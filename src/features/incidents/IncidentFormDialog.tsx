import { Loader2, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { incidentPriorityLabels, incidentTypeOptions } from '../../config/constants'
import { useToastError } from '../../hooks/use-toast-error'
import { type IncidentRow, useCreateIncident, useUpdateIncident } from '../../services/incidents.service'

interface Props {
  customerId: string
  incident?: IncidentRow
}

export function IncidentFormDialog({ customerId, incident }: Props) {
  const isEditing = Boolean(incident)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(incident?.title ?? '')
  const [type, setType] = useState(incident?.title ?? incidentTypeOptions[0].value)
  const [description, setDescription] = useState(incident?.description ?? '')
  const [priority, setPriority] = useState<IncidentRow['priority']>(incident?.priority ?? 'medium')

  const createIncident = useCreateIncident()
  const updateIncident = useUpdateIncident()
  const onError = useToastError()
  const isPending = createIncident.isPending || updateIncident.isPending

  function resetForm() {
    if (!isEditing) {
      setTitle('')
      setType(incidentTypeOptions[0].value)
      setDescription('')
      setPriority('medium')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const resolvedTitle = title.trim() || (incidentTypeOptions.find((o) => o.value === type)?.label ?? type)
    const payload = {
      customer_id: customerId,
      title: resolvedTitle,
      description: description.trim() || null,
      priority,
      status: 'open' as const,
    }

    if (isEditing && incident) {
      updateIncident.mutate(
        { id: incident.id, title: resolvedTitle, description: payload.description, priority },
        {
          onSuccess: () => { toast.success('Incidencia actualizada'); setOpen(false) },
          onError,
        },
      )
    } else {
      createIncident.mutate(payload, {
        onSuccess: () => {
          toast.success('Incidencia creada')
          resetForm()
          setOpen(false)
        },
        onError,
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => { setOpen(next); if (!next) resetForm() }}
      size="sm"
      title={isEditing ? 'Editar incidencia' : 'Nueva incidencia'}
      trigger={
        isEditing ? (
          <Button variant="ghost" size="icon" aria-label="Editar incidencia">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="h-4 w-4" />Nueva incidencia
          </Button>
        )
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Field label="Tipo de incidencia" required>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {incidentTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Título" hint="Deja vacío para usar el tipo como título">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Descripción breve del problema…"
          />
        </Field>

        <Field label="Prioridad" required>
          <Select value={priority} onChange={(e) => setPriority(e.target.value as IncidentRow['priority'])}>
            {Object.entries(incidentPriorityLabels).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </Field>

        <Field label="Notas adicionales">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalles, pasos realizados, contexto…"
          />
        </Field>

        <Button type="submit" size="lg" disabled={isPending} className="w-full">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear incidencia'}
        </Button>
      </form>
    </Dialog>
  )
}
