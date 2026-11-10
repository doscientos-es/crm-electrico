import { contractStatusLabels } from '../../config/constants'

export type RenewalFollowupStatus = 'pending' | 'paused' | 'expired'

export const activeExpiredFilter = 'active_renewal_expired'

export const renewalFollowupLabels: Record<RenewalFollowupStatus, string> = {
  pending: 'Pendiente de renovar',
  paused: 'Renovación vencida',
  expired: 'Activo pero renovación vencida',
}

export function getContractStatusLabel(contract: { status: string; renewal_followup_status?: RenewalFollowupStatus | null }) {
  if (contract.status === 'active' && contract.renewal_followup_status === 'expired') return renewalFollowupLabels.expired
  return contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status
}

export function getRenewalEndDate(contract: { ends_at: string | null; renewal_followup_status?: RenewalFollowupStatus | null; renewal_ends_at?: string | null }) {
  return contract.renewal_followup_status === 'expired' ? contract.renewal_ends_at ?? contract.ends_at : contract.ends_at
}