import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const calls: Array<[string, ...unknown[]]> = []
  const pages: unknown[][] = []
  const query = new Proxy({}, {
    get: (_, name) => name === 'then'
      ? (resolve: (value: unknown) => void) => Promise.resolve({ data: pages.shift() ?? [], count: 0, error: null }).then(resolve)
      : (...args: unknown[]) => { calls.push([String(name), ...args]); return query },
  })
  return { calls, pages, query }
})

vi.mock('../lib/supabase', () => ({ supabase: { from: () => mocks.query } }))
vi.mock('@tanstack/react-query', () => ({ useQuery: (options: unknown) => options }))

import { useAllContracts, useContractsDueForRenewal } from './contracts.service'
import { useRenewalContacts } from './activity.service'

async function runQuery(result: unknown) {
  return (result as { queryFn: () => Promise<unknown> }).queryFn()
}

describe('consultas de contratos', () => {
  beforeEach(() => { mocks.calls.length = 0; mocks.pages.length = 0 })
  afterEach(() => vi.useRealTimers())

  it('incluye contratos vencidos y limita los próximos a 60 días', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 5, 15, 12))
    await runQuery(useContractsDueForRenewal(60))
    expect(mocks.calls).toContainEqual(['eq', 'status', 'active'])
    expect(mocks.calls).toContainEqual(['not', 'ends_at', 'is', null])
    expect(mocks.calls.some(([method, column]) => method === 'gte' && column === 'ends_at')).toBe(false)
    expect(mocks.calls).toContainEqual(['lte', 'ends_at', '2025-08-14'])
  })

  it('recupera todas las páginas de renovaciones', async () => {
    mocks.pages.push(Array.from({ length: 1000 }, (_, id) => ({ id })), [{ id: 1000 }])
    const contracts = await runQuery(useContractsDueForRenewal(60)) as unknown[]
    expect(contracts).toHaveLength(1001)
    expect(mocks.calls).toContainEqual(['range', 0, 999])
    expect(mocks.calls).toContainEqual(['range', 1000, 1999])
  })

  it('filtra liquidaciones por comercial y estado antes de paginar', async () => {
    await runQuery(useAllContracts({ assignedTo: 'sales-id', settlementStatus: 'paid', page: 1, pageSize: 25, includeCompanyCommission: false }))
    expect(mocks.calls).toContainEqual(['eq', 'customer.assigned_to', 'sales-id'])
    expect(mocks.calls).toContainEqual(['eq', 'settlement_status', 'paid'])
    expect(mocks.calls).toContainEqual(['range', 25, 49])
    const selection = mocks.calls.find(([method]) => method === 'select')?.[1] as string
    expect(selection).toContain('settlement_status')
    expect(selection).toContain('terminated_at')
    expect(selection).not.toContain('commission_company_eur')
  })

  it('consulta contratos con incidencia y recupera su motivo', async () => {
    await runQuery(useAllContracts({ status: 'incident', page: 1, pageSize: 25, includeCompanyCommission: false }))
    expect(mocks.calls).toContainEqual(['eq', 'status', 'incident'])
    expect(mocks.calls).toContainEqual(['range', 25, 49])
    const selection = mocks.calls.find(([method]) => method === 'select')?.[1] as string
    expect(selection).toContain('incident_reason')
    expect(selection).toContain('customer:customers!inner')
    expect(selection).not.toContain('commission_company_eur')
  })

  it('recupera el historial completo de contactos, incluso con más de 1000 registros', async () => {
    mocks.pages.push(Array.from({ length: 1000 }, (_, id) => ({ id })), [{ id: 1000 }])
    const contacts = await runQuery(useRenewalContacts(['customer'])) as unknown[]
    expect(contacts).toHaveLength(1001)
    expect(mocks.calls).toContainEqual(['in', 'entity_id', ['customer']])
    expect(mocks.calls).toContainEqual(['range', 1000, 1999])
  })
})