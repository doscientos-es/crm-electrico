import { addMonths, subDays, subMonths } from 'date-fns'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normalizeContractStatus } from '../lib/contract-status'
import type {
  ActivityLog,
  Contract,
  Customer,
  Deal,
  DocumentRecord,
  EnergyData,
  EnergyProfile,
  Incident,
  Installation,
  Invoice,
  Lead,
  Organization,
  PipelineStage,
  Profile,
  Proposal,
  Simulation,
  Task,
} from '../types/domain'

const now = new Date()
const iso = now.toISOString()
const date = (value: Date) => value.toISOString().slice(0, 10)

const profiles: Profile[] = [
  { id: 'user-admin', full_name: 'Carlos Rivas', email: 'carlos@electrico.local', phone: '+34 600 111 001', role: 'admin', avatar_url: null, created_at: iso, updated_at: iso },
  { id: 'user-sales-1', full_name: 'Marta Soler', email: 'marta@electrico.local', phone: '+34 600 111 002', role: 'sales', avatar_url: null, created_at: iso, updated_at: iso },
  { id: 'user-sales-2', full_name: 'Diego Paredes', email: 'diego@electrico.local', phone: '+34 600 111 003', role: 'sales', avatar_url: null, created_at: iso, updated_at: iso },
]

function energy(index: number, residential: boolean): EnergyData {
  return {
    cups: `ES00210000000000000${index}AB`,
    marketer: index % 2 ? 'Iberdrola Clientes' : 'Endesa Energía',
    product: residential ? 'Plan Estable Hogar' : 'Plan Empresa Flexible',
    annualConsumptionKwh: residential ? 4_800 + index * 350 : 42_000 + index * 8_500,
    tariff: residential ? '2.0TD' : '3.0TD',
    energyPrice: residential ? 0.1425 : 0.1198,
    powerPrice: residential ? 31.25 : 27.4,
    commission: residential ? 95 : 420,
    estimatedMargin: residential ? 165 : 1180,
    startDate: date(subMonths(now, 5 + index)),
    endDate: date(addMonths(subMonths(now, 5 + index), 12)),
    notes: 'Datos revisados con la última factura disponible.',
  }
}

