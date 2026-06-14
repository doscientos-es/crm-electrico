import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Task } from '../types/domain'
import { localMutation } from './local-mutation'

export function useTasks() {
  return { data: useAppStore((state) => state.tasks), isLoading: false }
}

export function useCreateTask() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: Partial<Omit<Task, 'id' | 'created_at' | 'updated_at'>> & Pick<Task, 'title' | 'status' | 'priority' | 'due_at'>) => {
    const task: Task = {
      id: newId('task'), title: input.title, status: input.status, priority: input.priority, due_at: input.due_at,
      customer_id: input.customer_id ?? null, lead_id: input.lead_id ?? null, deal_id: input.deal_id ?? null,
      installation_id: input.installation_id ?? null, description: input.description ?? null,
      assigned_to: input.assigned_to ?? null, completed_at: input.completed_at ?? null,
      created_at: timestamp(), updated_at: timestamp(),
    }
    add('tasks', task)
    return task
  })
}

export function useUpdateTask() {
  const update = useAppStore((state) => state.update)
  return localMutation((input: Partial<Task> & { id: string }) => {
    const { id, ...patch } = input
    update('tasks', id, { ...patch, completed_at: patch.status === 'done' ? timestamp() : patch.completed_at })
    return input
  })
}
