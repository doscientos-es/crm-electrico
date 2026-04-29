/* eslint-disable react-refresh/only-export-components */
import { addMonths } from 'date-fns'
import { toast } from 'sonner'
import { create } from 'zustand'
import { initialDemoState } from '../data/demo-data'
import { getRenewalAlertDate } from '../lib/customer-workflow'
import type {
  ActivityLog,
  AppRole,
  Contract,
  Customer,
  CustomerEnergyProfile,
  Deal,
  DemoState,
  Document,
  Installation,
  InstallationVisit,
  Invoice,
  Lead,
  Profile,
  Proposal,
  SavingSimulation,
  Task,
} from '../types/domain'

const STORAGE_KEY = 'renovaciones-crm-demo-state-v2'
const BACKUP_INDEX_KEY = 'renovaciones-crm-backups-v2'
const BACKUP_PREFIX = 'renovaciones-crm-backup-v2:'

type CreateInput<T> = Omit<T, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'created_by'>

type BackupSnapshot = {
  id: string
  created_at: string
  label: string
  customers: number
}

type DemoStore = DemoState & {
  currentUser: DemoState['profiles'][number]
  backupSnapshots: BackupSnapshot[]
  loginDemo: (userId?: string) => void
  logout: () => void
  resetDemo: () => void
  createLead: (input: CreateInput<Lead>) => Lead
  updateLead: (id: string, patch: Partial<Lead>) => void
  convertLead: (id: string) => Customer
  createCustomer: (input: CreateInput<Customer>) => Customer
  updateCustomer: (id: string, patch: Partial<Customer>) => void
  touchCustomer: (id: string, payload?: { contacted_at?: string; notes?: string }) => void
  renewCustomer: (id: string) => void
  upsertEnergyProfile: (input: Omit<CreateInput<CustomerEnergyProfile>, 'has_solar'> & { has_solar?: boolean }) => CustomerEnergyProfile
  createInvoice: (input: CreateInput<Invoice>) => Invoice
  createSimulation: (
    input: Omit<CreateInput<SavingSimulation>, 'proposed_monthly_cost_eur' | 'monthly_saving_eur' | 'annual_saving_eur' | 'roi_years'>,
  ) => SavingSimulation
  createProposal: (input: CreateInput<Proposal>) => Proposal
  updateProposalStatus: (id: string, status: Proposal['status']) => void
  createDeal: (input: CreateInput<Deal>) => Deal
  moveDeal: (dealId: string, stageId: string) => void
  createTask: (input: CreateInput<Task>) => Task
  completeTask: (id: string) => void
  createContract: (input: CreateInput<Contract>) => Contract
  createInstallation: (input: CreateInput<Installation>) => Installation
  updateInstallation: (id: string, patch: Partial<Installation>) => void
  createVisit: (input: CreateInput<InstallationVisit>) => InstallationVisit
  updateVisitLocation: (visitId: string, latitude: number, longitude: number) => void
  createDocument: (input: CreateInput<Document>) => Document
  updateProfileRole: (id: string, role: DemoState['profiles'][number]['role']) => void
  createProfile: (input: { full_name: string; email: string; role: AppRole; phone?: string }) => Profile
  deleteProfile: (id: string) => void
  updateOrganization: (patch: Partial<DemoState['organization']>) => void
  exportCustomersCsv: () => void
  exportBackupJson: () => void
}

type DemoActions = Omit<DemoStore, keyof DemoState | 'currentUser' | 'backupSnapshots'>

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DemoState) : initialDemoState
  } catch {
    return initialDemoState
  }
}

function loadBackups(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(BACKUP_INDEX_KEY)
    return raw ? (JSON.parse(raw) as BackupSnapshot[]) : []
  } catch {
    return []
  }
}

