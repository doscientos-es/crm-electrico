import type { ContractStatus } from '../types/domain'

const validStatuses = new Set<ContractStatus>([
  'PENDING_PROCESSING',
  'PROCESSING',
  'PENDING_SIGNATURE',
  'ACTIVE',
  'CANCELLED',
])

const legacyStatuses: Record<string, ContractStatus> = {
  draft: 'PENDING_PROCESSING',
  pending_processing: 'PENDING_PROCESSING',
  processing: 'PROCESSING',
  sent: 'PENDING_SIGNATURE',
  pending_signature: 'PENDING_SIGNATURE',
  signed: 'ACTIVE',
  active: 'ACTIVE',
  cancelled: 'CANCELLED',
  canceled: 'CANCELLED',
}

export function normalizeContractStatus(value: unknown): ContractStatus {
  if (typeof value !== 'string') return 'PENDING_PROCESSING'
  if (validStatuses.has(value as ContractStatus)) return value as ContractStatus
  return legacyStatuses[value.toLowerCase()] ?? 'PENDING_PROCESSING'
}
