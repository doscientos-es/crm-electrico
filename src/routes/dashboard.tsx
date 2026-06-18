import { Activity, AlertTriangle, Ban, CalendarClock, CheckCircle2, ClipboardList, FileSignature, FileText, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import logoDarkUrl from '../assets/media/logo-dark.png'
import logoUrl from '../assets/media/logo.png'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { appBrand } from '../config/nav'
import { getContractRenewalStage, getDaysToContractEnd } from '../lib/customer-workflow'
import { useContracts } from '../services/contracts.service'
import { useCustomers } from '../services/customers.service'
import { useIncidents } from '../services/incidents.service'

const renewalStageStyle: Record<string, { label: string; className: string }> = {
  overdue: { label: 'Vencido', className: 'text-destructive' },
  urgent: { label: 'Urgente', className: 'text-amber-500' },
  due: { label: 'Contactar', className: 'text-primary' },
}

export function DashboardRoute() {
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: contracts = [] } = useContracts()
  const { data: openIncidents = [] } = useIncidents()

  const contractStats = useMemo(() => {
    const active = contracts.filter((c) => c.status === 'active').length
    const pendingSignature = contracts.filter((c) => c.status === 'pending_signature').length
    const pendingProcessing = contracts.filter((c) => c.status === 'pending_processing').length
    return { total: contracts.length, active, pendingSignature, pendingProcessing }
  }, [contracts])

  const kpis = useMemo(() => {
    const customers = customersResult?.data ?? []
    const thisMonth = new Date().toISOString().slice(0, 7)
    const activeCount = customers.filter((c) => c.status === 'active').length
    const activeContracts = contracts.filter((c) => c.status === 'active' && c.ends_at)
    const urgentCount = activeContracts.filter((c) => ['overdue', 'urgent'].includes(getContractRenewalStage(c))).length
    const thisMonthCount = activeContracts.filter((c) => c.ends_at?.startsWith(thisMonth)).length
    const terminatedCount = contracts.filter((c) => c.status === 'terminated').length
    return { activeCount, urgentCount, thisMonthCount, terminatedCount }
  }, [customersResult, contracts])

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

  const terminatedContracts = useMemo(
    () => contracts.filter((c) => c.status === 'terminated').slice(0, 6),
    [contracts],
  )

  return (
    <div className="space-y-8">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#06231f] px-6 py-8 shadow-xl md:px-10 md:py-10">
        {/* Background gradients */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.35),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(16,185,129,0.22),transparent_32%),linear-gradient(132deg,transparent_0_46%,rgba(255,255,255,0.09)_46%_46.6%,transparent_46.6%_52%,rgba(255,255,255,0.06)_52%_52.5%,transparent_52.5%)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-[-30%] h-[50%] -rotate-2 bg-[linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.07)_1px,transparent_1px)] bg-[size:64px_48px] opacity-60"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,35,31,0.05),rgba(6,35,31,0.65))]" aria-hidden />

        <div className="relative flex flex-wrap items-center gap-6">
          <img
            src={logoUrl}
            alt={`Logo de ${appBrand.name}`}
            className="h-auto w-36 shrink-0 rounded-lg object-contain drop-shadow-md md:w-44 dark:hidden"
          />
          <img
            src={logoDarkUrl}
            alt={`Logo de ${appBrand.name}`}
            className="h-auto w-36 shrink-0 rounded-lg object-contain drop-shadow-md md:w-44 hidden dark:block"
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
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-sky-200/80 bg-sky-200/60 dark:border-sky-800/40 dark:bg-sky-900/20 sm:grid-cols-3 xl:grid-cols-5">
        <Kpi title="Clientes activos" value={kpis.activeCount} icon={<Activity />} href="/customers?status=active" cellBg="bg-sky-50 hover:bg-sky-100/70 dark:bg-sky-950/50 dark:hover:bg-sky-900/50" />
        <Kpi title="Contratos urgentes" value={kpis.urgentCount} icon={<CalendarClock />} href="/renewals" cellBg="bg-sky-50 hover:bg-sky-100/70 dark:bg-sky-950/50 dark:hover:bg-sky-900/50" />
        <Kpi title="Vencen este mes" value={kpis.thisMonthCount} icon={<Users />} href="/renewals" cellBg="bg-sky-50 hover:bg-sky-100/70 dark:bg-sky-950/50 dark:hover:bg-sky-900/50" />
        <Kpi title="Incidencias abiertas" value={openIncidents.length} icon={<AlertTriangle />} highlight={openIncidents.length > 0 ? 'danger' : undefined} href="/incidents" cellBg="bg-sky-50 hover:bg-sky-100/70 dark:bg-sky-950/50 dark:hover:bg-sky-900/50" />
        <Kpi title="Contratos en baja" value={kpis.terminatedCount} icon={<Ban />} highlight={kpis.terminatedCount > 0 ? 'warning' : undefined} href="/contracts?status=terminated" cellBg="bg-sky-50 hover:bg-sky-100/70 dark:bg-sky-950/50 dark:hover:bg-sky-900/50" />
      </section>

      {/* KPIs — Contratos */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-violet-200/80 bg-violet-200/60 dark:border-violet-800/40 dark:bg-violet-900/20 xl:grid-cols-4">
        <Kpi title="Contratos totales" value={contractStats.total} icon={<FileText />} href="/contracts" cellBg="bg-violet-50 hover:bg-violet-100/70 dark:bg-violet-950/50 dark:hover:bg-violet-900/50" />
        <Kpi title="Contratos activos" value={contractStats.active} icon={<CheckCircle2 />} href="/contracts?status=active" cellBg="bg-violet-50 hover:bg-violet-100/70 dark:bg-violet-950/50 dark:hover:bg-violet-900/50" />
        <Kpi title="Pendientes de firma" value={contractStats.pendingSignature} icon={<FileSignature />} href="/contracts?status=pending_signature" cellBg="bg-violet-50 hover:bg-violet-100/70 dark:bg-violet-950/50 dark:hover:bg-violet-900/50" />
        <Kpi title="Pendientes de tramitar" value={contractStats.pendingProcessing} icon={<ClipboardList />} highlight={contractStats.pendingProcessing > 0 ? 'warning' : undefined} href="/contracts?status=pending_processing" cellBg="bg-violet-50 hover:bg-violet-100/70 dark:bg-violet-950/50 dark:hover:bg-violet-900/50" />
      </section>

      {/* Contratos en baja */}
      {terminatedContracts.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-destructive" />
              <h2 className="text-sm font-semibold text-foreground">Contratos en baja</h2>
              <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                {kpis.terminatedCount}
              </span>
            </div>
            <Button asChild size="sm" variant="ghost">
              <Link to="/contracts?status=terminated">Ver todos</Link>
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border border-destructive/20 bg-destructive/5 divide-y divide-destructive/10 max-h-80 overflow-y-auto">
            {terminatedContracts.map((contract) => (
              <Link
                key={contract.id}
                to={`/customers/${contract.customer_id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-colors"
              >
                <Ban className="h-4 w-4 shrink-0 text-destructive/60" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{contract.cups ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">{contract.provider ?? '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-destructive">Baja</p>
                  {contract.ends_at && (
                    <p className="text-xs text-muted-foreground">{contract.ends_at.slice(0, 10)}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
