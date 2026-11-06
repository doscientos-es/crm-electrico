import { Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { contractStatusLabels } from '../config/constants'
import { useAuth } from '../features/auth/AuthContext'
import { RenewalCustomerNotes, RenewalStatusControls } from '../features/renewals/RenewalFollowupControls'
import { useDebounce } from '../hooks/use-debounce'
import { usePagination } from '../hooks/use-pagination'
import { getContractRenewalStage, getDaysToContractEnd } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { can } from '../lib/permissions'
import { cn } from '../lib/utils'
import { useContractProviders, useContractsDueForRenewal } from '../services/contracts.service'
import { useProfiles } from '../services/profiles.service'

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
  const { profile: currentUser } = useAuth()
  const canEdit = can(currentUser?.role ?? 'viewer', 'customers:write')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const requestedStage = params.get('stage')
  const stage: StageFilter = requestedStage === 'due' || requestedStage === 'urgent' || requestedStage === 'overdue' ? requestedStage : 'all'
  const search = params.get('q') ?? ''
  const owner = params.get('owner') ?? 'all'
  const provider = params.get('provider') ?? 'all'
  const startsFrom = params.get('startsFrom') ?? ''
  const endsTo = params.get('endsTo') ?? ''
  const debouncedSearch = useDebounce(search, 250)

  function setStage(value: StageFilter) {
    setParams((p) => { const n = new URLSearchParams(p); if (value === 'all') n.delete('stage'); else n.set('stage', value); n.delete('page'); return n })
  }
  function setSearch(value: string) {
    setParams((p) => { const n = new URLSearchParams(p); if (value) n.set('q', value); else n.delete('q'); n.delete('page'); return n })
  }
  function setFilter(key: 'owner' | 'provider' | 'startsFrom' | 'endsTo', value: string, allValue?: string) {
    setParams((p) => {
      const n = new URLSearchParams(p)
      if (!value || value === allValue) n.delete(key); else n.set(key, value)
      n.delete('page')
      return n
    }, { replace: true })
  }

  const { data: contracts = [], isLoading, isError } = useContractsDueForRenewal(60)
  const { data: profiles } = useProfiles()
  const { data: providers } = useContractProviders()
  const renewalQueue = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    return contracts.filter((contract) => {
      const currentStage = getContractRenewalStage(contract)
      const inStage = stage === 'all' || currentStage === stage
      const customerName = contract.customer?.name?.toLowerCase() ?? ''
      const customerCompany = contract.customer?.company?.toLowerCase() ?? ''
      const cups = contract.cups?.toLowerCase() ?? ''
      const matchesSearch = !q || customerName.includes(q) || customerCompany.includes(q) || cups.includes(q)
      const matchesOwner = owner === 'all' || contract.customer?.assigned_to === owner
      const matchesProvider = provider === 'all' || contract.provider === provider
      const matchesStart = !startsFrom || (contract.starts_at ?? '') >= startsFrom
      const matchesEnd = !endsTo || (contract.ends_at ?? '') <= endsTo
      return inStage && matchesSearch && matchesOwner && matchesProvider && matchesStart && matchesEnd
    })
  }, [contracts, stage, debouncedSearch, owner, provider, startsFrom, endsTo])

  const pagination = usePagination(renewalQueue, 25)

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Renovaciones"
        description="Contratos activos vencidos o con vencimiento en los próximos 60 días."
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
            <option value="overdue">Vencidos</option>
            <option value="due">Para contactar</option>
            <option value="urgent">Urgentes (≤30 días)</option>
          </Select>
        </Field>
        {currentUser?.role !== 'sales' && (
          <Field label="Comercial" className="w-44">
            <Select value={owner} onChange={(e) => setFilter('owner', e.target.value, 'all')}>
              <option value="all">Todos</option>
              {(profiles ?? [])
                .filter((profile) => ['owner', 'admin', 'sales'].includes(profile.role))
                .map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Comercializadora" className="w-52">
          <Select value={provider} onChange={(e) => setFilter('provider', e.target.value, 'all')}>
            <option value="all">Todas</option>
            {(providers ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
        </Field>
        <Field label="Inicio" className="w-36">
          <Input type="date" value={startsFrom} onChange={(e) => setFilter('startsFrom', e.target.value)} />
        </Field>
        <Field label="Fin" className="w-36">
          <Input type="date" value={endsTo} onChange={(e) => setFilter('endsTo', e.target.value)} />
        </Field>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">No se pudieron cargar las renovaciones.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando renovaciones…</p>
      ) : renewalQueue.length === 0 ? (
        <EmptyState
          title="Sin renovaciones pendientes"
          description="No hay contratos vencidos o próximos a vencer con los filtros actuales."
        />
      ) : (
        <DataTable
          fillHeight
          className="flex-1 min-h-0"
          headers={['Cliente', 'Comercial responsable', 'Comercializadora', 'Canal de venta', 'CUPS', 'Vencimiento', 'Días', 'Estado contrato', 'Seguimiento manual', 'Notas del cliente']}
          pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, onPageChange: pagination.setPage }}
        >
          {pagination.items.map((contract) => {
            const days = getDaysToContractEnd(contract)
            return (
              <Tr
                key={contract.id}
                hover
                className="cursor-pointer"
                onClick={() => navigate(`/customers/${contract.customer?.id}`)}
              >
                <Td className="whitespace-nowrap">
                  <p className="font-medium text-foreground">{contract.customer?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{contract.customer?.company ?? ''}</p>
                </Td>
                <Td variant="muted">{contract.customer?.assigned_to ? profiles?.find((profile) => profile.id === contract.customer?.assigned_to)?.full_name ?? 'No disponible' : 'Sin asignar'}</Td>
                <Td variant="muted">{contract.provider ?? '—'}</Td>
                <Td variant="muted">{contract.sales_channel ?? '—'}</Td>
                <Td variant="muted">{contract.cups ?? '—'}</Td>
                <Td variant="muted">{formatDate(contract.ends_at ?? undefined)}</Td>
                <Td><DaysBadge days={days} /></Td>
                <Td>
                  <StatusBadge value={contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status} />
                </Td>
                <Td><RenewalStatusControls contractId={contract.id} status={contract.renewal_followup_status} canEdit={canEdit} /></Td>
                <Td>{contract.customer ? <RenewalCustomerNotes customerId={contract.customer.id} customerName={contract.customer.name} notes={contract.customer.notes} canEdit={canEdit} /> : '—'}</Td>
              </Tr>
            )
          })}
        </DataTable>
      )}
    </div>
  )
}
