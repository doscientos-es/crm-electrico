import { Mail, MessageSquarePlus, Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Dialog } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Field, Select, Textarea } from '../../components/ui/input'
import { useAuth } from '../auth/AuthContext'
import { useToastError } from '../../hooks/use-toast-error'
import { formatDateTime } from '../../lib/formatters'
import {
  getContactChannel,
  getContactNotes,
  type ContactChannel,
  type RenewalContactLog,
  useLogRenewalContact,
} from '../../services/activity.service'

const channelLabel: Record<ContactChannel, string> = {
  email: 'Correo electrónico',
  phone: 'Teléfono',
}

export function RenewalContactDialog({
  customerId,
  customerName,
  contractId,
  contacts,
  contactsLoading = false,
  contactsError = false,
}: {
  customerId: string
  customerName: string
  contractId: string
  contacts: RenewalContactLog[]
  contactsLoading?: boolean
  contactsError?: boolean
}) {
  const { profile } = useAuth()
  const logContact = useLogRenewalContact()
  const onError = useToastError()
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<ContactChannel>('phone')
  const [notes, setNotes] = useState('')
  const customerContacts = useMemo(
    () => contacts.filter((contact) => contact.entity_id === customerId),
    [contacts, customerId],
  )

  function resetForm() {
    setChannel('phone')
    setNotes('')
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || !notes.trim()) return

    logContact.mutate(
      {
        customerId,
        contractId,
        actorId: profile.id,
        channel,
        notes,
      },
      {
        onSuccess: () => {
          toast.success('Contacto registrado')
          resetForm()
          setOpen(false)
        },
        onError,
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next && !logContact.isPending) resetForm()
      }}
      title="Registrar contacto"
      description={`Seguimiento de renovación de ${customerName}.`}
      trigger={
        <Button size="sm" variant="outline">
          <MessageSquarePlus />
          Contacto
        </Button>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Canal" required>
            <Select value={channel} onChange={(event) => setChannel(event.target.value as ContactChannel)}>
              <option value="phone">Teléfono</option>
              <option value="email">Correo electrónico</option>
            </Select>
          </Field>
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground">Registrado por</p>
            <p className="mt-1 text-sm text-foreground">{profile?.full_name ?? 'Usuario actual'}</p>
          </div>
        </div>

        <Field
          label="Notas de la conversación"
          hint="Resume acuerdos, dudas y el siguiente paso."
          required
        >
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Ej.: El cliente revisará la oferta y responderá el viernes."
            maxLength={2000}
            autoFocus
          />
        </Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={logContact.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!profile || !notes.trim() || logContact.isPending}>
            {logContact.isPending ? 'Guardando...' : 'Guardar contacto'}
          </Button>
        </div>
      </form>

      <section className="mt-6 border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-foreground">Historial de contactos</h3>
        {contactsError ? (
          <p className="mt-3 text-sm text-destructive">No se pudo cargar el historial.</p>
        ) : contactsLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Cargando historial…</p>
        ) : customerContacts.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-5 text-center text-sm text-muted-foreground">
            Todavía no hay contactos registrados para esta renovación.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
            {customerContacts.map((contact) => {
              const contactChannel = getContactChannel(contact)
              return (
                <li key={contact.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                      {contactChannel === 'email' ? <Mail className="size-4" /> : <Phone className="size-4" />}
                      {contactChannel ? channelLabel[contactChannel] : 'Contacto'}
                    </span>
                    <time className="text-xs text-muted-foreground" dateTime={contact.created_at}>
                      {formatDateTime(contact.created_at)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                    {getContactNotes(contact)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {contact.actor?.full_name ?? 'Usuario no disponible'}
                  </p>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </Dialog>
  )
}
