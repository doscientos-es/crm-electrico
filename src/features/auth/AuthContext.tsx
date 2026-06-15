import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, fetchProfileById } from '../../lib/supabase'
import type { Tables } from '../../types/database.types'

type Profile = Tables<'profiles'>

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  isAuthenticated: boolean
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAuthInitialized, setIsAuthInitialized] = useState(false)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const currentUserId = useRef<string | null>(null)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      const nextUserId = nextSession?.user.id ?? null

      if (currentUserId.current !== nextUserId) {
        currentUserId.current = nextUserId
        setProfile(null)
        setIsProfileLoading(nextUserId !== null)
      }

      setSession(nextSession)
      setIsAuthInitialized(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const userId = session?.user.id
    if (!isAuthInitialized || !userId) return

    let cancelled = false

    void fetchProfileById(userId)
      .then((nextProfile) => {
        if (!cancelled) setProfile(nextProfile)
      })
      .finally(() => {
        if (!cancelled) setIsProfileLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isAuthInitialized, session?.user.id])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const isLoading = !isAuthInitialized || isProfileLoading

  return (
    <AuthContext.Provider value={{ session, profile, isAuthenticated: !!session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
