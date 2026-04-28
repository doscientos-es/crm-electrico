import { Building2, Download, Monitor, Moon, RotateCcw, Sun, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { Tabs } from '../components/ui/tabs'
import { useTheme } from '../hooks/use-theme'
import { formatDateTime } from '../lib/formatters'
import type { ThemePreference } from '../lib/theme'
import { cn } from '../lib/utils'
import { useDemoStore } from '../store/demo-store'
import type { AppRole } from '../types/domain'

// ─── Appearance Tab ──────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ElementType; description: string }[] = [
  { value: 'light', label: 'Claro', icon: Sun, description: 'Siempre tema claro' },
  { value: 'dark', label: 'Oscuro', icon: Moon, description: 'Siempre tema oscuro' },
  { value: 'system', label: 'Sistema', icon: Monitor, description: 'Sigue las preferencias del SO' },
]

function AppearanceTab() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Apariencia</CardTitle>
          <p className="text-sm text-muted-foreground">Selecciona el tema de color de la aplicación.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:max-w-sm">
            {THEME_OPTIONS.map(({ value, label, icon: Icon, description }) => {
              const active = theme === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  aria-pressed={active}
                  className={cn(
                    'focus-ring flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-all',
                    active
                      ? 'border-primary bg-primary/5 text-foreground shadow-sm shadow-primary/10'
                      : 'border-border bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <Icon className={cn('h-5 w-5', active && 'text-primary')} />
                  <span className="font-medium">{label}</span>
                  <span className="hidden text-center text-[11px] leading-tight sm:block">{description}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Organization Tab ─────────────────────────────────────────────────────────

function OrganizationTab() {
  const store = useDemoStore()
  const { organization } = store

  const [org, setOrg] = useState({
    name: organization.name,
    legal_name: organization.legal_name ?? '',
    tax_id: organization.tax_id ?? '',
    email: organization.email ?? '',
    phone: organization.phone ?? '',
    address: organization.address ?? '',
    city: organization.city ?? '',
    province: organization.province ?? '',
    postal_code: organization.postal_code ?? '',
  })

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    store.updateOrganization(org)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la empresa</CardTitle>
        <p className="text-sm text-muted-foreground">Datos legales y de contacto de la organización.</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre comercial">
              <Input value={org.name} onChange={(e) => setOrg((p) => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Razón social">
              <Input value={org.legal_name} onChange={(e) => setOrg((p) => ({ ...p, legal_name: e.target.value }))} />
            </Field>
            <Field label="CIF / NIF">
              <Input value={org.tax_id} onChange={(e) => setOrg((p) => ({ ...p, tax_id: e.target.value }))} />
            </Field>
            <Field label="Email">
              <Input type="email" autoComplete="email" value={org.email} onChange={(e) => setOrg((p) => ({ ...p, email: e.target.value }))} />
            </Field>
            <Field label="Teléfono">
              <Input type="tel" inputMode="tel" autoComplete="tel" value={org.phone} onChange={(e) => setOrg((p) => ({ ...p, phone: e.target.value }))} />
            </Field>
            <Field label="Dirección">
              <Input value={org.address} onChange={(e) => setOrg((p) => ({ ...p, address: e.target.value }))} />
            </Field>
            <Field label="Ciudad">
              <Input value={org.city} onChange={(e) => setOrg((p) => ({ ...p, city: e.target.value }))} />
            </Field>
            <Field label="Provincia">
              <Input value={org.province} onChange={(e) => setOrg((p) => ({ ...p, province: e.target.value }))} />
            </Field>
            <Field label="Código postal">
              <Input inputMode="numeric" value={org.postal_code} onChange={(e) => setOrg((p) => ({ ...p, postal_code: e.target.value }))} />
            </Field>
          </div>
          <div>
            <Button type="submit" className="w-fit">Guardar cambios</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  sales: 'Comercial',
  technician: 'Técnico',
  viewer: 'Visor',
}

const ROLE_OPTIONS: Array<{ value: AppRole; label: string; description: string }> = [
  { value: 'owner', label: 'Propietario', description: 'Acceso total, configuración y seguridad' },
  { value: 'admin', label: 'Administrador', description: 'Gestión de equipo y cartera completa' },
  { value: 'sales', label: 'Comercial', description: 'Solo su cartera asignada' },
  { value: 'technician', label: 'Técnico', description: 'Instalaciones y visitas técnicas' },
  { value: 'viewer', label: 'Visor', description: 'Acceso de solo lectura' },
]

function TeamTab() {
  const { profiles, customers, currentUser, updateProfileRole } = useDemoStore()
  const canEditRoles = currentUser.role === 'owner' || currentUser.role === 'admin'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipo</CardTitle>
        <p className="text-sm text-muted-foreground">
          Los administradores pueden cambiar roles y privilegios. Los comerciales solo ven su cartera asignada.
        </p>
      </CardHeader>
      <CardContent>
        <DataTable headers={['Miembro', 'Rol', 'Acceso', 'Clientes', 'Gestión']}>
          {profiles.map((profile) => {
            const assigned = customers.filter((c) => c.assigned_to === profile.id).length
            const fullAccess = profile.role === 'owner' || profile.role === 'admin'
            const isMe = profile.id === currentUser.id
            return (
              <tr key={profile.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                      {profile.full_name.slice(0, 2).toUpperCase()}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">{profile.full_name}</span>
                      {isMe && (
                        <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Tú</span>
                      )}
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{ROLE_LABELS[profile.role] ?? profile.role}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{fullAccess ? 'Cartera completa' : 'Solo su cartera'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{assigned}</td>
                <td className="px-4 py-3">
                  {canEditRoles ? (
                    <div className="grid gap-2 sm:min-w-60">
                      <Select value={profile.role} onChange={(e) => updateProfileRole(profile.id, e.target.value as AppRole)}>
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_OPTIONS.find((option) => option.value === profile.role)?.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Solo lectura</p>
                  )}
                </td>
              </tr>
            )
          })}
        </DataTable>
        {!canEditRoles && (
          <p className="mt-3 text-sm text-muted-foreground">Solo owner y admin pueden cambiar estos permisos.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Data Tab ─────────────────────────────────────────────────────────────────

function DataTab() {
  const store = useDemoStore()

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Exportar datos</CardTitle>
          <p className="text-sm text-muted-foreground">Descarga un snapshot de los datos en el formato que necesites.</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-1 text-sm font-medium text-foreground">Clientes CSV</p>
              <p className="mb-3 text-xs text-muted-foreground">Exporta nombre, DNI, estado, renovación y comercial asignado.</p>
              <Button size="sm" variant="secondary" onClick={store.exportCustomersCsv}>
                <Download className="h-3.5 w-3.5" />
                Descargar CSV
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-1 text-sm font-medium text-foreground">Backup JSON</p>
              <p className="mb-3 text-xs text-muted-foreground">Exporta clientes, contratos y documentos en formato JSON.</p>
              <Button size="sm" variant="secondary" onClick={store.exportBackupJson}>
                <Download className="h-3.5 w-3.5" />
                Descargar JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Puntos de restauración</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cada cambio genera un snapshot en <code className="rounded bg-muted px-1 font-mono text-[11px]">localStorage</code>. Se conservan los últimos 8.
          </p>
        </CardHeader>
        <CardContent>
          {store.backupSnapshots.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sin backups todavía.</p>
          ) : (
            <DataTable headers={['Fecha', 'Motivo', 'Clientes']}>
              {store.backupSnapshots.map((backup) => (
                <tr key={backup.id}>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateTime(backup.created_at)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{backup.label}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{backup.customers}</td>
                </tr>
              ))}
            </DataTable>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de peligro</CardTitle>
          <p className="text-sm text-muted-foreground">Restaura todos los datos de la demo a su estado inicial. Esta acción no se puede deshacer.</p>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" onClick={store.resetDemo}>
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar demo
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Route ────────────────────────────────────────────────────────────────────

const VALID_TABS = ['appearance', 'organization', 'team', 'data'] as const
type SettingsTab = (typeof VALID_TABS)[number]

export function SettingsRoute() {
  const { tab: rawTab } = useParams<{ tab: string }>()
  const navigate = useNavigate()
  const { currentUser } = useDemoStore()
  const canManageTeam = currentUser.role === 'owner' || currentUser.role === 'admin'

  const tab: SettingsTab =
    rawTab && (VALID_TABS as readonly string[]).includes(rawTab) && (rawTab !== 'team' || canManageTeam)
      ? (rawTab as SettingsTab)
      : 'appearance'

  function setTab(value: string) {
    navigate(`/settings/${value}`, { replace: true })
  }

  const tabs = useMemo(
    () => [
      { value: 'appearance', label: 'Apariencia', content: <AppearanceTab /> },
      { value: 'organization', label: 'Empresa', content: <OrganizationTab /> },
      ...(canManageTeam ? [{ value: 'team', label: 'Equipo', content: <TeamTab /> }] : []),
      { value: 'data', label: 'Datos', content: <DataTab /> },
    ],
    [canManageTeam],
  )

  return (
    <div>
      <PageHeader
        title="Ajustes"
        description="Personaliza la aplicación, gestiona tu empresa y exporta datos."
        action={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>CRM Eléctrico</span>
            <span className="text-border">·</span>
            <Users className="h-3.5 w-3.5" />
            <span>Demo</span>
          </div>
        }
      />
      <Tabs value={tab} onValueChange={setTab} tabs={tabs} />
    </div>
  )
}
