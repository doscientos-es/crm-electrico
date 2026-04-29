import { Activity, CalendarClock, CheckCircle2, Clock, FileText, Phone, TrendingDown, TrendingUp, Users, Wrench } from 'lucide-react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { getDaysToRenewal, getRenewalStage, getVisibleCustomers } from '../lib/customer-workflow'
import { relativeTime } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

const entityIcons: Record<string, ReactNode> = {
  customer: <Users className="h-3.5 w-3.5" />,
  deal: <TrendingUp className="h-3.5 w-3.5" />,
  contract: <FileText className="h-3.5 w-3.5" />,
  task: <CheckCircle2 className="h-3.5 w-3.5" />,
  installation: <Wrench className="h-3.5 w-3.5" />,
  proposal: <FileText className="h-3.5 w-3.5" />,
}

const renewalStageStyle: Record<string, { label: string; className: string }> = {
  overdue: { label: 'Vencido', className: 'text-destructive' },
  urgent: { label: 'Urgente', className: 'text-amber-500' },
  due: { label: 'Contactar', className: 'text-primary' },
  scheduled: { label: 'Programado', className: 'text-muted-foreground' },
}

export function DashboardRoute() {
  const store = useDemoStore()

  const visibleCustomers = useMemo(
    () => getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role),
    [store.customers, store.currentUser.id, store.currentUser.role],
  )

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const thisMonth = today.slice(0, 7) // 'YYYY-MM'
    const activeCount = visibleCustomers.filter((c) => c.status === 'active' || c.status === 'renewed').length
    const urgentCount = visibleCustomers.filter((c) => ['due', 'urgent', 'overdue'].includes(getRenewalStage(c))).length
    const thisMonthCount = visibleCustomers.filter((c) => c.renewal_date?.startsWith(thisMonth)).length
    const contactedTodayCount = visibleCustomers.filter((c) => c.last_contact_at?.startsWith(today)).length
    return { activeCount, urgentCount, thisMonthCount, contactedTodayCount }
  }, [visibleCustomers])

  const urgentRenewals = useMemo(
    () =>
      visibleCustomers
        .map((c) => ({ customer: c, stage: getRenewalStage(c), days: getDaysToRenewal(c) }))
        .filter(({ stage }) => ['overdue', 'urgent', 'due'].includes(stage))
        .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
        .slice(0, 6),
    [visibleCustomers],
  )

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

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border xl:grid-cols-4">
        <Kpi title="Clientes activos" value={kpis.activeCount} icon={<Activity />} />
        <Kpi title="Renovaciones urgentes" value={kpis.urgentCount} icon={<CalendarClock />} />
        <Kpi title="Renovaciones este mes" value={kpis.thisMonthCount} icon={<Users />} />
        <Kpi title="Contactados hoy" value={kpis.contactedTodayCount} icon={<Phone />} />
      </section>

      {/* Main content */}
      <section className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
        {/* Left column: renewals */}
        <div className="space-y-8">
          {urgentRenewals.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Renovaciones urgentes</h2>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/renewals">Ver todas</Link>
                </Button>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
                {urgentRenewals.map(({ customer, stage, days }) => {
                  const style = renewalStageStyle[stage] ?? renewalStageStyle.due
                  return (
                    <Link key={customer.id} to={`/customers/${customer.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">{customer.products_services.join(', ') || 'Sin servicios'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-semibold ${style.className}`}>{style.label}</p>
                        <p className="text-xs text-muted-foreground">{typeof days === 'number' ? (days < 0 ? `${Math.abs(days)}d vencido` : `${days}d`) : '-'}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right column: activity */}
        <div className="space-y-8">
          <div>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Actividad reciente</h2>
            <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
              {store.activityLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 shrink-0 text-muted-foreground">
                    {entityIcons[log.entity_type] ?? <Clock className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{String(log.metadata.label ?? log.action)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{relativeTime(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
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
