import { zodResolver } from '@hookform/resolvers/zod'
import { addMonths } from 'date-fns'
import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { type CustomerFormValues, customerSchema } from '../../schemas/customer.schema'
import { useAuth } from '../../features/auth/AuthContext'
import { type CustomerRow, useCreateCustomer, useUpdateCustomer } from '../../services/customers.service'
import { useProfiles } from '../../services/profiles.service'

type FullFormValues = CustomerFormValues

export function CustomerFormDialog({ customer }: { customer?: CustomerRow }) {
  const isEditing = Boolean(customer)
  const [open, setOpen] = useState(false)
  const { profile: currentUser } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const defaultRenewal = useMemo(() => addMonths(new Date(), 12).toISOString().slice(0, 10), [])

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FullFormValues>({
    resolver: zodResolver(customerSchema) as never,
    defaultValues: customer
      ? {
        name: customer.name,
        type: customer.type,
        legal_name: customer.legal_name ?? '',
        tax_id: customer.dni ?? '',
        contact_name: customer.contact_name ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        city: customer.city ?? '',
        notes: customer.notes ?? '',
        status: customer.status,
        contract_signed_at: customer.contract_signed_at?.slice(0, 10) ?? today,
        renewal_date: customer.renewal_date?.slice(0, 10) ?? defaultRenewal,
        assigned_to: customer.assigned_to ?? currentUser.id,
        products_services: customer.products_services.join(', '),
        cups: customer.energy_data?.cups ?? '',
        marketer: customer.energy_data?.marketer ?? '',
        product: customer.energy_data?.product ?? '',
        annual_consumption_kwh: customer.energy_data?.annualConsumptionKwh ?? 0,
        tariff: customer.energy_data?.tariff ?? '',
        energy_price: customer.energy_data?.energyPrice ?? 0,
        power_price: customer.energy_data?.powerPrice ?? 0,
        commission: customer.energy_data?.commission ?? 0,
        estimated_margin: customer.energy_data?.estimatedMargin ?? 0,
        energy_start_date: customer.energy_data?.startDate ?? '',
        energy_end_date: customer.energy_data?.endDate ?? '',
        energy_notes: customer.energy_data?.notes ?? '',
      }
      : {
        type: 'RESIDENTIAL',
        status: 'active',
        contract_signed_at: today,
        renewal_date: defaultRenewal,
        assigned_to: currentUser.id,
        products_services: '',
        email: '',
        phone: '',
        cups: '',
        marketer: '',
        product: '',
        annual_consumption_kwh: 0,
        tariff: '',
        energy_price: 0,
        power_price: 0,
        commission: 0,
        estimated_margin: 0,
        energy_start_date: '',
        energy_end_date: '',
        energy_notes: '',
      },
  })

  function onSubmit(values: FullFormValues) {
    const products = (values.products_services ?? '').split(',').map((s: string) => s.trim()).filter(Boolean)
    const hasEnergyData = Boolean(values.cups || values.marketer || values.product || values.tariff)
    if (hasEnergyData && !values.cups.trim()) {
      setValue('cups', '')
      return
    }
    const energy_data = hasEnergyData ? {
      cups: values.cups,
      marketer: values.marketer,
      product: values.product,
      annualConsumptionKwh: Number(values.annual_consumption_kwh || 0),
      tariff: values.tariff,
      energyPrice: Number(values.energy_price || 0),
      powerPrice: Number(values.power_price || 0),
      commission: Number(values.commission || 0),
      estimatedMargin: Number(values.estimated_margin || 0),
      startDate: values.energy_start_date,
      endDate: values.energy_end_date,
      notes: values.energy_notes,
    } : null
    if (isEditing && customer) {
      updateCustomer.mutate({
        id: customer.id,
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
        contract_signed_at: values.contract_signed_at,
        renewal_date: values.renewal_date,
        renewal_alert_months: 10,
        assigned_to: values.assigned_to || null,
        products_services: products,
        notes: values.notes || null,
        energy_data,
      }, { onSuccess: () => { reset(); setOpen(false) } })
    } else {
      createCustomer.mutate({
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
        contract_signed_at: values.contract_signed_at,
        renewal_date: values.renewal_date,
        renewal_alert_months: 10,
        assigned_to: values.assigned_to || null,
        products_services: products,
        notes: values.notes || null,
        energy_data,
      }, { onSuccess: () => { reset(); setOpen(false) } })
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
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tipo de cliente" error={errors.type?.message}>
            <Select {...register('type')}>
              <option value="RESIDENTIAL">Residencial</option>
              <option value="SME">Empresa / PYME</option>
            </Select>
          </Field>
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
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold">Datos energéticos</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="CUPS" hint="Obligatorio si completas datos energéticos"><Input {...register('cups')} /></Field>
            <Field label="Comercializadora"><Input {...register('marketer')} /></Field>
            <Field label="Producto"><Input {...register('product')} /></Field>
            <Field label="Tarifa"><Input {...register('tariff')} /></Field>
            <Field label="Consumo anual (kWh)"><Input type="number" min="0" step="0.01" {...register('annual_consumption_kwh')} /></Field>
            <Field label="Precio energía"><Input type="number" min="0" step="0.0001" {...register('energy_price')} /></Field>
            <Field label="Precio potencia"><Input type="number" min="0" step="0.01" {...register('power_price')} /></Field>
            <Field label="Comisión"><Input type="number" min="0" step="0.01" {...register('commission')} /></Field>
            <Field label="Margen estimado"><Input type="number" min="0" step="0.01" {...register('estimated_margin')} /></Field>
            <Field label="Inicio"><Input type="date" {...register('energy_start_date')} /></Field>
            <Field label="Fin"><Input type="date" {...register('energy_end_date')} /></Field>
          </div>
          <Field label="Observaciones" className="mt-4"><Textarea {...register('energy_notes')} /></Field>
        </div>
        <Button type="submit" disabled={isSubmitting}>{isEditing ? 'Guardar cambios' : 'Guardar cliente'}</Button>
      </form>
    </Dialog>
  )
}
