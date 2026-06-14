import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Field, Select, Input, Textarea } from '../../components/ui/input'
import { incidentPriorityLabels, incidentStatusLabels } from '../../config/constants'
import { incidentSchema, type IncidentFormValues } from '../../schemas/incident.schema'
import { useContracts } from '../../services/contracts.service'
import { useCustomers } from '../../services/customers.service'
import { useCreateIncident, useUpdateIncident, type IncidentRow } from '../../services/incidents.service'
import { useProfiles } from '../../services/profiles.service'

export function IncidentForm({ incident }: { incident?: IncidentRow }) {
  const navigate = useNavigate()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: contracts = [] } = useContracts()
  const { data: profiles = [] } = useProfiles()
  const customers = customersResult?.data ?? []
  const createIncident = useCreateIncident()
  const updateIncident = useUpdateIncident()
  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: incident ? {
      title: incident.title,
      description: incident.description,
      status: incident.status,
      priority: incident.priority,
      customerId: incident.customerId,
      contractId: incident.contractId ?? '',
      assignedTo: incident.assignedTo ?? '',
      internalNotes: incident.internalNotes,
    } : {
      title: '',
      description: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      customerId: customers[0]?.id ?? '',
      contractId: '',
      assignedTo: '',
      internalNotes: '',
    },
  })
  const customerId = useWatch({ control: form.control, name: 'customerId' })
  const availableContracts = contracts.filter((contract) => contract.customer_id === customerId)

  function onSubmit(values: IncidentFormValues) {
    const payload = { ...values, contractId: values.contractId || null, assignedTo: values.assignedTo || null }
    const options = { onSuccess: () => navigate(incident ? `/incidents/${incident.id}` : '/incidents') }
    if (incident) updateIncident.mutate({ id: incident.id, ...payload }, options)
    else createIncident.mutate(payload, options)
  }

  return (
    <form className="grid gap-5 rounded-lg border border-border bg-card p-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Título" required error={form.formState.errors.title?.message}><Input {...form.register('title')} /></Field>
        <Field label="Cliente" required error={form.formState.errors.customerId?.message}>
          <Select {...form.register('customerId')}><option value="">Selecciona un cliente</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
        </Field>
        <Field label="Estado" required error={form.formState.errors.status?.message}>
          <Select {...form.register('status')}>{Object.entries(incidentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        </Field>
        <Field label="Prioridad" required error={form.formState.errors.priority?.message}>
          <Select {...form.register('priority')}>{Object.entries(incidentPriorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select>
        </Field>
        <Field label="Contrato">
          <Select {...form.register('contractId')}><option value="">Sin contrato</option>{availableContracts.map((item) => <option key={item.id} value={item.id}>{item.contract_number}</option>)}</Select>
        </Field>
        <Field label="Asignado a">
          <Select {...form.register('assignedTo')}><option value="">Sin asignar</option>{profiles.map((item) => <option key={item.id} value={item.id}>{item.full_name}</option>)}</Select>
        </Field>
      </div>
      <Field label="Descripción"><Textarea {...form.register('description')} /></Field>
      <Field label="Notas internas"><Textarea {...form.register('internalNotes')} /></Field>
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancelar</Button><Button type="submit">{incident ? 'Guardar cambios' : 'Crear incidencia'}</Button></div>
    </form>
  )
}
