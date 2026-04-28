import { FileX2 } from 'lucide-react'
import {
  type HTMLAttributes,
  type ReactNode,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  forwardRef,
} from 'react'
import { cn } from '../../lib/utils'

// ── Primitives ────────────────────────────────────────────────────────────────

export const Tr = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }
>(({ className, hover = false, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(hover && 'cursor-default transition-colors hover:bg-accent/60', className)}
    {...props}
  />
))
Tr.displayName = 'Tr'

export type TdVariant = 'default' | 'primary' | 'muted' | 'mono'

export const Td = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement> & {
    variant?: TdVariant
    align?: 'left' | 'right' | 'center'
  }
>(({ className, variant = 'default', align = 'left', ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'px-4 py-3',
      variant === 'primary' && 'font-medium text-foreground',
      variant === 'muted' && 'text-muted-foreground',
      variant === 'mono' && 'font-mono text-xs text-muted-foreground',
      align === 'right' && 'text-right',
      align === 'center' && 'text-center',
      className,
    )}
    {...props}
  />
))
Td.displayName = 'Td'

export const Th = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }
>(({ className, align = 'left', ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'px-4 py-3 font-semibold',
      align === 'right' && 'text-right',
      align === 'center' && 'text-center',
      className,
    )}
    {...props}
  />
))
Th.displayName = 'Th'

export const TableHead = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn('bg-muted text-xs uppercase tracking-wide text-muted-foreground', className)}
      {...props}
    />
  ),
)
TableHead.displayName = 'TableHead'

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('divide-y divide-border', className)} {...props} />
  ),
)
TableBody.displayName = 'TableBody'

// ── ColDef — string (backward compat) or rich object ─────────────────────────

export type ColDef = string | { label: string; align?: 'left' | 'right' | 'center'; width?: string }

// ── DataTable compound ────────────────────────────────────────────────────────

export function DataTable({
  headers,
  children,
  className,
}: {
  headers: ColDef[]
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse text-left text-sm">
          <TableHead>
            <tr>
              {headers.map((header) => {
                const label = typeof header === 'string' ? header : header.label
                const align = typeof header === 'string' ? 'left' : (header.align ?? 'left')
                const width = typeof header === 'string' ? undefined : header.width
                return (
                  <Th key={label} align={align} style={width ? { width } : undefined}>
                    {label}
                  </Th>
                )
              })}
            </tr>
          </TableHead>
          <TableBody>{children}</TableBody>
        </table>
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="grid place-items-center rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <div className="max-w-sm">
        <div className="mb-3 flex justify-center text-muted-foreground/50 [&_svg]:size-10">
          {icon ?? <FileX2 />}
        </div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  )
}

/**
 * Muestra una ruta truncando el prefijo (directorio) y dejando visible el sufijo (nombre de archivo).
 * Útil para rutas largas en tablas donde lo importante está al final.
 *
 * @example <TruncatePath path="org/customer/docs/factura-2024.pdf" />
 * → org/customer/docs/  [truncado]  factura-2024.pdf
 */
export function TruncatePath({
  path,
  separator = '/',
  className,
}: {
  path: string
  separator?: string
  className?: string
}) {
  const lastIndex = path.lastIndexOf(separator)

  if (lastIndex === -1) {
    return <span className={cn('truncate font-mono text-xs', className)}>{path}</span>
  }

  const prefix = path.slice(0, lastIndex + 1)
  const suffix = path.slice(lastIndex + 1)

  return (
    <span className={cn('flex min-w-0 font-mono text-xs', className)}>
      <span className="min-w-0 truncate opacity-50">{prefix}</span>
      <span className="shrink-0">{suffix}</span>
    </span>
  )
}
