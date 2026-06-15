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

export function ContractsRoute() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [editingContract, setEditingContract] = useState<ContractWithCustomer | null>(null)

  const search = params.get('q') ?? ''
  const status = params.get('status') ?? 'all'
  const page = Math.max(1, Number(params.get('page') ?? '1'))

  function setSearch(v: string) {
    setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('q', v); else n.delete('q'); n.delete('page'); return n }, { replace: true })
  }
  function setStatus(v: string) {
    setParams((p) => { const n = new URLSearchParams(p); if (v !== 'all') n.set('status', v); else n.delete('status'); n.delete('page'); return n }, { replace: true })
  }
  function setPage(p: number) {
    setParams((prev) => { const n = new URLSearchParams(prev); if (p > 1) n.set('page', String(p)); else n.delete('page'); return n }, { replace: true })
  }

  const debouncedSearch = useDebounce(search, 250)

  const { data: result, isLoading } = useAllContracts({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status as ContractStatus : undefined,
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
              placeholder="Nº contrato, CUPS, comercializadora, producto..."
            />
          </div>
        </Field>
        <Field label="Estado" className="w-52">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos</option>
            {Object.entries(contractStatusLabels).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </Field>
      </div>

      {!isLoading && contracts.length === 0 ? (
        <EmptyState
          title="Sin contratos"
          description={debouncedSearch || status !== 'all' ? 'Prueba a ajustar los filtros de búsqueda.' : 'Todavía no hay contratos registrados.'}
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Nº Contrato', 'Estado', 'Producto / Comercializadora', 'CUPS', 'Inicio', 'Fin', 'Importe']}
          pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: setPage, onPageSizeChange: () => { } }}
        >
          {contracts.map((contract) => (
            <Tr
              key={contract.id}
              hover
              className="cursor-pointer"
              onClick={() => contract.customer_id && navigate(`/customers/${contract.customer_id}`)}
            >
              <Td>
                <p className="font-medium text-foreground">{contract.customer?.name ?? '-'}</p>
                <p className="text-xs text-muted-foreground">{contract.customer?.company ?? ''}</p>
              </Td>
              <Td variant="muted">{contract.contract_number ?? '-'}</Td>
              <Td>
                <StatusBadge value={contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status} />
              </Td>
              <Td>
                <p className="text-sm text-foreground">{contract.product ?? '-'}</p>
                <p className="text-xs text-muted-foreground">{contract.provider ?? ''}</p>
              </Td>
              <Td variant="muted" className="font-mono text-xs">{contract.cups ?? '-'}</Td>
              <Td variant="muted">{formatDate(contract.starts_at ?? undefined)}</Td>
              <Td variant="muted">{formatDate(contract.ends_at ?? undefined)}</Td>
              <Td variant="muted">{money.format(contract.amount_eur)}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
