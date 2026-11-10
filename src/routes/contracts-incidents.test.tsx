// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IncidentsRoute } from './contracts'

const mocks = vi.hoisted(() => {
  const contracts = [
    { id: '1', customer_id: '1', customer: { name: 'Cliente uno' }, status: 'incident', incident_reason: 'Falta la firma', cups: 'CUPS1' },
    { id: '2', customer_id: '2', customer: { name: 'Cliente dos' }, status: 'incident', incident_reason: null, cups: 'CUPS2' },
    { id: '3', customer_id: '3', customer: { name: 'Cliente activo' }, status: 'active', cups: 'CUPS3' },
  ]
  const useAllContracts = vi.fn((params: { status?: string }) => {
    const data = contracts.filter((contract) => !params.status || contract.status === params.status)
    return { data: { data, count: data.length }, isLoading: false, isError: false }
  })
  return { useAllContracts }
})

vi.mock('../features/auth/AuthContext', () => ({ useAuth: () => ({ profile: { role: 'sales' } }) }))
vi.mock('../features/contracts/ContractFormDialog', () => ({ ContractFormDialog: () => <p>Edición del contrato</p> }))
vi.mock('../services/profiles.service', () => ({ useProfiles: () => ({ data: [] }) }))
vi.mock('../services/contracts.service', () => ({
  useAllContracts: mocks.useAllContracts,
  useContractProviders: () => ({ data: [] }),
  fetchAllContractsForExport: vi.fn(),
}))

describe('listado de incidencias', () => {
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals() })

  it('fija el estado, muestra el motivo y permite abrir el contrato', () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<MemoryRouter initialEntries={['/incidents?status=active']}><IncidentsRoute /></MemoryRouter>))

    expect(mocks.useAllContracts).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'incident', includeCompanyCommission: false }))
    expect(container.textContent).toContain('Cliente uno')
    expect(container.textContent).toContain('Falta la firma')
    expect(container.textContent).toContain('Sin registrar')
    expect(container.textContent).not.toContain('Cliente activo')
    expect(Array.from(container.querySelectorAll('select')).some((select) => Array.from(select.options).some((option) => option.value === 'incident'))).toBe(false)

    act(() => container.querySelector('tbody tr')!.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(container.textContent).toContain('Edición del contrato')
    act(() => root.unmount())
    container.remove()
  })
})