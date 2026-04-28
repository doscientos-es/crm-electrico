import { cn } from '../../lib/utils'

/* ── Primitive ── */
function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}

/* ── Text lines ── */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('grid gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Bone key={i} className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  )
}

/* ── KPI Card ── */
export function SkeletonKpi() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <Bone className="h-3.5 w-28" />
          <Bone className="h-7 w-20" />
          <Bone className="h-3 w-16" />
        </div>
        <Bone className="h-11 w-11 rounded-md" />
      </div>
    </div>
  )
}

/* ── Table rows ── */
export function SkeletonTableRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Bone className={cn('h-4', c === 0 ? 'w-32' : 'w-20')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/* ── Full page skeleton: header + KPIs + table ── */
export function PageSkeleton({ kpis = 4, tableRows = 6, tableCols = 5 }: { kpis?: number; tableRows?: number; tableCols?: number }) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Bone className="h-7 w-48" />
          <Bone className="h-4 w-72" />
        </div>
        <Bone className="h-10 w-32 rounded-lg" />
      </div>

      {/* KPI row */}
      {kpis > 0 && (
        <div className={`grid gap-4 md:grid-cols-2 xl:grid-cols-${kpis}`}>
          {Array.from({ length: kpis }).map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-4 py-3 border-b border-border">
          <Bone className="h-4 w-40" />
        </div>
        <table className="w-full">
          <tbody>
            <SkeletonTableRows rows={tableRows} cols={tableCols} />
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Sidebar nav skeleton ── */
export function SkeletonNav({ items = 7 }: { items?: number }) {
  return (
    <div className="grid gap-1 p-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md px-3 py-2.5">
          <Bone className="h-4 w-4 shrink-0" />
          <Bone className="h-4 flex-1" />
        </div>
      ))}
    </div>
  )
}
