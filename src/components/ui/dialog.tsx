import { X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'
import { Button } from './button'

export function Dialog({
  open,
  onOpenChange,
  title,
  trigger,
  children,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  trigger?: ReactNode
  children: ReactNode
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger> : null}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-950/40" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 grid max-h-[90dvh] w-[calc(100vw-24px)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
            <DialogPrimitive.Title className="text-base font-semibold text-slate-950">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar dialogo">
                <X className="h-4 w-4" />
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="p-5">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
