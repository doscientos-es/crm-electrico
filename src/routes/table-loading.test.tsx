// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CustomersRoute } from './customers'
import { DocumentsRoute } from './documents'

const mocks = vi.hoisted(() => ({ useCustomers: vi.fn(), useAllDocuments: vi.fn() }))
vi.mock('../features/auth/AuthContext', () => ({ useAuth: () => ({ profile: { id: 'user', role: 'sales' } }) }))
vi.mock('../features/customers/CustomerFormDialog', () => ({ CustomerFormDialog: () => null }))
vi.mock('../components/documents/FileViewerDialog', () => ({ FileViewerDialog: () => null }))
vi.mock('../hooks/use-toast-error', () => ({ useToastError: () => vi.fn() }))
vi.mock('../services/profiles.service', () => ({ useProfiles: () => ({ data: [] }) }))
vi.mock('../services/customers.service', () => ({ useCustomers: mocks.useCustomers, fetchAllCustomersForExport: vi.fn() }))
vi.mock('../services/documents.service', () => ({
  useAllDocuments: mocks.useAllDocuments,
  useUploadDocument: () => ({ isPending: false, mutate: vi.fn() }),
  useDeleteDocument: () => ({ isPending: false, mutate: vi.fn() }),
}))

describe('carga de tablas', () => {
  afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals() })

  it.each([
    { name: 'clientes', Page: CustomersRoute, hook: mocks.useCustomers, empty: 'Sin clientes', error: 'No se pudieron cargar los clientes.' },
    { name: 'documentos', Page: DocumentsRoute, hook: mocks.useAllDocuments, empty: 'Sin documentos', error: 'No se pudieron cargar los documentos.' },
  ])('distingue carga, vacío y error en $name', ({ name, Page, hook, empty, error }) => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    mocks.useCustomers.mockReturnValue({ data: { data: [], count: 0 }, isLoading: false, isError: false })
    hook.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const render = () => root.render(<MemoryRouter><Page /></MemoryRouter>)
    act(render)

    expect(container.querySelector('[role="status"]')?.textContent).toBe(`Cargando ${name}…`)
    expect(container.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(6)
    expect(container.textContent).not.toContain(empty)

    hook.mockReturnValue({ data: { data: [], count: 0 }, isLoading: false, isError: false })
    act(render)
    expect(container.textContent).toContain(empty)
    expect(container.querySelector('[role="status"]')).toBeNull()

    hook.mockReturnValue({ data: undefined, isLoading: false, isError: true })
    act(render)
    expect(container.textContent).toContain(error)
    expect(container.textContent).not.toContain(empty)
    act(() => root.unmount())
    container.remove()
  })
})