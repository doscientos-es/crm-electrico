import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Field, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { useAuth } from '../features/auth/AuthContext'
import { settlementLabel, type SettlementStatus } from '../features/settlements/settlement'
import { formatDate, money } from '../lib/formatters'
import { useAllContracts } from '../services/contracts.service'

const PAGE_SIZE = 25

export function SettlementsRoute() {
  const { profile } = useAuth()
  const [status, setStatus] = useState<'all' | SettlementStatus>('all')
  const [page, setPage] = useState(1)
  const { data, isLoading, isError } = useAllContracts({
    assignedTo: profile?.id,
    enabled: !!profile?.id,
    settlementStatus: status === 'all' ? undefined : status,
    includeCompanyCommission: false,
    page: page - 1,
    pageSize: PAGE_SIZE,
  })
  const contracts = data?.data ?? []

  return (
    <div className="flex h-full flex-col">
      <PageHeader title="Mis liquidaciones" description="Liquidaciones de los contratos de tus clientes asignados." />
      <div className="mb-6">
        <Field label="Liquidación" className="w-52">
          <Select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1) }}>
            <option value="all">Todas</option>
            <option value="pending">Pendientes de liquidar</option>
            <option value="paid">Liquidadas</option>
          </Select>
        </Field>
      </div>
      {isError ? <p className="text-sm text-destructive">No se pudieron cargar las liquidaciones.</p>
        : isLoading || !profile ? <p className="text-sm text-muted-foreground">Cargando liquidaciones…</p>
          : contracts.length === 0 ? <EmptyState
            title="Sin liquidaciones"
            description={page > 1 ? 'No hay contratos en esta página.' : 'No hay contratos con este filtro.'}
            action={page > 1 ? <Button variant="outline" onClick={() => setPage(1)}>Volver a la primera página</Button> : undefined}
          />
            : (
              <DataTable fillHeight className="flex-1 min-h-0"
                headers={['Cliente', 'CUPS', 'Comercializadora', 'Comisión comercial', 'Liquidación', 'Fecha de liquidación']}
                pagination={{ page, pageSize: PAGE_SIZE, total: data?.count ?? 0, totalPages: Math.ceil((data?.count ?? 0) / PAGE_SIZE), onPageChange: setPage }}>
                {contracts.map((contract) => (
                  <Tr key={contract.id}>
                    <Td variant="primary"><Link className="text-primary hover:underline" to={`/customers/${contract.customer_id}`}>{contract.customer?.name ?? '—'}</Link></Td>
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