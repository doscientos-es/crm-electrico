import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '../components/ui/tooltip'
import { ThemeProvider } from '../hooks/use-theme'
import { DemoStoreProvider } from '../store/demo-store'
import { queryClient } from './query-client'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <DemoStoreProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </TooltipProvider>
        </DemoStoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
