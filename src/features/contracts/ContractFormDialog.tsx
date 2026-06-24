import { zodResolver } from '@hookform/resolvers/zod'
import { addYears, format } from 'date-fns'
import { CopyCheck, Euro, Loader2, MapPin, Pencil, Plus, RefreshCw, Trash2, Zap } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, InputGroup, Select, Textarea } from '../../components/ui/input'
import { contractStatusLabels } from '../../config/constants'
import { useAuth } from '../auth/AuthContext'
import { useToastError } from '../../hooks/use-toast-error'
import { canViewCompanyCommission } from '../../lib/permissions'
import { type ContractFormValues, contractSchema } from '../../schemas/forms.schema'
import { type ContractRow, useCreateContract, useDeleteContract, useUpdateContract } from '../../services/contracts.service'
import { useCustomer } from '../../services/customers.service'

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="col-span-full border-t pt-4 first:border-t-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {description && <p className="mt-0.5 text-xs text-muted-foreground/70">{description}</p>}
    </div>
  )
}

function MoneyInput({ children }: { children: ReactNode }) {
  return <InputGroup leading={<Euro />}>{children}</InputGroup>
}

function EnergyInput({ children }: { children: ReactNode }) {
  return <InputGroup leading={<Zap />}>{children}</InputGroup>
}

const numOrNull = (v: number | undefined) => (v === undefined || Number.isNaN(v) ? null : v)

