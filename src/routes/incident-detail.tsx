import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { incidentPriorityLabels, incidentStatusLabels } from '../config/constants'
import { formatDateTime } from '../lib/formatters'
import { useContract } from '../services/contracts.service'
import { useCustomer } from '../services/customers.service'
import { useIncident } from '../services/incidents.service'
import { useProfiles } from '../services/profiles.service'

export function IncidentDetailRoute() {
  const { id } = useParams()
  const { data: incident } = useIncident(id)
  const { data: customer } = useCustomer(incident?.customerId)
  const { data: contract } = useContract(incident?.contractId ?? undefined)
  const { data: profiles = [] } = useProfiles()
  const assigned = profiles.find((item) => item.id === incident?.assignedTo)
  if (!incident) return <p className="text-sm text-muted-foreground">Incidencia no encontrada.</p>
  return (
    <div>
      <PageHeader title={incident.title} description={customer?.name ?? 'Cliente no disponible'} action={<div className="flex gap-2"><Button asChild variant="secondary"><Link to="/incidents">Volver</Link></Button><Button asChild><Link to={`/incidents/${incident.id}/edit`}>Editar</Link></Button></div>} />
      <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4 border-b border-border pb-6">
        <Stat label="Estado"><StatusBadge value={incidentStatusLabels[incident.status]} /></Stat>
        <Stat label="Prioridad"><StatusBadge value={incidentPriorityLabels[incident.priority]} /></Stat>
        <Stat label="Creada">{formatDateTime(incident.createdAt)}</Stat>
        <Stat label="Actualizada">{formatDateTime(incident.updatedAt)}</Stat>
        <Stat label="Resuelta">{formatDateTime(incident.resolvedAt ?? undefined)}</Stat>
      </div>
      <section className="grid gap-8 xl:grid-cols-2">
        <Detail title="Información" rows={[['Cliente', customer?.name ?? '—'], ['Contrato', contract?.contract_number ?? '—'], ['Asignado a', assigned?.full_name ?? '—'], ['Descripción', incident.description || '—']]} />
        <Detail title="Seguimiento interno" rows={[['Notas internas', incident.internalNotes || '—'], ['Última actualización', formatDateTime(incident.updatedAt)], ['Fecha de resolución', formatDateTime(incident.resolvedAt ?? undefined)]]} />
      </section>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><div className="mt-1 text-sm font-semibold">{children}</div></div>
}

function Detail({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <div><h2 className="mb-3 text-sm font-semibold">{title}</h2><dl className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">{rows.map(([label, value]) => <div key={label} className="grid gap-1 px-4 py-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="whitespace-pre-wrap text-sm">{value}</dd></div>)}</dl></div>
}
