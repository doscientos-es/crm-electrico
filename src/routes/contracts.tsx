import { FileText, Plus, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { contractStatusLabels } from '../config/constants'
import { formatDate, money } from '../lib/formatters'
import { useContracts } from '../services/contracts.service'
import { useCustomers } from '../services/customers.service'

export function ContractsRoute() {
  const { data: contracts = [] } = useContracts()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const customers = useMemo(() => customersResult?.data ?? [], [customersResult?.data])
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const status = params.get('status') ?? 'all'
  const customerId = params.get('customer') ?? 'all'
  const customersById = useMemo(() => Object.fromEntries(customers.map((item) => [item.id, item.name])), [customers])
  const filtered = contracts.filter((contract) => {
    if (status !== 'all' && contract.status !== status) return false
    if (customerId !== 'all' && contract.customer_id !== customerId) return false
    const query = search.trim().toLowerCase()
    return !query || contract.contract_number.toLowerCase().includes(query) || (customersById[contract.customer_id] ?? '').toLowerCase().includes(query)
  })

  function setFilter(key: string, value: string, empty = 'all') {
    setParams((current) => {
      const next = new URLSearchParams(current)
      if (value === empty) next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Contratos"
        description="Tramitación, firma, vigencia, importe y datos energéticos de cada contrato."
        action={<Button asChild><Link to="/contracts/new"><Plus className="h-4 w-4" />Nuevo contrato</Link></Button>}
      />
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="min-w-52 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(event) => setFilter('q', event.target.value, '')} placeholder="Número o cliente..." />
          </div>
        </Field>
        <Field label="Estado" className="w-52">
          <Select value={status} onChange={(event) => setFilter('status', event.target.value)}>
            <option value="all">Todos</option>
            {Object.entries(contractStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        <Field label="Cliente" className="w-56">
          <Select value={customerId} onChange={(event) => setFilter('customer', event.target.value)}>
            <option value="all">Todos</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </Select>
        </Field>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<FileText />} title="Sin contratos" description="No hay contratos que coincidan con los filtros." action={<Button asChild><Link to="/contracts/new">Crear contrato</Link></Button>} />
      ) : (
        <DataTable headers={['Contrato', 'Cliente', 'Estado', 'Vigencia', 'Importe', 'Comisión', '']}>
          {filtered.map((contract) => (
            <Tr key={contract.id} hover>
              <Td variant="primary"><Link className="hover:underline" to={`/contracts/${contract.id}`}>{contract.contract_number}</Link></Td>
              <Td variant="muted">{customersById[contract.customer_id] ?? '—'}</Td>
              <Td><StatusBadge value={contractStatusLabels[contract.status] ?? contract.status} /></Td>
              <Td variant="muted">{formatDate(contract.starts_at ?? undefined)} – {formatDate(contract.ends_at ?? undefined)}</Td>
              <Td>{money.format(contract.amount_eur)}</Td>
              <Td>{money.format(contract.commission_eur)}</Td>
              <Td><Button asChild size="sm" variant="secondary"><Link to={`/contracts/${contract.id}/edit`}>Editar</Link></Button></Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
