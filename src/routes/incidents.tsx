import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { incidentPriorityLabels, incidentStatusLabels } from '../config/constants'
import { IncidentFormDialog } from '../features/incidents/IncidentFormDialog'
import { useToastError } from '../hooks/use-toast-error'
import { formatDate, relativeTime } from '../lib/formatters'
import { useAllIncidents, useResolveIncident } from '../services/incidents.service'

const priorityColor: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-destructive font-semibold',
}

export function IncidentsRoute() {
  const { data: incidents = [], isLoading } = useAllIncidents()
  const resolveIncident = useResolveIncident()
  const onError = useToastError()

  function handleResolve(id: string) {
    resolveIncident.mutate(id, {
      onSuccess: () => toast.success('Incidencia resuelta'),
      onError,
    })
  }

  return (
    <div>
      <PageHeader
        title="Incidencias"
        description="Incidencias abiertas de clientes. Al resolverlas desaparecen de este listado."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando incidencias…</p>
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 />}
          title="Sin incidencias abiertas"
          description="Cuando se creen incidencias desde la ficha de un cliente aparecerán aquí."
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Tipo / Título', 'Prioridad', 'Estado', 'Creada', { label: 'Acciones', align: 'right' }]}
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
              <Td variant="muted">{incident.title}</Td>
              <Td>
                <span className={priorityColor[incident.priority] ?? ''}>
                  {incidentPriorityLabels[incident.priority as keyof typeof incidentPriorityLabels] ?? incident.priority}
                </span>
              </Td>
              <Td>
                <StatusBadge value={incidentStatusLabels[incident.status as keyof typeof incidentStatusLabels] ?? incident.status} />
              </Td>
              <Td variant="muted" className="whitespace-nowrap">
                <span title={formatDate(incident.created_at)}>{relativeTime(incident.created_at)}</span>
              </Td>
              <Td align="right">
                <div className="flex items-center justify-end gap-1">
                  {incident.customer && (
                    <IncidentFormDialog customerId={incident.customer.id} incident={incident} />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolveIncident.isPending}
                    onClick={() => handleResolve(incident.id)}
                    className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolver
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
