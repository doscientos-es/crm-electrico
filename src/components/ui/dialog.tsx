import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'

const sizeClasses: Record<DialogSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'w-[min(96vw,1100px)] max-w-none',
}

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl'

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  trigger,
  children,
  size = 'md',
  className,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description?: string
  trigger?: ReactNode
  children: ReactNode
  size?: DialogSize
  className?: string
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="animate-fade-in fixed inset-0 z-40 bg-black/50" />
        <DialogPrimitive.Content
          className={cn(
            'animate-zoom-in fixed left-1/2 top-1/2 z-50 grid max-h-[90dvh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl border border-border bg-background shadow-xl',
            sizeClasses[size],
            className,
          )}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
            <div>
              <DialogPrimitive.Title className="text-base font-semibold leading-none text-foreground">{title}</DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar">
                <X />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="p-6">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
