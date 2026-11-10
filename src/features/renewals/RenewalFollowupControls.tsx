import { AlertTriangle, Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Textarea } from '../../components/ui/input'
import { useToastError } from '../../hooks/use-toast-error'
import { useUpdateContract } from '../../services/contracts.service'
import { useUpdateCustomerNotes } from '../../services/customers.service'
import { renewalFollowupLabels, type RenewalFollowupStatus } from './renewal-followup'

export function RenewalStatusControls({ contractId, status, renewalEndsAt, canEdit }: {
  contractId: string; status: RenewalFollowupStatus | null | undefined; renewalEndsAt?: string | null; canEdit: boolean
}) {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(renewalEndsAt ?? '')
  const update = useUpdateContract()
  const onError = useToastError()

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!date || update.isPending) return
    update.mutate({ id: contractId, renewal_followup_status: 'expired', renewal_ends_at: date }, {
      onSuccess: () => { toast.success('Seguimiento de renovación actualizado'); setOpen(false) }, onError,
    })
  }

  return (
    <div role="group" aria-label={`Seguimiento: ${status ? renewalFollowupLabels[status] : 'Sin marcar'}`}
      className="flex items-center gap-1 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Button type="button" size="xs" variant={status === 'expired' || status === 'paused' ? 'default' : 'outline'}
        aria-label="Renovación vencida" title="Marcar o editar renovación vencida"
        aria-pressed={status === 'expired' || status === 'paused'} disabled={!canEdit || update.isPending}
        onClick={() => { setDate(renewalEndsAt ?? ''); setOpen(true) }}>
        <AlertTriangle aria-hidden="true" /> Vencida
      </Button>
      {open && <Dialog open onOpenChange={(value) => { if (!value && !update.isPending) setOpen(false) }}
        title="Renovación vencida" description="Indica la fecha final de renovación para calcular los días restantes." size="sm">
        <form className="grid gap-4" onSubmit={save}>
          <Field label="Fecha final de renovación" required>
            <Input type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Button type="submit" disabled={!date || update.isPending}>{update.isPending ? 'Guardando…' : 'Guardar'}</Button>
        </form>
      </Dialog>}
    </div>
  )
}

function NotesDialog({ customerId, customerName, notes, updatedAt, onClose }: {
  customerId: string; customerName: string; notes: string | null; updatedAt: string; onClose: () => void
}) {
  const [originalUpdatedAt] = useState(updatedAt)
  const [value, setValue] = useState(notes ?? '')
  const update = useUpdateCustomerNotes()
  const onError = useToastError()

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (update.isPending) return
    update.mutate({ id: customerId, notes: value.trim() ? value : null, expectedUpdatedAt: originalUpdatedAt }, {
      onSuccess: () => { toast.success('Notas del cliente actualizadas'); onClose() }, onError,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !update.isPending) onClose() }}
      title="Notas del cliente" description={`Notas compartidas de ${customerName}, también visibles en su ficha.`} size="sm">
      <form className="grid gap-4" onSubmit={save}>
        <Field label="Notas"><Textarea value={value} onChange={(event) => setValue(event.target.value)} /></Field>
        <Button type="submit" disabled={update.isPending}>{update.isPending ? 'Guardando…' : 'Guardar notas'}</Button>
      </form>
    </Dialog>
  )
}

export function RenewalCustomerNotes({ customerId, customerName, notes, updatedAt, canEdit }: {
  customerId: string; customerName: string; notes: string | null; updatedAt: string; canEdit: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-w-0 items-center gap-1.5 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <span className="max-w-40 truncate text-sm text-muted-foreground" title={notes ?? undefined}>{notes || 'Sin notas'}</span>
      {canEdit && <Button type="button" variant="ghost" size="icon-xs" aria-label="Editar notas del cliente"
        title="Editar notas del cliente" onClick={() => setOpen(true)}><Pencil aria-hidden="true" /></Button>}
      {open && <NotesDialog customerId={customerId} customerName={customerName} notes={notes} updatedAt={updatedAt} onClose={() => setOpen(false)} />}
    </div>
  )
}