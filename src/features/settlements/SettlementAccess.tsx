import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { canViewSettlements } from '../../lib/permissions'
import { useAuth } from '../auth/AuthContext'

export function SettlementAccess({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  return canViewSettlements(profile?.role) ? children : <Navigate to="/dashboard" replace />
}