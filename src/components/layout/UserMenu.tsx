import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { useNavigate } from 'react-router-dom'
import { cn, initials } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'

export function UserMenu({
  fullName,
  email,
  role,
  organizationName,
  onLogout,
}: {
  fullName: string
  email: string
  role: string
  organizationName: string
  onLogout: () => void
}) {
  const navigate = useNavigate()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" size="sm" className="h-11 gap-3 rounded-full px-3">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/15">
            {initials(fullName)}
          </div>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-sm font-semibold leading-none text-foreground">{fullName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{organizationName}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-50 min-w-72 overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
        >
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
              <Badge tone="emerald" className="shrink-0 capitalize">
                {role}
              </Badge>
            </div>
          </div>

          <DropdownMenu.Separator className="my-2 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={() => navigate('/settings')}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors',
              'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            )}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
              <Settings className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">Ajustes</p>
              <p className="truncate text-xs text-muted-foreground">Empresa, permisos y backups</p>
            </div>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-2 h-px bg-border" />

          <DropdownMenu.Item
            onSelect={(event) => {
              event.preventDefault()
              onLogout()
            }}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors',
              'text-destructive hover:bg-destructive/10 focus:bg-destructive/10',
            )}
          >
            <div className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive">
              <LogOut className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">Cerrar sesión</p>
              <p className="text-xs opacity-80">Salir de la demo</p>
            </div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}