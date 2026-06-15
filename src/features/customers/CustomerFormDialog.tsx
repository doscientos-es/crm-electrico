import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { customerTypeLabels } from '../../config/constants'
import { useAuth } from '../../features/auth/AuthContext'
import { type CustomerFormValues, customerSchema } from '../../schemas/customer.schema'
import { type CustomerRow, useCreateCustomer, useUpdateCustomer } from '../../services/customers.service'
import { useProfiles } from '../../services/profiles.service'

type FullFormValues = CustomerFormValues & {
  assigned_to: string
  products_services: string
}

/** Map system-managed statuses to their editable equivalent */
function toEditableStatus(s: string): 'active' | 'inactive' | 'lost' {
  if (s === 'inactive') return 'inactive'
  if (s === 'lost') return 'lost'
  return 'active' // active | renewal_due | renewed → active
}

export function CustomerFormDialog({ customer }: { customer?: CustomerRow }) {
  const isEditing = Boolean(customer)
  const [open, setOpen] = useState(false)
  const { profile: currentUser } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FullFormValues>({
    resolver: zodResolver(customerSchema) as never,
    defaultValues: customer
      ? {
        name: customer.name,
        type: customer.type,
        status: toEditableStatus(customer.status),
        legal_name: customer.legal_name ?? '',
        tax_id: customer.dni ?? '',
        contact_name: customer.contact_name ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        city: customer.city ?? '',
        notes: customer.notes ?? '',
        assigned_to: customer.assigned_to ?? currentUser?.id ?? '',
        products_services: customer.products_services.join(', '),
      }
      : {
        type: 'residential',
        status: 'active',
        assigned_to: currentUser?.id ?? '',
        products_services: '',
        email: '',
        phone: '',
      },
  })

  function onSubmit(values: FullFormValues) {
    const products = (values.products_services ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
    const common = {
      type: values.type,
      name: values.name,
      company: values.legal_name || null,
      legal_name: values.legal_name || null,
      dni: values.tax_id || null,
      status: values.status,
      contact_name: values.contact_name || values.name,
      email: values.email || null,
      phone: values.phone || null,
      city: values.city || null,
      assigned_to: values.assigned_to || null,
      products_services: products,
      notes: values.notes || null,
    }
    if (isEditing && customer) {
      updateCustomer.mutate({ id: customer.id, ...common }, { onSuccess: () => { reset(); setOpen(false) } })
    } else {
      createCustomer.mutate(common, { onSuccess: () => { reset(); setOpen(false) } })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={isEditing ? 'Editar cliente' : 'Nuevo cliente'}
      trigger={
        isEditing ? (
          <Button variant="secondary" size="sm">
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        )
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit as never)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nombre" error={errors.name?.message}>
            <Input {...register('name')} />
          </Field>
          <Field label="Tipo de cliente" error={(errors as Record<string, { message?: string }>).type?.message}>
            <Select {...register('type')}>
              {Object.entries(customerTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
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
              <option value="inactive">Baja</option>
              <option value="lost">Perdido</option>
            </Select>
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
        <Button type="submit" disabled={isSubmitting}>{isEditing ? 'Guardar cambios' : 'Guardar cliente'}</Button>
      </form>
    </Dialog>
  )
}
