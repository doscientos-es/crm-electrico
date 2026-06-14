import { Activity, CalendarClock, CheckCircle2, Clock, FileText, Phone, TrendingDown, TrendingUp, Users, Wrench } from 'lucide-react'
import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { useRecentActivity } from '../services/activity.service'
import { useCustomers } from '../services/customers.service'
import { useContracts } from '../services/contracts.service'
import { useIncidents } from '../services/incidents.service'
import { contractStatusLabels } from '../config/constants'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { getDaysToRenewal, getRenewalStage } from '../lib/customer-workflow'
import { relativeTime } from '../lib/formatters'

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
  const { data: customersResult, isLoading: customersLoading } = useCustomers({ pageSize: 500 })
  const { data: recentActivity } = useRecentActivity(8)
  const { data: contracts = [] } = useContracts()
  const { data: incidents = [] } = useIncidents()

  const customers = useMemo(() => customersResult?.data ?? [], [customersResult?.data])

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const thisMonth = today.slice(0, 7)
    const activeCount = customers.filter((c) => c.status === 'active' || c.status === 'renewed').length
    const urgentCount = customers.filter((c) => ['due', 'urgent', 'overdue'].includes(getRenewalStage(c))).length
    const thisMonthCount = customers.filter((c) => c.renewal_date?.startsWith(thisMonth)).length
    const contactedTodayCount = customers.filter((c) => c.last_contact_at?.startsWith(today)).length
    const openIncidents = incidents.filter((item) => !['RESOLVED', 'CLOSED'].includes(item.status)).length
    const urgentIncidents = incidents.filter((item) => item.priority === 'URGENT' && !['RESOLVED', 'CLOSED'].includes(item.status)).length
    const activeContracts = contracts.filter((item) => item.status === 'ACTIVE').length
    const pendingSignature = contracts.filter((item) => item.status === 'PENDING_SIGNATURE').length
    const processing = contracts.filter((item) => item.status === 'PROCESSING').length
    const pendingProcessing = contracts.filter((item) => item.status === 'PENDING_PROCESSING').length
    return { activeCount, urgentCount, thisMonthCount, contactedTodayCount, openIncidents, urgentIncidents, activeContracts, pendingSignature, processing, pendingProcessing }
  }, [customers, contracts, incidents])

  const contractsByStatus = useMemo(
    () => Object.fromEntries(Object.keys(contractStatusLabels).map((status) => [status, contracts.filter((item) => item.status === status).length])),
    [contracts],
  )

  const urgentRenewals = useMemo(
    () =>
      customers
        .map((c) => ({ customer: c, stage: getRenewalStage(c), days: getDaysToRenewal(c) }))
        .filter(({ stage }) => ['overdue', 'urgent', 'due'].includes(stage))
        .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
        .slice(0, 6),
    [customers],
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

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Contratos por estado</h2>
          <Button asChild size="sm" variant="ghost"><Link to="/contracts">Ver contratos</Link></Button>
        </div>
        <div className="grid overflow-hidden rounded-lg border border-border bg-card divide-y divide-border sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-5">
          {Object.entries(contractStatusLabels).map(([status, label]) => (
            <Link key={status} to={`/contracts?status=${status}`} className="flex items-center justify-between gap-3 px-4 py-4 transition-colors hover:bg-muted/50">
              <StatusBadge value={label} />
              <span className="text-xl font-semibold tabular-nums">{contractsByStatus[status] ?? 0}</span>
            </Link>
          ))}
        </div>
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
              {(recentActivity ?? []).map((log) => (
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
              {!recentActivity?.length && !customersLoading && (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">Sin actividad reciente.</p>
              )}
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
