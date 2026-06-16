import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { InsertDto, Tables, UpdateDto } from '../types/database.types'
import { queryKeys } from './query-keys'

export type TaskRow = Tables<'tasks'>

export type TaskWithCustomer = TaskRow & {
  customer: { id: string; name: string; company: string | null } | null
}

export function useTasks(params?: { month?: string }) {
  return useQuery<TaskWithCustomer[]>({
    queryKey: queryKeys.tasks(params),
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*, customer:customers(id, name, company)')
        .order('due_at', { ascending: true })

      if (params?.month) {
        const start = `${params.month}-01`
        const [year, month] = params.month.split('-').map(Number)
        const lastDay = new Date(year, month, 0).getDate()
        const end = `${params.month}-${String(lastDay).padStart(2, '0')}T23:59:59`
        query = query.gte('due_at', start).lte('due_at', end)
      }

      const { data, error } = await query
      if (error) throw error
      return data as TaskWithCustomer[]
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (dto: InsertDto<'tasks'>) => {
      const { data, error } = await supabase.from('tasks').insert(dto as never).select().single()
      if (error) throw error
      return data as TaskRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateDto<'tasks'> & { id: string }) => {
      const { data, error } = await supabase.from('tasks').update(dto as never).eq('id', id).select().single()
      if (error) throw error
      return data as TaskRow
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
