import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { money } from '../lib/formatters'
import { type SimulationFormValues, simulationSchema } from '../schemas/simulation.schema'
import { useDemoStore } from '../store/demo-store'

export function SimulationsRoute() {
  const store = useDemoStore()
  const form = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationSchema) as never,
    defaultValues: { customer_id: store.customers[0]?.id, estimated_saving_percent: 18, current_monthly_cost_eur: 500 },
  })
  const currentCost = Number(useWatch({ control: form.control, name: 'current_monthly_cost_eur' }) || 0)
  const percent = Number(useWatch({ control: form.control, name: 'estimated_saving_percent' }) || 0)
  const watchedCustomerId = useWatch({ control: form.control, name: 'customer_id' })
  const monthlySaving = currentCost * (percent / 100)

  function selectCustomer(customerId: string) {
    const energy = store.energyProfiles.find((item) => item.customer_id === customerId)
    form.setValue('customer_id', customerId)
    if (energy) {
      form.setValue('energy_profile_id', energy.id)
      form.setValue('current_monthly_cost_eur', energy.monthly_cost_eur)
      form.setValue('contracted_power_kw', energy.contracted_power_kw)
      form.setValue('monthly_consumption_kwh', energy.monthly_consumption_kwh)
      form.setValue('tariff_type', energy.tariff_type)
    }
  }

  function onSubmit(values: SimulationFormValues) {
    store.createSimulation(values)
  }

  return (
    <div>
      <PageHeader title="Simulador de ahorro" description="Calculo simple demo-ready: ahorro mensual, ahorro anual y ROI solar." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva simulacion</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select value={watchedCustomerId} onChange={(event) => selectCustomer(event.target.value)}>
                  {store.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Coste mensual actual" error={form.formState.errors.current_monthly_cost_eur?.message}>
                <Input type="number" step="0.01" {...form.register('current_monthly_cost_eur')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Potencia kW" error={form.formState.errors.contracted_power_kw?.message}>
                  <Input type="number" step="0.01" {...form.register('contracted_power_kw')} />
                </Field>
                <Field label="kWh mensual" error={form.formState.errors.monthly_consumption_kwh?.message}>
                  <Input type="number" step="0.01" {...form.register('monthly_consumption_kwh')} />
                </Field>
              </div>
              <Field label="Ahorro estimado %" error={form.formState.errors.estimated_saving_percent?.message}>
                <Input type="number" step="0.1" {...form.register('estimated_saving_percent')} />
              </Field>
              <Field label="Inversion solar EUR" error={form.formState.errors.solar_investment_eur?.message}>
                <Input type="number" step="0.01" {...form.register('solar_investment_eur')} />
              </Field>
              <Field label="Notas" error={form.formState.errors.notes?.message}>
                <Textarea {...form.register('notes')} />
              </Field>
              <div className="grid grid-cols-2 gap-3 rounded-md bg-primary/10 p-3 text-sm">
                <div>
                  <p className="text-primary">Coste propuesto</p>
                  <p className="font-semibold text-foreground">{money.format(currentCost - monthlySaving)}</p>
                </div>
                <div>
                  <p className="text-primary">Ahorro anual</p>
                  <p className="font-semibold text-foreground">{money.format(monthlySaving * 12)}</p>
                </div>
              </div>
              <Button type="submit">Guardar simulacion</Button>
            </form>
          </CardContent>
        </Card>
        <DataTable headers={['Cliente', 'Actual', 'Propuesto', 'Ahorro mensual', 'Ahorro anual', 'ROI']}>
          {store.simulations.map((simulation) => (
            <tr key={simulation.id}>
              <td className="px-4 py-3 font-medium text-foreground">{store.customers.find((customer) => customer.id === simulation.customer_id)?.name}</td>
              <td className="px-4 py-3">{money.format(simulation.current_monthly_cost_eur)}</td>
              <td className="px-4 py-3">{money.format(simulation.proposed_monthly_cost_eur)}</td>
              <td className="px-4 py-3">{money.format(simulation.monthly_saving_eur)}</td>
              <td className="px-4 py-3">{money.format(simulation.annual_saving_eur)}</td>
              <td className="px-4 py-3">{simulation.roi_years ? `${simulation.roi_years} anos` : '-'}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
