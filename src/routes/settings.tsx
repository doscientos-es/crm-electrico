import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CheckCircle2, Download, IdCard, Mail, MapPin, Monitor, Moon, Phone, Plus, Sun, Trash2, Upload, Users } from 'lucide-react'
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
import { Field, Input, InputGroup, Select } from '../components/ui/input'
import { DataTable, Td, Tr } from '../components/ui/table'
import { Tabs } from '../components/ui/tabs'
import { useAuth } from '../features/auth/AuthContext'
import { useTheme } from '../hooks/use-theme'

import { appBrand } from '~/config/nav'
import { contractStatusLabels, customerStatusLabels } from '../config/constants'
import { exportToCSV } from '../lib/export'
import { formatDate } from '../lib/formatters'
import type { ThemePreference } from '../lib/theme'
import { cn } from '../lib/utils'
import { fetchAllContractsForExport } from '../services/contracts.service'
import { fetchAllCustomersForExport, useCreateCustomer, useCustomers } from '../services/customers.service'
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
        <form className="grid gap-6" onSubmit={handleSubmit}>
          {/* ── Identidad ── */}
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <p className="col-span-full text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identidad</p>

            <Field label="Nombre comercial" required hint="Nombre que aparece en la aplicación">
              <InputGroup leading={<Building2 />}>
                <Input value={org.name} onChange={(e) => setOrg((p) => ({ ...p, name: e.target.value }))} placeholder="Mi Empresa S.L." />
              </InputGroup>
            </Field>

            <Field label="Razón social" hint="Denominación legal completa">
              <Input value={org.legal_name} onChange={(e) => setOrg((p) => ({ ...p, legal_name: e.target.value }))} placeholder="Mi Empresa Servicios S.L." />
            </Field>

            <Field label="CIF / NIF" hint="Número de identificación fiscal">
              <InputGroup leading={<IdCard />}>
                <Input value={org.tax_id} onChange={(e) => setOrg((p) => ({ ...p, tax_id: e.target.value }))} placeholder="B12345678" />
              </InputGroup>
            </Field>
          </div>

          {/* ── Contacto ── */}
          <div className="grid items-start gap-4 border-t pt-4 sm:grid-cols-2">
            <p className="col-span-full text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contacto</p>

            <Field label="Email">
              <InputGroup leading={<Mail />}>
                <Input type="email" autoComplete="email" value={org.email} onChange={(e) => setOrg((p) => ({ ...p, email: e.target.value }))} placeholder="contacto@empresa.com" />
              </InputGroup>
            </Field>

            <Field label="Teléfono">
              <InputGroup leading={<Phone />}>
                <Input type="tel" inputMode="tel" autoComplete="tel" value={org.phone} onChange={(e) => setOrg((p) => ({ ...p, phone: e.target.value }))} placeholder="600 123 456" />
              </InputGroup>
            </Field>
          </div>

          {/* ── Dirección ── */}
          <div className="grid items-start gap-4 border-t pt-4 sm:grid-cols-2">
            <p className="col-span-full text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección</p>

            <Field label="Dirección" className="sm:col-span-2">
              <InputGroup leading={<MapPin />}>
                <Input value={org.address} onChange={(e) => setOrg((p) => ({ ...p, address: e.target.value }))} placeholder="Calle Gran Vía, 1" />
              </InputGroup>
            </Field>

            <Field label="Ciudad">
              <Input value={org.city} onChange={(e) => setOrg((p) => ({ ...p, city: e.target.value }))} placeholder="Madrid" />
            </Field>

            <Field label="Provincia">
              <Input value={org.province} onChange={(e) => setOrg((p) => ({ ...p, province: e.target.value }))} placeholder="Madrid" />
            </Field>

            <Field label="Código postal" hint="5 dígitos">
              <Input inputMode="numeric" value={org.postal_code} onChange={(e) => setOrg((p) => ({ ...p, postal_code: e.target.value }))} placeholder="28001" />
            </Field>
          </div>

          <div className="border-t pt-4">
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
      { fullName: values.full_name, email: values.email, role: values.role, phone: values.phone },
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
            {inviteProfile.error instanceof Error
              ? inviteProfile.error.message
              : 'Error al enviar la invitación. Inténtalo de nuevo.'}
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

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

const VALID_CUSTOMER_STATUSES = Object.keys(customerStatusLabels)

