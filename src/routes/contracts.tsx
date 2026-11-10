import { Download, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { contractStatusLabels } from '../config/constants'
import { useAuth } from '../features/auth/AuthContext'
import { ContractFormDialog } from '../features/contracts/ContractFormDialog'
import { settlementLabel } from '../features/settlements/settlement'
import { useDebounce } from '../hooks/use-debounce'
import { exportToCSV } from '../lib/export'
import { formatDate, money } from '../lib/formatters'
import { canViewCompanyCommission } from '../lib/permissions'
import { type ContractWithCustomer, fetchAllContractsForExport, useAllContracts, useContractProviders } from '../services/contracts.service'
import { useProfiles } from '../services/profiles.service'
import type { ContractStatus } from '../types/database.types'

const PAGE_SIZE = 25

function setParam(p: URLSearchParams, key: string, value: string | undefined) {
  if (value) p.set(key, value); else p.delete(key)
}

export function ContractsRoute() {
  return <ContractsList />
}

export function IncidentsRoute() {
  return <ContractsList fixedStatus="incident" />
}

function ContractsList({ fixedStatus }: { fixedStatus?: ContractStatus }) {
  const { profile: currentUser } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [editingContract, setEditingContract] = useState<ContractWithCustomer | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const showCompanyCommission = canViewCompanyCommission(currentUser?.role ?? 'viewer')

  async function handleExport() {
    setIsExporting(true)
    try {
      const rows = await fetchAllContractsForExport({
        search: debouncedSearch || undefined,
        status: status !== 'all' ? status as ContractStatus : undefined,
        assignedTo: owner !== 'all' ? owner : undefined,
        provider: provider !== 'all' ? provider : undefined,
        startsFrom: startsFrom || undefined,
        endsTo: endsTo || undefined,
        includeCompanyCommission: showCompanyCommission,
      })
      if (!rows.length) {
        toast.info('No hay contratos que exportar con los filtros actuales.')
        return
      }
      const statusLabel = status !== 'all' ? contractStatusLabels[status as keyof typeof contractStatusLabels] ?? status : 'todos'
      const filename = `contratos_${statusLabel}_${new Date().toISOString().slice(0, 10)}`
      exportToCSV(
        rows.map((ct) => ({
          Cliente: ct.customer?.name ?? '',
          Empresa: ct.customer?.company ?? '',
          Estado: contractStatusLabels[ct.status as keyof typeof contractStatusLabels] ?? ct.status,
          ...(fixedStatus === 'incident' ? { 'Motivo de incidencia': ct.incident_reason ?? '' } : {}),
          'Estado de liquidación': settlementLabel(ct.settlement_status),
          'Fecha de liquidación': ct.settlement_date ? formatDate(ct.settlement_date) : '',
          Comercializadora: ct.provider ?? '',
          'Canal de venta': ct.sales_channel ?? '',
          Producto: ct.product ?? '',
          CUPS: ct.cups ?? '',
          Tarifa: ct.tariff_type ?? '',
          'Potencia (kW)': ct.power_kw ?? '',
          'Consumo anual (kWh)': ct.annual_consumption_kwh ?? '',
          'Precio energía': ct.energy_price_eur ?? '',
          'Importe (€)': ct.amount_eur ?? '',
          'Comisión (€)': ct.commission_eur ?? '',
          ...(showCompanyCommission ? { 'Comisión empresa (€)': ct.commission_company_eur ?? '' } : {}),
          'Comisión comercial (€)': ct.commission_commercial_eur ?? '',
          'Inicio vigencia': ct.starts_at ? formatDate(ct.starts_at) : '',
          'Fin vigencia': ct.ends_at ? formatDate(ct.ends_at) : '',
          'Fecha baja': ct.terminated_at ? formatDate(ct.terminated_at) : '',
          'Fecha firma': ct.signed_at ? formatDate(ct.signed_at) : '',
        })),
        filename,
      )
      toast.success(`${rows.length} contratos exportados correctamente.`)
    } catch {
      toast.error('Error al exportar. Inténtalo de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const search = params.get('q') ?? ''
  const status = fixedStatus ?? params.get('status') ?? 'all'
  const owner = params.get('owner') ?? 'all'
  const provider = params.get('provider') ?? 'all'
  const startsFrom = params.get('startsFrom') ?? ''
  const endsTo = params.get('endsTo') ?? ''
  const page = Math.max(1, Number(params.get('page') ?? '1'))

  function setSearch(v: string) {
    setParams((p) => { const n = new URLSearchParams(p); setParam(n, 'q', v); n.delete('page'); return n }, { replace: true })
  }
  function setStatus(v: string) {
    setParams((p) => { const n = new URLSearchParams(p); setParam(n, 'status', v !== 'all' ? v : undefined); n.delete('page'); return n }, { replace: true })
  }
  function setOwner(v: string) {
    setParams((p) => { const n = new URLSearchParams(p); setParam(n, 'owner', v !== 'all' ? v : undefined); n.delete('page'); return n }, { replace: true })
  }
  function setProvider(v: string) {
    setParams((p) => { const n = new URLSearchParams(p); setParam(n, 'provider', v !== 'all' ? v : undefined); n.delete('page'); return n }, { replace: true })
  }
  function setDateParam(key: string, v: string) {
    setParams((p) => { const n = new URLSearchParams(p); setParam(n, key, v || undefined); n.delete('page'); return n }, { replace: true })
  }
  function setPage(p: number) {
    setParams((prev) => { const n = new URLSearchParams(prev); if (p > 1) n.set('page', String(p)); else n.delete('page'); return n }, { replace: true })
  }

  const hasFilters = !!(search || status !== 'all' || owner !== 'all' || provider !== 'all' || startsFrom || endsTo)
  const debouncedSearch = useDebounce(search, 250)
  const { data: profiles } = useProfiles()
  const { data: providers } = useContractProviders()

  const { data: result, isLoading, isError } = useAllContracts({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status as ContractStatus : undefined,
    assignedTo: owner !== 'all' ? owner : undefined,
    provider: provider !== 'all' ? provider : undefined,
    startsFrom: startsFrom || undefined,
    endsTo: endsTo || undefined,
    page: page - 1,
    pageSize: PAGE_SIZE,
    includeCompanyCommission: showCompanyCommission,
  })

  const contracts = result?.data ?? []
  const total = result?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const headers = [
    'Cliente',
    'Estado',
    ...(fixedStatus === 'incident' ? ['Motivo de la incidencia'] : []),
    'Producto / Comercializadora',
    'Canal de venta',
    'CUPS',
    'Inicio',
    'Fin',
    ...(showCompanyCommission ? ['Comisión empresa'] : []),
    'Comisión comercial',
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={fixedStatus === 'incident' ? 'Incidencias' : 'Contratos'}
        description={fixedStatus === 'incident' ? 'Contratos en estado de incidencia.' : 'Listado global de todos los contratos. Busca por CUPS, comercializadora, canal de venta o producto.'}
      />

      <div className="mb-6 grid gap-3 sm:flex sm:flex-wrap sm:items-end">
        <Field label="Buscar" className="min-w-52 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cliente, CUPS, comercializadora, canal de venta, producto..."
            />
          </div>
        </Field>
        {!fixedStatus && (
          <Field label="Estado" className="w-44">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Todos</option>
              {Object.entries(contractStatusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
        )}
        {currentUser?.role !== 'sales' && (
          <Field label="Comercial" className="w-44">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">Todos</option>
              {(profiles ?? [])
                .filter((profile) => ['owner', 'admin', 'sales'].includes(profile.role))
                .map((profile) => <option key={profile.id} value={profile.id}>{profile.full_name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Comercializadora" className="w-52">
          <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="all">Todas</option>
            {(providers ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
        </Field>
        <div className="flex items-end gap-3">
          <Field label="Inicio" className="w-36">
            <Input type="date" value={startsFrom} onChange={(e) => setDateParam('startsFrom', e.target.value)} />
          </Field>
          <Field label="Fin" className="w-36">
            <Input type="date" value={endsTo} onChange={(e) => setDateParam('endsTo', e.target.value)} />
          </Field>
          <Button variant="outline" className="self-end" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">No se pudieron cargar los contratos.</p>
      ) : !isLoading && contracts.length === 0 ? (
        <EmptyState
          title="Sin contratos"
          description={hasFilters ? 'Prueba a ajustar los filtros de búsqueda.' : 'Todavía no hay contratos registrados.'}
        />
      ) : (
        <DataTable
          fillHeight
          className="flex-1 min-h-0"
          headers={headers}
          isLoading={isLoading}
          loadingLabel={fixedStatus === 'incident' ? 'Cargando incidencias…' : 'Cargando contratos…'}
          pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: setPage }}
        >
          {contracts.map((contract) => (
            <Tr
              key={contract.id}
              hover
              className="cursor-pointer"
              onClick={() => setEditingContract(contract)}
            >
              <Td
                onClick={(e) => {
                  if (!contract.customer_id) return
                  e.stopPropagation()
                  navigate(`/customers/${contract.customer_id}`)
                }}
                className="group max-w-48 align-middle"
              >
                <p className="truncate text-sm font-medium text-foreground group-hover:underline">{contract.customer?.name ?? '-'}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{contract.customer?.company ?? ''}</p>
              </Td>
              <Td className="whitespace-nowrap">
                <StatusBadge value={contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status} />
              </Td>
              {fixedStatus === 'incident' && <Td className="whitespace-pre-wrap">{contract.incident_reason || 'Sin registrar'}</Td>}
              <Td className="max-w-48 align-middle">
                <p className="truncate text-sm font-medium text-foreground">{contract.product ?? '-'}</p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">{contract.provider ?? ''}</p>
              </Td>
              <Td variant="muted" className="max-w-40 truncate">{contract.sales_channel ?? '-'}</Td>
              <Td variant="muted" className="whitespace-nowrap text-sm">{contract.cups ?? '-'}</Td>
              <Td variant="muted" className="whitespace-nowrap">{formatDate(contract.starts_at ?? undefined)}</Td>
              <Td variant="muted" className="whitespace-nowrap">{formatDate(contract.ends_at ?? undefined)}</Td>
              {showCompanyCommission && (
                <Td variant="muted" className="whitespace-nowrap">{money.format(contract.commission_company_eur ?? 0)}</Td>
              )}
              <Td variant="muted" className="whitespace-nowrap">{money.format(contract.commission_commercial_eur ?? 0)}</Td>
            </Tr>
          ))}
        </DataTable>
      )}

      {editingContract && (
        <ContractFormDialog
          key={editingContract.id}
          customerId={editingContract.customer_id ?? ''}
          contract={editingContract}
          open
          onOpenChange={(next) => { if (!next) setEditingContract(null) }}
        />
      )}
    </div>
  )
}
