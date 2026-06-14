import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Profile } from '../types/domain'
import { localMutation } from './local-mutation'

export function useProfiles() {
  return { data: useAppStore((state) => state.profiles), isLoading: false }
}

export function useInviteProfile() {
  const addProfile = useAppStore((state) => state.addProfile)
  return localMutation((input: Partial<Profile> & Pick<Profile, 'full_name' | 'email' | 'role'>) => {
    const profile: Profile = {
      id: input.id ?? newId('profile'),
      full_name: input.full_name,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role,
      avatar_url: null,
      created_at: timestamp(),
      updated_at: timestamp(),
    }
    addProfile(profile)
    return profile
  })
}

export function useUpdateProfile() {
  const updateProfile = useAppStore((state) => state.updateProfile)
  return localMutation((input: Partial<Profile> & { id: string }) => {
    const { id, ...patch } = input
    updateProfile(id, patch)
    return input
  })
}