function DataTab() {
  const { data: customersData } = useCustomers({ pageSize: 5000 })
  const customers = customersData?.data ?? []
  const createCustomer = useCreateCustomer()
  const importInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  // ── Export filters ──────────────────────────────────────────────────────────
  const [exportStatus, setExportStatus] = useState('all')
  const [exportDateFrom, setExportDateFrom] = useState('')
  const [exportDateTo, setExportDateTo] = useState('')
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [isExportingContracts, setIsExportingContracts] = useState(false)

  const { data: profiles } = useProfiles()
  const profilesById = useMemo(
    () => Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name ?? ''])),
    [profiles],
  )

  async function exportCsv() {
    setIsExportingCsv(true)
    try {
      const rows = await fetchAllCustomersForExport({
        status: exportStatus !== 'all' ? exportStatus : undefined,
        dateFrom: exportDateFrom || undefined,
        dateTo: exportDateTo || undefined,
      })
      if (!rows.length) {
        toast.info('No hay clientes con los filtros seleccionados.')
        return
      }
      exportToCSV(
        rows.map((c) => ({
          Nombre: c.name,
          Empresa: c.company ?? '',
          DNI: c.dni ?? '',
          Estado: customerStatusLabels[c.status as keyof typeof customerStatusLabels] ?? c.status,
          Email: c.email ?? '',
          Teléfono: c.phone ?? '',
          Ciudad: c.city ?? '',
          Provincia: c.province ?? '',
          IBAN: c.iban ?? '',
          'Comercial asignado': profilesById[c.assigned_to ?? ''] ?? '',
          'Servicios contratados': (c.products_services as string[] ?? []).join(', '),
          'Contrato firmado': c.contract_signed_at ? formatDate(c.contract_signed_at) : '',
          'Fecha renovación': c.renewal_date ? formatDate(c.renewal_date) : '',
          'Alta en CRM': c.created_at ? formatDate(c.created_at) : '',
        })),
        `clientes-${new Date().toISOString().slice(0, 10)}`,
      )
      toast.success(`${rows.length} clientes exportados.`)
    } catch {
      toast.error('Error al exportar clientes.')
    } finally {
      setIsExportingCsv(false)
    }
  }

  async function exportContractsCsv() {
    setIsExportingContracts(true)
    try {
      const rows = await fetchAllContractsForExport({
        dateFrom: exportDateFrom || undefined,
        dateTo: exportDateTo || undefined,
      })
      if (!rows.length) {
        toast.info('No hay contratos con los filtros seleccionados.')
        return
      }
      exportToCSV(
        rows.map((ct) => ({
          'Nº Contrato': ct.contract_number ?? '',
          Cliente: ct.customer?.name ?? '',
          Empresa: ct.customer?.company ?? '',
          'Comercial asignado': profilesById[ct.customer?.assigned_to ?? ''] ?? '',
          Estado: contractStatusLabels[ct.status as keyof typeof contractStatusLabels] ?? ct.status,
          Comercializadora: ct.provider ?? '',
          Producto: ct.product ?? '',
          CUPS: ct.cups ?? '',
          Tarifa: ct.tariff_type ?? '',
          'Potencia (kW)': ct.power_kw ?? '',
          'Consumo anual (kWh)': ct.annual_consumption_kwh ?? '',
          'Precio energía': ct.energy_price_eur ?? '',
          'Precio potencia': ct.power_price_eur ?? '',
          'Importe (€)': ct.amount_eur ?? '',
          'Comisión (€)': ct.commission_eur ?? '',
          'Inicio vigencia': ct.starts_at ? formatDate(ct.starts_at) : '',
          'Fin vigencia': ct.ends_at ? formatDate(ct.ends_at) : '',
          'Fecha firma': ct.signed_at ? formatDate(ct.signed_at) : '',
          'Alta en CRM': ct.created_at ? formatDate(ct.created_at) : '',
          Notas: ct.notes ?? '',
        })),
        `contratos-${new Date().toISOString().slice(0, 10)}`,
      )
      toast.success(`${rows.length} contratos exportados.`)
    } catch {
      toast.error('Error al exportar contratos.')
    } finally {
      setIsExportingContracts(false)
    }
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

  async function importCsv(file: File) {
    setImporting(true)
    try {
      const rows = parseCsv(await file.text())
      if (rows.length < 2) {
        toast.error('El archivo CSV no contiene filas de datos.')
        return
      }
      const headers = rows[0].map((h) => h.trim().toLowerCase())
      const idx = (name: string) => headers.findIndex((h) => h === name)
      const nameIdx = idx('nombre')
      if (nameIdx === -1) {
        toast.error('El CSV debe incluir una columna "Nombre".')
        return
      }
      const dniIdx = idx('dni')
      const statusIdx = idx('estado')
      const renewalIdx = idx('fecha renovacion')
      const emailIdx = idx('email')
      const phoneIdx = idx('teléfono') !== -1 ? idx('teléfono') : idx('telefono')
      const cityIdx = idx('ciudad')

      let created = 0
      let skipped = 0
      for (const row of rows.slice(1)) {
        const name = row[nameIdx]?.trim()
        if (!name) {
          skipped++
          continue
        }
        const rawStatus = statusIdx !== -1 ? row[statusIdx]?.trim() : ''
        const status = VALID_CUSTOMER_STATUSES.includes(rawStatus) ? rawStatus : 'active'
        try {
          await createCustomer.mutateAsync({
            type: 'residential',
            name,
            dni: dniIdx !== -1 ? row[dniIdx]?.trim() || null : null,
            status: status as never,
            contact_name: name,
            email: emailIdx !== -1 ? row[emailIdx]?.trim() || null : null,
            phone: phoneIdx !== -1 ? row[phoneIdx]?.trim() || null : null,
            city: cityIdx !== -1 ? row[cityIdx]?.trim() || null : null,
            renewal_date: renewalIdx !== -1 ? row[renewalIdx]?.trim() || null : null,
          })
          created++
        } catch {
          skipped++
        }
      }
      toast.success(`Importación completada: ${created} creados, ${skipped} omitidos.`)
    } catch {
      toast.error('No se pudo leer el archivo CSV.')
    } finally {
      setImporting(false)
      if (importInputRef.current) importInputRef.current.value = ''
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Exportar datos</CardTitle>
          <p className="text-sm text-muted-foreground">Descarga un snapshot de los datos en el formato que necesites.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* ── Filtros de exportación ── */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Estado cliente">
              <Select value={exportStatus} onChange={(e) => setExportStatus(e.target.value)}>
                <option value="all">Todos</option>
                {Object.entries(customerStatusLabels).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Alta desde">
              <Input type="date" value={exportDateFrom} onChange={(e) => setExportDateFrom(e.target.value)} />
            </Field>
            <Field label="Alta hasta">
              <Input type="date" value={exportDateTo} onChange={(e) => setExportDateTo(e.target.value)} />
            </Field>
          </div>

          {/* ── Botones de exportación ── */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-1 text-sm font-medium text-foreground">Clientes CSV</p>
              <p className="mb-3 text-xs text-muted-foreground">Nombre, empresa, DNI, estado, comercial, servicios y renovación.</p>
              <Button size="sm" variant="secondary" disabled={isExportingCsv} onClick={exportCsv}>
                <Download className="h-3.5 w-3.5" />
                {isExportingCsv ? 'Exportando...' : 'Descargar CSV'}
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-1 text-sm font-medium text-foreground">Contratos CSV</p>
              <p className="mb-3 text-xs text-muted-foreground">Una fila por contrato con datos energéticos, comercial y vigencia.</p>
              <Button size="sm" variant="secondary" disabled={isExportingContracts} onClick={exportContractsCsv}>
                <Download className="h-3.5 w-3.5" />
                {isExportingContracts ? 'Exportando...' : 'Descargar CSV'}
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-1 text-sm font-medium text-foreground">Backup JSON</p>
              <p className="mb-3 text-xs text-muted-foreground">Exporta todos los clientes en formato JSON para backup completo.</p>
              <Button size="sm" variant="secondary" onClick={exportJson}>
                <Download className="h-3.5 w-3.5" />
                Descargar JSON
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importar clientes</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sube un CSV con las columnas Nombre, DNI, Estado, Fecha renovacion, Email, Teléfono y Ciudad. Solo el nombre es obligatorio.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-1 text-sm font-medium text-foreground">Clientes CSV</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Compatible con el archivo generado por «Descargar CSV». Cada fila crea un nuevo cliente.
            </p>
            <input
              ref={importInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) importCsv(file)
              }}
            />
            <Button size="sm" variant="secondary" disabled={importing} onClick={() => importInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5" />
              {importing ? 'Importando...' : 'Importar CSV'}
            </Button>
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
  const canManageOrg = currentUser?.role === 'owner' || currentUser?.role === 'admin'
  const canManageTeam = canManageOrg

  const tab: SettingsTab =
    rawTab &&
      (VALID_TABS as readonly string[]).includes(rawTab) &&
      (rawTab !== 'team' || canManageTeam) &&
      (rawTab !== 'organization' || canManageOrg) &&
      (rawTab !== 'data' || canManageOrg)
      ? (rawTab as SettingsTab)
      : 'appearance'

  function setTab(value: string) {
    navigate(`/settings/${value}`, { replace: true })
  }

  const tabs = useMemo(
    () => [
      { value: 'appearance', label: 'Apariencia', content: <AppearanceTab /> },
      ...(canManageOrg ? [{ value: 'organization', label: 'Empresa', content: <OrganizationTab /> }] : []),
      ...(canManageTeam ? [{ value: 'team', label: 'Equipo', content: <TeamTab /> }] : []),
      ...(canManageOrg ? [{ value: 'data', label: 'Datos', content: <DataTab /> }] : []),
    ],
    [canManageOrg, canManageTeam],
  )

  return (
    <div>
      <PageHeader
        title="Ajustes"
        description="Personaliza la aplicación, gestiona tu empresa y exporta datos."
        action={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>{appBrand.name}</span>
            <span className="text-border">·</span>
            <Users className="h-3.5 w-3.5" />
            <span>{currentUser?.full_name}</span>
          </div>
        }
      />
      <Tabs value={tab} onValueChange={setTab} tabs={tabs} />
    </div>
  )
}
