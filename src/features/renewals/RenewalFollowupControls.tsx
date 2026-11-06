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
    <div className="grid gap-1" onClick={(event) => event.stopPropagation()}>
      {!status && <span className="text-xs text-muted-foreground">Sin marcar</span>}
      {(Object.entries(renewalFollowupLabels) as [RenewalFollowupStatus, string][]).map(([value, label]) => (
        <Button key={value} type="button" size="xs" variant={status === value ? 'default' : 'outline'}
          aria-pressed={status === value} disabled={!canEdit || update.isPending || status === value}
          onClick={() => update.mutate({ id: contractId, renewal_followup_status: value }, {
            onSuccess: () => toast.success('Seguimiento de renovación actualizado'), onError,
          })}>
          {label}
        </Button>
      ))}
    </div>
  )
}

function NotesDialog({ customerId, customerName, notes, onClose }: {
  customerId: string; customerName: string; notes: string | null; onClose: () => void
}) {
  const [originalNotes] = useState(notes)
  const [value, setValue] = useState(notes ?? '')
  const update = useUpdateCustomerNotes()
  const onError = useToastError()

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (update.isPending) return
    update.mutate({ id: customerId, notes: value.trim() ? value : null, previousNotes: originalNotes }, {
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

export function RenewalCustomerNotes({ customerId, customerName, notes, canEdit }: {
  customerId: string; customerName: string; notes: string | null; canEdit: boolean
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid min-w-40 gap-1" onClick={(event) => event.stopPropagation()}>
      <span className="max-w-52 truncate text-sm text-muted-foreground" title={notes ?? undefined}>{notes || 'Sin notas'}</span>
      {canEdit && <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>Editar notas</Button>}
      {open && <NotesDialog customerId={customerId} customerName={customerName} notes={notes} onClose={() => setOpen(false)} />}
    </div>
  )
}