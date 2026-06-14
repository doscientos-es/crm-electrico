import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Installation } from '../types/domain'
import { localMutation } from './local-mutation'

export function useInstallations() {
  return { data: useAppStore((state) => state.installations), isLoading: false }
}

export function useCreateInstallation() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: Partial<Omit<Installation, 'id' | 'created_at' | 'updated_at'>> & Pick<Installation, 'customer_id' | 'status' | 'type' | 'address'>) => {
    const installation: Installation = {
      id: newId('installation'),
      customer_id: input.customer_id, status: input.status, type: input.type, address: input.address,
      deal_id: input.deal_id ?? null, contract_id: input.contract_id ?? null, city: input.city ?? null,
      province: input.province ?? null, postal_code: input.postal_code ?? null,
      assigned_technician: input.assigned_technician ?? null, scheduled_at: input.scheduled_at ?? null,
      notes: input.notes ?? null,
      completed_at: input.completed_at ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      created_at: timestamp(),
      updated_at: timestamp(),
    }
    add('installations', installation)
    return installation
  })
}

export function useUpdateInstallation() {
  const update = useAppStore((state) => state.update)
  return localMutation((input: Partial<Installation> & { id: string }) => {
    const { id, ...patch } = input
    update('installations', id, patch)
    return input
  })
}
