import { Tooltip as TooltipPrimitive } from 'radix-ui'
import { type ComponentPropsWithoutRef, type ElementRef, type ReactNode, forwardRef } from 'react'
import { cn } from '../../lib/utils'

// Re-export provider for app-level wrapping
export const TooltipProvider = TooltipPrimitive.Provider
export const TooltipRoot = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md animate-fade-in',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = 'TooltipContent'

/** Convenience wrapper: <Tooltip tip="Texto"><Button /></Tooltip> */
export function Tooltip({
  tip,
  children,
  side,
  delayDuration = 400,
}: {
  tip: ReactNode
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayDuration?: number
}) {
  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{tip}</TooltipContent>
    </TooltipRoot>
  )
}
