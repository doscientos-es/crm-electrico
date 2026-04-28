import { Tabs as TabsPrimitive } from 'radix-ui'
import { type ComponentPropsWithoutRef, type ElementRef, type ReactNode, forwardRef } from 'react'
import { cn } from '../../lib/utils'

// ── Primitives ────────────────────────────────────────────────────────────────

export const TabsRoot = TabsPrimitive.Root

export const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = 'TabsList'

export const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'focus-ring inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow [&_svg]:size-4 [&_svg]:shrink-0',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = 'TabsTrigger'

export const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn('mt-2 focus-visible:outline-none', className)}
    {...props}
  />
))
TabsContent.displayName = 'TabsContent'

// ── Compound helper ───────────────────────────────────────────────────────────

export type TabDef = { value: string; label: string; icon?: ReactNode; content: ReactNode }

export function Tabs({
  value,
  onValueChange,
  tabs,
  className,
}: {
  value: string
  onValueChange: (value: string) => void
  tabs: TabDef[]
  className?: string
}) {
  return (
    <TabsRoot value={value} onValueChange={onValueChange} className={cn('w-full', className)}>
      <TabsList className="mb-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.icon}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </TabsRoot>
  )
}
