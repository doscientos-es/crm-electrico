import { Slot } from 'radix-ui'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'icon'
  asChild?: boolean
  children: ReactNode
}

export function Button({ className, variant = 'primary', size = 'md', asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      className={cn(
        'focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md border font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700',
        variant === 'secondary' && 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
        variant === 'ghost' && 'border-transparent bg-transparent text-slate-700 hover:bg-slate-100',
        variant === 'danger' && 'border-red-600 bg-red-600 text-white hover:bg-red-700',
        size === 'sm' && 'min-h-9 px-3 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'icon' && 'h-11 w-11 p-0',
        className,
      )}
      {...props}
    />
  )
}
