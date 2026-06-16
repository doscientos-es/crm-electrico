import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { contractStatusLabels } from '../config/constants'
import { ContractFormDialog } from '../features/contracts/ContractFormDialog'
import { useDebounce } from '../hooks/use-debounce'
import { formatDate, money } from '../lib/formatters'
import { type ContractWithCustomer, useAllContracts } from '../services/contracts.service'
import type { ContractStatus } from '../types/database.types'

const PAGE_SIZE = 25

function setParam(p: URLSearchParams, key: string, value: string | undefined) {
  if (value) p.set(key, value); else p.delete(key)
}

export function ContractsRoute() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [editingContract, setEditingContract] = useState<ContractWithCustomer | null>(null)

  const search = params.get('q') ?? ''
  const status = params.get('status') ?? 'all'
  const startsFrom = params.get('startsFrom') ?? ''
  const startsTo = params.get('startsTo') ?? ''
  const endsFrom = params.get('endsFrom') ?? ''
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

  const hasFilters = !!(search || status !== 'all' || startsFrom || startsTo || endsFrom || endsTo)
  const debouncedSearch = useDebounce(search, 250)

  const { data: result, isLoading } = useAllContracts({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status as ContractStatus : undefined,
    startsFrom: startsFrom || undefined,
    startsTo: startsTo || undefined,
    endsFrom: endsFrom || undefined,
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
        description="Listado global de todos los contratos. Busca por número, CUPS, comercializadora o producto."
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="min-w-52 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cliente, nº contrato, CUPS, comercializadora, producto..."
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
        <Field label="Inicio desde" className="w-36">
          <Input type="date" value={startsFrom} onChange={(e) => setDateParam('startsFrom', e.target.value)} />
        </Field>
        <Field label="Inicio hasta" className="w-36">
          <Input type="date" value={startsTo} onChange={(e) => setDateParam('startsTo', e.target.value)} />
        </Field>
        <Field label="Vto. desde" className="w-36">
          <Input type="date" value={endsFrom} onChange={(e) => setDateParam('endsFrom', e.target.value)} />
        </Field>
        <Field label="Vto. hasta" className="w-36">
          <Input type="date" value={endsTo} onChange={(e) => setDateParam('endsTo', e.target.value)} />
        </Field>
      </div>

      {!isLoading && contracts.length === 0 ? (
        <EmptyState
          title="Sin contratos"
          description={hasFilters ? 'Prueba a ajustar los filtros de búsqueda.' : 'Todavía no hay contratos registrados.'}
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Estado', 'Producto / Comercializadora', 'CUPS', 'Inicio', 'Fin', 'Comisión empresa']}
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
              <Td variant="muted" className="whitespace-nowrap font-mono text-xs">{contract.cups ?? '-'}</Td>
              <Td variant="muted" className="whitespace-nowrap">{formatDate(contract.starts_at ?? undefined)}</Td>
              <Td variant="muted" className="whitespace-nowrap">{formatDate(contract.ends_at ?? undefined)}</Td>
              <Td variant="muted" className="whitespace-nowrap">{money.format(contract.commission_company_eur ?? 0)}</Td>
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
