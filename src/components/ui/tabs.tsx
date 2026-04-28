import { Tabs as TabsPrimitive } from 'radix-ui'
import type { ReactNode } from 'react'

export function Tabs({
  value,
  onValueChange,
  tabs,
}: {
  value: string
  onValueChange: (value: string) => void
  tabs: Array<{ value: string; label: string; content: ReactNode }>
}) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.value}
            value={tab.value}
            className="focus-ring min-h-10 rounded-md px-3 text-sm font-medium text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {tabs.map((tab) => (
        <TabsPrimitive.Content key={tab.value} value={tab.value}>
          {tab.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  )
}
