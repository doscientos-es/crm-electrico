import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Select } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { customerStatusLabels } from '../config/constants'
import { getDaysToRenewal, getRenewalAlertDate, getRenewalStage, getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

type StageFilter = 'all' | 'due' | 'urgent' | 'overdue' | 'scheduled'

export function RenewalsRoute() {
  const store = useDemoStore()
  const [stage, setStage] = useState<StageFilter>('all')
  const customers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)

  const renewalQueue = useMemo(() => {
    return customers
      .filter((customer) => {
        const currentStage = getRenewalStage(customer)
        return ['due', 'urgent', 'overdue', 'scheduled'].includes(currentStage) && (stage === 'all' || currentStage === stage)
      })
      .sort((left, right) => (left.renewal_date ?? '').localeCompare(right.renewal_date ?? ''))
  }, [customers, stage])

  return (
    <div>
      <PageHeader
        title="Renovaciones"
        description="Cola automatica basada en contrato anual y aviso a los 10 meses."
        action={
          <Button asChild variant="secondary">
            <Link to="/customers">Ir a clientes</Link>
          </Button>
        }
      />

      <div className="mb-5 grid gap-4 rounded-lg border border-border bg-card p-4 md:grid-cols-3">
        <Field label="Estado de aviso">
          <Select value={stage} onChange={(event) => setStage(event.target.value as StageFilter)}>
            <option value="all">Todos</option>
            <option value="scheduled">Programados</option>
            <option value="due">Para contactar</option>
            <option value="urgent">Urgentes</option>
            <option value="overdue">Vencidos</option>
          </Select>
        </Field>
      </div>

      <DataTable headers={['Cliente', 'Estado', 'Avisar desde', 'Renovacion', 'Dias', 'Comercial', 'Acciones']}>
        {renewalQueue.map((customer) => {
          const alertDate = getRenewalAlertDate(customer)
          const days = getDaysToRenewal(customer)
          return (
            <tr key={customer.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.products_services.join(', ') || 'Sin servicios'}</p>
              </td>
              <td className="px-4 py-3">
                <StatusBadge value={customerStatusLabels[customer.status]} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{alertDate ? formatDate(alertDate.toISOString()) : '-'}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(customer.renewal_date)}</td>
              <td className="px-4 py-3 text-muted-foreground">{typeof days === 'number' ? days : '-'}</td>
              <td className="px-4 py-3 text-muted-foreground">{store.profiles.find((profile) => profile.id === customer.assigned_to)?.full_name ?? '-'}</td>
              <td className="px-4 py-3">
                <Button asChild size="sm" variant="secondary">
                  <Link to={`/customers/${customer.id}`}>Abrir ficha</Link>
                </Button>
              </td>
            </tr>
          )
        })}
      </DataTable>
    </div>
  )
}
