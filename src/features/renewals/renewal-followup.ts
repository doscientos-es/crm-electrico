export type RenewalFollowupStatus = 'pending' | 'paused'

export const renewalFollowupLabels: Record<RenewalFollowupStatus, string> = {
  pending: 'Pendiente de renovar',
  paused: 'Renovación vencida / en pausa',
}