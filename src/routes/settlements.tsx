import { Download } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { useAuth } from '../features/auth/AuthContext'
import { settlementLabel, type SettlementStatus } from '../features/settlements/settlement'
import { formatDate, money } from '../lib/formatters'
import {
  fetchAllSettlementsForExport,
  useAllContracts,
  useContractProviders,
  useContractSalesChannels,
} from '../services/contracts.service'
import { useProfiles } from '../services/profiles.service'

const PAGE_SIZE = 25

export function SettlementsRoute() {
  const { profile } = useAuth()
  const [status, setStatus] = useState<'all' | SettlementStatus>('all')
  const [owner, setOwner] = useState('all')
  const [provider, setProvider] = useState('all')
  const [channel, setChannel] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [page, setPage] = useState(1)
  const { data: profiles = [] } = useProfiles()
  const { data: providers = [] } = useContractProviders()
  const { data: channels = [] } = useContractSalesChannels()
  const filters = {
    settlementStatus: status === 'all' ? ('registered' as const) : status,
    assignedTo: owner !== 'all' ? owner : undefined,
    provider: provider !== 'all' ? provider : undefined,
    salesChannel: channel !== 'all' ? channel : undefined,
    settlementFrom: dateFrom || undefined,
    settlementTo: dateTo || undefined,
  }
  const { data, isLoading, isError } = useAllContracts({
    ...filters,
    enabled: !!profile?.id,
    includeCompanyCommission: false,
    page: page - 1,
    pageSize: PAGE_SIZE,
  })
  const contracts = data?.data ?? []

  async function handleExport() {
    setIsExporting(true)
    try {
      const rows = await fetchAllSettlementsForExport(filters)
      if (!rows.length) {
        toast.info('No hay liquidaciones que exportar con los filtros actuales.')
        return
      }
      const XLSX = await import('xlsx')
      const sheet = XLSX.utils.json_to_sheet(
        rows.map((contract) => ({
          Cliente: contract.customer?.name ?? '',
          Comercial:
            profiles.find((item) => item.id === contract.customer?.assigned_to)?.full_name ?? '',
          Canal: contract.sales_channel ?? '',
          Comercializadora: contract.provider ?? '',
          CUPS: contract.cups ?? '',
          'Comisión comercial (€)': contract.commission_commercial_eur ?? 0,
          Liquidación: settlementLabel(contract.settlement_status),
          'Fecha de liquidación': contract.settlement_date
            ? formatDate(contract.settlement_date)
            : '',
        })),
      )
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, 'Liquidaciones')
      XLSX.writeFile(workbook, `liquidaciones_${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success(`${rows.length} liquidaciones exportadas correctamente.`)
    } catch {
      toast.error('Error al exportar las liquidaciones. Inténtalo de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Mis liquidaciones"
        description="Liquidaciones de los contratos de todos los clientes."
      />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Liquidación" className="w-52">
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status)
              setPage(1)
            }}
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes de liquidar</option>
            <option value="paid">Liquidadas</option>
          </Select>
        </Field>
        <Field label="Comercial" className="w-44">
          <Select
            value={owner}
            onChange={(event) => {
              setOwner(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Todos</option>
            {profiles
              .filter((item) => ['owner', 'admin', 'sales'].includes(item.role))
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Canal" className="w-44">
          <Select
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Todos</option>
            {channels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Comercializadora" className="w-52">
          <Select
            value={provider}
            onChange={(event) => {
              setProvider(event.target.value)
              setPage(1)
            }}
          >
            <option value="all">Todas</option>
            {providers.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Liquidación desde" className="w-40">
          <Input
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value)
              setPage(1)
            }}
          />
        </Field>
        <Field label="Liquidación hasta" className="w-40">
          <Input
            type="date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value)
              setPage(1)
            }}
          />
        </Field>
        <Button variant="outline" onClick={handleExport} disabled={!profile || isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? 'Exportando…' : 'Exportar Excel'}
        </Button>
      </div>
      {isError ? (
        <p className="text-destructive text-sm">No se pudieron cargar las liquidaciones.</p>
      ) : !isLoading && profile && contracts.length === 0 ? (
        <EmptyState
          title="Sin liquidaciones"
          description={
            page > 1 ? 'No hay contratos en esta página.' : 'No hay contratos con este filtro.'
          }
          action={
            page > 1 ? (
              <Button variant="outline" onClick={() => setPage(1)}>
                Volver a la primera página
              </Button>
            ) : undefined
          }
        />
      ) : (
        <DataTable
          fillHeight
          className="min-h-0 flex-1"
          headers={[
            'Cliente',
            'Comercial',
            'Canal',
            'CUPS',
            'Comercializadora',
            'Comisión comercial',
            'Liquidación',
            'Fecha de liquidación',
          ]}
          isLoading={isLoading || !profile}
          loadingLabel="Cargando liquidaciones…"
          pagination={{
            page,
            pageSize: PAGE_SIZE,
            total: data?.count ?? 0,
            totalPages: Math.ceil((data?.count ?? 0) / PAGE_SIZE),
            onPageChange: setPage,
          }}
        >
          {contracts.map((contract) => (
            <Tr key={contract.id}>
              <Td variant="primary">
                <Link
                  className="text-primary hover:underline"
                  to={`/customers/${contract.customer_id}`}
                >
                  {contract.customer?.name ?? '—'}
                </Link>
              </Td>
              <Td variant="muted">
                {profiles.find((item) => item.id === contract.customer?.assigned_to)?.full_name ??
                  '—'}
              </Td>
              <Td variant="muted">{contract.sales_channel ?? '—'}</Td>
              <Td variant="muted">{contract.cups ?? '—'}</Td>
              <Td variant="muted">{contract.provider ?? '—'}</Td>
              <Td variant="muted">{money.format(contract.commission_commercial_eur ?? 0)}</Td>
              <Td>{settlementLabel(contract.settlement_status)}</Td>
              <Td variant="muted">{formatDate(contract.settlement_date ?? undefined)}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
