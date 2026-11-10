// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import { DashboardRoute } from './dashboard'

vi.mock('../services/contracts.service', () => ({
  useContractsDueForRenewal: () => ({ data: [] }),
  useContractStats: () => ({
    data: {
      total: 8, active: 3, activeRenewalExpired: 2, processing: 0, pendingSignature: 0,
      pendingProcessing: 0, incident: 1, pendingRecovery: 0, cancelled: 1, terminated: 0,
      urgentRenewals: 0, thisMonthEnding: 0,
    }
  }),
}))
vi.mock('../services/customers.service', () => ({ useCustomerCount: () => ({ data: 3 }) }))

it('enlaza el contador de activos vencidos y mantiene una sola tarjeta de incidencias', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<MemoryRouter><DashboardRoute /></MemoryRouter>))

  const expired = container.querySelector<HTMLAnchorElement>('a[href="/contracts?status=active_renewal_expired"]')
  expect(expired?.textContent).toContain('Activo renovación vencida')
  expect(expired?.textContent).toContain('2')
  const incidents = Array.from(container.querySelectorAll('a')).filter((link) => link.textContent?.includes('incidencia'))
  expect(incidents).toHaveLength(1)
  expect(incidents[0].getAttribute('href')).toBe('/incidents')
  expect(incidents[0].textContent).toContain('1')

  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})