import { zodResolver } from '@hookform/resolvers/zod'
import { Printer } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { proposalStatusLabels } from '../config/constants'
import { money } from '../lib/formatters'
import { type ProposalFormValues, proposalSchema } from '../schemas/forms.schema'
import { useDemoStore } from '../store/demo-store'

const defaultValidUntil = '2026-05-12'

export function ProposalsRoute() {
  const store = useDemoStore()
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalSchema) as never,
    defaultValues: {
      customer_id: store.customers[0]?.id,
      simulation_id: store.simulations[0]?.id,
      title: 'Propuesta de ahorro energetico',
      services: 'Optimizacion de potencia\nCambio de tarifa\nSeguimiento trimestral',
      estimated_price_eur: 1200,
      valid_until: defaultValidUntil,
    },
  })
  const watchedSimulationId = useWatch({ control: form.control, name: 'simulation_id' })
  const watchedCustomerId = useWatch({ control: form.control, name: 'customer_id' })
  const watchedTitle = useWatch({ control: form.control, name: 'title' })
  const watchedServices = useWatch({ control: form.control, name: 'services' })
  const watchedPrice = useWatch({ control: form.control, name: 'estimated_price_eur' })
  const selectedSimulation = store.simulations.find((item) => item.id === watchedSimulationId)
  const selectedCustomer = store.customers.find((item) => item.id === watchedCustomerId)

  function onSubmit(values: ProposalFormValues) {
    store.createProposal({
      ...values,
      status: 'draft',
      services: values.services.split('\n').map((item) => item.trim()).filter(Boolean),
      html_snapshot: document.querySelector('.print-page')?.innerHTML,
    })
  }

  return (
    <div>
      <PageHeader
        title="Propuestas comerciales"
        description="Generacion HTML imprimible, con estados draft/sent/accepted/rejected."
        action={
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir vista
          </Button>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card className="no-print">
          <CardHeader>
            <CardTitle>Nueva propuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select {...form.register('customer_id')}>
                  {store.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Simulacion" error={form.formState.errors.simulation_id?.message}>
                <Select {...form.register('simulation_id')}>
                  {store.simulations.map((simulation) => (
                    <option key={simulation.id} value={simulation.id}>
                      {store.customers.find((customer) => customer.id === simulation.customer_id)?.name} · {money.format(simulation.annual_saving_eur)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Titulo" error={form.formState.errors.title?.message}>
                <Input {...form.register('title')} />
              </Field>
              <Field label="Servicios recomendados" error={form.formState.errors.services?.message}>
                <Textarea {...form.register('services')} />
              </Field>
              <Field label="Precio estimado" error={form.formState.errors.estimated_price_eur?.message}>
                <Input type="number" step="0.01" {...form.register('estimated_price_eur')} />
              </Field>
              <Field label="Valida hasta" error={form.formState.errors.valid_until?.message}>
                <Input type="date" {...form.register('valid_until')} />
              </Field>
              <Button type="submit">Crear propuesta</Button>
            </form>
          </CardContent>
        </Card>
        <div className="grid gap-4">
          <Card className="print-page">
            <CardContent className="p-8">
              <div className="flex justify-between gap-6 border-b border-border pb-6">
                <div>
                  <p className="text-sm font-semibold uppercase text-primary">Propuesta comercial</p>
                  <h2 className="mt-2 text-3xl font-semibold text-foreground">{watchedTitle}</h2>
                  <p className="mt-2 text-muted-foreground">Cliente: {selectedCustomer?.name ?? 'Selecciona cliente'}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{store.organization.name}</p>
                  <p>{store.organization.tax_id}</p>
                  <p>{store.organization.city}</p>
                </div>
              </div>
              <div className="my-6 grid gap-4 md:grid-cols-3">
                <ProposalMetric label="Coste actual" value={selectedSimulation ? money.format(selectedSimulation.current_monthly_cost_eur) : '-'} />
                <ProposalMetric label="Coste propuesto" value={selectedSimulation ? money.format(selectedSimulation.proposed_monthly_cost_eur) : '-'} />
                <ProposalMetric label="Ahorro anual" value={selectedSimulation ? money.format(selectedSimulation.annual_saving_eur) : '-'} />
              </div>
              <h3 className="font-semibold text-foreground">Servicios recomendados</h3>
              <ul className="mt-3 grid gap-2 text-sm text-foreground">
                {watchedServices?.split('\n').filter(Boolean).map((service) => <li key={service}>- {service}</li>)}
              </ul>
              <div className="mt-6 rounded-md bg-primary/10 p-4">
                <p className="text-sm text-primary">Precio estimado</p>
                <p className="text-2xl font-semibold text-foreground">{money.format(Number(watchedPrice || 0))}</p>
              </div>
            </CardContent>
          </Card>
          <DataTable headers={['Propuesta', 'Cliente', 'Importe', 'Validez', 'Estado', 'Acciones']} className="no-print">
            {store.proposals.map((proposal) => (
              <tr key={proposal.id}>
                <td className="px-4 py-3 font-medium text-foreground">{proposal.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{store.customers.find((customer) => customer.id === proposal.customer_id)?.name}</td>
                <td className="px-4 py-3">{money.format(proposal.estimated_price_eur)}</td>
                <td className="px-4 py-3">{proposal.valid_until}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={proposalStatusLabels[proposal.status]} />
                </td>
                <td className="px-4 py-3">
                  <select className="min-h-10 rounded-md border border-border bg-background px-2" value={proposal.status} onChange={(event) => store.updateProposalStatus(proposal.id, event.target.value as typeof proposal.status)}>
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviada</option>
                    <option value="accepted">Aceptada</option>
                    <option value="rejected">Rechazada</option>
                  </select>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>
    </div>
  )
}

function ProposalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
