import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Tables } from '../types/database.types'
import { queryKeys } from './query-keys'

export type ActivityLogRow = Tables<'activity_logs'>
export type ContactChannel = 'email' | 'phone'

export type ContactLog = ActivityLogRow & {
  actor: { full_name: string } | null
}
export type RenewalContactLog = ContactLog

export function getContactChannel(log: ActivityLogRow): ContactChannel | null {
  if (!log.metadata || typeof log.metadata !== 'object' || Array.isArray(log.metadata)) return null
  const channel = (log.metadata as Record<string, unknown>).channel
  return channel === 'email' || channel === 'phone' ? channel : null
}

export function getContactNotes(log: ActivityLogRow) {
  if (!log.metadata || typeof log.metadata !== 'object' || Array.isArray(log.metadata)) return ''
  const notes = (log.metadata as Record<string, unknown>).notes
  return typeof notes === 'string' ? notes : ''
}

export function useRecentActivity(limit = 10) {
  return useQuery<ActivityLogRow[]>({
    queryKey: ['activity', 'recent', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data as ActivityLogRow[]
    },
  })
}

export function useCustomerActivity(customerId: string) {
  return useQuery<ActivityLogRow[]>({
    queryKey: ['activity', 'customer', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', 'customer')
        .eq('entity_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as ActivityLogRow[]
    },
    enabled: !!customerId,
  })
}

// Alias for routes that import useActivityLogs
export const useActivityLogs = useCustomerActivity

export function useCustomerInteractions(customerId: string | undefined) {
  return useQuery<ContactLog[]>({
    queryKey: ['activity', 'customer-interactions', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, actor:profiles!activity_logs_actor_id_fkey(full_name)')
        .eq('entity_type', 'customer')
        .eq('entity_id', customerId!)
        .eq('action', 'renewal_contact')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      return data as ContactLog[]
    },
    enabled: !!customerId,
  })
}

export function useRenewalContacts(customerIds: string[]) {
  const ids = [...new Set(customerIds)].sort()

  return useQuery<ContactLog[]>({
    queryKey: ['activity', 'renewal-contacts', ids],
    queryFn: async () => {
      if (ids.length === 0) return []

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*, actor:profiles!activity_logs_actor_id_fkey(full_name)')
        .eq('entity_type', 'customer')
        .eq('action', 'renewal_contact')
        .in('entity_id', ids)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ContactLog[]
    },
    enabled: ids.length > 0,
  })
}

export function useLogRenewalContact() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      customerId,
      contractId,
      actorId,
      channel,
      notes,
    }: {
      customerId: string
      contractId: string
      actorId: string
      channel: ContactChannel
      notes: string
    }) => {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert({
          actor_id: actorId,
          entity_type: 'customer',
          entity_id: customerId,
          action: 'renewal_contact',
          metadata: {
            channel,
            notes: notes.trim(),
            contract_id: contractId,
          },
        } as never)
        .select()
        .single()

      if (error) throw error
      return data as ActivityLogRow
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ['activity'] })
      void qc.invalidateQueries({ queryKey: queryKeys.customer(variables.customerId) })
    },
  })
}

export function useLogActivity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ entityType, entityId, action, metadata = {} }: {
      entityType: string
      entityId: string
      action: string
      metadata?: Record<string, unknown>
    }) => {
      const { error } = await supabase.from('activity_logs').insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        metadata,
      } as never)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activity'] }),
  })
}
