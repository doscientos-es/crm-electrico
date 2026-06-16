import { zodResolver } from '@hookform/resolvers/zod'
import { addYears, format } from 'date-fns'
import { Euro, Loader2, Pencil, Plus, Trash2, Zap } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, InputGroup, Select, Textarea } from '../../components/ui/input'
import { contractStatusLabels } from '../../config/constants'
import { useToastError } from '../../hooks/use-toast-error'
import { type ContractFormValues, contractSchema } from '../../schemas/forms.schema'
import { type ContractRow, useCreateContract, useDeleteContract, useUpdateContract } from '../../services/contracts.service'

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
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  customerId: string
  contract?: ContractRow
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isEditing = Boolean(contract)
  const [internalOpen, setInternalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = controlledOnOpenChange ?? setInternalOpen
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const deleteContract = useDeleteContract()
  const onError = useToastError()
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
      contract_number: contract?.contract_number ?? '',
      cups: contract?.cups ?? '',
      provider: contract?.provider ?? '',
      product: contract?.product ?? '',
      tariff_type: contract?.tariff_type ?? '',
      power_kw: contract?.power_kw ?? undefined,
      annual_consumption_kwh: contract?.annual_consumption_kwh ?? undefined,
      energy_price_eur: contract?.energy_price_eur ?? undefined,
      power_price_p1_eur: contract?.power_price_p1_eur ?? undefined,
      power_price_p2_eur: contract?.power_price_p2_eur ?? undefined,
      power_price_p3_eur: contract?.power_price_p3_eur ?? undefined,
      power_price_p4_eur: contract?.power_price_p4_eur ?? undefined,
      power_price_p5_eur: contract?.power_price_p5_eur ?? undefined,
      power_price_p6_eur: contract?.power_price_p6_eur ?? undefined,
      commission_company_eur: contract?.commission_company_eur ?? 0,
      commission_commercial_eur: contract?.commission_commercial_eur ?? 0,
      starts_at: contract?.starts_at?.slice(0, 10) ?? '',
      ends_at: contract?.ends_at?.slice(0, 10) ?? '',
      notes: contract?.notes ?? '',
    },
  })

  function onSubmit(values: ContractFormValues) {
    const payload = {
      customer_id: customerId,
      status: values.status,
      contract_number: values.contract_number || null,
      cups: values.cups || null,
      provider: values.provider || null,
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
      commission_company_eur: values.commission_company_eur ?? 0,
      commission_commercial_eur: values.commission_commercial_eur ?? 0,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
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
      createContract.mutate(payload, done)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
      size="lg"
      title={isEditing ? 'Editar contrato' : 'Nuevo contrato'}
      trigger={
        controlledOpen !== undefined ? undefined : isEditing ? (
          <Button variant="secondary" size="sm"><Pencil className="h-4 w-4" />Editar</Button>
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

        {/* ── Suministro ── */}
        <div className="grid items-start gap-4 md:grid-cols-2">
          <SectionHeader title="Suministro" />

          <Field label="Comercializadora" error={errors.provider?.message}>
            <Input {...register('provider')} placeholder="Iberdrola, Endesa, Naturgy…" />
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
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
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

          <Field label="Comisión empresa" error={errors.commission_company_eur?.message}>
            <MoneyInput>
              <Input type="number" step="any" min={0} {...register('commission_company_eur')} placeholder="0.00" />
            </MoneyInput>
          </Field>

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
