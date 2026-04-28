import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Archive, CalendarClock, ShieldCheck, Users } from 'lucide-react'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { customerStatusLabels } from '../config/constants'
import { getDaysToRenewal, getRenewalStage, getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function DashboardRoute() {
  const store = useDemoStore()
  const visibleCustomers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)
  const dueCustomers = visibleCustomers.filter((customer) => ['due', 'urgent', 'overdue'].includes(getRenewalStage(customer)))
  const activeCustomers = visibleCustomers.filter((customer) => customer.status === 'active' || customer.status === 'renewed')
  const lostCustomers = visibleCustomers.filter((customer) => customer.status === 'lost' || customer.status === 'inactive')

  return (
    <div>
      <PageHeader
        title="Cartera y renovaciones"
        description="Vista central de clientes, contratos y avisos automaticos a los 10 meses."
        action={
          <Button asChild>
            <Link to="/renewals">Ver cola de renovacion</Link>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Clientes visibles" value={visibleCustomers.length} icon={<Users />} />
        <Kpi title="Activos" value={activeCustomers.length} icon={<ShieldCheck />} />
        <Kpi title="Pendientes de renovacion" value={dueCustomers.length} icon={<CalendarClock />} />
        <Kpi title="Bajas y perdidos" value={lostCustomers.length} icon={<Archive />} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Clientes a contactar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {dueCustomers.slice(0, 6).map((customer) => {
              const days = getDaysToRenewal(customer)
              return (
                <div key={customer.id} className="rounded-md border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-950">{customer.name}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {customer.company ?? 'Particular'} · {customer.products_services.join(', ') || 'Sin servicios definidos'}
                      </p>
                    </div>
                    <StatusBadge value={customerStatusLabels[customer.status]} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Renueva: {formatDate(customer.renewal_date)}</span>
                    <span>{typeof days === 'number' ? `${days} dias` : 'Sin fecha'}</span>
                    <span>{store.profiles.find((profile) => profile.id === customer.assigned_to)?.full_name}</span>
                  </div>
                </div>
              )
            })}
            {!dueCustomers.length ? <p className="text-sm text-slate-500">No hay avisos pendientes en esta cartera.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ultimos eventos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {store.activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-md border border-slate-100 p-3">
                <div className="mt-0.5 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-slate-700">{String(log.metadata.label ?? log.action)}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Kpi({ title, value, icon }: { title: string; value: string | number; icon: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-md bg-emerald-50 text-emerald-700">
          <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        </div>
      </CardContent>
    </Card>
  )
}
