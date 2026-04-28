import { Activity, CalendarClock, Clock, Euro, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { getRenewalStage, getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate, money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function DashboardRoute() {
  const store = useDemoStore()
  const visibleCustomers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)
  const dueCount = visibleCustomers.filter((customer) => ['due', 'urgent', 'overdue'].includes(getRenewalStage(customer))).length
  const pipelineValue = store.deals.filter((deal) => deal.status === 'open').reduce((sum, deal) => sum + deal.value_eur, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cartera y renovaciones"
        description="Vista central de clientes, contratos y avisos automaticos a los 10 meses."
        action={
          <Button asChild>
            <Link to="/renewals">Ver cola de renovacion</Link>
          </Button>
        }
      />

      {/* KPIs — flat grid, no card boxes */}
      <section className="grid grid-cols-2 gap-px bg-border xl:grid-cols-4">
        <Kpi title="Leads activos" value={store.leads.filter((lead) => lead.status !== 'lost').length} icon={<Users />} trend={+12} />
        <Kpi title="Clientes activos" value={store.customers.length} icon={<Activity />} trend={+5} />
        <Kpi title="Renovaciones urgentes" value={dueCount} icon={<CalendarClock />} />
        <Kpi title="Pipeline abierto" value={money.format(pipelineValue)} icon={<Euro />} trend={+8} />
      </section>

      {/* Content sections — no card wrappers */}
      <section className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pipeline comercial</h2>
          <div className="space-y-4">
            {(() => {
              const stagesWithTotals = store.pipelineStages.map((stage) => {
                const deals = store.deals.filter((deal) => deal.stage_id === stage.id)
                const total = deals.reduce((sum, deal) => sum + deal.value_eur, 0)
                return { stage, deals, total }
              })
              const maxTotal = Math.max(...stagesWithTotals.map((s) => s.total), 1)
              return stagesWithTotals.map(({ stage, deals, total }) => (
                <div key={stage.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{stage.name}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {deals.length} · {money.format(total)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.round((total / maxTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Actividad reciente</h2>
          <div className="space-y-0 divide-y divide-border">
            {store.activityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-3 first:pt-0">
                <div className="mt-0.5 shrink-0 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-foreground">{String(log.metadata.label ?? log.action)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(log.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function Kpi({ title, value, icon, trend }: { title: string; value: string | number; icon: React.ReactNode; trend?: number }) {
  const isPositive = (trend ?? 0) >= 0
  return (
    <div className="flex items-center justify-between bg-background px-5 py-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        {trend !== undefined && (
          <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? '+' : ''}{trend}% mes anterior
          </p>
        )}
      </div>
      <div className="text-muted-foreground/40">
        <span className="[&>svg]:h-8 [&>svg]:w-8">{icon}</span>
      </div>
    </div>
  )
}
