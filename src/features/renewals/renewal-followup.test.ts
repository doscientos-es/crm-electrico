import { expect, it } from 'vitest'
import { getRenewalEndDate } from './renewal-followup'

it('usa la fecha de renovación solo para el nuevo estado y conserva los valores históricos', () => {
  const contract = { ends_at: '2025-01-01', renewal_ends_at: '2026-01-15' }
  expect(getRenewalEndDate({ ...contract, renewal_followup_status: 'expired' })).toBe('2026-01-15')
  expect(getRenewalEndDate({ ...contract, renewal_followup_status: 'paused' })).toBe('2025-01-01')
  expect(getRenewalEndDate({ ...contract, renewal_followup_status: null })).toBe('2025-01-01')
  expect(getRenewalEndDate({ ...contract, renewal_followup_status: 'expired', renewal_ends_at: null })).toBe('2025-01-01')
})