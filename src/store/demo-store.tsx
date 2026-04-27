/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { toast } from 'sonner'
import { initialDemoState } from '../data/demo-data'
import type {
  ActivityLog,
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
  Proposal,
  SavingSimulation,
  Task,
} from '../types/domain'

const STORAGE_KEY = 'energiza-crm-demo-state'

type CreateInput<T> = Omit<T, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'created_by'>

type DemoStore = DemoState & {
  currentUser: DemoState['profiles'][number]
  loginDemo: (userId?: string) => void
  logout: () => void
  resetDemo: () => void
  createLead: (input: CreateInput<Lead>) => Lead
  updateLead: (id: string, patch: Partial<Lead>) => void
  convertLead: (id: string) => Customer
  createCustomer: (input: CreateInput<Customer>) => Customer
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
  updateOrganization: (patch: Partial<DemoState['organization']>) => void
}

const DemoStoreContext = createContext<DemoStore | null>(null)

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as DemoState) : initialDemoState
  } catch {
    return initialDemoState
  }
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

function activity(state: DemoState, action: string, entityType: string, entityId: string, label: string): ActivityLog {
  return {
    id: crypto.randomUUID(),
    organization_id: state.organization.id,
    actor_id: state.currentUserId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    metadata: { label },
    created_at: new Date().toISOString(),
  }
}

