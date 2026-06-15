import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { initials } from '../../lib/utils'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-11 w-full gap-3 rounded-xl px-3">
          <Avatar size="sm">
            <AvatarFallback>{initials(fullName)}</AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-sm font-semibold leading-none text-foreground">{fullName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{organizationName}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-72 rounded-xl p-2 shadow-xl"
      >
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
            <Badge variant="emerald" className="shrink-0 capitalize">
              {role}
            </Badge>
          </div>
        </div>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onSelect={() => navigate('/settings')}
          className="gap-3 rounded-lg px-3 py-2"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground">
            <Settings className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground">Ajustes</p>
            <p className="truncate text-xs text-muted-foreground">Empresa, permisos y backups</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          destructive
          onSelect={(event) => {
            event.preventDefault()
            onLogout()
          }}
          className="gap-3 rounded-lg px-3 py-2"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-destructive/10 text-destructive">
            <LogOut className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">Cerrar sesión</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}