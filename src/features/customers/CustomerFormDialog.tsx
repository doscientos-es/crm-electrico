import { addMonths } from 'date-fns'
import { Plus } from 'lucide-react'
import { type FormEvent, useMemo, useState } from 'react'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { useDemoStore } from '../../store/demo-store'
import type { Customer } from '../../types/domain'

type FormState = {
  name: string
  company: string
  dni: string
  status: Customer['status']
  contract_signed_at: string
  renewal_date: string
  assigned_to: string
  products_services: string
  email: string
  phone: string
  city: string
  notes: string
}

export function CustomerFormDialog() {
  const [open, setOpen] = useState(false)
  const { createCustomer, profiles, currentUser } = useDemoStore()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const defaultRenewal = useMemo(() => addMonths(new Date(), 12).toISOString().slice(0, 10), [])
  const [form, setForm] = useState<FormState>({
    name: '',
    company: '',
    dni: '',
    status: 'active',
    contract_signed_at: today,
    renewal_date: defaultRenewal,
    assigned_to: currentUser.id,
    products_services: '',
    email: '',
    phone: '',
    city: '',
    notes: '',
  })

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function reset() {
    setForm({
      name: '',
      company: '',
      dni: '',
      status: 'active',
      contract_signed_at: today,
      renewal_date: defaultRenewal,
      assigned_to: currentUser.id,
      products_services: '',
      email: '',
      phone: '',
      city: '',
      notes: '',
    })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createCustomer({
      type: form.company ? 'business' : 'residential',
      name: form.name,
      company: form.company || undefined,
      legal_name: form.company || undefined,
      dni: form.dni || undefined,
      status: form.status,
      contact_name: form.name,
      email: form.email || undefined,
      phone: form.phone || undefined,
      city: form.city || undefined,
      contract_signed_at: form.contract_signed_at,
      renewal_date: form.renewal_date,
      renewal_alert_months: 10,
      assigned_to: form.assigned_to,
      products_services: form.products_services
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      notes: form.notes || undefined,
    })
    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title="Nuevo cliente"
      trigger={
        <Button>
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Button>
      }
    >
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre">
            <Input value={form.name} onChange={(event) => update('name', event.target.value)} required />
          </Field>
          <Field label="Empresa">
            <Input value={form.company} onChange={(event) => update('company', event.target.value)} />
          </Field>
          <Field label="DNI">
            <Input value={form.dni} onChange={(event) => update('dni', event.target.value)} />
          </Field>
          <Field label="Estado">
            <Select value={form.status} onChange={(event) => update('status', event.target.value as Customer['status'])}>
              <option value="active">Activo</option>
              <option value="renewal_due">Renovacion pendiente</option>
              <option value="renewed">Renovado</option>
              <option value="inactive">Baja</option>
              <option value="lost">Perdido</option>
            </Select>
          </Field>
          <Field label="Fecha contrato">
            <Input
              type="date"
              value={form.contract_signed_at}
              onChange={(event) => {
                const contractSignedAt = event.target.value
                update('contract_signed_at', contractSignedAt)
                if (contractSignedAt) {
                  update('renewal_date', addMonths(new Date(contractSignedAt), 12).toISOString().slice(0, 10))
                }
              }}
              required
            />
          </Field>
          <Field label="Fecha renovacion">
            <Input type="date" value={form.renewal_date} onChange={(event) => update('renewal_date', event.target.value)} required />
          </Field>
          <Field label="Comercial responsable">
            <Select value={form.assigned_to} onChange={(event) => update('assigned_to', event.target.value)}>
              {profiles
                .filter((profile) => profile.role === 'owner' || profile.role === 'admin' || profile.role === 'sales')
                .map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.full_name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Ciudad">
            <Input value={form.city} onChange={(event) => update('city', event.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} />
          </Field>
          <Field label="Telefono">
            <Input type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} />
          </Field>
        </div>
        <Field label="Productos y servicios">
          <Textarea
            value={form.products_services}
            onChange={(event) => update('products_services', event.target.value)}
            placeholder="Luz pyme, Gas, Mantenimiento anual"
          />
        </Field>
        <Field label="Notas">
          <Textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} />
        </Field>
        <Button type="submit">Guardar cliente</Button>
      </form>
    </Dialog>
  )
}
