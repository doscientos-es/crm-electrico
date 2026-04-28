import { zodResolver } from '@hookform/resolvers/zod'
import { addMonths } from 'date-fns'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { type CustomerFormValues, customerSchema } from '../../schemas/customer.schema'
import { useDemoStore } from '../../store/demo-store'
import type { Customer } from '../../types/domain'

export function CustomerFormDialog() {
  const [open, setOpen] = useState(false)
  const { createCustomer, profiles, currentUser } = useDemoStore()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const defaultRenewal = useMemo(() => addMonths(new Date(), 12).toISOString().slice(0, 10), [])

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<CustomerFormValues & {
    status: Customer['status']
    contract_signed_at: string
    renewal_date: string
    assigned_to: string
    products_services: string
  }>({
    resolver: zodResolver(customerSchema) as never,
    defaultValues: {
      type: 'residential',
      status: 'active',
      contract_signed_at: today,
      renewal_date: defaultRenewal,
      assigned_to: currentUser.id,
      products_services: '',
      email: '',
      phone: '',
    },
  })

  type FullFormValues = CustomerFormValues & { status: Customer['status']; contract_signed_at: string; renewal_date: string; assigned_to: string; products_services: string }

  function onSubmit(values: FullFormValues) {
    createCustomer({
      type: values.legal_name ? 'business' : 'residential',
      name: values.name,
      company: values.legal_name || undefined,
      legal_name: values.legal_name || undefined,
      dni: values.tax_id || undefined,
      status: values.status,
      contact_name: values.contact_name || values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      city: values.city || undefined,
      contract_signed_at: values.contract_signed_at,
      renewal_date: values.renewal_date,
      renewal_alert_months: 10,
      assigned_to: values.assigned_to,
      products_services: (values.products_services ?? '')
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean),
      notes: values.notes || undefined,
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
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label="Empresa" error={errors.legal_name?.message}>
            <Input {...register('legal_name')} />
          </Field>
          <Field label="DNI / NIF" error={errors.tax_id?.message}>
            <Input {...register('tax_id')} />
          </Field>
          <Field label="Estado" error={(errors as Record<string, { message?: string }>).status?.message}>
            <Select {...register('status')}>
              <option value="active">Activo</option>
              <option value="renewal_due">Renovacion pendiente</option>
              <option value="renewed">Renovado</option>
              <option value="inactive">Baja</option>
              <option value="lost">Perdido</option>
            </Select>
          </Field>
          <Field label="Fecha contrato" error={(errors as Record<string, { message?: string }>).contract_signed_at?.message}>
            <Input
              type="date"
              {...register('contract_signed_at', {
                onChange: (e) => {
                  const val = e.target.value
                  if (val) setValue('renewal_date', addMonths(new Date(val), 12).toISOString().slice(0, 10))
                },
              })}
            />
          </Field>
          <Field label="Fecha renovacion" error={(errors as Record<string, { message?: string }>).renewal_date?.message}>
            <Input type="date" {...register('renewal_date')} />
          </Field>
          <Field label="Comercial responsable" error={(errors as Record<string, { message?: string }>).assigned_to?.message}>
            <Select {...register('assigned_to')}>
              {profiles
                .filter((p) => ['owner', 'admin', 'sales'].includes(p.role))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
            </Select>
          </Field>
          <Field label="Ciudad" error={errors.city?.message}>
            <Input {...register('city')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} />
          </Field>
          <Field label="Telefono" error={errors.phone?.message}>
            <Input type="tel" inputMode="tel" autoComplete="tel" {...register('phone')} />
          </Field>
        </div>
        <Field label="Productos y servicios" error={(errors as Record<string, { message?: string }>).products_services?.message}>
          <Textarea {...register('products_services')} placeholder="Luz pyme, Gas, Mantenimiento anual" />
        </Field>
        <Field label="Notas" error={errors.notes?.message}>
          <Textarea {...register('notes')} />
        </Field>
        <Button type="submit" disabled={isSubmitting}>Guardar cliente</Button>
      </form>
    </Dialog>
  )
}
