import { AlertTriangle, Clock, Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Textarea } from '../../components/ui/input'
import { useToastError } from '../../hooks/use-toast-error'
import { useUpdateContract } from '../../services/contracts.service'
import { useUpdateCustomerNotes } from '../../services/customers.service'
import { renewalFollowupLabels, type RenewalFollowupStatus } from './renewal-followup'

export function RenewalStatusControls({ contractId, status, canEdit }: {
  contractId: string; status: RenewalFollowupStatus | null | undefined; canEdit: boolean
}) {
  const update = useUpdateContract()
  const onError = useToastError()
  return (
    <div role="group" aria-label={`Seguimiento: ${status ? renewalFollowupLabels[status] : 'Sin marcar'}`}
      className="flex items-center gap-1 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      {(Object.entries(renewalFollowupLabels) as [RenewalFollowupStatus, string][]).map(([value, label]) => (
        <Button key={value} type="button" size="xs" variant={status === value ? 'default' : 'outline'}
          className={status === value ? 'disabled:opacity-100' : undefined} aria-label={label} title={label}
          aria-pressed={status === value} disabled={!canEdit || update.isPending || status === value}
          onClick={() => update.mutate({ id: contractId, renewal_followup_status: value }, {
            onSuccess: () => toast.success('Seguimiento de renovación actualizado'), onError,
          })}>
          {value === 'pending' ? <Clock aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
          {value === 'pending' ? 'Pendiente' : 'Vencida'}
        </Button>
      ))}
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