function persist(next: DemoState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DemoState>(loadState)

  const mutate = useCallback((recipe: (draft: DemoState) => DemoState, message?: string) => {
    setState((current) => {
      const next = recipe(current)
      persist(next)
      return next
    })
    if (message) toast.success(message)
  }, [])

  const value = useMemo<DemoStore>(() => {
    const currentUser = state.profiles.find((profile) => profile.id === state.currentUserId) ?? state.profiles[0]

    return {
      ...state,
      currentUser,
      loginDemo: (userId = 'user-owner') => {
        mutate((draft) => ({ ...draft, currentUserId: userId, isAuthenticated: true }), 'Sesion demo iniciada')
      },
      logout: () => {
        mutate((draft) => ({ ...draft, isAuthenticated: false }), 'Sesion cerrada')
      },
      resetDemo: () => {
        persist(initialDemoState)
        setState(initialDemoState)
        toast.success('Datos demo restaurados')
      },
      createLead: (input) => {
        const entity = stamp(state, { ...input, status: input.status ?? 'new' }) as Lead
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
        const lead = state.leads.find((item) => item.id === id)
        if (!lead) throw new Error('Lead no encontrado')
        const customer = stamp(state, {
          lead_id: lead.id,
          type: 'business',
          name: lead.company_name ?? lead.contact_name,
          contact_name: lead.contact_name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          province: lead.province,
          postal_code: lead.postal_code,
          notes: lead.notes,
        }) as Customer
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
          'Lead convertido en cliente',
        )
        return customer
      },
      createCustomer: (input) => {
        const entity = stamp(state, input) as Customer
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
      upsertEnergyProfile: (input) => {
        const existing = state.energyProfiles.find((profile) => profile.customer_id === input.customer_id)
        const entity = existing
          ? ({ ...existing, ...input, has_solar: input.has_solar ?? false, updated_at: new Date().toISOString() } as CustomerEnergyProfile)
          : (stamp(state, { ...input, has_solar: input.has_solar ?? false }) as CustomerEnergyProfile)
        mutate(
          (draft) => ({
            ...draft,
            energyProfiles: existing
              ? draft.energyProfiles.map((profile) => (profile.id === existing.id ? entity : profile))
              : [entity, ...draft.energyProfiles],
            activityLogs: [
              activity(draft, 'energy_profile_saved', 'customer', entity.customer_id, 'Ficha energetica actualizada'),
              ...draft.activityLogs,
            ],
          }),
          'Ficha energetica guardada',
        )
        return entity
      },
      createInvoice: (input) => {
        const entity = stamp(state, input) as Invoice
        const document = stamp(state, {
          customer_id: input.customer_id,
          type: 'invoice',
          bucket: 'invoices',
          file_path: input.file_path,
          file_name: input.file_name,
          mime_type: 'application/pdf',
          size_bytes: 420_000,
          uploaded_by: state.currentUserId,
        }) as Document
        mutate(
          (draft) => ({
            ...draft,
            invoices: [entity, ...draft.invoices],
            documents: [document, ...draft.documents],
            activityLogs: [
              activity(draft, 'invoice_uploaded', 'invoice', entity.id, `Factura subida: ${entity.file_name}`),
              ...draft.activityLogs,
            ],
          }),
          'Factura registrada',
        )
        return entity
      },
      createSimulation: (input) => {
        const monthlySaving = Number((input.current_monthly_cost_eur * (input.estimated_saving_percent / 100)).toFixed(2))
        const annualSaving = Number((monthlySaving * 12).toFixed(2))
        const entity = stamp(state, {
          ...input,
          monthly_saving_eur: monthlySaving,
          annual_saving_eur: annualSaving,
          proposed_monthly_cost_eur: Number((input.current_monthly_cost_eur - monthlySaving).toFixed(2)),
          roi_years:
            input.solar_investment_eur && annualSaving > 0 ? Number((input.solar_investment_eur / annualSaving).toFixed(2)) : undefined,
        }) as SavingSimulation
        mutate(
          (draft) => ({
            ...draft,
            simulations: [entity, ...draft.simulations],
            activityLogs: [
              activity(draft, 'simulation_created', 'simulation', entity.id, `Simulacion creada: ahorro anual ${annualSaving} EUR`),
              ...draft.activityLogs,
            ],
          }),
          'Simulacion guardada',
        )
        return entity
      },
      createProposal: (input) => {
        const entity = stamp(state, input) as Proposal
        mutate(
          (draft) => ({
            ...draft,
            proposals: [entity, ...draft.proposals],
            activityLogs: [
              activity(draft, 'proposal_created', 'proposal', entity.id, `Propuesta creada: ${entity.title}`),
              ...draft.activityLogs,
            ],
          }),
          'Propuesta creada',
        )
        return entity
      },
      updateProposalStatus: (id, status) => {
        mutate(
          (draft) => ({
            ...draft,
            proposals: draft.proposals.map((proposal) =>
              proposal.id === id
                ? {
                    ...proposal,
                    status,
                    sent_at: status === 'sent' ? new Date().toISOString() : proposal.sent_at,
                    accepted_at: status === 'accepted' ? new Date().toISOString() : proposal.accepted_at,
                    updated_at: new Date().toISOString(),
                  }
                : proposal,
            ),
            activityLogs: [
              activity(draft, `proposal_${status}`, 'proposal', id, `Propuesta marcada como ${status}`),
              ...draft.activityLogs,
            ],
          }),
          'Estado de propuesta actualizado',
        )
      },
      createDeal: (input) => {
        const entity = stamp(state, { ...input, status: input.status ?? 'open' }) as Deal
        mutate(
          (draft) => ({
            ...draft,
            deals: [entity, ...draft.deals],
            activityLogs: [activity(draft, 'deal_created', 'deal', entity.id, `Oportunidad creada: ${entity.title}`), ...draft.activityLogs],
          }),
          'Oportunidad creada',
        )
        return entity
      },
      moveDeal: (dealId, stageId) => {
        const stage = state.pipelineStages.find((item) => item.id === stageId)
        mutate(
          (draft) => ({
            ...draft,
            deals: draft.deals.map((deal) =>
              deal.id === dealId
                ? {
                    ...deal,
                    stage_id: stageId,
                    status: stage?.is_won ? 'won' : stage?.is_lost ? 'lost' : 'open',
                    probability: stage?.is_won ? 100 : stage?.is_lost ? 0 : deal.probability,
                    won_at: stage?.is_won ? new Date().toISOString() : deal.won_at,
                    updated_at: new Date().toISOString(),
                  }
                : deal,
            ),
            activityLogs: [activity(draft, 'deal_moved', 'deal', dealId, `Oportunidad movida a ${stage?.name}`), ...draft.activityLogs],
          }),
          'Pipeline actualizado',
        )
      },
      createTask: (input) => {
        const entity = stamp(state, { ...input, status: input.status ?? 'pending', priority: input.priority ?? 'medium' }) as Task
        mutate(
          (draft) => ({
            ...draft,
            tasks: [entity, ...draft.tasks],
            activityLogs: [activity(draft, 'task_created', 'task', entity.id, `Tarea creada: ${entity.title}`), ...draft.activityLogs],
          }),
          'Tarea creada',
        )
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
        const entity = stamp(state, input) as Contract
        mutate(
          (draft) => ({
            ...draft,
            contracts: [entity, ...draft.contracts],
            activityLogs: [
              activity(draft, 'contract_created', 'contract', entity.id, `Contrato creado: ${entity.contract_number}`),
              ...draft.activityLogs,
            ],
          }),
          'Contrato creado',
        )
        return entity
      },
      createInstallation: (input) => {
        const entity = stamp(state, input) as Installation
        mutate(
          (draft) => ({
            ...draft,
            installations: [entity, ...draft.installations],
            activityLogs: [
              activity(draft, 'installation_created', 'installation', entity.id, `Instalacion creada: ${entity.type}`),
              ...draft.activityLogs,
            ],
          }),
          'Instalacion creada',
        )
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
        const entity = stamp(state, { ...input, photo_paths: input.photo_paths ?? [] }) as InstallationVisit
        mutate(
          (draft) => ({
            ...draft,
            installationVisits: [entity, ...draft.installationVisits],
            activityLogs: [activity(draft, 'visit_scheduled', 'visit', entity.id, 'Visita tecnica programada'), ...draft.activityLogs],
          }),
          'Visita creada',
        )
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
        const entity = stamp(state, input) as Document
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
      updateOrganization: (patch) => {
        mutate(
          (draft) => ({
            ...draft,
            organization: { ...draft.organization, ...patch, updated_at: new Date().toISOString() },
          }),
          'Empresa actualizada',
        )
      },
    }
  }, [mutate, state])

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>
}

export function useDemoStore() {
  const context = useContext(DemoStoreContext)
  if (!context) throw new Error('useDemoStore debe usarse dentro de DemoStoreProvider')
  return context
}
