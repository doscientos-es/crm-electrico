import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Field, Input, Select, Textarea } from '../../components/ui/input'
import { contractStatusLabels } from '../../config/constants'
import { contractSchema, type ContractFormValues } from '../../schemas/contract.schema'
import { useCreateContract, useUpdateContract, type ContractRow } from '../../services/contracts.service'
import { useCustomers } from '../../services/customers.service'

const emptyEnergy = {
  cups: '',
  marketer: '',
  product: '',
  annualConsumptionKwh: 0,
  tariff: '',
  energyPrice: 0,
  powerPrice: 0,
  commission: 0,
  estimatedMargin: 0,
  startDate: '',
  endDate: '',
  notes: '',
}

export function ContractForm({ contract }: { contract?: ContractRow }) {
  const navigate = useNavigate()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const customers = useMemo(() => customersResult?.data ?? [], [customersResult?.data])
  const suggestedNumber = useMemo(
    () => `ENE-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`,
    [],
  )
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as never,
    defaultValues: contract ? {
      customer_id: contract.customer_id,
      contract_number: contract.contract_number,
      status: contract.status,
      starts_at: contract.starts_at ?? '',
      ends_at: contract.ends_at ?? '',
      amount_eur: contract.amount_eur,
      commission_eur: contract.commission_eur,
      energy_data: contract.energy_data ?? emptyEnergy,
    } : {
      customer_id: '',
      contract_number: suggestedNumber,
      status: 'PENDING_PROCESSING',
      starts_at: '',
      ends_at: '',
      amount_eur: 0,
      commission_eur: 0,
      energy_data: emptyEnergy,
    },
  })

  useEffect(() => {
    if (!contract && !form.getValues('customer_id') && customers[0]) {
      form.setValue('customer_id', customers[0].id)
      if (customers[0].energy_data) form.setValue('energy_data', customers[0].energy_data)
    }
  }, [contract, customers, form])

  function onSubmit(values: ContractFormValues) {
    const payload = {
      ...values,
      deal_id: null,
      proposal_id: null,
      signed_at: values.status === 'ACTIVE' ? new Date().toISOString() : null,
      file_path: contract?.file_path ?? null,
    }
    const options = { onSuccess: () => navigate(contract ? `/contracts/${contract.id}` : '/contracts') }
    if (contract) updateContract.mutate({ id: contract.id, ...payload }, options)
    else createContract.mutate(payload, options)
  }

  return (
    <form className="grid gap-6" onSubmit={form.handleSubmit(onSubmit)}>
      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-sm font-semibold">Datos del contrato</h2>
        <Field label="Cliente" required error={form.formState.errors.customer_id?.message}>
          <Select {...form.register('customer_id')}>
            <option value="">Selecciona un cliente</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </Select>
        </Field>
        <Field label="Número de contrato" required error={form.formState.errors.contract_number?.message}>
          <Input {...form.register('contract_number')} />
        </Field>
        <Field label="Estado" required error={form.formState.errors.status?.message}>
          <Select {...form.register('status')}>
            {Object.entries(contractStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </Field>
        <Field label="Importe" error={form.formState.errors.amount_eur?.message}>
          <Input type="number" min="0" step="0.01" {...form.register('amount_eur')} />
        </Field>
        <Field label="Fecha de inicio">
          <Input type="date" {...form.register('starts_at')} />
        </Field>
        <Field label="Fecha de fin">
          <Input type="date" {...form.register('ends_at')} />
        </Field>
        <Field label="Comisión" error={form.formState.errors.commission_eur?.message}>
          <Input type="number" min="0" step="0.01" {...form.register('commission_eur')} />
        </Field>
      </section>

      <section className="grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-3">
          <h2 className="text-sm font-semibold">Datos energéticos</h2>
          <p className="mt-1 text-xs text-muted-foreground">El CUPS es obligatorio si completas cualquier dato energético.</p>
        </div>
        <Field label="CUPS" error={form.formState.errors.energy_data?.cups?.message}>
          <Input {...form.register('energy_data.cups')} />
        </Field>
        <Field label="Comercializadora"><Input {...form.register('energy_data.marketer')} /></Field>
        <Field label="Producto"><Input {...form.register('energy_data.product')} /></Field>
        <Field label="Consumo anual (kWh)"><Input type="number" min="0" step="0.01" {...form.register('energy_data.annualConsumptionKwh')} /></Field>
        <Field label="Tarifa"><Input {...form.register('energy_data.tariff')} /></Field>
        <Field label="Precio energía (€/kWh)"><Input type="number" min="0" step="0.0001" {...form.register('energy_data.energyPrice')} /></Field>
        <Field label="Precio potencia"><Input type="number" min="0" step="0.01" {...form.register('energy_data.powerPrice')} /></Field>
        <Field label="Comisión"><Input type="number" min="0" step="0.01" {...form.register('energy_data.commission')} /></Field>
        <Field label="Margen estimado"><Input type="number" min="0" step="0.01" {...form.register('energy_data.estimatedMargin')} /></Field>
        <Field label="Inicio suministro"><Input type="date" {...form.register('energy_data.startDate')} /></Field>
        <Field label="Fin suministro"><Input type="date" {...form.register('energy_data.endDate')} /></Field>
        <Field label="Observaciones" className="md:col-span-2 xl:col-span-3">
          <Textarea {...form.register('energy_data.notes')} />
        </Field>
      </section>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button type="submit" disabled={createContract.isPending || updateContract.isPending}>
          {contract ? 'Guardar cambios' : 'Crear contrato'}
        </Button>
      </div>
    </form>
  )
}
