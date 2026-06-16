import { Mail, Phone, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { contractStatusLabels } from '../config/constants'
import { ContractFormDialog } from '../features/contracts/ContractFormDialog'
import { RenewalContactDialog } from '../features/renewals/RenewalContactDialog'
import { useDebounce } from '../hooks/use-debounce'
import { usePagination } from '../hooks/use-pagination'
import { getContractRenewalStage, getDaysToContractEnd } from '../lib/customer-workflow'
import { formatDate, formatDateTime, relativeTime } from '../lib/formatters'
import { cn } from '../lib/utils'
import { getContactChannel, useRenewalContacts } from '../services/activity.service'
import { useContractsDueForRenewal } from '../services/contracts.service'

type StageFilter = 'all' | 'due' | 'urgent' | 'overdue'

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

  const stage = (params.get('stage') ?? 'all') as StageFilter
  const search = params.get('q') ?? ''
  const debouncedSearch = useDebounce(search, 250)

  function setStage(value: StageFilter) {
    setParams((p) => { const n = new URLSearchParams(p); if (value === 'all') n.delete('stage'); else n.set('stage', value); n.delete('page'); return n })
  }
  function setSearch(value: string) {
    setParams((p) => { const n = new URLSearchParams(p); if (value) n.set('q', value); else n.delete('q'); n.delete('page'); return n })
  }

  const { data: contracts = [] } = useContractsDueForRenewal(60)
  const customerIds = useMemo(
    () => contracts.flatMap((contract) => contract.customer?.id ? [contract.customer.id] : []),
    [contracts],
  )
  const { data: renewalContacts = [] } = useRenewalContacts(customerIds)
  const latestContactByCustomer = useMemo(() => {
    const latest = new Map<string, (typeof renewalContacts)[number]>()
    for (const contact of renewalContacts) {
      if (!latest.has(contact.entity_id)) latest.set(contact.entity_id, contact)
    }
    return latest
  }, [renewalContacts])

  const renewalQueue = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return contracts.filter((contract) => {
      const currentStage = getContractRenewalStage(contract)
      const inStage = stage === 'all' || currentStage === stage
      const customerName = contract.customer?.name?.toLowerCase() ?? ''
      const customerCompany = contract.customer?.company?.toLowerCase() ?? ''
      const cups = contract.cups?.toLowerCase() ?? ''
      const matchesSearch = !q || customerName.includes(q) || customerCompany.includes(q) || cups.includes(q)
      return inStage && matchesSearch
    })
  }, [contracts, stage, debouncedSearch])

  const pagination = usePagination(renewalQueue, 25)

  return (
    <div>
      <PageHeader
        title="Renovaciones"
        description="Contratos activos con vencimiento en los próximos 60 días."
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
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cliente, empresa o CUPS..." />
          </div>
        </Field>
        <Field label="Urgencia" className="w-52">
          <Select value={stage} onChange={(e) => setStage(e.target.value as StageFilter)}>
            <option value="all">Todos</option>
            <option value="due">Para contactar</option>
            <option value="urgent">Urgentes (≤30 días)</option>
            <option value="overdue">Vencidos</option>
          </Select>
        </Field>
      </div>

      {renewalQueue.length === 0 ? (
        <EmptyState
          title="Sin renovaciones pendientes"
          description="No hay contratos activos con vencimiento en los próximos 60 días."
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Comercializadora', 'CUPS', 'Vencimiento', 'Días', 'Último contacto', 'Estado contrato', 'Acciones']}
          pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize }}
        >
          {pagination.items.map((contract) => {
            const days = getDaysToContractEnd(contract)
            const customerId = contract.customer?.id
            const latestContact = customerId ? latestContactByCustomer.get(customerId) : undefined
            const contactChannel = latestContact ? getContactChannel(latestContact) : null
            return (
              <Tr
                key={contract.id}
                hover
                className="cursor-pointer"
                onClick={() => navigate(`/customers/${contract.customer?.id}`)}
              >
                <Td>
                  <p className="font-medium text-foreground">{contract.customer?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{contract.customer?.company ?? ''}</p>
                </Td>
                <Td variant="muted">{contract.provider ?? '—'}</Td>
                <Td variant="muted">{contract.cups ?? '—'}</Td>
                <Td variant="muted">{formatDate(contract.ends_at ?? undefined)}</Td>
                <Td><DaysBadge days={days} /></Td>
                <Td>
                  {latestContact ? (
                    <div title={formatDateTime(latestContact.created_at)}>
                      <p className="flex items-center gap-1.5 text-sm text-foreground">
                        {contactChannel === 'email' ? <Mail className="size-3.5" /> : <Phone className="size-3.5" />}
                        {relativeTime(latestContact.created_at)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {latestContact.actor?.full_name ?? 'Usuario no disponible'}
                      </p>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin contacto</span>
                  )}
                </Td>
                <Td>
                  <StatusBadge value={contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status} />
                </Td>
                <Td>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} role="presentation">
                    {customerId && (
                      <>
                        <RenewalContactDialog
                          customerId={customerId}
                          customerName={contract.customer?.name ?? 'Cliente'}
                          contractId={contract.id}
                          contacts={renewalContacts}
                        />
                        <ContractFormDialog customerId={customerId} prefillFrom={contract} />
                      </>
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
