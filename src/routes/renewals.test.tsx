// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { RenewalsRoute } from './renewals'

const mocks = vi.hoisted(() => ({ contracts: [{
  id: 'c1', customer_id: 'u1', customer: { id: 'u1', name: 'Cliente', company: null, assigned_to: null, notes: null, updated_at: 'v1' },
  status: 'active', ends_at: '2025-01-01', starts_at: '2024-01-01', renewal_followup_status: 'expired', renewal_ends_at: '2026-01-15',
}] }))
vi.mock('../features/auth/AuthContext', () => ({ useAuth: () => ({ profile: { role: 'sales' } }) }))
vi.mock('../services/contracts.service', () => ({
  useContractsDueForRenewal: () => ({ data: mocks.contracts, isLoading: false, isError: false }),
  useContractProviders: () => ({ data: [] }),
  useUpdateContract: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('../services/customers.service', () => ({ useUpdateCustomerNotes: () => ({ mutate: vi.fn(), isPending: false }) }))
vi.mock('../services/profiles.service', () => ({ useProfiles: () => ({ data: [] }) }))
vi.mock('../hooks/use-toast-error', () => ({ useToastError: () => vi.fn() }))

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

it('muestra y filtra los días según la nueva fecha, sin cambiar el vencimiento original', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 0, 1, 12))
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<MemoryRouter initialEntries={['/renewals?stage=urgent']}><RenewalsRoute /></MemoryRouter>))

  expect(container.textContent).toContain('Cliente')
  expect(container.textContent).toContain('15 ene 2026')
  expect(container.textContent).toContain('14d')
  expect(container.textContent).toContain('Activo pero renovación vencida')
  expect(container.textContent).not.toContain('01 ene 2025')
  expect(mocks.contracts[0].ends_at).toBe('2025-01-01')

  const stage = Array.from(container.querySelectorAll('select')).find((select) =>
    Array.from(select.options).some((option) => option.value === 'overdue'))!
  act(() => { stage.value = 'overdue'; stage.dispatchEvent(new Event('change', { bubbles: true })) })
  expect(container.textContent).toContain('Sin renovaciones pendientes')
  act(() => root.unmount())
  container.remove()
})