function storeBackup(state: DemoState, label: string) {
  const snapshot: BackupSnapshot = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    label,
    customers: state.customers.length,
  }
  const backups = [snapshot, ...loadBackups()].slice(0, 8)
  localStorage.setItem(BACKUP_INDEX_KEY, JSON.stringify(backups))
  localStorage.setItem(`${BACKUP_PREFIX}${snapshot.id}`, JSON.stringify(state))
}

function persist(next: DemoState, label = 'Backup automatico') {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  storeBackup(next, label)
}

function stamp<T extends object>(state: DemoState, input: T): T & {
  id: string
  organization_id: string
  created_at: string
  updated_at: string
  created_by: string
} {
  return {
    ...input,
    id: crypto.randomUUID(),
    organization_id: state.organization.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: state.currentUserId,
  }
}

function activity(
  state: DemoState,
  action: string,
  entityType: string,
  entityId: string,
  label: string,
  metadata: Record<string, unknown> = {},
  createdAt = new Date().toISOString(),
): ActivityLog {
  return {
    id: crypto.randomUUID(),
    organization_id: state.organization.id,
    actor_id: state.currentUserId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    metadata: { label, ...metadata },
    created_at: createdAt,
  }
}

function normalizeCustomerInput(state: DemoState, input: CreateInput<Customer> | Partial<Customer>) {
  const contractSignedAt = input.contract_signed_at
  const renewalDate = input.renewal_date ?? (contractSignedAt ? addMonths(new Date(contractSignedAt), 12).toISOString().slice(0, 10) : undefined)

  return {
    type: input.type ?? 'business',
    status: input.status ?? 'active',
    products_services: input.products_services ?? [],
    renewal_alert_months: input.renewal_alert_months ?? 10,
    assigned_to: input.assigned_to ?? state.currentUserId,
    renewal_date: renewalDate,
    ...input,
  }
}

