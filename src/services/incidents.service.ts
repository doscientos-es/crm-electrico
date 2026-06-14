import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Incident } from '../types/domain'
import { localMutation } from './local-mutation'

export type IncidentRow = Incident
type IncidentInput = Omit<Incident, 'id' | 'createdAt' | 'updatedAt' | 'resolvedAt'> & {
  resolvedAt?: string | null
}

export function useIncidents() {
  const incidents = useAppStore((state) => state.incidents)
  return { data: incidents, isLoading: false }
}

export function useIncident(id?: string) {
  const incident = useAppStore((state) => state.incidents.find((item) => item.id === id))
  return { data: incident, isLoading: false }
}

export function useCreateIncident() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: IncidentInput) => {
    const createdAt = timestamp()
    const incident: Incident = { ...input, id: newId('incident'), createdAt, updatedAt: createdAt, resolvedAt: input.resolvedAt ?? null }
    add('incidents', incident)
    return incident
  })
}

export function useUpdateIncident() {
  const update = useAppStore((state) => state.update)
  return localMutation((input: Partial<Incident> & { id: string }) => {
    const { id, ...patch } = input
    const resolved = patch.status === 'RESOLVED' || patch.status === 'CLOSED'
    update('incidents', id, { ...patch, resolvedAt: resolved ? patch.resolvedAt ?? timestamp() : null })
    return input
  })
}
