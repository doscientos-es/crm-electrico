import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '../../components/ui/button'
import { Dialog } from '../../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { contractStatusLabels } from '../../config/constants'
import { useToastError } from '../../hooks/use-toast-error'
import { type ContractFormValues, contractSchema } from '../../schemas/forms.schema'
import { type ContractRow, useCreateContract, useUpdateContract } from '../../services/contracts.service'

const numOrNull = (v: number | undefined) => (v === undefined || Number.isNaN(v) ? null : v)

export function ContractFormDialog({
  customerId,
  contract,
}: {
  customerId: string
  contract?: ContractRow
}) {
  const isEditing = Boolean(contract)
  const [open, setOpen] = useState(false)
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const onError = useToastError()
  const isPending = createContract.isPending || updateContract.isPending

  const {
    register,
    handleSubmit,
    reset,
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
      power_price_eur: contract?.power_price_eur ?? undefined,
      commission_eur: contract?.commission_eur ?? 0,
      amount_eur: contract?.amount_eur ?? 0,
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
      power_price_eur: numOrNull(values.power_price_eur),
      commission_eur: values.commission_eur ?? 0,
      amount_eur: values.amount_eur ?? 0,
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
        isEditing ? (
          <Button variant="secondary" size="sm"><Pencil className="h-4 w-4" />Editar</Button>
        ) : (
          <Button size="sm"><Plus className="h-4 w-4" />Nuevo contrato</Button>
        )
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Estado" error={errors.status?.message}>
            <Select {...register('status')}>
              {Object.entries(contractStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Número de contrato" error={errors.contract_number?.message}>
            <Input {...register('contract_number')} />
          </Field>
          <Field label="CUPS" error={errors.cups?.message}>
            <Input {...register('cups')} placeholder="ES0000..." />
          </Field>
          <Field label="Comercializadora" error={errors.provider?.message}>
            <Input {...register('provider')} />
          </Field>
          <Field label="Producto" error={errors.product?.message}>
            <Input {...register('product')} />
          </Field>
          <Field label="Tarifa de acceso" error={errors.tariff_type?.message}>
            <Input {...register('tariff_type')} placeholder="2.0TD, 3.0TD..." />
          </Field>
          <Field label="Potencia (kW)" error={errors.power_kw?.message}>
            <Input type="number" step="any" {...register('power_kw')} />
          </Field>
          <Field label="Consumo anual (kWh)" error={errors.annual_consumption_kwh?.message}>
            <Input type="number" step="any" {...register('annual_consumption_kwh')} />
          </Field>
          <Field label="Precio energía (€/kWh)" error={errors.energy_price_eur?.message}>
            <Input type="number" step="any" {...register('energy_price_eur')} />
          </Field>
          <Field label="Precio potencia (€/kW)" error={errors.power_price_eur?.message}>
            <Input type="number" step="any" {...register('power_price_eur')} />
          </Field>
          <Field label="Comisión (€)" error={errors.commission_eur?.message}>
            <Input type="number" step="any" {...register('commission_eur')} />
          </Field>
          <Field label="Importe (€)" error={errors.amount_eur?.message}>
            <Input type="number" step="any" {...register('amount_eur')} />
          </Field>
          <Field label="Inicio" error={errors.starts_at?.message}>
            <Input type="date" {...register('starts_at')} />
          </Field>
          <Field label="Fin / vencimiento" error={errors.ends_at?.message}>
            <Input type="date" {...register('ends_at')} />
          </Field>
        </div>
        <Field label="Notas" error={errors.notes?.message}>
          <Textarea {...register('notes')} />
        </Field>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Guardar contrato'}
        </Button>
      </form>
    </Dialog>
  )
}