function makeActions(get: () => DemoStore, set: (fn: (s: DemoStore) => Partial<DemoStore>) => void): DemoActions {
  function mutate(recipe: (draft: DemoState) => DemoState, message?: string, backupLabel?: string) {
    set((current) => {
      const next = recipe(current)
      persist(next, backupLabel ?? message ?? 'Backup automatico')
      return { ...next, backupSnapshots: loadBackups() }
    })
    if (message) toast.success(message)
  }

  return {
    loginDemo: (userId = 'user-owner') => {
      mutate((draft) => ({ ...draft, currentUserId: userId, isAuthenticated: true }), 'Sesion iniciada')
    },
    logout: () => {
      mutate((draft) => ({ ...draft, isAuthenticated: false }), 'Sesion cerrada')
    },
    resetDemo: () => {
      persist(initialDemoState, 'Restauracion demo')
      set(() => ({ ...initialDemoState, backupSnapshots: loadBackups() }))
      toast.success('Datos demo restaurados')
    },
    createLead: (input) => {
      const entity = stamp(get(), { ...input, status: input.status ?? 'new' }) as Lead
      mutate(
        (draft) => ({
          ...draft,
          leads: [entity, ...draft.leads],
          activityLogs: [
            activity(draft, 'lead_created', 'lead', entity.id, `Lead creado: ${entity.company_name ?? entity.contact_name}`),
            ...draft.activityLogs,
          ],
        }),
        'Lead creado',
      )
      return entity
    },
    updateLead: (id, patch) => {
      mutate(
        (draft) => ({
          ...draft,
          leads: draft.leads.map((lead) => (lead.id === id ? { ...lead, ...patch, updated_at: new Date().toISOString() } : lead)),
        }),
        'Lead actualizado',
      )
    },
    convertLead: (id) => {
      const s = get()
      const lead = s.leads.find((item) => item.id === id)
      if (!lead) throw new Error('Lead no encontrado')
      const customer = stamp(
        s,
        normalizeCustomerInput(s, {
          lead_id: lead.id,
          type: 'business',
          name: lead.company_name ?? lead.contact_name,
          company: lead.company_name,
          contact_name: lead.contact_name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          province: lead.province,
          postal_code: lead.postal_code,
          notes: lead.notes,
          products_services: [],
        }),
      ) as Customer

      mutate(
        (draft) => ({
          ...draft,
          customers: [customer, ...draft.customers],
          leads: draft.leads.map((item) =>
            item.id === id
              ? { ...item, status: 'converted', converted_customer_id: customer.id, updated_at: new Date().toISOString() }
              : item,
          ),
          activityLogs: [
            activity(draft, 'lead_converted', 'customer', customer.id, `Lead convertido en cliente: ${customer.name}`),
            ...draft.activityLogs,
          ],
        }),
        'Cliente creado desde lead',
      )
      return customer
    },
    createCustomer: (input) => {
      const s = get()
      const entity = stamp(s, normalizeCustomerInput(s, input)) as Customer
      mutate(
        (draft) => ({
          ...draft,
          customers: [entity, ...draft.customers],
          activityLogs: [activity(draft, 'customer_created', 'customer', entity.id, `Cliente creado: ${entity.name}`), ...draft.activityLogs],
        }),
        'Cliente creado',
      )
      return entity
    },
    updateCustomer: (id, patch) => {
      mutate(
        (draft) => ({
          ...draft,
          customers: draft.customers.map((customer) => {
            if (customer.id !== id) return customer
            const next = { ...customer, ...normalizeCustomerInput(draft, patch), updated_at: new Date().toISOString() }
            return next
          }),
          activityLogs: [activity(draft, 'customer_updated', 'customer', id, 'Ficha de cliente actualizada'), ...draft.activityLogs],
        }),
        'Cliente actualizado',
      )
    },
    touchCustomer: (id, payload) => {
      const contactedAt = payload?.contacted_at ? new Date(payload.contacted_at).toISOString() : new Date().toISOString()
      const notes = payload?.notes?.trim()
      mutate(
        (draft) => ({
          ...draft,
          customers: draft.customers.map((customer) =>
            customer.id === id ? { ...customer, last_contact_at: contactedAt, updated_at: new Date().toISOString() } : customer,
          ),
          activityLogs: [
            activity(
              draft,
              'customer_contacted',
              'customer',
              id,
              notes ? `Llamada registrada: ${notes}` : 'Llamada registrada sin notas',
              { customer_id: id, notes: notes ?? '', contacted_at: contactedAt },
              contactedAt,
            ),
            ...draft.activityLogs,
          ],
        }),
        'Contacto registrado',
      )
    },
    renewCustomer: (id) => {
      mutate(
        (draft) => ({
          ...draft,
          customers: draft.customers.map((customer) => {
            if (customer.id !== id) return customer
            const newSigned = new Date().toISOString().slice(0, 10)
            const newRenewal = addMonths(new Date(), 12).toISOString().slice(0, 10)
            return { ...customer, status: 'renewed', contract_signed_at: newSigned, renewal_date: newRenewal, updated_at: new Date().toISOString() }
          }),
          activityLogs: [activity(draft, 'customer_renewed', 'customer', id, 'Contrato renovado'), ...draft.activityLogs],
        }),
        'Contrato renovado',
      )
    },
    upsertEnergyProfile: (input) => {
      const s = get()
      const existing = s.energyProfiles.find((profile) => profile.customer_id === input.customer_id)
      const entity = existing
        ? ({ ...existing, ...input, has_solar: input.has_solar ?? false, updated_at: new Date().toISOString() } as CustomerEnergyProfile)
        : (stamp(s, { ...input, has_solar: input.has_solar ?? false }) as CustomerEnergyProfile)
      mutate(
        (draft) => ({
          ...draft,
          energyProfiles: existing
            ? draft.energyProfiles.map((profile) => (profile.id === existing.id ? entity : profile))
            : [entity, ...draft.energyProfiles],
        }),
        'Ficha energetica guardada',
      )
      return entity
    },
    createInvoice: (input) => {
      const entity = stamp(get(), input) as Invoice
      mutate((draft) => ({ ...draft, invoices: [entity, ...draft.invoices] }), 'Factura registrada')
      return entity
    },
    createSimulation: (input) => {
      const monthlySaving = Number((input.current_monthly_cost_eur * (input.estimated_saving_percent / 100)).toFixed(2))
      const annualSaving = Number((monthlySaving * 12).toFixed(2))
      const entity = stamp(get(), {
        ...input,
        monthly_saving_eur: monthlySaving,
        annual_saving_eur: annualSaving,
        proposed_monthly_cost_eur: Number((input.current_monthly_cost_eur - monthlySaving).toFixed(2)),
        roi_years:
          input.solar_investment_eur && annualSaving > 0 ? Number((input.solar_investment_eur / annualSaving).toFixed(2)) : undefined,
      }) as SavingSimulation
      mutate((draft) => ({ ...draft, simulations: [entity, ...draft.simulations] }), 'Simulacion guardada')
      return entity
    },
    createProposal: (input) => {
      const entity = stamp(get(), input) as Proposal
      mutate((draft) => ({ ...draft, proposals: [entity, ...draft.proposals] }), 'Propuesta creada')
      return entity
    },
    updateProposalStatus: (id, status) => {
      mutate(
        (draft) => ({
          ...draft,
          proposals: draft.proposals.map((proposal) =>
            proposal.id === id ? { ...proposal, status, updated_at: new Date().toISOString() } : proposal,
          ),
        }),
        'Estado de propuesta actualizado',
      )
    },
    createDeal: (input) => {
      const entity = stamp(get(), { ...input, status: input.status ?? 'open' }) as Deal
      mutate((draft) => ({ ...draft, deals: [entity, ...draft.deals] }), 'Oportunidad creada')
      return entity
    },
    moveDeal: (dealId, stageId) => {
      mutate(
        (draft) => ({
          ...draft,
          deals: draft.deals.map((deal) => (deal.id === dealId ? { ...deal, stage_id: stageId, updated_at: new Date().toISOString() } : deal)),
        }),
        'Pipeline actualizado',
      )
    },
    createTask: (input) => {
      const entity = stamp(get(), { ...input, status: input.status ?? 'pending', priority: input.priority ?? 'medium' }) as Task
      mutate((draft) => ({ ...draft, tasks: [entity, ...draft.tasks] }), 'Tarea creada')
      return entity
    },
    completeTask: (id) => {
      mutate(
        (draft) => ({
          ...draft,
          tasks: draft.tasks.map((task) =>
            task.id === id ? { ...task, status: 'done', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() } : task,
          ),
        }),
        'Tarea completada',
      )
    },
    createContract: (input) => {
      const entity = stamp(get(), input) as Contract
      mutate((draft) => ({ ...draft, contracts: [entity, ...draft.contracts] }), 'Contrato creado')
      return entity
    },
    createInstallation: (input) => {
      const entity = stamp(get(), input) as Installation
      mutate((draft) => ({ ...draft, installations: [entity, ...draft.installations] }), 'Instalacion creada')
      return entity
    },
    updateInstallation: (id, patch) => {
      mutate(
        (draft) => ({
          ...draft,
          installations: draft.installations.map((installation) =>
            installation.id === id ? { ...installation, ...patch, updated_at: new Date().toISOString() } : installation,
          ),
        }),
        'Instalacion actualizada',
      )
    },
    createVisit: (input) => {
      const entity = stamp(get(), { ...input, photo_paths: input.photo_paths ?? [] }) as InstallationVisit
      mutate((draft) => ({ ...draft, installationVisits: [entity, ...draft.installationVisits] }), 'Visita creada')
      return entity
    },
    updateVisitLocation: (visitId, latitude, longitude) => {
      mutate(
        (draft) => ({
          ...draft,
          installationVisits: draft.installationVisits.map((visit) =>
            visit.id === visitId ? { ...visit, latitude, longitude, started_at: visit.started_at ?? new Date().toISOString() } : visit,
          ),
        }),
        'Ubicacion guardada',
      )
    },
    createDocument: (input) => {
      const entity = stamp(get(), input) as Document
      mutate(
        (draft) => ({
          ...draft,
          documents: [entity, ...draft.documents],
          activityLogs: [activity(draft, 'document_uploaded', 'document', entity.id, `Documento subido: ${entity.file_name}`), ...draft.activityLogs],
        }),
        'Documento registrado',
      )
      return entity
    },
    createProfile: (input) => {
      const s = get()
      const entity: Profile = {
        id: crypto.randomUUID(),
        organization_id: s.organization.id,
        full_name: input.full_name,
        email: input.email,
        role: input.role,
        phone: input.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      mutate(
        (draft) => ({
          ...draft,
          profiles: [...draft.profiles, entity],
          activityLogs: [activity(draft, 'profile_created', 'profile', entity.id, `Miembro añadido: ${entity.full_name}`), ...draft.activityLogs],
        }),
        'Miembro añadido',
      )
      return entity
    },
    deleteProfile: (id) => {
      mutate(
        (draft) => {
          const profile = draft.profiles.find((p) => p.id === id)
          return {
            ...draft,
            profiles: draft.profiles.filter((p) => p.id !== id),
            activityLogs: [activity(draft, 'profile_deleted', 'profile', id, `Miembro eliminado: ${profile?.full_name ?? id}`), ...draft.activityLogs],
          }
        },
        'Miembro eliminado',
      )
    },
    updateProfileRole: (id, role) => {
      mutate(
        (draft) => ({
          ...draft,
          profiles: draft.profiles.map((profile) => (profile.id === id ? { ...profile, role, updated_at: new Date().toISOString() } : profile)),
        }),
        'Permisos actualizados',
      )
    },
    updateOrganization: (patch) => {
      mutate(
        (draft) => ({
          ...draft,
          organization: { ...draft.organization, ...patch, updated_at: new Date().toISOString() },
        }),
        'Empresa actualizada',
      )
    },
    exportCustomersCsv: () => {
      const s = get()
      const profileNameById = Object.fromEntries(s.profiles.map((p) => [p.id, p.full_name]))
      const rows = s.customers.map((customer) => [
        customer.name,
        customer.dni ?? '',
        customer.company ?? '',
        customer.status,
        customer.contract_signed_at ?? '',
        customer.renewal_date ?? '',
        customer.products_services.join(' | '),
        profileNameById[customer.assigned_to ?? ''] ?? '',
      ])
      const header = ['Nombre', 'DNI', 'Empresa', 'Estado', 'Fecha contrato', 'Fecha renovacion', 'Productos/Servicios', 'Comercial']
      const csv = [header, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
        .join('\n')
      downloadFile(`clientes-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
      toast.success('Exportacion CSV generada')
    },
    exportBackupJson: () => {
      const s = get()
      const payload = {
        exported_at: new Date().toISOString(),
        organization: s.organization,
        customers: s.customers,
        documents: s.documents,
        contracts: s.contracts,
      }
      downloadFile(`backup-crm-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json')
      toast.success('Backup JSON generado')
    },
  }
}

const useDemoStoreBase = create<DemoStore>()((set, get) => {
  const initial = loadState()
  const actions = makeActions(get as () => DemoStore, set as (fn: (s: DemoStore) => Partial<DemoStore>) => void)
  return {
    ...initial,
    currentUser: initial.profiles.find((p) => p.id === initial.currentUserId) ?? initial.profiles[0],
    backupSnapshots: loadBackups(),
    ...actions,
  }
})

export function useDemoStore() {
  return useDemoStoreBase()
}

/** No-op provider — Zustand doesn't need a React tree wrapper */
export function DemoStoreProvider({ children }: { children: import('react').ReactNode }) {
  return <>{children}</>
}

export { getRenewalAlertDate }
