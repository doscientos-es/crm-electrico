import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { type LeadFormValues, leadSchema } from '../../schemas/lead.schema'
import { useDemoStore } from '../../store/demo-store'
import type { Lead } from '../../types/domain'

export function LeadFormDialog({ lead }: { lead?: Lead }) {
  const [open, setOpen] = useState(false)
  const { createLead, updateLead, profiles } = useDemoStore()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema) as never,
    defaultValues: lead ?? { status: 'new', source: 'web', assigned_to: 'user-sales' },
  })

  function onSubmit(values: LeadFormValues) {
    if (lead) updateLead(lead.id, values)
    else createLead(values)
    reset()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={lead ? 'Editar lead' : 'Nuevo lead'}
      trigger={
        <Button size={lead ? 'sm' : 'default'} variant={lead ? 'secondary' : 'default'}>
          {!lead ? <Plus className="h-4 w-4" /> : null}
          {lead ? 'Editar' : 'Nuevo lead'}
        </Button>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Empresa" error={errors.company_name?.message}>
            <Input {...register('company_name')} />
          </Field>
          <Field label="Contacto" error={errors.contact_name?.message}>
            <Input {...register('contact_name')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" {...register('email')} />
          </Field>
          <Field label="Telefono" error={errors.phone?.message}>
            <Input type="tel" {...register('phone')} />
          </Field>
          <Field label="Origen" error={errors.source?.message}>
            <Select {...register('source')}>
              <option value="web">Web</option>
              <option value="referido">Referido</option>
              <option value="llamada">Llamada</option>
              <option value="feria solar">Feria solar</option>
              <option value="campana local">Campana local</option>
            </Select>
          </Field>
          <Field label="Estado" error={errors.status?.message}>
            <Select {...register('status')}>
              <option value="new">Nuevo</option>
              <option value="contacted">Contactado</option>
              <option value="qualified">Cualificado</option>
              <option value="lost">Perdido</option>
              <option value="converted">Convertido</option>
            </Select>
          </Field>
          <Field label="Ciudad" error={errors.city?.message}>
            <Input {...register('city')} />
          </Field>
          <Field label="Factura estimada mensual" error={errors.estimated_monthly_bill?.message}>
            <Input type="number" step="0.01" {...register('estimated_monthly_bill')} />
          </Field>
          <Field label="Asignado a" error={errors.assigned_to?.message}>
            <Select {...register('assigned_to')}>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Notas" error={errors.notes?.message}>
          <Textarea {...register('notes')} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar lead'}
        </Button>
      </form>
    </Dialog>
  )
}
