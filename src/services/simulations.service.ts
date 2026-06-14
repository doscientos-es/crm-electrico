import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Simulation } from '../types/domain'
import { localMutation } from './local-mutation'

export function useEnergyProfiles() {
  return { data: useAppStore((state) => state.energyProfiles), isLoading: false }
}

export function useSimulations() {
  return { data: useAppStore((state) => state.simulations), isLoading: false }
}

export function useCreateSimulation() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: Omit<Simulation, 'id' | 'created_at' | 'updated_at' | 'invoice_id'> & { invoice_id?: string | null }) => {
    const simulation: Simulation = { ...input, id: newId('simulation'), invoice_id: input.invoice_id ?? null, created_at: timestamp(), updated_at: timestamp() }
    add('simulations', simulation)
    return simulation
  })
}
