// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContractsRoute, IncidentsRoute } from './contracts'

const mocks = vi.hoisted(() => {
  const contracts = [
    { id: '1', customer_id: '1', customer: { name: 'Cliente uno', assigned_to: 'sales-1' }, status: 'incident', renewal_followup_status: null, incident_reason: 'Falta la firma', created_at: '2026-11-10T12:00:00Z', cups: 'CUPS1' },
    { id: '2', customer_id: '2', customer: { name: 'Cliente dos', assigned_to: null }, status: 'incident', renewal_followup_status: null, incident_reason: null, created_at: '2026-11-09T12:00:00Z', cups: 'CUPS2' },
    { id: '3', customer_id: '3', customer: { name: 'Cliente activo' }, status: 'active', renewal_followup_status: null, cups: 'CUPS3' },
    { id: '4', customer_id: '4', customer: { name: 'Cliente vencido' }, status: 'active', renewal_followup_status: 'expired', cups: 'CUPS4' },
    { id: '5', customer_id: '5', customer: { name: 'Cliente cancelado' }, status: 'cancelled', renewal_followup_status: 'expired', cups: 'CUPS5' },
  ]
  const useAllContracts = vi.fn((params: { status?: string; renewalFollowupStatus?: string }) => {
    const data = contracts.filter((contract) => (!params.status || contract.status === params.status)
      && (!params.renewalFollowupStatus || contract.renewal_followup_status === params.renewalFollowupStatus))
    return { data: { data, count: data.length }, isLoading: false, isError: false }
  })
  return { useAllContracts, fetchAllContractsForExport: vi.fn().mockResolvedValue([]) }
})

vi.mock('../features/auth/AuthContext', () => ({ useAuth: () => ({ profile: { role: 'sales' } }) }))
vi.mock('../features/contracts/ContractFormDialog', () => ({ ContractFormDialog: () => <p>Edición del contrato</p> }))
vi.mock('../services/profiles.service', () => ({ useProfiles: () => ({ data: [{ id: 'sales-1', full_name: 'Comercial Uno', role: 'sales' }] }) }))
vi.mock('../services/contracts.service', () => ({
  useAllContracts: mocks.useAllContracts,
  useContractProviders: () => ({ data: [] }),
  fetchAllContractsForExport: mocks.fetchAllContractsForExport,
}))

describe('listado de incidencias', () => {
  afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals() })

  it('muestra el skeleton de contratos mientras carga la lista', () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    mocks.useAllContracts.mockReturnValueOnce({ data: { data: [], count: 0 }, isLoading: true, isError: false })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<MemoryRouter><IncidentsRoute /></MemoryRouter>))
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Cargando incidencias…')
    expect(container.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(6)
    expect(container.textContent).not.toContain('Sin contratos')
    act(() => root.unmount())
    container.remove()
  })

  it('muestra los datos de incidencias y permite abrir el contrato', () => {
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
    expect(Array.from(container.querySelectorAll('thead th'), (header) => header.textContent)).toEqual(['Cliente', 'Motivo', 'Comercial responsable', 'Creada', 'Acciones'])
    const rows = container.querySelectorAll('tbody tr')
    expect(Array.from(rows[0].querySelectorAll('td'), (cell) => cell.textContent)).toEqual(['Cliente uno', 'Falta la firma', 'Comercial Uno', '10 nov 2026', 'Ver contrato'])
    expect(rows[1].textContent).toContain('Sin asignar')
    expect(rows[0].querySelector('[title]')?.getAttribute('title')).toBe('Fecha de creación del contrato')

    act(() => rows[0].querySelector('button')!.click())
    expect(container.textContent).toContain('Edición del contrato')
    act(() => root.unmount())
    container.remove()
  })

  it('abre el filtro de activos vencidos y exporta con los mismos criterios', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    act(() => root.render(<MemoryRouter initialEntries={['/contracts?status=active_renewal_expired']}><ContractsRoute /></MemoryRouter>))
    expect(mocks.useAllContracts).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'active', renewalFollowupStatus: 'expired' }))
    expect(container.querySelector('select')?.value).toBe('active_renewal_expired')
    expect(container.textContent).toContain('Cliente vencido')
    expect(container.textContent).toContain('Activo pero renovación vencida')
    expect(container.textContent).not.toContain('Cliente activo')
    expect(container.textContent).not.toContain('Cliente cancelado')
    const exportButton = Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes('Exportar Excel'))!
    await act(async () => exportButton.click())
    expect(mocks.fetchAllContractsForExport).toHaveBeenCalledWith(expect.objectContaining({ status: 'active', renewalFollowupStatus: 'expired' }))
    act(() => root.unmount())
    container.remove()
  })
})