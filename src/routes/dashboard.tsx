import { Activity, CalendarClock, CheckCircle2, FileSignature, FileText, RefreshCcw, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { contractStatusLabels } from '../config/constants'
import { getDaysToRenewal, getRenewalStage } from '../lib/customer-workflow'
import { useContracts } from '../services/contracts.service'
import { useCustomers } from '../services/customers.service'

const renewalStageStyle: Record<string, { label: string; className: string }> = {
  overdue: { label: 'Vencido', className: 'text-destructive' },
  urgent: { label: 'Urgente', className: 'text-amber-500' },
  due: { label: 'Contactar', className: 'text-primary' },
  scheduled: { label: 'Programado', className: 'text-muted-foreground' },
}

export function DashboardRoute() {
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: contracts = [] } = useContracts()

  const customers = customersResult?.data ?? []

  const contractStats = useMemo(() => {
    const byStatus: Record<string, number> = {}
    for (const key of Object.keys(contractStatusLabels)) byStatus[key] = 0
    for (const c of contracts) byStatus[c.status] = (byStatus[c.status] ?? 0) + 1
    const active = byStatus.active ?? 0
    const pendingSignature = byStatus.pending_signature ?? 0
    return { total: contracts.length, active, pendingSignature, byStatus }
  }, [contracts])

  const kpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const thisMonth = today.slice(0, 7)
    const activeCount = customers.filter((c) => c.status === 'active' || c.status === 'renewed').length
    const urgentCount = customers.filter((c) => ['due', 'urgent', 'overdue'].includes(getRenewalStage(c))).length
    const thisMonthCount = customers.filter((c) => c.renewal_date?.startsWith(thisMonth)).length
    const renewedThisMonthCount = customers.filter((c) => c.status === 'renewed' && c.renewal_date?.startsWith(thisMonth)).length
    return { activeCount, urgentCount, thisMonthCount, renewedThisMonthCount }
  }, [customers])

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
        <Kpi title="Renovados este mes" value={kpis.renewedThisMonthCount} icon={<RefreshCcw />} />
      </section>

      {/* Contract KPIs */}
      <section className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border xl:grid-cols-3">
        <Kpi title="Contratos totales" value={contractStats.total} icon={<FileText />} />
        <Kpi title="Contratos activos" value={contractStats.active} icon={<CheckCircle2 />} />
        <Kpi title="Pendientes de firma" value={contractStats.pendingSignature} icon={<FileSignature />} />
      </section>

      {/* Contract state breakdown */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Contratos por estado</h2>
        <div className="flex flex-wrap gap-x-8 gap-y-4 rounded-lg border border-border bg-card px-5 py-4">
          {Object.entries(contractStatusLabels).map(([value, label]) => (
            <div key={value} className="flex items-center gap-2">
              <StatusBadge value={label} />
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {contractStats.byStatus[value] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <section>
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
