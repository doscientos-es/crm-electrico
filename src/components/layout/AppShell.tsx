import { Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { appBrand, navItems } from '../../config/nav'
import { initials } from '../../lib/utils'
import { useDemoStore } from '../../store/demo-store'
import { Button } from '../ui/button'

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const BrandIcon = appBrand.icon
  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-600 text-white">
          <BrandIcon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-950">{appBrand.name}</p>
          <p className="text-xs text-slate-500">{appBrand.description}</p>
        </div>
      </div>
      <nav className="grid gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={({ isActive }) =>
                [
                  'focus-ring flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
                  isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export function AppShell() {
  const { currentUser, organization, logout } = useDemoStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const currentNav = navItems.find((item) => location.pathname.startsWith(item.href))

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-950/40"
            aria-label="Cerrar navegacion"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative h-full">
            <Sidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir navegacion">
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Cartera centralizada</p>
              <h1 className="text-lg font-semibold text-slate-950">{currentNav?.label ?? 'Dashboard'}</h1>
            </div>
          </div>
          <div className="hidden min-h-10 w-full max-w-md items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 md:flex">
            <Search className="h-4 w-4" />
            Buscar clientes, DNI, empresa o renovacion
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-950">{currentUser.full_name}</p>
              <p className="text-xs text-slate-500">
                {organization.name} · {currentUser.role}
              </p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
              {initials(currentUser.full_name)}
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>
              Salir
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
