import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CopyCheck, CreditCard, IdCard, Mail, MapPin, Pencil, Phone, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, InputGroup, Select, Textarea } from '../../components/ui/input'
import { customerTypeLabels } from '../../config/constants'
import { useAuth } from '../../features/auth/AuthContext'
import { type CustomerFormValues, customerSchema } from '../../schemas/customer.schema'
import { type CustomerRow, useCreateCustomer, useUpdateCustomer } from '../../services/customers.service'
import { useProfiles } from '../../services/profiles.service'

type FullFormValues = CustomerFormValues & {
  assigned_to: string
  products_services: string
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="col-span-full border-t pt-4 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {description && <p className="mt-0.5 text-xs text-muted-foreground/70">{description}</p>}
    </div>
  )
}

/** Map system-managed statuses to their editable equivalent */
function toEditableStatus(s: string): 'new' | 'active' | 'inactive' | 'lost' {
  if (s === 'new') return 'new'
  if (s === 'inactive') return 'inactive'
  if (s === 'lost') return 'lost'
  return 'active' // active | renewal_due | renewed → active
}

export function CustomerFormDialog({ customer }: { customer?: CustomerRow }) {
  const isEditing = Boolean(customer)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { profile: currentUser } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const [sameAsSupply, setSameAsSupply] = useState(false)
  const { register, handleSubmit, reset, getValues, setValue, formState: { errors, isSubmitting } } = useForm<FullFormValues>({
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
        iban: customer.iban ?? '',
        address: customer.address ?? '',
        city: customer.city ?? '',
        province: customer.province ?? '',
        postal_code: customer.postal_code ?? '',
        mailing_address: customer.mailing_address ?? '',
        mailing_city: customer.mailing_city ?? '',
        mailing_province: customer.mailing_province ?? '',
        mailing_postal_code: customer.mailing_postal_code ?? '',
        notes: customer.notes ?? '',
        assigned_to: customer.assigned_to ?? currentUser?.id ?? '',
        products_services: customer.products_services.join(', '),
      }
      : {
        type: 'residential',
        status: 'new',
        assigned_to: currentUser?.id ?? '',
        products_services: '',
        email: '',
        phone: '',
        iban: '',
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
      iban: values.iban || null,
      address: values.address || null,
      city: values.city || null,
      province: values.province || null,
      postal_code: values.postal_code || null,
      mailing_address: values.mailing_address || null,
      mailing_city: values.mailing_city || null,
      mailing_province: values.mailing_province || null,
      mailing_postal_code: values.mailing_postal_code || null,
      assigned_to: values.assigned_to || null,
      products_services: products,
      notes: values.notes || null,
    }
    // If "same as supply" is checked, ensure mailing fields mirror supply
    if (sameAsSupply) {
      common.mailing_address = common.address
      common.mailing_city = common.city
      common.mailing_province = common.province
      common.mailing_postal_code = common.postal_code
    }

    if (isEditing && customer) {
      updateCustomer.mutate({ id: customer.id, ...common }, { onSuccess: () => { reset(); setOpen(false) } })
    } else {
      createCustomer.mutate(common, { onSuccess: (data) => { reset(); setOpen(false); navigate(`/customers/${data.id}`) } })
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
        {/* ── Datos generales ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Datos generales" />

          <Field label="Nombre" error={errors.name?.message} required>
            <Input {...register('name')} placeholder="Nombre del cliente o razón social" />
          </Field>

          <Field label="Tipo de cliente" error={(errors as Record<string, { message?: string }>).type?.message} required>
            <Select {...register('type')}>
              {Object.entries(customerTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>

          <Field label="Empresa" error={errors.legal_name?.message} hint="Denominación social, si aplica">
            <InputGroup leading={<Building2 />}>
              <Input {...register('legal_name')} placeholder="Electro Soluciones S.L." />
            </InputGroup>
          </Field>

          <Field label="DNI / NIF" error={errors.tax_id?.message}>
            <InputGroup leading={<IdCard />}>
              <Input {...register('tax_id')} placeholder="12345678A / B12345678" />
            </InputGroup>
          </Field>
        </div>

        {/* ── Estado y asignación ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Estado y asignación" />

          <Field label="Estado" error={(errors as Record<string, { message?: string }>).status?.message} required>
            <Select {...register('status')}>
              <option value="new">Nuevo</option>
              <option value="active">Activo</option>
              <option value="inactive">Baja</option>
              <option value="lost">Perdido</option>
            </Select>
          </Field>

          <Field
            label="Comercial responsable"
            error={(errors as Record<string, { message?: string }>).assigned_to?.message}
            hint="Encargado del seguimiento del cliente"
          >
            <Select {...register('assigned_to')}>
              {profiles
                .filter((p) => ['owner', 'admin', 'sales'].includes(p.role))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
            </Select>
          </Field>
        </div>

        {/* ── Contacto ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Contacto" />

          <Field label="Persona de contacto" error={errors.contact_name?.message} hint="Si se deja vacío se usará el nombre del cliente">
            <Input {...register('contact_name')} placeholder="Persona de referencia" />
          </Field>

          <Field label="Email" error={errors.email?.message}>
            <InputGroup leading={<Mail />}>
              <Input type="email" autoComplete="email" {...register('email')} placeholder="cliente@email.com" />
            </InputGroup>
          </Field>

          <Field label="Teléfono" error={errors.phone?.message}>
            <InputGroup leading={<Phone />}>
              <Input type="tel" inputMode="tel" autoComplete="tel" {...register('phone')} placeholder="600 123 456" />
            </InputGroup>
          </Field>

          <Field label="IBAN" error={(errors as Record<string, { message?: string }>).iban?.message} hint="Número de cuenta bancaria">
            <InputGroup leading={<CreditCard />}>
              <Input {...register('iban')} placeholder="ES00 0000 0000 0000 0000 0000" />
            </InputGroup>
          </Field>
        </div>

        {/* ── Dirección de suministro ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Dirección de suministro" description="Dirección física del punto de suministro" />

          <Field label="Dirección" error={errors.address?.message}>
            <InputGroup leading={<MapPin />}>
              <Input {...register('address')} placeholder="Calle, número, piso…" />
            </InputGroup>
          </Field>

          <Field label="Código postal" error={(errors as Record<string, { message?: string }>).postal_code?.message}>
            <Input inputMode="numeric" {...register('postal_code')} placeholder="28001" />
          </Field>

          <Field label="Ciudad" error={errors.city?.message}>
            <Input {...register('city')} placeholder="Madrid, Barcelona…" />
          </Field>

          <Field label="Provincia" error={errors.province?.message}>
            <Input {...register('province')} placeholder="Madrid" />
          </Field>
        </div>

        {/* ── Dirección de correspondencia ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <div className="col-span-full border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección de correspondencia</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">Solo si el cliente recibe cartas en otra dirección</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !sameAsSupply
                  setSameAsSupply(next)
                  if (next) {
                    const v = getValues()
                    setValue('mailing_address', v.address ?? '')
                    setValue('mailing_postal_code', v.postal_code ?? '')
                    setValue('mailing_city', v.city ?? '')
                    setValue('mailing_province', v.province ?? '')
                  }
                }}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${sameAsSupply ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-muted-foreground hover:text-foreground'}`}
              >
                <CopyCheck className="h-3.5 w-3.5" />
                Igual que suministro
              </button>
            </div>
          </div>

          <Field label="Dirección" error={(errors as Record<string, { message?: string }>).mailing_address?.message}>
            <InputGroup leading={<MapPin />}>
              <Input {...register('mailing_address')} placeholder="Calle, número, piso…" disabled={sameAsSupply} />
            </InputGroup>
          </Field>

          <Field label="Código postal" error={(errors as Record<string, { message?: string }>).mailing_postal_code?.message}>
            <Input inputMode="numeric" {...register('mailing_postal_code')} placeholder="28001" disabled={sameAsSupply} />
          </Field>

          <Field label="Ciudad" error={(errors as Record<string, { message?: string }>).mailing_city?.message}>
            <Input {...register('mailing_city')} placeholder="Madrid, Barcelona…" disabled={sameAsSupply} />
          </Field>

          <Field label="Provincia" error={(errors as Record<string, { message?: string }>).mailing_province?.message}>
            <Input {...register('mailing_province')} placeholder="Madrid" disabled={sameAsSupply} />
          </Field>
        </div>

        {/* ── Detalles ── */}
        <Field
          label="Productos y servicios"
          error={(errors as Record<string, { message?: string }>).products_services?.message}
          hint="Separa cada producto con una coma"
        >
          <Textarea {...register('products_services')} placeholder="Luz pyme, Gas, Mantenimiento anual" />
        </Field>

        <Field label="Notas" error={errors.notes?.message} hint="Observaciones internas sobre el cliente">
          <Textarea {...register('notes')} placeholder="Añade cualquier información relevante sobre este cliente…" />
        </Field>

        <Button type="submit" size="lg" disabled={isSubmitting}>{isEditing ? 'Guardar cambios' : 'Guardar cliente'}</Button>
      </form>
    </Dialog>
  )
}
