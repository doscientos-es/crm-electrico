import { AlertCircle, Plus, Search } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { incidentPriorityLabels, incidentStatusLabels } from '../config/constants'
import { formatDateTime } from '../lib/formatters'
import { useContracts } from '../services/contracts.service'
import { useCustomers } from '../services/customers.service'
import { useIncidents } from '../services/incidents.service'

export function IncidentsRoute() {
  const { data: incidents = [] } = useIncidents()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: contracts = [] } = useContracts()
  const customers = useMemo(() => customersResult?.data ?? [], [customersResult?.data])
  const customersById = useMemo(() => Object.fromEntries(customers.map((item) => [item.id, item.name])), [customers])
  const contractsById = useMemo(() => Object.fromEntries(contracts.map((item) => [item.id, item.contract_number])), [contracts])
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const status = params.get('status') ?? 'all'
  const priority = params.get('priority') ?? 'all'
  const customer = params.get('customer') ?? 'all'
  const contract = params.get('contract') ?? 'all'
  const filtered = incidents.filter((item) => {
    if (status !== 'all' && item.status !== status) return false
    if (priority !== 'all' && item.priority !== priority) return false
    if (customer !== 'all' && item.customerId !== customer) return false
    if (contract !== 'all' && item.contractId !== contract) return false
    const query = search.toLowerCase().trim()
    return !query || item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query) || item.internalNotes.toLowerCase().includes(query)
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
      <PageHeader title="Incidencias" description="Seguimiento de consultas, errores de facturación y gestiones con clientes y comercializadoras." action={<Button asChild><Link to="/incidents/new"><Plus className="h-4 w-4" />Nueva incidencia</Link></Button>} />
      <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Field label="Buscar" className="xl:col-span-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setFilter('q', event.target.value, '')} placeholder="Título, descripción o notas..." /></div></Field>
        <Field label="Estado"><Select value={status} onChange={(event) => setFilter('status', event.target.value)}><option value="all">Todos</option>{Object.entries(incidentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
        <Field label="Prioridad"><Select value={priority} onChange={(event) => setFilter('priority', event.target.value)}><option value="all">Todas</option>{Object.entries(incidentPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
        <Field label="Cliente"><Select value={customer} onChange={(event) => setFilter('customer', event.target.value)}><option value="all">Todos</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
        <Field label="Contrato" className="xl:col-start-5"><Select value={contract} onChange={(event) => setFilter('contract', event.target.value)}><option value="all">Todos</option>{contracts.map((item) => <option key={item.id} value={item.id}>{item.contract_number}</option>)}</Select></Field>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={<AlertCircle />} title="Sin incidencias" description="No hay incidencias que coincidan con los filtros." action={<Button asChild><Link to="/incidents/new">Crear incidencia</Link></Button>} />
      ) : (
        <DataTable headers={['Incidencia', 'Cliente', 'Contrato', 'Estado', 'Prioridad', 'Actualizada', '']}>
          {filtered.map((item) => (
            <Tr key={item.id} hover>
              <Td><Link className="font-medium hover:underline" to={`/incidents/${item.id}`}>{item.title}</Link><p className="max-w-72 truncate text-xs text-muted-foreground">{item.description || 'Sin descripción'}</p></Td>
              <Td variant="muted">{customersById[item.customerId] ?? '—'}</Td>
              <Td variant="muted">{item.contractId ? contractsById[item.contractId] ?? '—' : '—'}</Td>
              <Td><StatusBadge value={incidentStatusLabels[item.status]} /></Td>
              <Td><StatusBadge value={incidentPriorityLabels[item.priority]} /></Td>
              <Td variant="muted">{formatDateTime(item.updatedAt)}</Td>
              <Td><Button asChild size="sm" variant="secondary"><Link to={`/incidents/${item.id}/edit`}>Editar</Link></Button></Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
