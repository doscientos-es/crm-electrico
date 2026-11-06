import { CheckCircle2, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { IncidentFormDialog } from '../features/incidents/IncidentFormDialog'
import { useDebounce } from '../hooks/use-debounce'
import { useToastError } from '../hooks/use-toast-error'
import { formatDate, relativeTime } from '../lib/formatters'
import { useAllIncidents, useResolveIncident } from '../services/incidents.service'
import { useProfiles } from '../services/profiles.service'

const PAGE_SIZE = 25

export function IncidentsRoute() {
  const [params, setParams] = useSearchParams()

  const search = params.get('q') ?? ''
  const status = params.get('status') ?? 'open'
  const priority = params.get('priority') ?? 'all'
  const page = Math.max(1, Number(params.get('page') ?? '1'))

  function setSearch(v: string) { setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('q', v); else n.delete('q'); n.delete('page'); return n }, { replace: true }) }
  function setStatus(v: string) { setParams((p) => { const n = new URLSearchParams(p); if (v !== 'open') n.set('status', v); else n.delete('status'); n.delete('page'); return n }, { replace: true }) }
  function setPriority(v: string) { setParams((p) => { const n = new URLSearchParams(p); if (v !== 'all') n.set('priority', v); else n.delete('priority'); n.delete('page'); return n }, { replace: true }) }
  function setPage(p: number) { setParams((prev) => { const n = new URLSearchParams(prev); if (p > 1) n.set('page', String(p)); else n.delete('page'); return n }, { replace: true }) }

  const debouncedSearch = useDebounce(search, 250)
  const { data: profiles } = useProfiles()

  const { data: result, isLoading, isError } = useAllIncidents({
    search: debouncedSearch || undefined,
    status,
    priority: priority !== 'all' ? priority : undefined,
    page: page - 1,
    pageSize: PAGE_SIZE,
  })

  const incidents = result?.data ?? []
  const total = result?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const resolveIncident = useResolveIncident()
  const onError = useToastError()

  function handleResolve(id: string) {
    resolveIncident.mutate(id, {
      onSuccess: () => toast.success('Incidencia resuelta'),
      onError,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Incidencias"
        description="Incidencias de clientes. Filtra por estado, prioridad o busca por título."
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="min-w-52 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título de incidencia..." />
          </div>
        </Field>
        <Field label="Estado" className="w-40">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="open">Abiertas</option>
            <option value="all">Todas</option>
            <option value="new">Nuevas</option>
            <option value="in_progress">En progreso</option>
            <option value="resolved">Resueltas</option>
            <option value="closed">Cerradas</option>
          </Select>
        </Field>
        <Field label="Prioridad" className="w-40">
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="all">Todas</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </Select>
        </Field>
      </div>

      {isError ? (
        <p className="text-sm text-destructive">No se pudieron cargar las incidencias.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando incidencias…</p>
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 />}
          title="Sin incidencias"
          description="No hay incidencias con los filtros actuales."
        />
      ) : (
        <DataTable
          fillHeight
          className="flex-1 min-h-0"
          headers={['Cliente', 'Motivo', 'Comercial responsable', 'Creada', { label: 'Acciones', align: 'right' }]}
          pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: setPage }}
        >
          {incidents.map((incident) => (
            <Tr key={incident.id} hover>
              <Td variant="primary">
                {incident.customer ? (
                  <Link
                    to={`/customers/${incident.customer.id}`}
                    className="hover:underline text-primary"
                  >
                    {incident.customer.name}
                  </Link>
                ) : (
                  '—'
                )}
              </Td>
              <Td variant="muted">
                <p>{incident.title}</p>
                {incident.description && <p className="text-xs text-muted-foreground">{incident.description}</p>}
              </Td>
              <Td variant="muted">{incident.customer?.assigned_to ? profiles?.find((profile) => profile.id === incident.customer?.assigned_to)?.full_name ?? 'No disponible' : 'Sin asignar'}</Td>
              <Td variant="muted" className="whitespace-nowrap">
                <span title={formatDate(incident.created_at)}>{relativeTime(incident.created_at)}</span>
              </Td>
              <Td align="right">
                <div className="flex items-center justify-end gap-1">
                  {incident.customer && (
                    <IncidentFormDialog customerId={incident.customer.id} incident={incident} />
                  )}
                  {!['resolved', 'closed'].includes(incident.status) && <Button
                    size="sm"
                    variant="outline"
                    disabled={resolveIncident.isPending}
                    onClick={() => handleResolve(incident.id)}
                    className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolver
                  </Button>}
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
