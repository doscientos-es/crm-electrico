import { describe, expect, it } from 'vitest'
import { contractSchema } from '../../schemas/forms.schema'
import { settlementLabel } from './settlement'

describe('liquidaciones', () => {
  it('distingue los registros históricos desconocidos de los pendientes y pagados', () => {
    expect(settlementLabel(null)).toBe('Sin registrar')
    expect(settlementLabel('pending')).toBe('Pendiente de liquidar')
    expect(settlementLabel('paid')).toBe('Liquidado')
  })

  it('exige fecha al registrar una liquidación pagada', () => {
    const contract = { customer_id: 'customer', settlement_status: 'paid' }
    expect(contractSchema.safeParse(contract).success).toBe(false)
    expect(contractSchema.safeParse({ ...contract, settlement_date: '2026-11-06' }).success).toBe(true)
    expect(contractSchema.safeParse({ ...contract, settlement_status: 'pending' }).success).toBe(true)
  })
})