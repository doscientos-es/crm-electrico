import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

export type BadgeTone = 'default' | 'secondary' | 'destructive' | 'outline' | 'emerald' | 'sky' | 'amber' | 'violet'

export function Badge({
  children,
  tone = 'default',
  dot,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        tone === 'default' && 'border-transparent bg-primary text-primary-foreground',
        tone === 'secondary' && 'border-transparent bg-secondary text-secondary-foreground',
        tone === 'destructive' && 'border-transparent bg-destructive text-destructive-foreground',
        tone === 'outline' && 'border-border text-foreground',
        tone === 'emerald' && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-400',
        tone === 'sky' && 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/60 dark:text-sky-400',
        tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/60 dark:text-amber-400',
        tone === 'violet' && 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/60 dark:text-violet-400',
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" aria-hidden />
      )}
      {children}
    </span>
  )
}

/** Lightweight icon wrapper — renders a 16 × 16 svg slot inside a Badge */
export function BadgeIcon({ children }: { children: ReactNode }) {
  return <span className="-ml-0.5 [&_svg]:size-3">{children}</span>
}
