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
import { ContractFormDialog } from '../features/contracts/ContractFormDialog'
import { useDebounce } from '../hooks/use-debounce'
import { exportToCSV } from '../lib/export'
import { formatDate, money } from '../lib/formatters'
import { type ContractWithCustomer, fetchAllContractsForExport, useAllContracts } from '../services/contracts.service'
import type { ContractStatus } from '../types/database.types'

const PAGE_SIZE = 25

function setParam(p: URLSearchParams, key: string, value: string | undefined) {
  if (value) p.set(key, value); else p.delete(key)
}

export function ContractsRoute() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [editingContract, setEditingContract] = useState<ContractWithCustomer | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const rows = await fetchAllContractsForExport({
        search: debouncedSearch || undefined,
        status: status !== 'all' ? status as ContractStatus : undefined,
        startsFrom: startsFrom || undefined,
        endsTo: endsTo || undefined,
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
          'Comisión empresa (€)': ct.commission_company_eur ?? '',
          'Comisión comercial (€)': ct.commission_commercial_eur ?? '',
          'Inicio vigencia': ct.starts_at ? formatDate(ct.starts_at) : '',
          'Fin vigencia': ct.ends_at ? formatDate(ct.ends_at) : '',
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
  const status = params.get('status') ?? 'all'
  const startsFrom = params.get('startsFrom') ?? ''
  const endsTo = params.get('endsTo') ?? ''
  const page = Math.max(1, Number(params.get('page') ?? '1'))

  function setSearch(v: string) {
    setParams((p) => { const n = new URLSearchParams(p); setParam(n, 'q', v); n.delete('page'); return n }, { replace: true })
  }
  function setStatus(v: string) {
    setParams((p) => { const n = new URLSearchParams(p); setParam(n, 'status', v !== 'all' ? v : undefined); n.delete('page'); return n }, { replace: true })
  }
  function setDateParam(key: string, v: string) {
    setParams((p) => { const n = new URLSearchParams(p); setParam(n, key, v || undefined); n.delete('page'); return n }, { replace: true })
  }
  function setPage(p: number) {
    setParams((prev) => { const n = new URLSearchParams(prev); if (p > 1) n.set('page', String(p)); else n.delete('page'); return n }, { replace: true })
  }

  const hasFilters = !!(search || status !== 'all' || startsFrom || endsTo)
  const debouncedSearch = useDebounce(search, 250)

  const { data: result, isLoading } = useAllContracts({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status as ContractStatus : undefined,
    startsFrom: startsFrom || undefined,
    endsTo: endsTo || undefined,
    page: page - 1,
    pageSize: PAGE_SIZE,
  })

  const contracts = result?.data ?? []
  const total = result?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Listado global de todos los contratos. Busca por CUPS, comercializadora, canal de venta o producto."
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
        <Field label="Estado" className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos</option>
            {Object.entries(contractStatusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
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

      {!isLoading && contracts.length === 0 ? (
        <EmptyState
          title="Sin contratos"
          description={hasFilters ? 'Prueba a ajustar los filtros de búsqueda.' : 'Todavía no hay contratos registrados.'}
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Estado', 'Producto / Comercializadora', 'Canal de venta', 'CUPS', 'Inicio', 'Fin', 'Comisión empresa', 'Comisión comercial']}
          pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: setPage, onPageSizeChange: () => { } }}
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
                className="group max-w-48"
              >
                <p className="truncate font-medium text-foreground group-hover:underline">{contract.customer?.name ?? '-'}</p>
                <p className="truncate text-xs text-muted-foreground">{contract.customer?.company ?? ''}</p>
              </Td>
              <Td className="whitespace-nowrap">
                <StatusBadge value={contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status} />
              </Td>
              <Td className="max-w-48">
                <p className="truncate text-sm text-foreground">{contract.product ?? '-'}</p>
                <p className="truncate text-xs text-muted-foreground">{contract.provider ?? ''}</p>
              </Td>
              <Td variant="muted" className="max-w-40 truncate">{contract.sales_channel ?? '-'}</Td>
              <Td variant="muted" className="whitespace-nowrap font-mono text-xs">{contract.cups ?? '-'}</Td>
              <Td variant="muted" className="whitespace-nowrap">{formatDate(contract.starts_at ?? undefined)}</Td>
              <Td variant="muted" className="whitespace-nowrap">{formatDate(contract.ends_at ?? undefined)}</Td>
              <Td variant="muted" className="whitespace-nowrap">{money.format(contract.commission_company_eur ?? 0)}</Td>
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
