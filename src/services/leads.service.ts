import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Lead } from '../types/domain'
import { localMutation } from './local-mutation'

export type LeadRow = Lead

export function useLeads(filters: { search?: string; status?: string; page?: number; pageSize?: number } = {}) {
  const leads = useAppStore((state) => state.leads)
  const search = filters.search?.toLowerCase()
  const filtered = leads.filter((item) =>
    (!filters.status || item.status === filters.status) &&
    (!search || item.contact_name.toLowerCase().includes(search) || item.company_name?.toLowerCase().includes(search)),
  )
  const page = filters.page ?? 0
  const size = filters.pageSize ?? 25
  return { data: { data: filtered.slice(page * size, (page + 1) * size), count: filtered.length }, isLoading: false }
}

type LeadInput = Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at'>> & Pick<Lead, 'contact_name' | 'source' | 'status'>

export function useCreateLead() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: LeadInput) => {
    const lead: Lead = {
      id: newId('lead'), contact_name: input.contact_name, source: input.source, status: input.status,
      company_name: input.company_name ?? null, email: input.email ?? null, phone: input.phone ?? null,
      city: input.city ?? null, notes: input.notes ?? null, estimated_monthly_bill: input.estimated_monthly_bill ?? null,
      assigned_to: input.assigned_to ?? null, converted_customer_id: input.converted_customer_id ?? null,
      created_at: timestamp(), updated_at: timestamp(),
    }
    add('leads', lead)
    return lead
  })
}

export function useUpdateLead() {
  const update = useAppStore((state) => state.update)
  return localMutation((input: Partial<Lead> & { id: string }) => {
    const { id, ...patch } = input
    update('leads', id, patch)
    return input
  })
}
