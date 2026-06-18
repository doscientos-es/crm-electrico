import { Menu, Search, Settings } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import logo from '../../assets/media/logo.png'
import { appBrand, navItems } from '../../config/nav'
import { useAuth } from '../../features/auth/AuthContext'
import { cn } from '../../lib/utils'
import { useOrganization } from '../../services/organization.service'
import { ErrorBoundary } from '../feedback/ErrorBoundary'
import { PageSkeleton } from '../feedback/Skeleton'
import { Button } from '../ui/button'
import { DialogOverlay, DialogPortal, DialogRoot } from '../ui/dialog'
import { Separator } from '../ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { CommandPalette } from './CommandPalette'
import { ThemeToggleButton } from './ThemeToggleButton'
import { UserMenu } from './UserMenu'

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, signOut } = useAuth()
  const { data: organization } = useOrganization()

  return (
    <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border/60">
      {/* Brand */}
      <Link to="/dashboard" className="flex h-16 shrink-0 items-center px-4 transition-opacity hover:opacity-80">
        <img src={logo} alt={appBrand.name} className="h-auto max-h-11 w-full rounded-md object-contain" />
      </Link>

      <Separator className="mx-4 w-auto bg-sidebar-border/50" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {navItems.filter((item) => item.enabled !== false).map((item) => {
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {/* span wrapper avoids passing asChild to NavLink which has a function className
                        — Radix Slot would stringify it, stripping all Tailwind classes */}
                    <span className="block">
                      <NavLink
                        to={item.href}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                          cn(
                            'group focus-ring relative flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-all duration-150',
                            isActive
                              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0 transition-transform duration-150',
                                isActive ? 'scale-105' : 'group-hover:scale-105',
                              )}
                            />
                            <span className="flex-1 truncate">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="flex-col items-start gap-0.5 max-w-56">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-background/70">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer — user menu */}
      <Separator className="mx-4 w-auto bg-sidebar-border/50" />
      <div className="m-3 flex items-center gap-2">
        <UserMenu
          fullName={profile?.full_name ?? ''}
          email={profile?.email ?? ''}
          role={profile?.role ?? 'viewer'}
          organizationName={organization?.name ?? ''}
          onLogout={signOut}
        />
      </div>
    </div>
  )
}

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const location = useLocation()
  const currentNav = navItems.find((item) => location.pathname.startsWith(item.href))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer via Radix Dialog */}
      <DialogRoot open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogPortal>
          <DialogOverlay className="animate-fade-in fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" />
          <div
            aria-label="Menu de navegacion"
            className="animate-slide-in-left fixed inset-y-0 left-0 z-50 w-64 shadow-2xl shadow-black/10 lg:hidden"
          >
            <SidebarContent onNavigate={() => setDrawerOpen(false)} />
          </div>
        </DialogPortal>
      </DialogRoot>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border/60 bg-background/90 px-4 backdrop-blur-md">
          {/* Left — mobile menu + page title */}
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setDrawerOpen(true)} aria-label="Abrir menu">
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="truncate text-sm font-semibold text-foreground">{currentNav?.label ?? 'Dashboard'}</h1>
          </div>

          {/* Center — search */}
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="focus-ring hidden h-9 w-full max-w-xs cursor-text items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex"
            >
              <Search className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">Buscar...</span>
              <kbd className="pointer-events-none flex h-5 select-none items-center rounded-md border border-border/60 bg-background px-1.5 font-mono text-[10px]">
                ⌘K
              </kbd>
            </button>
          </div>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

          {/* Right — actions */}
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggleButton />
            {/* Mobile search */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setPaletteOpen(true)} aria-label="Buscar">
              <Search className="h-4 w-4" />
            </Button>
            {/* Settings shortcut */}
            <Button variant="ghost" size="icon" asChild aria-label="Ajustes">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-screen-2xl p-4 md:p-6">
          <ErrorBoundary level="page">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