function customer(
  id: string,
  name: string,
  type: Customer['type'],
  status: Customer['status'],
  owner: string,
  company: string | null,
  index: number,
): Customer {
  const signed = subMonths(now, 3 + index)
  return {
    id,
    type,
    name,
    company,
    dni: type === 'RESIDENTIAL' ? `25${index}4432${index}X` : `B46000${index}1`,
    legal_name: company,
    tax_id: company ? `B46000${index}1` : null,
    status,
    contact_name: name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@cliente.local`,
    phone: `+34 640 120 10${index}`,
    address: `Calle Energía ${index}`,
    city: index % 2 ? 'Valencia' : 'Alzira',
    province: 'Valencia',
    postal_code: `4600${index}`,
    latitude: null,
    longitude: null,
    contract_signed_at: date(signed),
    renewal_date: date(addMonths(signed, 12)),
    renewal_alert_months: 10,
    products_services: type === 'RESIDENTIAL' ? ['Tarifa hogar'] : ['Luz PYME', 'Seguimiento anual'],
    assigned_to: owner,
    last_contact_at: subDays(now, index).toISOString(),
    notes: 'Cliente activo de la cartera energética.',
    energy_data: energy(index, type === 'RESIDENTIAL'),
    created_at: subMonths(now, 10).toISOString(),
    updated_at: iso,
  }
}

const customers: Customer[] = [
  customer('customer-001', 'Lucía Moreno', 'RESIDENTIAL', 'renewal_due', 'user-sales-1', null, 1),
  customer('customer-002', 'Bar Mediterráneo', 'SME', 'active', 'user-sales-1', 'Bar Mediterráneo S.L.', 2),
  customer('customer-003', 'Talleres Ferrer', 'SME', 'renewed', 'user-sales-2', 'Talleres Ferrer S.L.', 3),
  customer('customer-004', 'Josefa Márquez', 'RESIDENTIAL', 'active', 'user-sales-2', null, 4),
  customer('customer-005', 'Frutas Navarro', 'SME', 'renewal_due', 'user-sales-2', 'Frutas Navarro S.L.', 5),
  { ...customer('customer-006', 'Casa Rural La Safor', 'SME', 'active', 'user-sales-1', 'Casa Rural La Safor C.B.', 6), contract_signed_at: '2025-06-20', renewal_date: '2026-06-20' },
  { ...customer('customer-007', 'Clínica Dental Turia', 'SME', 'active', 'user-sales-1', 'Clínica Dental Turia S.L.', 7), contract_signed_at: '2025-06-25', renewal_date: '2026-06-25' },
  { ...customer('customer-008', 'Miguel Torres', 'RESIDENTIAL', 'active', 'user-sales-2', null, 8), contract_signed_at: '2025-06-30', renewal_date: '2026-06-30' },
  { ...customer('customer-009', 'Panadería Sol', 'SME', 'active', 'user-sales-2', 'Panadería Sol S.L.', 9), contract_signed_at: '2025-07-10', renewal_date: '2026-07-10' },
]

const statusSequence: Contract['status'][] = ['PENDING_PROCESSING', 'PROCESSING', 'PENDING_SIGNATURE', 'ACTIVE', 'CANCELLED']
const contracts: Contract[] = customers.map((item, index) => ({
  id: `contract-00${index + 1}`,
  customer_id: item.id,
  deal_id: null,
  proposal_id: null,
  status: statusSequence[index],
  contract_number: `ENE-${now.getFullYear()}-${String(index + 1).padStart(4, '0')}`,
  signed_at: statusSequence[index] === 'ACTIVE' ? item.contract_signed_at : null,
  starts_at: item.energy_data?.startDate ?? null,
  ends_at: item.energy_data?.endDate ?? null,
  amount_eur: 950 + index * 480,
  commission_eur: item.energy_data?.commission ?? 0,
  file_path: null,
  energy_data: item.energy_data,
  created_at: subDays(now, index + 2).toISOString(),
  updated_at: iso,
}))

const incidents: Incident[] = [
  { id: 'incident-001', title: 'Factura con consumo estimado incorrecto', description: 'El cliente indica que la lectura no coincide con el contador.', status: 'OPEN', priority: 'URGENT', customerId: 'customer-001', contractId: 'contract-001', createdAt: subDays(now, 1).toISOString(), updatedAt: iso, resolvedAt: null, assignedTo: 'user-sales-1', internalNotes: 'Solicitada fotografía del contador.' },
  { id: 'incident-002', title: 'Cambio de titular pendiente', description: 'Documentación enviada a la comercializadora.', status: 'IN_PROGRESS', priority: 'HIGH', customerId: 'customer-002', contractId: 'contract-002', createdAt: subDays(now, 4).toISOString(), updatedAt: subDays(now, 1).toISOString(), resolvedAt: null, assignedTo: 'user-admin', internalNotes: 'Revisar respuesta en 48 horas.' },
  { id: 'incident-003', title: 'Falta CIF actualizado', description: 'Necesitamos el CIF para completar la renovación.', status: 'WAITING_CUSTOMER', priority: 'MEDIUM', customerId: 'customer-005', contractId: null, createdAt: subDays(now, 7).toISOString(), updatedAt: subDays(now, 2).toISOString(), resolvedAt: null, assignedTo: 'user-sales-2', internalNotes: '' },
  { id: 'incident-004', title: 'Duplicidad de recibo resuelta', description: 'La comercializadora ha emitido abono.', status: 'RESOLVED', priority: 'LOW', customerId: 'customer-003', contractId: 'contract-003', createdAt: subDays(now, 20).toISOString(), updatedAt: subDays(now, 3).toISOString(), resolvedAt: subDays(now, 3).toISOString(), assignedTo: 'user-sales-2', internalNotes: 'Confirmado con el cliente.' },
]

type EntityName =
  | 'customers' | 'contracts' | 'incidents' | 'leads' | 'tasks' | 'documents'
  | 'energyProfiles' | 'invoices' | 'simulations' | 'proposals' | 'deals' | 'installations'

type AppState = {
  organization: Organization
  profiles: Profile[]
  currentUserId: string
  isAuthenticated: boolean
  customers: Customer[]
  contracts: Contract[]
  incidents: Incident[]
  leads: Lead[]
  tasks: Task[]
  documents: DocumentRecord[]
  activityLogs: ActivityLog[]
  energyProfiles: EnergyProfile[]
  invoices: Invoice[]
  simulations: Simulation[]
  proposals: Proposal[]
  pipelineStages: PipelineStage[]
  deals: Deal[]
  installations: Installation[]
  login: (userId: string) => void
  logout: () => void
  add: (entity: EntityName, value: unknown) => void
  update: (entity: EntityName, id: string, patch: Record<string, unknown>) => void
  setOrganization: (patch: Partial<Organization>) => void
  addProfile: (profile: Profile) => void
  updateProfile: (id: string, patch: Partial<Profile>) => void
}

const baseState = {
  organization: {
    id: 'org-demo',
    name: 'Eléctrico Renovaciones S.L.',
    legal_name: 'Eléctrico Renovaciones S.L.',
    tax_id: 'B72845193',
    email: 'equipo@electrico.local',
    phone: '+34 960 123 456',
    address: 'Av. del Puerto 118',
    city: 'Valencia',
    province: 'Valencia',
    postal_code: '46023',
  },
  profiles,
  currentUserId: 'user-admin',
  isAuthenticated: false,
  customers,
  contracts,
  incidents,
  leads: [] as Lead[],
  tasks: [] as Task[],
  documents: [] as DocumentRecord[],
  activityLogs: customers.map((item, index) => ({
    id: `activity-${index}`,
    actor_id: item.assigned_to,
    entity_type: 'customer',
    entity_id: item.id,
    action: 'customer_updated',
    metadata: { label: `Ficha actualizada: ${item.name}` },
    created_at: subDays(now, index).toISOString(),
  })),
  energyProfiles: customers.map((item, index) => ({
    id: `energy-profile-${index}`,
    customer_id: item.id,
    cups: item.energy_data?.cups ?? null,
    tariff_type: item.energy_data?.tariff ?? '',
    contracted_power_kw: item.type === 'RESIDENTIAL' ? 4.6 : 15,
    monthly_consumption_kwh: (item.energy_data?.annualConsumptionKwh ?? 0) / 12,
    monthly_cost_eur: item.type === 'RESIDENTIAL' ? 82 : 680,
    annual_consumption_kwh: item.energy_data?.annualConsumptionKwh ?? null,
    has_solar: false,
    roof_area_m2: null,
    notes: item.energy_data?.notes ?? null,
    created_at: iso,
    updated_at: iso,
  })),
  invoices: [] as Invoice[],
  simulations: [] as Simulation[],
  proposals: [] as Proposal[],
  pipelineStages: [
    { id: 'stage-1', name: 'Nuevo contacto', position: 1, color: '#0ea5e9', is_won: false, is_lost: false, created_at: iso, updated_at: iso },
    { id: 'stage-2', name: 'Propuesta', position: 2, color: '#8b5cf6', is_won: false, is_lost: false, created_at: iso, updated_at: iso },
    { id: 'stage-3', name: 'Ganado', position: 3, color: '#22c55e', is_won: true, is_lost: false, created_at: iso, updated_at: iso },
  ],
  deals: [] as Deal[],
  installations: [] as Installation[],
}

function normalizeStoredState(state: Partial<AppState>) {
  return {
    ...state,
    customers: (state.customers ?? customers).map((item) => ({
      ...item,
      type: item.type === 'SME' || item.type === 'RESIDENTIAL'
        ? item.type
        : item.company ? 'SME' as const : 'RESIDENTIAL' as const,
      energy_data: item.energy_data ?? null,
    })),
    contracts: (state.contracts ?? contracts).map((item) => ({
      ...item,
      status: normalizeContractStatus(item.status),
      contract_number: item.contract_number || 'Sin número',
      customer_id: item.customer_id || '',
      amount_eur: Number(item.amount_eur ?? 0),
      commission_eur: item.commission_eur ?? item.energy_data?.commission ?? 0,
      energy_data: item.energy_data ?? null,
    })),
    incidents: state.incidents ?? incidents,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...baseState,
      login: (userId) => set({ currentUserId: userId, isAuthenticated: true }),
      logout: () => set({ isAuthenticated: false }),
      add: (entity, value) => set((state) => ({ [entity]: [value, ...state[entity]] }) as Partial<AppState>),
      update: (entity, id, patch) => set((state) => ({
        [entity]: (state[entity] as Array<{ id: string }>).map((item) =>
          item.id === id ? { ...item, ...patch, updated_at: iso, updatedAt: iso } : item,
        ),
      }) as Partial<AppState>),
      setOrganization: (patch) => set((state) => ({ organization: { ...state.organization, ...patch } })),
      addProfile: (profile) => set((state) => ({ profiles: [...state.profiles, profile] })),
      updateProfile: (id, patch) => set((state) => ({
        profiles: state.profiles.map((profile) => profile.id === id ? { ...profile, ...patch } : profile),
      })),
    }),
    {
      name: 'crm-electrico-state-v6',
      version: 6,
      merge: (persisted, current) => ({ ...current, ...normalizeStoredState(persisted as Partial<AppState>) }),
    },
  ),
)

export function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function timestamp() {
  return new Date().toISOString()
}
