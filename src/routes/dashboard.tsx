import { Activity, CalendarClock, CheckCircle2, FileSignature, FileText, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { getContractRenewalStage, getDaysToContractEnd } from '../lib/customer-workflow'
import { useContracts } from '../services/contracts.service'
import { useCustomers } from '../services/customers.service'

const renewalStageStyle: Record<string, { label: string; className: string }> = {
  overdue: { label: 'Vencido', className: 'text-destructive' },
  urgent: { label: 'Urgente', className: 'text-amber-500' },
  due: { label: 'Contactar', className: 'text-primary' },
}

export function DashboardRoute() {
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: contracts = [] } = useContracts()

  const customers = customersResult?.data ?? []

  const contractStats = useMemo(() => {
    const active = contracts.filter((c) => c.status === 'active').length
    const pendingSignature = contracts.filter((c) => c.status === 'pending_signature').length
    return { total: contracts.length, active, pendingSignature }
  }, [contracts])

  const kpis = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7)
    const activeCount = customers.filter((c) => c.status === 'active').length
    const activeContracts = contracts.filter((c) => c.status === 'active' && c.ends_at)
    const urgentCount = activeContracts.filter((c) => ['overdue', 'urgent'].includes(getContractRenewalStage(c))).length
    const thisMonthCount = activeContracts.filter((c) => c.ends_at?.startsWith(thisMonth)).length
    return { activeCount, urgentCount, thisMonthCount }
  }, [customers, contracts])

  const urgentRenewals = useMemo(
    () =>
      contracts
        .filter((c) => c.status === 'active' && c.ends_at)
        .map((c) => ({ contract: c, stage: getContractRenewalStage(c), days: getDaysToContractEnd(c) }))
        .filter(({ stage }) => ['overdue', 'urgent', 'due'].includes(stage))
        .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
        .slice(0, 6),
    [contracts],
  )

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cartera y renovaciones"
        description="Vista central de clientes, contratos y vencimientos próximos."
        action={
          <Button asChild>
            <Link to="/renewals">Ver cola de renovacion</Link>
          </Button>
        }
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border xl:grid-cols-3">
        <Kpi title="Clientes activos" value={kpis.activeCount} icon={<Activity />} />
        <Kpi title="Contratos urgentes" value={kpis.urgentCount} icon={<CalendarClock />} />
        <Kpi title="Vencen este mes" value={kpis.thisMonthCount} icon={<Users />} />
      </section>

      {/* Contract KPIs */}
      <section className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border xl:grid-cols-3">
        <Kpi title="Contratos totales" value={contractStats.total} icon={<FileText />} />
        <Kpi title="Contratos activos" value={contractStats.active} icon={<CheckCircle2 />} />
        <Kpi title="Pendientes de firma" value={contractStats.pendingSignature} icon={<FileSignature />} />
      </section>

      {/* Urgent contract renewals */}
      <section>
        {urgentRenewals.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Contratos próximos a vencer</h2>
              <Button asChild size="sm" variant="ghost">
                <Link to="/renewals">Ver todas</Link>
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
              {urgentRenewals.map(({ contract, stage, days }) => {
                const style = renewalStageStyle[stage] ?? renewalStageStyle.due
                return (
                  <Link key={contract.id} to={`/customers/${contract.customer_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{contract.contract_number ?? contract.cups ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{contract.provider ?? '—'}</p>
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
