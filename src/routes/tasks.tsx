import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { priorityLabels, taskStatusLabels } from '../config/constants'
import { formatDateTime } from '../lib/formatters'
import { taskSchema, type TaskFormValues } from '../schemas/forms.schema'
import { useDemoStore } from '../store/demo-store'

const defaultDueAt = '2026-04-28T09:00'

export function TasksRoute() {
  const store = useDemoStore()
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema) as never,
    defaultValues: {
      title: '',
      priority: 'medium',
      status: 'pending',
      assigned_to: 'user-sales',
      due_at: defaultDueAt,
    },
  })

  function onSubmit(values: TaskFormValues) {
    store.createTask(values)
    form.reset({ ...form.getValues(), title: '', description: '' })
  }

  return (
    <div>
      <PageHeader title="Tareas" description="Seguimiento comercial y operativo con asignacion a ventas o tecnico." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva tarea</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Titulo" error={form.formState.errors.title?.message}>
                <Input {...form.register('title')} />
              </Field>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select {...form.register('customer_id')}>
                  <option value="">Sin cliente</option>
                  {store.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Prioridad" error={form.formState.errors.priority?.message}>
                  <Select {...form.register('priority')}>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </Select>
                </Field>
                <Field label="Vence" error={form.formState.errors.due_at?.message}>
                  <Input type="datetime-local" {...form.register('due_at')} />
                </Field>
              </div>
              <Field label="Asignado a" error={form.formState.errors.assigned_to?.message}>
                <Select {...form.register('assigned_to')}>
                  {store.profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Descripcion" error={form.formState.errors.description?.message}>
                <Textarea {...form.register('description')} />
              </Field>
              <Button type="submit">Crear tarea</Button>
            </form>
          </CardContent>
        </Card>
        <DataTable headers={['Tarea', 'Cliente', 'Prioridad', 'Estado', 'Vence', 'Asignado', 'Acciones']}>
          {store.tasks.map((task) => (
            <tr key={task.id}>
              <td className="px-4 py-3 font-medium text-slate-950">{task.title}</td>
              <td className="px-4 py-3 text-slate-600">{store.customers.find((customer) => customer.id === task.customer_id)?.name ?? '-'}</td>
              <td className="px-4 py-3">
                <StatusBadge value={priorityLabels[task.priority]} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge value={taskStatusLabels[task.status]} />
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(task.due_at)}</td>
              <td className="px-4 py-3 text-slate-600">{store.profiles.find((profile) => profile.id === task.assigned_to)?.full_name}</td>
              <td className="px-4 py-3">
                {task.status !== 'done' ? (
                  <Button size="sm" variant="secondary" onClick={() => store.completeTask(task.id)}>
                    <CheckCircle2 className="h-4 w-4" />
                    Completar
                  </Button>
                ) : null}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
