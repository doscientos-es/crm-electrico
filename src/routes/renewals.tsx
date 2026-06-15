import { Phone, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { customerStatusLabels } from '../config/constants'
import { ContactLogDialog } from '../features/customers/ContactLogDialog'
import { useCustomerActions } from '../hooks/use-customer-actions'
import { useDebounce } from '../hooks/use-debounce'
import { getDaysToRenewal, getRenewalStage } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { cn } from '../lib/utils'
import { useCustomers } from '../services/customers.service'
import { useProfiles } from '../services/profiles.service'

type StageFilter = 'all' | 'due' | 'urgent' | 'overdue' | 'scheduled'

function DaysBadge({ days }: { days: number | undefined }) {
  if (typeof days !== 'number') return <span className="text-muted-foreground">-</span>
  return (
    <span
      className={cn(
        'tabular-nums font-medium',
        days < 0 ? 'text-destructive' : days <= 30 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
      )}
    >
      {days}d
    </span>
  )
}

export function RenewalsRoute() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [page, _setPage] = useState(0)

  const stage = (params.get('stage') ?? 'all') as StageFilter
  const search = params.get('q') ?? ''
  const debouncedSearch = useDebounce(search, 250)

  function setStage(value: StageFilter) {
    setParams((p) => { const n = new URLSearchParams(p); if (value === 'all') n.delete('stage'); else n.set('stage', value); n.delete('page'); return n })
  }
  function setSearch(value: string) {
    setParams((p) => { const n = new URLSearchParams(p); if (value) n.set('q', value); else n.delete('q'); n.delete('page'); return n })
  }

  // Fetch all customers with renewal filtering (RLS handles visibility)
  const { data: result } = useCustomers({ search: debouncedSearch || undefined, pageSize: 500 })
  const { data: profiles } = useProfiles()
  const { renewCustomer } = useCustomerActions()

  const profilesById = useMemo(
    () => Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])),
    [profiles],
  )

  const allCustomers = result?.data ?? []

  const renewalQueue = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return allCustomers
      .filter((customer) => {
        const currentStage = getRenewalStage(customer)
        const inStage = ['due', 'urgent', 'overdue', 'scheduled'].includes(currentStage) && (stage === 'all' || currentStage === stage)
        const matchesSearch = !q || customer.name.toLowerCase().includes(q) || customer.company?.toLowerCase().includes(q)
        return inStage && matchesSearch
      })
      .sort((a, b) => (a.renewal_date ?? '').localeCompare(b.renewal_date ?? ''))
  }, [allCustomers, stage, debouncedSearch])

  const PAGE_SIZE = 25
  const total = renewalQueue.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const pageItems = renewalQueue.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  void _setPage

  return (
    <div>
      <PageHeader
        title="Renovaciones"
        description="Cola automatica basada en contrato anual y aviso a los 10 meses."
        action={
          <Button asChild variant="secondary">
            <Link to="/customers">Ir a clientes</Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="min-w-48 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre o empresa..." />
          </div>
        </Field>
        <Field label="Estado de aviso" className="w-52">
          <Select value={stage} onChange={(e) => setStage(e.target.value as StageFilter)}>
            <option value="all">Todos</option>
            <option value="scheduled">Programados</option>
            <option value="due">Para contactar</option>
            <option value="urgent">Urgentes</option>
            <option value="overdue">Vencidos</option>
          </Select>
        </Field>
      </div>

      {renewalQueue.length === 0 ? (
        <EmptyState
          title="Sin renovaciones pendientes"
          description="No hay clientes en periodo de renovacion (10-12 meses desde firma)."
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Estado', 'Renovacion', 'Dias', 'Comercial', 'Acciones']}
          pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: _setPage, onPageSizeChange: () => { } }}
        >
          {pageItems.map((customer) => {
            const days = getDaysToRenewal(customer)
            return (
              <Tr key={customer.id} hover className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                <Td>
                  <p className="font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{(customer.products_services as string[]).join(', ') || 'Sin servicios'}</p>
                </Td>
                <Td><StatusBadge value={customerStatusLabels[customer.status as keyof typeof customerStatusLabels] ?? customer.status} /></Td>
                <Td variant="muted">{formatDate(customer.renewal_date ?? undefined)}</Td>
                <Td><DaysBadge days={days} /></Td>
                <Td variant="muted">{profilesById[customer.assigned_to ?? ''] ?? '-'}</Td>
                <Td>
                  <div className="flex gap-1">
                    <ContactLogDialog
                      customerId={customer.id}
                      customerName={customer.name}
                      trigger={
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => e.stopPropagation()}>
                          <Phone className="h-3 w-3" />Contactar
                        </Button>
                      }
                    />
                    {customer.status !== 'renewed' && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        onClick={(e) => { e.stopPropagation(); renewCustomer(customer) }}>
                        <RefreshCw className="h-3 w-3" />Renovado
                      </Button>
                    )}
                  </div>
                </Td>
              </Tr>
            )
          })}
        </DataTable>
      )}
    </div>
  )
}