export function ContractFormDialog({
  customerId,
  contract,
  prefillFrom,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  customerId: string
  contract?: ContractRow
  /** Pre-fills a new contract form with data from a previous contract (renewal). */
  prefillFrom?: ContractRow
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEditing = Boolean(contract)
  const source = contract ?? prefillFrom
  const [internalOpen, setInternalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const deleteContract = useDeleteContract()
  const { data: customer } = useCustomer(customerId)
  const { profile: currentUser } = useAuth()
  const onError = useToastError()
  const showCompanyCommission = canViewCompanyCommission(currentUser?.role ?? 'viewer')

  // The customer's address to optionally copy into the contract's supply address.
  // Falls back to legacy supply fields for customers created before the move.
  const customerAddress = customer
    ? (() => {
      const address = customer.mailing_address ?? customer.address ?? ''
      const postal_code = customer.mailing_postal_code ?? customer.postal_code ?? ''
      const city = customer.mailing_city ?? customer.city ?? ''
      const province = customer.mailing_province ?? customer.province ?? ''
      return address || postal_code || city || province ? { address, postal_code, city, province } : null
    })()
    : null
  const isPending = createContract.isPending || updateContract.isPending

  function handleDelete() {
    if (!contract) return
    deleteContract.mutate(contract.id, {
      onSuccess: () => {
        toast.success('Contrato eliminado')
        setOpen(false)
      },
      onError,
    })
  }

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as never,
    defaultValues: {
      customer_id: customerId,
      status: contract?.status ?? 'pending_processing',
      // dates are never copied on renewal — they must be set fresh
      cups: source?.cups ?? '',
      provider: source?.provider ?? '',
      sales_channel: source?.sales_channel ?? '',
      product: source?.product ?? '',
      tariff_type: source?.tariff_type ?? '',
      power_kw: source?.power_kw ?? undefined,
      annual_consumption_kwh: source?.annual_consumption_kwh ?? undefined,
      energy_price_eur: source?.energy_price_eur ?? undefined,
      power_price_p1_eur: source?.power_price_p1_eur ?? undefined,
      power_price_p2_eur: source?.power_price_p2_eur ?? undefined,
      power_price_p3_eur: source?.power_price_p3_eur ?? undefined,
      power_price_p4_eur: source?.power_price_p4_eur ?? undefined,
      power_price_p5_eur: source?.power_price_p5_eur ?? undefined,
      power_price_p6_eur: source?.power_price_p6_eur ?? undefined,
      commission_company_eur: source?.commission_company_eur ?? 0,
      commission_commercial_eur: source?.commission_commercial_eur ?? 0,
      supply_address: source?.supply_address ?? '',
      supply_city: source?.supply_city ?? '',
      supply_province: source?.supply_province ?? '',
      supply_postal_code: source?.supply_postal_code ?? '',
      starts_at: contract?.starts_at?.slice(0, 10) ?? '',
      ends_at: contract?.ends_at?.slice(0, 10) ?? '',
      terminated_at: contract?.terminated_at?.slice(0, 10) ?? '',
      notes: source?.notes ?? '',
    },
  })

  function onSubmit(values: ContractFormValues) {
    const payload = {
      customer_id: customerId,
      status: values.status,
      cups: values.cups || null,
      provider: values.provider || null,
      sales_channel: values.sales_channel || null,
      product: values.product || null,
      tariff_type: values.tariff_type || null,
      power_kw: numOrNull(values.power_kw),
      annual_consumption_kwh: numOrNull(values.annual_consumption_kwh),
      energy_price_eur: numOrNull(values.energy_price_eur),
      power_price_p1_eur: numOrNull(values.power_price_p1_eur),
      power_price_p2_eur: numOrNull(values.power_price_p2_eur),
      power_price_p3_eur: numOrNull(values.power_price_p3_eur),
      power_price_p4_eur: numOrNull(values.power_price_p4_eur),
      power_price_p5_eur: numOrNull(values.power_price_p5_eur),
      power_price_p6_eur: numOrNull(values.power_price_p6_eur),
      ...(showCompanyCommission || !isEditing
        ? { commission_company_eur: showCompanyCommission ? values.commission_company_eur ?? 0 : source?.commission_company_eur ?? 0 }
        : {}),
      commission_commercial_eur: values.commission_commercial_eur ?? 0,
      supply_address: values.supply_address || null,
      supply_city: values.supply_city || null,
      supply_province: values.supply_province || null,
      supply_postal_code: values.supply_postal_code || null,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
      terminated_at: values.terminated_at || null,
      notes: values.notes || null,
    }
    const done = {
      onSuccess: () => {
        toast.success(isEditing ? 'Contrato actualizado' : 'Contrato creado')
        reset()
        setOpen(false)
      },
      onError,
    }
    if (isEditing && contract) {
      updateContract.mutate({ id: contract.id, ...payload }, done)
    } else {
      createContract.mutate(payload, {
        onSuccess: () => {
          if (prefillFrom) {
            updateContract.mutate({ id: prefillFrom.id, status: 'terminated' })
          }
          toast.success('Contrato creado')
          reset()
          setOpen(false)
        },
        onError,
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
      size="xl"
      title={isEditing ? 'Editar contrato' : prefillFrom ? 'Renovar contrato' : 'Nuevo contrato'}
      trigger={
        controlledOpen !== undefined ? undefined : isEditing ? (
          <Button variant="secondary" size="sm"><Pencil className="h-4 w-4" />Editar</Button>
        ) : prefillFrom ? (
          <Button size="sm" variant="default"><RefreshCw className="h-4 w-4" />Renovar</Button>
        ) : (
          <Button size="sm"><Plus className="h-4 w-4" />Nuevo contrato</Button>
        )
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        {/* ── Identificación ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Identificación" />

          <Field label="Estado" error={errors.status?.message} required>
            <Select {...register('status')}>
              {Object.entries(contractStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>

          <Field
            label="CUPS"
            error={errors.cups?.message}
            hint="Código Universal del Punto de Suministro — 20 caracteres alfanuméricos"
          >
            <Input {...register('cups')} placeholder="ES0021000000000000AA" />
          </Field>
        </div>

        {/* ── Dirección de suministro ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <div className="col-span-full border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección de suministro</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">Dirección física del punto de suministro</p>
              </div>
              {customerAddress && (
                <button
                  type="button"
                  onClick={() => {
                    setValue('supply_address', customerAddress.address)
                    setValue('supply_postal_code', customerAddress.postal_code)
                    setValue('supply_city', customerAddress.city)
                    setValue('supply_province', customerAddress.province)
                  }}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CopyCheck className="h-3.5 w-3.5" />
                  Copiar del cliente
                </button>
              )}
            </div>
          </div>

          <Field label="Dirección" error={errors.supply_address?.message}>
            <InputGroup leading={<MapPin />}>
              <Input {...register('supply_address')} placeholder="Calle, número, piso…" />
            </InputGroup>
          </Field>

          <Field label="Código postal" error={(errors as Record<string, { message?: string }>).supply_postal_code?.message}>
            <Input inputMode="numeric" {...register('supply_postal_code')} placeholder="28001" />
          </Field>

          <Field label="Ciudad" error={errors.supply_city?.message}>
            <Input {...register('supply_city')} placeholder="Madrid, Barcelona…" />
          </Field>

          <Field label="Provincia" error={errors.supply_province?.message}>
            <Input {...register('supply_province')} placeholder="Madrid" />
          </Field>
        </div>

        {/* ── Suministro ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Suministro" />

          <Field label="Comercializadora" error={errors.provider?.message}>
            <Input {...register('provider')} placeholder="Ej. Iberdrola, Endesa, Naturgy…" />
          </Field>

          <Field label="Canal de venta" error={errors.sales_channel?.message}>
            <Input {...register('sales_channel')} placeholder="Ej. Puerta fría, Referido, Online…" />
          </Field>

          <Field label="Producto / oferta" error={errors.product?.message}>
            <Input {...register('product')} placeholder="Tarifa Plana, Luz Fija…" />
          </Field>

          <Field
            label="Tarifa de acceso"
            error={errors.tariff_type?.message}
            hint="Determinada por la potencia y el tipo de suministro"
          >
            <Input {...register('tariff_type')} placeholder="2.0TD, RL1, 6.1TD…" />
          </Field>
        </div>

        {/* ── Datos técnicos ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Datos técnicos" />

          <Field label="Potencia contratada" error={errors.power_kw?.message} hint="Kilovatios (kW)">
            <EnergyInput>
              <Input type="number" step="any" min={0} {...register('power_kw')} placeholder="4.60" />
            </EnergyInput>
          </Field>

          <Field label="Consumo anual estimado" error={errors.annual_consumption_kwh?.message} hint="Kilovatios-hora (kWh)">
            <EnergyInput>
              <Input type="number" step="any" min={0} {...register('annual_consumption_kwh')} placeholder="3500" />
            </EnergyInput>
          </Field>
        </div>

        {/* ── Precios ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Precios y comisión" />

          <Field label="Precio energía" error={errors.energy_price_eur?.message} hint="€ por kWh consumido">
            <MoneyInput>
              <Input type="number" step="any" min={0} {...register('energy_price_eur')} placeholder="0.1200" />
            </MoneyInput>
          </Field>

          <div className="col-span-full">
            <p className="mb-2 text-sm font-medium text-foreground">Precio potencia por tramo <span className="text-xs font-normal text-muted-foreground">(€/kW·año)</span></p>
            <div className="grid grid-cols-3 gap-3">
              {([1, 2, 3, 4, 5, 6] as const).map((p) => {
                const key = `power_price_p${p}_eur` as const
                return (
                  <Field key={key} label={`P${p}`} error={(errors as Record<string, { message?: string }>)[key]?.message}>
                    <MoneyInput>
                      <Input type="number" step="any" min={0} {...register(key)} placeholder="0.00" />
                    </MoneyInput>
                  </Field>
                )
              })}
            </div>
          </div>

          {showCompanyCommission && (
            <Field label="Comisión empresa" error={errors.commission_company_eur?.message}>
              <MoneyInput>
                <Input type="number" step="any" min={0} {...register('commission_company_eur')} placeholder="0.00" />
              </MoneyInput>
            </Field>
          )}

          <Field label="Comisión comercial" error={errors.commission_commercial_eur?.message}>
            <MoneyInput>
              <Input type="number" step="any" min={0} {...register('commission_commercial_eur')} placeholder="0.00" />
            </MoneyInput>
          </Field>
        </div>

        {/* ── Vigencia ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Vigencia del contrato" />

          <Field label="Fecha de inicio" error={errors.starts_at?.message}>
            <Input
              type="date"
              {...register('starts_at', {
                onChange: (event) => {
                  const value = event.target.value
                  if (value && !getValues('ends_at')) {
                    setValue('ends_at', format(addYears(new Date(`${value}T00:00:00`), 1), 'yyyy-MM-dd'), {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                },
              })}
            />
          </Field>

          <Field label="Fecha de vencimiento" error={errors.ends_at?.message}>
            <Input type="date" {...register('ends_at')} />
          </Field>

          <Field label="Fecha de baja" error={errors.terminated_at?.message}>
            <Input type="date" {...register('terminated_at')} />
          </Field>
        </div>

        {/* ── Notas ── */}
        <Field label="Notas" error={errors.notes?.message} hint="Condiciones especiales, observaciones u otras anotaciones relevantes">
          <Textarea {...register('notes')} placeholder="Añade cualquier observación relevante sobre este contrato…" />
        </Field>

        <div className="flex items-center gap-2">
          <Button type="submit" size="lg" disabled={isPending} className="flex-1">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar contrato'}
          </Button>

          {isEditing && !confirmDelete && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteContract.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {isEditing && confirmDelete && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2">
              <span className="text-sm text-destructive">¿Eliminar contrato?</span>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteContract.isPending}
              >
                {deleteContract.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sí, eliminar'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteContract.isPending}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </form>
    </Dialog>
  )
}
