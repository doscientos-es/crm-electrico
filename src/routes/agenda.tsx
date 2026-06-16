import { ChevronLeft, ChevronRight, FileText, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { useAuth } from '../features/auth/AuthContext'
import { cn } from '../lib/utils'
import { type ContractForCalendar, useContractsByMonth } from '../services/contracts.service'
import { useCustomers } from '../services/customers.service'
import { type TaskWithCustomer, useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '../services/tasks.service'
import type { ContractStatus, TaskPriority, TaskStatus } from '../types/database.types'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const priorityStyles: Record<TaskPriority, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Baja', medium: 'Media', high: 'Alta', urgent: 'Urgente',
}

const statusLabels: Record<TaskStatus, string> = {
  pending: 'Pendiente', in_progress: 'En curso', done: 'Hecho', cancelled: 'Cancelado',
}

const contractEventStyle = 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300'

const contractStatusLabels: Record<ContractStatus, string> = {
  pending_processing: 'Pendiente procesado',
  processing: 'En trámite',
  pending_signature: 'Pendiente firma',
  active: 'Activo',
  cancelled: 'Cancelado',
  terminated: 'Terminado',
  incident: 'Incidencia',
}

type CalendarEvent =
  | { kind: 'task'; data: TaskWithCustomer }
  | { kind: 'contract'; data: ContractForCalendar }

function toYearMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function buildCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1)
  // Monday-based: getDay() returns 0=Sun, shift so Mon=0
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AgendaRoute() {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<CalendarEvent | null>(null)
  const [prefillDate, setPrefillDate] = useState<string>('')

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const ym = toYearMonth(cursor)

  const { data: tasks = [] } = useTasks({ month: ym })
  const { data: contracts = [] } = useContractsByMonth(ym)
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const customers = customersResult?.data ?? []

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    const add = (day: string, ev: CalendarEvent) => {
      if (!map.has(day)) map.set(day, [])
      const bucket = map.get(day)
      if (bucket) bucket.push(ev)
    }
    for (const t of tasks) add(t.due_at.slice(0, 10), { kind: 'task', data: t })
    for (const c of contracts) if (c.ends_at) add(c.ends_at.slice(0, 10), { kind: 'contract', data: c })
    return map
  }, [tasks, contracts])

  const weeks = buildCalendarGrid(year, month)

  const monthLabel = cursor.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  function prev() { setCursor(new Date(year, month - 1, 1)) }
  function next() { setCursor(new Date(year, month + 1, 1)) }

  function openCreate(dateStr?: string) {
    setPrefillDate(dateStr ?? toDateStr(today))
    setCreateOpen(true)
  }

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Reuniones, renovaciones y contactos programados."
        action={
          <Button onClick={() => openCreate()}>
            <Plus className="size-4" /> Nueva entrada
          </Button>
        }
      />

      {/* Month navigation */}
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="size-4" /></Button>
        <span className="min-w-44 text-center text-sm font-semibold capitalize text-foreground">{monthLabel}</span>
        <Button variant="outline" size="icon" onClick={next}><ChevronRight className="size-4" /></Button>
        <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}>Hoy</Button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {DAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-border border-b border-border last:border-b-0">
            {week.map((date, di) => {
              const dateStr = date ? toDateStr(date) : ''
              const dayEvents = dateStr ? (eventsByDay.get(dateStr) ?? []) : []
              const isToday = date ? toDateStr(date) === toDateStr(today) : false
              return (
                <div
                  key={di}
                  className={cn(
                    'group min-h-24 p-1.5 text-xs',
                    date ? 'cursor-pointer hover:bg-muted/30 transition-colors' : 'bg-muted/10',
                  )}
                  onClick={() => date && openCreate(toDateStr(date))}
                  role={date ? 'button' : undefined}
                  tabIndex={date ? 0 : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && date && openCreate(toDateStr(date))}
                >
                  {date && (
                    <>
                      <span className={cn(
                        'mb-1 flex size-6 items-center justify-center rounded-full text-xs font-medium',
                        isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
                      )}>
                        {date.getDate()}
                      </span>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) =>
                          ev.kind === 'task' ? (
                            <button
                              key={ev.data.id}
                              type="button"
                              className={cn('block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium', priorityStyles[ev.data.priority])}
                              onClick={(e) => { e.stopPropagation(); setSelected(ev) }}
                            >
                              {ev.data.title}
                            </button>
                          ) : (
                            <button
                              key={ev.data.id}
                              type="button"
                              className={cn('block w-full truncate rounded px-1.5 py-0.5 text-left text-xs font-medium', contractEventStyle)}
                              onClick={(e) => { e.stopPropagation(); setSelected(ev) }}
                            >
                              <FileText className="mr-0.5 inline size-2.5" />
                              {ev.data.customer?.name ?? ev.data.contract_number ?? 'Contrato'}
                            </button>
                          )
                        )}
                        {dayEvents.length > 3 && (
                          <span className="block pl-1 text-xs text-muted-foreground">+{dayEvents.length - 3} más</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <CreateTaskDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        prefillDate={prefillDate}
        customers={customers}
      />

      {selected?.kind === 'task' && (
        <TaskDetailDialog
          task={selected.data}
          customers={customers}
          onClose={() => setSelected(null)}
        />
      )}
      {selected?.kind === 'contract' && (
        <ContractExpiryDialog
          contract={selected.data}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

/* ── Create dialog ───────────────────────────────────────────────── */

type CustomerOption = { id: string; name: string; company: string | null }

function CreateTaskDialog({
  open, onOpenChange, prefillDate, customers,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  prefillDate: string
  customers: CustomerOption[]
}) {
  const { profile } = useAuth()
  const create = useCreateTask()

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(prefillDate)
  const [time, setTime] = useState('09:00')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [description, setDescription] = useState('')
  const [customerId, setCustomerId] = useState('')

  // sync prefill date when dialog opens
  useEffect(() => { setDate(prefillDate) }, [prefillDate])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim() || !date) return
    await create.mutateAsync({
      title: title.trim(),
      due_at: `${date}T${time}:00`,
      priority,
      description: description.trim() || null,
      customer_id: customerId || null,
      assigned_to: profile?.id ?? null,
      status: 'pending',
    })
    setTitle(''); setDescription(''); setCustomerId('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Nueva entrada de agenda">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título" required>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reunión con cliente, Renovación..." required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha" required>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </Field>
          <Field label="Hora">
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        <Field label="Tipo / Prioridad">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="low">Baja — Contacto rutinario</option>
            <option value="medium">Media — Reunión / Seguimiento</option>
            <option value="high">Alta — Renovación</option>
            <option value="urgent">Urgente — Acción inmediata</option>
          </Select>
        </Field>
        <Field label="Cliente (opcional)">
          <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">Sin cliente</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
            ))}
          </Select>
        </Field>
        <Field label="Notas">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalles adicionales..." />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button type="submit" disabled={create.isPending}>Guardar</Button>
        </div>
      </form>
    </Dialog>
  )
}

/* ── Detail/Edit dialog ──────────────────────────────────────────── */

function TaskDetailDialog({
  task, customers, onClose,
}: {
  task: TaskWithCustomer
  customers: CustomerOption[]
  onClose: () => void
}) {
  const update = useUpdateTask()
  const remove = useDeleteTask()

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [date, setDate] = useState(task.due_at.slice(0, 10))
  const [time, setTime] = useState(task.due_at.slice(11, 16))
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [status, setStatus] = useState<TaskStatus>(task.status)
  const [description, setDescription] = useState(task.description ?? '')
  const [customerId, setCustomerId] = useState(task.customer_id ?? '')

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    await update.mutateAsync({
      id: task.id,
      title: title.trim(),
      due_at: `${date}T${time}:00`,
      priority, status,
      description: description.trim() || null,
      customer_id: customerId || null,
    })
    setEditing(false)
    onClose()
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta entrada?')) return
    await remove.mutateAsync(task.id)
    onClose()
  }

  return (
    <Dialog open onOpenChange={() => onClose()} title={editing ? 'Editar entrada' : task.title}>
      {editing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Título" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha" required>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="Hora">
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>
          <Field label="Prioridad">
            <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {(Object.keys(priorityLabels) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{priorityLabels[p]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {(Object.keys(statusLabels) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </Select>
          </Field>
          <Field label="Cliente">
            <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Sin cliente</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>
              ))}
            </Select>
          </Field>
          <Field label="Notas">
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button type="submit" disabled={update.isPending}>Guardar</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha</p>
              <p className="mt-0.5">{new Date(task.due_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Prioridad</p>
              <span className={cn('mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs font-medium', priorityStyles[task.priority])}>
                {priorityLabels[task.priority]}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</p>
              <p className="mt-0.5">{statusLabels[task.status]}</p>
            </div>
            {task.customer && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cliente</p>
                <p className="mt-0.5">{task.customer.name}</p>
              </div>
            )}
          </div>
          {task.description && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notas</p>
              <p className="mt-0.5 text-sm text-foreground">{task.description}</p>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={remove.isPending}>Eliminar</Button>
            <Button type="button" onClick={() => setEditing(true)}>Editar</Button>
          </div>
        </div>
      )}
    </Dialog>
  )
}

/* ── Contract expiry dialog ──────────────────────────────────────── */

function ContractExpiryDialog({
  contract, onClose,
}: {
  contract: ContractForCalendar
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={() => onClose()} title="Caducidad de contrato">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {contract.customer && (
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cliente</p>
              <p className="mt-0.5 font-medium">
                {contract.customer.name}
                {contract.customer.company ? ` — ${contract.customer.company}` : ''}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fecha caducidad</p>
            <p className="mt-0.5">{new Date(contract.ends_at).toLocaleDateString('es-ES', { dateStyle: 'medium' })}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</p>
            <p className="mt-0.5">{contractStatusLabels[contract.status]}</p>
          </div>
          {contract.contract_number && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Nº contrato</p>
              <p className="mt-0.5">{contract.contract_number}</p>
            </div>
          )}
          {contract.provider && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Comercializadora</p>
              <p className="mt-0.5">{contract.provider}</p>
            </div>
          )}
          {contract.product && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Producto</p>
              <p className="mt-0.5">{contract.product}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Dialog>
  )
}
