import { Activity, AlertTriangle, Ban, CalendarClock, CheckCircle2, ClipboardList, FileSignature, FileText, RotateCcw, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import logoUrl from '../assets/media/logo.png'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { appBrand } from '../config/nav'
import { getContractRenewalStage, getDaysToContractEnd } from '../lib/customer-workflow'
import { useContractStats, useContractsDueForRenewal } from '../services/contracts.service'
import { useCustomerCount } from '../services/customers.service'
import { useOpenIncidentsCount } from '../services/incidents.service'
import { dashboardContractKpis, type ContractKpiIcon } from './dashboard-kpis'

const renewalStageStyle: Record<string, { label: string; className: string }> = {
  overdue: { label: 'Vencido', className: 'text-destructive' },
  urgent: { label: 'Urgente', className: 'text-amber-500' },
  due: { label: 'Contactar', className: 'text-primary' },
}

const contractKpiIcons: Record<ContractKpiIcon, React.ReactNode> = {
  total: <FileText />,
  active: <CheckCircle2 />,
  signature: <FileSignature />,
  processing: <ClipboardList />,
  incident: <AlertTriangle />,
  recovery: <RotateCcw />,
  cancelled: <Ban />,
  terminated: <Ban />,
}

export function DashboardRoute() {
  const { data: activeCustomerCount = 0 } = useCustomerCount({ status: 'active' })
  const { data: openIncidentsCount = 0 } = useOpenIncidentsCount()
  const { data: renewalContracts = [] } = useContractsDueForRenewal(60)
  const {
    data: contractStats = {
      total: 0,
      active: 0,
      processing: 0,
      pendingSignature: 0,
      pendingProcessing: 0,
      incident: 0,
      pendingRecovery: 0,
      cancelled: 0,
      terminated: 0,
      urgentRenewals: 0,
      thisMonthEnding: 0,
    },
  } = useContractStats()

  const kpis = useMemo(() => {
    return {
      activeCount: activeCustomerCount,
      urgentCount: contractStats.urgentRenewals,
      thisMonthCount: contractStats.thisMonthEnding,
      incidents: openIncidentsCount,
    }
  }, [activeCustomerCount, contractStats, openIncidentsCount])

  const urgentRenewals = useMemo(
    () =>
      renewalContracts
        .map((c) => ({ contract: c, stage: getContractRenewalStage(c), days: getDaysToContractEnd(c) }))
        .filter(({ stage }) => ['urgent', 'due'].includes(stage))
        .sort((a, b) => (a.days ?? 999) - (b.days ?? 999))
        .slice(0, 6),
    [renewalContracts],
  )



  return (
    <div className="space-y-8 h-full overflow-y-auto">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#5c1a17] px-6 py-8 shadow-xl md:px-10 md:py-10">
        {/* Background gradients */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.3),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(243,115,108,0.3),transparent_32%),linear-gradient(132deg,transparent_0_46%,rgba(255,255,255,0.08)_46%_46.6%,transparent_46.6%_52%,rgba(255,255,255,0.05)_52%_52.5%,transparent_52.5%)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-[-30%] h-[50%] -rotate-2 bg-[linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:64px_48px] opacity-60"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(92,26,23,0.05),rgba(92,26,23,0.6))]" aria-hidden />

        <div className="relative flex flex-wrap items-center gap-6">
          <img
            src={logoUrl}
            alt={`Logo de ${appBrand.name}`}
            className="h-auto w-36 shrink-0 rounded-lg object-contain drop-shadow-md md:w-44 brightness-0 invert"
          />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-white md:text-2xl">{appBrand.name}</h2>
            <p className="mt-1 text-sm text-white/60">{appBrand.description} · Panel de gestión de cartera</p>
          </div>
          <div className="ml-auto shrink-0">
            <Button asChild className="bg-amber-400 text-amber-950 hover:bg-amber-300 font-semibold">
              <Link to="/renewals">Ver renovaciones</Link>
            </Button>
          </div>
        </div>
      </div>

      <PageHeader
        title="Cartera y renovaciones"
        description="Vista central de clientes, contratos y vencimientos próximos."
      />

      {/* KPIs — Cartera */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-rose-200/80 bg-rose-200/60 dark:border-rose-800/40 dark:bg-rose-900/20 sm:grid-cols-4">
        <Kpi title="Clientes activos" value={kpis.activeCount} icon={<Activity />} href="/customers?status=active" cellBg="bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-950/50 dark:hover:bg-rose-900/50" />
        <Kpi title="Contratos urgentes" value={kpis.urgentCount} icon={<CalendarClock />} href="/renewals?stage=urgent" cellBg="bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-950/50 dark:hover:bg-rose-900/50" />
        <Kpi title="Vencen este mes" value={kpis.thisMonthCount} icon={<Users />} href="/renewals" cellBg="bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-950/50 dark:hover:bg-rose-900/50" />
        <Kpi title="Incidencias abiertas" value={kpis.incidents} icon={<AlertTriangle />} highlight={kpis.incidents > 0 ? 'danger' : undefined} href="/incidents" cellBg="bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-950/50 dark:hover:bg-rose-900/50" />
      </section>

      {/* KPIs — Contratos */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-orange-200/80 bg-orange-200/60 dark:border-orange-800/40 dark:bg-orange-900/20 md:grid-cols-3 xl:grid-cols-9">
        {dashboardContractKpis.map((item) => {
          const value = contractStats[item.metric]
          return (
            <Kpi
              key={item.metric}
              title={item.title}
              value={value}
              icon={contractKpiIcons[item.icon]}
              highlight={item.highlight && value > 0 ? item.highlight : undefined}
              href={item.href}
              cellBg="bg-orange-50 hover:bg-orange-100/70 dark:bg-orange-950/50 dark:hover:bg-orange-900/50"
            />
          )
        })}
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
            <div className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border max-h-80 overflow-y-auto">
              {urgentRenewals.map(({ contract, stage, days }) => {
                const style = renewalStageStyle[stage] ?? renewalStageStyle.due
                return (
                  <Link key={contract.id} to={`/customers/${contract.customer_id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{contract.cups ?? '—'}</p>
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

function Kpi({ title, value, icon, trend, highlight, href, cellBg }: { title: string; value: string | number; icon: React.ReactNode; trend?: number; highlight?: 'warning' | 'danger'; href?: string; cellBg?: string }) {
  const isPositive = (trend ?? 0) >= 0
  const valueClass = highlight === 'danger' ? 'text-destructive' : highlight === 'warning' ? 'text-amber-500' : 'text-foreground'
  const baseBg = cellBg ?? 'bg-background'
  const content = (
    <>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
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
    </>
  )

  if (href) {
    return (
      <Link to={href} className={`flex items-center justify-between px-5 py-5 transition-colors ${baseBg}`}>
        {content}
      </Link>
    )
  }

  return (
    <div className={`flex items-center justify-between px-5 py-5 ${baseBg}`}>
      {content}
    </div>
  )
}
