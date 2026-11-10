// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SettlementsRoute } from './settlements'

const mocks = vi.hoisted(() => {
  const auth = { profile: { id: 'admin', role: 'admin' } }
  const contracts = [
    { id: '1', customer_id: '1', customer: { name: 'Cliente uno', assigned_to: 'sales-1' }, settlement_status: 'pending' },
    { id: '2', customer_id: '2', customer: { name: 'Cliente dos', assigned_to: 'sales-2' }, settlement_status: 'paid' },
    { id: '3', customer_id: '3', customer: { name: 'Cliente histórico', assigned_to: 'sales-1' }, settlement_status: null },
  ]
  const useAllContracts = vi.fn((params: { assignedTo?: string; settlementStatus?: string }) => {
    const data = contracts.filter((contract) =>
      (!params.assignedTo || contract.customer.assigned_to === params.assignedTo)
      && (!params.settlementStatus || (params.settlementStatus === 'registered'
        ? contract.settlement_status === 'pending' || contract.settlement_status === 'paid'
        : contract.settlement_status === params.settlementStatus)),
    )
    return { data: { data, count: data.length }, isLoading: false, isError: false }
  })
  return { auth, useAllContracts }
})

vi.mock('../features/auth/AuthContext', () => ({ useAuth: () => mocks.auth }))
vi.mock('../services/contracts.service', () => ({ useAllContracts: mocks.useAllContracts }))

describe('Mis liquidaciones', () => {
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals() })

  it.each(['owner', 'admin'])('muestra contratos de todos los comerciales para %s y filtra por estado', (role) => {
    mocks.auth.profile.role = role
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<MemoryRouter><SettlementsRoute /></MemoryRouter>))

    expect(mocks.useAllContracts).toHaveBeenLastCalledWith(expect.objectContaining({
      enabled: true, includeCompanyCommission: false, page: 0, pageSize: 25, settlementStatus: 'registered',
    }))
    expect(mocks.useAllContracts.mock.lastCall?.[0].assignedTo).toBeUndefined()
    expect(container.textContent).toContain('Cliente uno')
    expect(container.textContent).toContain('Cliente dos')
    expect(container.textContent).not.toContain('Cliente histórico')
    expect(container.textContent).not.toContain('Sin registrar')
    expect(container.textContent).toContain('1–2 de 2')

    const select = container.querySelector('select')!
    act(() => { select.value = 'pending'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(container.textContent).toContain('Cliente uno')
    expect(container.textContent).not.toContain('Cliente dos')
    expect(container.textContent).not.toContain('Cliente histórico')
    expect(mocks.useAllContracts.mock.lastCall?.[0].settlementStatus).toBe('pending')

    act(() => { select.value = 'paid'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(container.textContent).toContain('Cliente dos')
    expect(container.textContent).not.toContain('Cliente uno')
    expect(container.textContent).not.toContain('Cliente histórico')
    expect(mocks.useAllContracts.mock.lastCall?.[0].settlementStatus).toBe('paid')

    act(() => { select.value = 'all'; select.dispatchEvent(new Event('change', { bubbles: true })) })
    expect(container.textContent).toContain('Cliente uno')
    expect(container.textContent).toContain('Cliente dos')
    expect(container.textContent).not.toContain('Cliente histórico')

    act(() => root.unmount())
    container.remove()
  })
})