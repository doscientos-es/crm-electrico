/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { useAppStore } from '../../store/app-store'

type AuthContextValue = {
  isAuthenticated: boolean
  isLoading: boolean
  profile: ReturnType<typeof useAppStore.getState>['profiles'][number]
  profiles: ReturnType<typeof useAppStore.getState>['profiles']
  login: (userId: string) => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)
  const profiles = useAppStore((state) => state.profiles)
  const currentUserId = useAppStore((state) => state.currentUserId)
  const login = useAppStore((state) => state.login)
  const signOut = useAppStore((state) => state.logout)
  const profile = profiles.find((item) => item.id === currentUserId) ?? profiles[0]

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading: false, profile, profiles, login, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
