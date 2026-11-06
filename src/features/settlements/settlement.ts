export type SettlementStatus = 'pending' | 'paid'

export function settlementLabel(status: SettlementStatus | null | undefined) {
  if (status === 'pending') return 'Pendiente de liquidar'
  if (status === 'paid') return 'Liquidado'
  return 'Sin registrar'
}