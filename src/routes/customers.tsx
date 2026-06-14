import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { customerStatusLabels, customerTypeLabels } from '../config/constants'
import { CustomerFormDialog } from '../features/customers/CustomerFormDialog'
import { useAuth } from '../features/auth/AuthContext'
import { useDebounce } from '../hooks/use-debounce'
import { formatDate } from '../lib/formatters'
import { useCustomers } from '../services/customers.service'
import { useProfiles } from '../services/profiles.service'

const PAGE_SIZE = 25

export function CustomersRoute() {
  const { profile: currentUser } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const search = params.get('q') ?? ''
  const status = params.get('status') ?? 'all'
  const owner = params.get('owner') ?? 'all'
  const type = params.get('type') ?? 'all'
  const page = Number(params.get('page') ?? '1')

  function setSearch(v: string) { setParams((p) => { const n = new URLSearchParams(p); v ? n.set('q', v) : n.delete('q'); n.delete('page'); return n }, { replace: true }) }
  function setStatus(v: string) { setParams((p) => { const n = new URLSearchParams(p); v !== 'all' ? n.set('status', v) : n.delete('status'); n.delete('page'); return n }, { replace: true }) }
  function setOwner(v: string) { setParams((p) => { const n = new URLSearchParams(p); v !== 'all' ? n.set('owner', v) : n.delete('owner'); n.delete('page'); return n }, { replace: true }) }
  function setType(v: string) { setParams((p) => { const n = new URLSearchParams(p); v !== 'all' ? n.set('type', v) : n.delete('type'); n.delete('page'); return n }, { replace: true }) }
  function setPage(p: number) { setParams((prev) => { const n = new URLSearchParams(prev); if (p > 1) n.set('page', String(p)); else n.delete('page'); return n }, { replace: true }) }

  const debouncedSearch = useDebounce(search, 250)

  const { data: result, isLoading } = useCustomers({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status : undefined,
    assignedTo: owner !== 'all' ? owner : undefined,
    type: type !== 'all' ? type : undefined,
    page: page - 1,
    pageSize: PAGE_SIZE,
  })

  const { data: profiles } = useProfiles()

  const profilesById = useMemo(
    () => Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])),
    [profiles],
  )

  const customers = result?.data ?? []
  const total = result?.count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Base centralizada de clientes con contrato, renovacion, estado, comercial y servicios contratados."
        action={<CustomerFormDialog />}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="min-w-52 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, DNI, empresa..." />
          </div>
        </Field>
        <Field label="Estado" className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="renewal_due">Renovacion pendiente</option>
            <option value="renewed">Renovados</option>
            <option value="inactive">Baja</option>
            <option value="lost">Perdidos</option>
          </Select>
        </Field>
        <Field label="Tipo" className="w-44">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Todos</option>
            <option value="RESIDENTIAL">Residencial</option>
            <option value="SME">Empresa / PYME</option>
          </Select>
        </Field>
        {currentUser?.role !== 'sales' && (
          <Field label="Comercial" className="w-44">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">Todos</option>
              {(profiles ?? [])
                .filter((p) => ['owner', 'admin', 'sales'].includes(p.role))
                .map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </Field>
        )}
      </div>

      {!isLoading && customers.length === 0 ? (
        <EmptyState
          title={total === 0 && !debouncedSearch && status === 'all' ? 'Sin clientes' : 'Sin resultados'}
          description={total === 0 && !debouncedSearch && status === 'all' ? 'Crea el primer cliente para empezar a gestionar la cartera.' : 'Prueba a ajustar los filtros de busqueda.'}
          action={total === 0 && !debouncedSearch ? <CustomerFormDialog /> : undefined}
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Tipo', 'Estado', 'Contrato', 'Renovacion', 'Servicios', 'Comercial']}
          pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: setPage, onPageSizeChange: () => { } }}
        >
          {customers.map((customer) => (
            <Tr key={customer.id} hover className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
              <Td>
                <p className="font-medium text-foreground">{customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.dni ?? 'Sin DNI'} · {customer.company ?? 'Sin empresa'}
                </p>
              </Td>
              <Td><StatusBadge value={customerTypeLabels[customer.type]} /></Td>
              <Td><StatusBadge value={customerStatusLabels[customer.status as keyof typeof customerStatusLabels] ?? customer.status} /></Td>
              <Td variant="muted">{formatDate(customer.contract_signed_at ?? undefined)}</Td>
              <Td variant="muted">{formatDate(customer.renewal_date ?? undefined)}</Td>
              <Td variant="muted">{(customer.products_services as string[]).join(', ') || '-'}</Td>
              <Td variant="muted">{profilesById[customer.assigned_to ?? ''] ?? '-'}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
