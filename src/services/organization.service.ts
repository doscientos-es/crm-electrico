import { useAppStore } from '../store/app-store'
import type { Organization } from '../types/domain'
import { localMutation } from './local-mutation'

export function useOrganization() {
  return { data: useAppStore((state) => state.organization), isLoading: false }
}

export function useUpdateOrganization() {
  const setOrganization = useAppStore((state) => state.setOrganization)
  return localMutation((input: Partial<Organization> & { id: string }) => {
    const { id, ...patch } = input
    void id
    setOrganization(patch)
    return input
  })
}
