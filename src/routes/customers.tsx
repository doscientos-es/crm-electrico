import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { customerStatusLabels } from '../config/constants'
import { CustomerFormDialog } from '../features/customers/CustomerFormDialog'
import { useDebounce } from '../hooks/use-debounce'
import { usePagination } from '../hooks/use-pagination'
import { getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'
import type { Customer } from '../types/domain'

export function CustomersRoute() {
  const store = useDemoStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const search = params.get('q') ?? ''
  const status = (params.get('status') ?? 'all') as 'all' | Customer['status']
  const owner = params.get('owner') ?? 'all'

  function setSearch(v: string) { setParams((p) => { const n = new URLSearchParams(p); v ? n.set('q', v) : n.delete('q'); n.delete('page'); return n }, { replace: true }) }
  function setStatus(v: string) { setParams((p) => { const n = new URLSearchParams(p); v !== 'all' ? n.set('status', v) : n.delete('status'); n.delete('page'); return n }, { replace: true }) }
  function setOwner(v: string) { setParams((p) => { const n = new URLSearchParams(p); v !== 'all' ? n.set('owner', v) : n.delete('owner'); n.delete('page'); return n }, { replace: true }) }

  const debouncedSearch = useDebounce(search, 250)

  const profilesById = useMemo(
    () => Object.fromEntries(store.profiles.map((p) => [p.id, p.full_name])),
    [store.profiles],
  )

  const baseCustomers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)

  const filteredCustomers = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return baseCustomers.filter((customer) => {
      const matchesSearch =
        !q ||
        [customer.name, customer.company, customer.dni, customer.phone, customer.email]
          .some((v) => v?.toLowerCase().includes(q))
      const matchesStatus = status === 'all' || customer.status === status
      const matchesOwner = owner === 'all' || customer.assigned_to === owner
      return matchesSearch && matchesStatus && matchesOwner
    })
  }, [baseCustomers, debouncedSearch, status, owner])

  const pagination = usePagination(filteredCustomers, 25)

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
          <Select value={status} onChange={(e) => setStatus(e.target.value as 'all' | Customer['status'])}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="renewal_due">Renovacion pendiente</option>
            <option value="renewed">Renovados</option>
            <option value="inactive">Baja</option>
            <option value="lost">Perdidos</option>
          </Select>
        </Field>
        {store.currentUser.role !== 'sales' && (
          <Field label="Comercial" className="w-44">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">Todos</option>
              {store.profiles
                .filter((p) => p.role === 'owner' || p.role === 'admin' || p.role === 'sales')
                .map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </Field>
        )}
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState
          title={baseCustomers.length === 0 ? 'Sin clientes' : 'Sin resultados'}
          description={baseCustomers.length === 0 ? 'Crea el primer cliente para empezar a gestionar la cartera.' : 'Prueba a ajustar los filtros de busqueda.'}
          action={baseCustomers.length === 0 ? <CustomerFormDialog /> : undefined}
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Estado', 'Contrato', 'Renovacion', 'Servicios', 'Comercial']}
          pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize }}
        >
          {pagination.items.map((customer) => (
            <Tr key={customer.id} hover className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
              <Td>
                <p className="font-medium text-foreground">{customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.dni ?? 'Sin DNI'} · {customer.company ?? 'Sin empresa'}
                </p>
              </Td>
              <Td><StatusBadge value={customerStatusLabels[customer.status]} /></Td>
              <Td variant="muted">{formatDate(customer.contract_signed_at)}</Td>
              <Td variant="muted">{formatDate(customer.renewal_date)}</Td>
              <Td variant="muted">{customer.products_services.join(', ') || '-'}</Td>
              <Td variant="muted">{profilesById[customer.assigned_to ?? ''] ?? '-'}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
