import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { IncidentForm } from '../features/incidents/IncidentForm'
import { useIncident } from '../services/incidents.service'

export function IncidentFormRoute() {
  const { id } = useParams()
  const { data: incident } = useIncident(id)
  const editing = Boolean(id)
  if (editing && !incident) return <div className="grid gap-4"><p className="text-sm text-muted-foreground">Incidencia no encontrada.</p><Button asChild variant="secondary" className="w-fit"><Link to="/incidents">Volver</Link></Button></div>
  return <div><PageHeader title={editing ? 'Editar incidencia' : 'Nueva incidencia'} description="Registra el contexto, prioridad, estado y relación con cliente o contrato." /><IncidentForm incident={incident} /></div>
}
