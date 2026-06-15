import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CheckCircle2, Download, Monitor, Moon, Plus, Sun, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { PageHeader } from '../components/data-table/Toolbar'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog } from '../components/ui/dialog'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, Td, Tr } from '../components/ui/table'
import { Tabs } from '../components/ui/tabs'
import { useAuth } from '../features/auth/AuthContext'
import { useTheme } from '../hooks/use-theme'

import type { ThemePreference } from '../lib/theme'
import { cn } from '../lib/utils'
import { useCustomers } from '../services/customers.service'
import { useOrganization, useUpdateOrganization } from '../services/organization.service'
import { useDeleteProfile, useInviteProfile, useProfiles, useUpdateProfile } from '../services/profiles.service'
import type { AppRole } from '../types/database.types'

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
  const { data: organization } = useOrganization()
  const updateOrganization = useUpdateOrganization()
  const initialized = useRef(false)

  const [org, setOrg] = useState({
    name: '',
    legal_name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
  })

  useEffect(() => {
    if (organization && !initialized.current) {
      initialized.current = true
      setOrg({
        name: organization.name ?? '',
        legal_name: organization.legal_name ?? '',
        tax_id: organization.tax_id ?? '',
        email: organization.email ?? '',
        phone: organization.phone ?? '',
        address: organization.address ?? '',
        city: organization.city ?? '',
        province: organization.province ?? '',
        postal_code: organization.postal_code ?? '',
      })
    }
  }, [organization])

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!organization?.id) return
    updateOrganization.mutate(
      { id: organization.id, ...org },
      {
        onSuccess: () => toast.success('Datos de la empresa guardados'),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'No se pudieron guardar los cambios'),
      },
    )
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
            <Button type="submit" className="w-fit" disabled={updateOrganization.isPending}>
              {updateOrganization.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ─── Team Tab ─────────────────────────────────────────────────────────────────

const memberSchema = z.object({
  full_name: z.string().min(2, 'Nombre obligatorio'),
  email: z.string().email('Email inválido'),
  role: z.enum(['owner', 'admin', 'sales'] as const),
  phone: z.string().optional(),
})
type MemberFormValues = z.infer<typeof memberSchema>

function MemberFormDialog() {
  const [open, setOpen] = useState(false)
  const [inviteSent, setInviteSent] = useState<string | null>(null)
  const inviteProfile = useInviteProfile()

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { role: 'sales', phone: '' },
  })

  const selectedRole = watch('role')

  async function onSubmit(values: MemberFormValues) {
    inviteProfile.mutate(
      { fullName: values.full_name, email: values.email, role: values.role },
      {
        onSuccess: () => {
          setInviteSent(values.email)
          reset()
        },
      },
    )
  }

  function handleClose(next: boolean) {
    setOpen(next)
    if (!next) {
      reset()
      setInviteSent(null)
    }
  }

  const buttonLabel = 'Invitar miembro'
  const dialogTitle = 'Invitar miembro'
  const dialogDescription = 'Se enviará un email de invitación. El miembro elige su contraseña al aceptarla.'

  return (
    <Dialog
      open={open}
      onOpenChange={handleClose}
      title={dialogTitle}
      description={dialogDescription}
      size="md"
      trigger={
        <Button size="sm">
          <Plus className="h-3.5 w-3.5" />
          {buttonLabel}
        </Button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 pt-2" noValidate>
        <Field label="Nombre completo" error={errors.full_name?.message} required>
          <Input
            {...register('full_name')}
            id="member-full-name"
            placeholder="Ana García"
            autoComplete="name"
            autoFocus
            aria-required
            aria-invalid={!!errors.full_name}
            aria-describedby={errors.full_name ? 'member-full-name-error' : undefined}
          />
        </Field>
        <Field label="Email" error={errors.email?.message} required>
          <Input
            {...register('email')}
            id="member-email"
            type="email"
            inputMode="email"
            placeholder="ana@empresa.com"
            autoComplete="email"
            aria-required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'member-email-error' : undefined}
          />
        </Field>
        <Field label="Teléfono" error={errors.phone?.message} hint="Opcional · formato +34 600 000 000">
          <Input
            {...register('phone')}
            id="member-phone"
            type="tel"
            inputMode="tel"
            placeholder="+34 600 000 000"
            autoComplete="tel"
            aria-invalid={!!errors.phone}
          />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium text-foreground">
            Rol <span className="text-destructive" aria-hidden>*</span>
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map((opt) => {
              const active = selectedRole === opt.value
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'focus-within:ring-ring flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-left transition-all focus-within:ring-2 focus-within:ring-offset-2',
                    active
                      ? 'border-primary bg-primary/5 text-foreground shadow-sm shadow-primary/10'
                      : 'border-border bg-muted/30 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    value={opt.value}
                    checked={active}
                    onChange={() => setValue('role', opt.value, { shouldValidate: true })}
                  />
                  <span className={cn('text-sm font-medium', active && 'text-primary')}>{opt.label}</span>
                  <span className="text-[11px] leading-tight">{opt.description}</span>
                </label>
              )
            })}
          </div>
          {errors.role && <span className="text-xs font-medium text-destructive">{errors.role.message}</span>}
        </fieldset>
        {inviteProfile.isError && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            Error al enviar la invitación. Inténtalo de nuevo.
          </p>
        )}
        {inviteSent && (
          <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Invitación enviada a <strong>{inviteSent}</strong>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting || inviteProfile.isPending}>
            {inviteProfile.isPending ? 'Enviando…' : 'Enviar invitación'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  sales: 'Comercial',
}

type AssignableRole = 'owner' | 'admin' | 'sales'

const ROLE_OPTIONS: Array<{ value: AssignableRole; label: string; description: string }> = [
  { value: 'owner', label: 'Propietario', description: 'Acceso total, configuración y seguridad' },
  { value: 'admin', label: 'Administrador', description: 'Gestión de equipo y cartera completa' },
  { value: 'sales', label: 'Comercial', description: 'Solo su cartera asignada' },
]

function TeamTab() {
  const { profile: currentUser } = useAuth()
  const { data: profiles = [] } = useProfiles()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const updateProfile = useUpdateProfile()
  const deleteProfile = useDeleteProfile()
  const canEditRoles = currentUser?.role === 'owner' || currentUser?.role === 'admin'
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const customers = customersResult?.data ?? []

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Equipo</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Los administradores pueden cambiar roles y privilegios. Los comerciales solo ven su cartera asignada.
            </p>
          </div>
          {canEditRoles && <MemberFormDialog />}
        </div>
      </CardHeader>
      <CardContent>
        <DataTable headers={['Miembro', 'Rol', 'Acceso', 'Clientes', 'Gestión', '']}>
          {profiles.map((profile) => {
            const assigned = customers.filter((c) => c.assigned_to === profile.id).length
            const fullAccess = profile.role === 'owner' || profile.role === 'admin'
            const isMe = profile.id === currentUser?.id
            return (
              <Tr key={profile.id} hover>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarFallback>{profile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-medium text-foreground">{profile.full_name}</span>
                      {isMe && (
                        <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Tú</span>
                      )}
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                </Td>
                <Td variant="muted" className="text-sm">{ROLE_LABELS[profile.role] ?? profile.role}</Td>
                <Td variant="muted" className="text-sm">{fullAccess ? 'Cartera completa' : 'Solo su cartera'}</Td>
                <Td variant="muted" className="text-sm">{assigned}</Td>
                <Td>
                  {canEditRoles ? (
                    <div className="grid gap-2 sm:min-w-60">
                      <Select
                        value={profile.role}
                        onChange={(e) => updateProfile.mutate({ id: profile.id, role: e.target.value as AppRole })}
                      >
                        {ROLE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_OPTIONS.find((option) => option.value === profile.role)?.description}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Solo lectura</p>
                  )}
                </Td>
                <Td>
                  {canEditRoles && !isMe && (
                    confirmDeleteId === profile.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">¿Eliminar?</span>
                        <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null) }}>
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleteProfile.isPending}
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteProfile.mutate(profile.id, { onSuccess: () => setConfirmDeleteId(null) })
                          }}
                        >
                          Eliminar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(profile.id) }}
                        aria-label="Eliminar miembro"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )
                  )}
                </Td>
              </Tr>
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
  const { data: customersData } = useCustomers({ pageSize: 5000 })
  const customers = customersData?.data ?? []

  function exportCsv() {
    const headers = ['Nombre', 'DNI', 'Estado', 'Fecha renovacion', 'Asignado a', 'Email', 'Teléfono', 'Ciudad']
    const rows = customers.map((c) => [
      c.name, c.dni ?? '', c.status, c.renewal_date ?? '', c.assigned_to ?? '', c.email ?? '', c.phone ?? '', c.city ?? '',
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportJson() {
    const payload = { exported_at: new Date().toISOString(), customers }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup-crm-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

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
              <Button size="sm" variant="secondary" onClick={exportCsv}>
                <Download className="h-3.5 w-3.5" />
                Descargar CSV
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-1 text-sm font-medium text-foreground">Backup JSON</p>
              <p className="mb-3 text-xs text-muted-foreground">Exporta todos los clientes en formato JSON.</p>
              <Button size="sm" variant="secondary" onClick={exportJson}>
                <Download className="h-3.5 w-3.5" />
                Descargar JSON
              </Button>
            </div>
          </div>
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
  const { profile: currentUser } = useAuth()
  const canManageTeam = currentUser?.role === 'owner' || currentUser?.role === 'admin'

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
