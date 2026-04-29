import { Phone, RefreshCw, Search } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { customerStatusLabels } from '../config/constants'
import { useDebounce } from '../hooks/use-debounce'
import { usePagination } from '../hooks/use-pagination'
import { getDaysToRenewal, getRenewalStage, getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { cn } from '../lib/utils'
import { useDemoStore } from '../store/demo-store'

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
  const store = useDemoStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [contactingCustomerId, setContactingCustomerId] = useState<string | null>(null)
  const [contactedAt, setContactedAt] = useState(() => formatDateTimeLocal(new Date()))
  const [callNotes, setCallNotes] = useState('')

  const stage = (params.get('stage') ?? 'all') as StageFilter
  const search = params.get('q') ?? ''
  const debouncedSearch = useDebounce(search, 250)

  function setStage(value: StageFilter) {
    setParams((p) => { const n = new URLSearchParams(p); value === 'all' ? n.delete('stage') : n.set('stage', value); n.delete('page'); return n })
  }
  function setSearch(value: string) {
    setParams((p) => { const n = new URLSearchParams(p); value ? n.set('q', value) : n.delete('q'); n.delete('page'); return n })
  }

  const profilesById = useMemo(
    () => Object.fromEntries(store.profiles.map((p) => [p.id, p.full_name])),
    [store.profiles],
  )

  const customers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)

  const renewalQueue = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return customers
      .filter((customer) => {
        const currentStage = getRenewalStage(customer)
        const inStage = ['due', 'urgent', 'overdue', 'scheduled'].includes(currentStage) && (stage === 'all' || currentStage === stage)
        const matchesSearch = !q || customer.name.toLowerCase().includes(q) || customer.company?.toLowerCase().includes(q)
        return inStage && matchesSearch
      })
      .sort((a, b) => (a.renewal_date ?? '').localeCompare(b.renewal_date ?? ''))
  }, [customers, stage, debouncedSearch])

  const pagination = usePagination(renewalQueue, 25)
  const contactingCustomer = contactingCustomerId ? customers.find((customer) => customer.id === contactingCustomerId) : undefined

  function openContactDialog(customerId: string) {
    setContactingCustomerId(customerId)
    setContactedAt(formatDateTimeLocal(new Date()))
    setCallNotes('')
  }

  function closeContactDialog() {
    setContactingCustomerId(null)
    setCallNotes('')
  }

  function submitContactLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!contactingCustomerId) return
    store.touchCustomer(contactingCustomerId, { contacted_at: contactedAt, notes: callNotes })
    closeContactDialog()
  }

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
          pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize }}
        >
          {pagination.items.map((customer) => {
            const days = getDaysToRenewal(customer)
            return (
              <Tr key={customer.id} hover className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
                <Td>
                  <p className="font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.products_services.join(', ') || 'Sin servicios'}</p>
                </Td>
                <Td><StatusBadge value={customerStatusLabels[customer.status]} /></Td>
                <Td variant="muted">{formatDate(customer.renewal_date)}</Td>
                <Td><DaysBadge days={days} /></Td>
                <Td variant="muted">{profilesById[customer.assigned_to ?? ''] ?? '-'}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs"
                      onClick={(e) => { e.stopPropagation(); openContactDialog(customer.id) }}>
                      <Phone className="h-3 w-3" />Contactar
                    </Button>
                    {customer.status !== 'renewed' && (
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                        onClick={(e) => { e.stopPropagation(); store.renewCustomer(customer.id) }}>
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

      <Dialog
        open={Boolean(contactingCustomerId)}
        onOpenChange={(open) => {
          if (!open) closeContactDialog()
        }}
        title={contactingCustomer ? `Registrar llamada con ${contactingCustomer.name}` : 'Registrar llamada'}
        description="Guarda fecha, hora y notas de la llamada en la actividad del cliente."
      >
        <form className="grid gap-4" onSubmit={submitContactLog}>
          <Field label="Fecha y hora">
            <Input type="datetime-local" value={contactedAt} onChange={(event) => setContactedAt(event.target.value)} required />
          </Field>
          <Field label="Notas de la llamada">
            <Textarea
              value={callNotes}
              onChange={(event) => setCallNotes(event.target.value)}
              placeholder="Resumen de la conversación, siguiente paso, objeciones, etc."
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeContactDialog}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar actividad
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}

function formatDateTimeLocal(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  const hours = String(value.getHours()).padStart(2, '0')
  const minutes = String(value.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
