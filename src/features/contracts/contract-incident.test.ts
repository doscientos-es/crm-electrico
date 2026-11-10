import { describe, expect, it } from 'vitest'
import { contractSchema } from '../../schemas/forms.schema'

describe('motivo de incidencia de contrato', () => {
  const contract = { customer_id: 'customer', status: 'incident' }

  it('exige un motivo con contenido para contratos en incidencia', () => {
    expect(contractSchema.safeParse(contract).success).toBe(false)
    expect(contractSchema.safeParse({ ...contract, incident_reason: '   ' }).success).toBe(false)
    expect(contractSchema.safeParse({ ...contract, incident_reason: 'Falta la firma' }).success).toBe(true)
  })

  it('no exige motivo para otros estados', () => {
    expect(contractSchema.safeParse({ customer_id: 'customer', status: 'active' }).success).toBe(true)
  })
})