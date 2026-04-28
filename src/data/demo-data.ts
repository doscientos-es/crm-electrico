import { addMonths, subDays, subMonths } from 'date-fns'
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
  Organization,
  PipelineStage,
  Profile,
  Proposal,
  SavingSimulation,
  Task,
} from '../types/domain'
import { getRenewalAlertDate } from '../lib/customer-workflow'

const orgId = 'org-renovaciones-demo'
const now = new Date('2026-04-28T09:00:00.000Z')
const nowIso = now.toISOString()

const organization: Organization = {
  id: orgId,
  name: 'Electrico Renovaciones S.L.',
  legal_name: 'Electrico Renovaciones S.L.',
  tax_id: 'B72845193',
  email: 'equipo@electrico.local',
  phone: '+34 960 123 456',
  address: 'Av. del Puerto 118',
  city: 'Valencia',
  province: 'Valencia',
  postal_code: '46023',
  created_at: nowIso,
  updated_at: nowIso,
}

const profiles: Profile[] = [
  {
    id: 'user-admin',
    organization_id: orgId,
    full_name: 'Carlos Rivas',
    email: 'carlos@electrico.local',
    role: 'admin',
    phone: '+34 600 111 001',
    created_at: nowIso,
  },
  {
    id: 'user-sales-1',
    organization_id: orgId,
    full_name: 'Marta Soler',
    email: 'marta@electrico.local',
    role: 'sales',
    phone: '+34 600 111 002',
    created_at: nowIso,
  },
  {
    id: 'user-sales-2',
    organization_id: orgId,
    full_name: 'Diego Paredes',
    email: 'diego@electrico.local',
    role: 'sales',
    phone: '+34 600 111 003',
    created_at: nowIso,
  },
  {
    id: 'user-sales-3',
    organization_id: orgId,
    full_name: 'Nuria Campos',
    email: 'nuria@electrico.local',
    role: 'sales',
    phone: '+34 600 111 004',
    created_at: nowIso,
  },
]

const pipelineStages: PipelineStage[] = []
const leads: Lead[] = []
const deals: Deal[] = []
const invoices: Invoice[] = []
const simulations: SavingSimulation[] = []
const proposals: Proposal[] = []
const tasks: Task[] = []
const installations: Installation[] = []
const installationVisits: InstallationVisit[] = []

function makeCustomer(
  id: string,
  name: string,
  status: Customer['status'],
  assignedTo: string,
  contractSignedAt: Date,
  productsServices: string[],
  city: string,
  company?: string,
) {
  const renewalDate = addMonths(contractSignedAt, 12)
  return {
    id,
    organization_id: orgId,
    type: company ? 'business' : 'residential',
    name,
    company,
    legal_name: company,
    dni: company ? undefined : `25${id.slice(-3)}443${id.slice(-1)}X`,
    tax_id: company ? `B46${id.slice(-3)}921` : undefined,
    status,
    contact_name: name,
    email: `${name.toLowerCase().replaceAll(' ', '.')}@cliente.local`,
    phone: `+34 640 12${id.slice(-2)} ${id.slice(-2)}${id.slice(-1)}`,
    address: `Calle Renovacion ${id.slice(-2)}`,
    city,
    province: city === 'Castellon' ? 'Castellon' : 'Valencia',
    postal_code: `46${id.slice(-3)}`,
    contract_signed_at: contractSignedAt.toISOString().slice(0, 10),
    renewal_date: renewalDate.toISOString().slice(0, 10),
    renewal_alert_months: 10,
    products_services: productsServices,
    assigned_to: assignedTo,
    last_contact_at: subDays(renewalDate, 45).toISOString(),
    notes: 'Cliente de cartera migrado desde Excel. Revisar renovacion y documentacion anual.',
    created_at: subMonths(contractSignedAt, 1).toISOString(),
    updated_at: nowIso,
    created_by: 'user-admin',
  } satisfies Customer
}

const customers: Customer[] = [
  makeCustomer(
    'customer-001',
    'Bar Mediterraneo',
    'active',
    'user-sales-1',
    subMonths(now, 8),
    ['Luz pyme', 'Mantenimiento anual'],
    'Valencia',
    'Bar Mediterraneo S.L.',
  ),
  makeCustomer(
    'customer-002',
    'Lucia Moreno',
    'renewal_due',
    'user-sales-1',
    subMonths(now, 10),
    ['Tarifa hogar'],
    'Godella',
  ),
  makeCustomer(
    'customer-003',
    'Comunidad Garbi',
    'renewal_due',
    'user-sales-2',
    subMonths(now, 11),
    ['Luz comunidad', 'Gestoria de renovacion'],
    'Valencia',
    'Comunidad Garbi',
  ),
  makeCustomer(
    'customer-004',
    'Ceramicas Norte',
    'active',
    'user-sales-2',
    subMonths(now, 5),
    ['Luz industrial', 'Optimizacion de potencia'],
    'Castellon',
    'Ceramicas Norte S.L.',
  ),
  makeCustomer(
    'customer-005',
    'Supermercado Alzira',
    'renewed',
    'user-sales-3',
    subMonths(now, 1),
    ['Luz pyme', 'Gas', 'Seguimiento trimestral'],
    'Alzira',
    'Supermercado Alzira S.L.',
  ),
  makeCustomer(
    'customer-006',
    'Residencial Turia 24',
    'inactive',
    'user-sales-3',
    subMonths(now, 14),
    ['Luz zonas comunes'],
    'Valencia',
    'Residencial Turia 24',
  ),
  makeCustomer(
    'customer-007',
    'Clinica Nova Salut',
    'lost',
    'user-sales-1',
    subMonths(now, 15),
    ['Luz pyme'],
    'Torrent',
    'Clinica Nova Salut S.L.',
  ),
  makeCustomer(
    'customer-008',
    'Casa Rural La Safor',
    'renewal_due',
    'user-sales-3',
    subMonths(now, 10),
    ['Luz pyme', 'Gas'],
    'Gandia',
    'Casa Rural La Safor C.B.',
  ),
  makeCustomer(
    'customer-009',
    'Josefa Marquez',
    'active',
    'user-sales-1',
    subMonths(now, 4),
    ['Tarifa hogar', 'Seguro de mantenimiento'],
    'Burjassot',
  ),
  makeCustomer(
    'customer-010',
    'Frutas Navarro',
    'renewal_due',
    'user-sales-2',
    subMonths(now, 10),
    ['Luz pyme', 'Gas', 'Soporte de incidencias'],
    'Alzira',
    'Frutas Navarro S.L.',
  ),
  makeCustomer(
    'customer-011',
    'Residencial Parque Central',
    'active',
    'user-sales-2',
    subMonths(now, 7),
    ['Luz zonas comunes', 'Gestoria de renovacion'],
    'Valencia',
    'Residencial Parque Central',
  ),
  makeCustomer(
    'customer-012',
    'Talleres Ferrer',
    'renewed',
    'user-sales-3',
    subMonths(now, 2),
    ['Luz pyme', 'Optimizacion de potencia'],
    'Paterna',
    'Talleres Ferrer S.L.',
  ),
]

const energyProfiles: CustomerEnergyProfile[] = customers.map((customer, index) => ({
  id: `energy-${String(index + 1).padStart(3, '0')}`,
  organization_id: orgId,
  customer_id: customer.id,
  cups: `ES00210000${String(1000000000 + index)}AB`,
  tariff_type: customer.type === 'residential' ? '2.0TD' : customer.company?.includes('Ceramicas') ? '6.1TD' : '3.0TD',
  contracted_power_kw: customer.type === 'residential' ? 5.75 : customer.company?.includes('Ceramicas') ? 55 : 15,
  monthly_consumption_kwh: 950 + index * 430,
  monthly_cost_eur: 180 + index * 95,
  annual_consumption_kwh: (950 + index * 430) * 12,
  has_solar: index % 3 === 0,
  roof_area_m2: index % 3 === 0 ? 85 + index * 10 : undefined,
  notes: 'Perfil de consumo migrado desde historial del cliente.',
  created_at: nowIso,
  updated_at: nowIso,
  created_by: 'user-admin',
}))

const contracts: Contract[] = customers.map((customer, index) => ({
  id: `contract-${String(index + 1).padStart(3, '0')}`,
  organization_id: orgId,
  customer_id: customer.id,
  status: customer.status === 'lost' || customer.status === 'inactive' ? 'cancelled' : 'signed',
  contract_number: `REN-2026-${String(index + 1).padStart(4, '0')}`,
  signed_at: customer.contract_signed_at,
  starts_at: customer.contract_signed_at,
  ends_at: customer.renewal_date,
  amount_eur: 900 + index * 150,
  file_path: `${orgId}/${customer.id}/contracts/contrato-${index + 1}.pdf`,
  created_at: nowIso,
  updated_at: nowIso,
  created_by: 'user-admin',
}))

const documents: Document[] = customers.flatMap((customer, index) => [
  {
    id: `doc-contract-${index + 1}`,
    organization_id: orgId,
    customer_id: customer.id,
    type: 'contract',
    bucket: 'customer-documents',
    file_path: `${orgId}/${customer.id}/contracts/contrato-${index + 1}.pdf`,
    file_name: `contrato-${customer.name.toLowerCase().replaceAll(' ', '-')}.pdf`,
    mime_type: 'application/pdf',
    size_bytes: 420_000,
    uploaded_by: 'user-admin',
    created_at: nowIso,
    updated_at: nowIso,
    created_by: 'user-admin',
  },
  {
    id: `doc-id-${index + 1}`,
    organization_id: orgId,
    customer_id: customer.id,
    type: customer.company ? 'cif' : 'dni',
    bucket: 'customer-documents',
    file_path: `${orgId}/${customer.id}/docs/identificacion-${index + 1}.pdf`,
    file_name: customer.company ? 'cif.pdf' : 'dni.pdf',
    mime_type: 'application/pdf',
    size_bytes: 180_000,
    uploaded_by: customer.assigned_to,
    created_at: subDays(now, index + 3).toISOString(),
    updated_at: nowIso,
    created_by: customer.assigned_to,
  },
])

const activityLogs: ActivityLog[] = customers.map((customer, index) => {
  const alertDate = getRenewalAlertDate(customer)
  return {
    id: `activity-${index + 1}`,
    organization_id: orgId,
    actor_id: customer.assigned_to,
    entity_type: 'customer',
    entity_id: customer.id,
    action: customer.status === 'renewal_due' ? 'renewal_due' : 'customer_synced',
    metadata: {
      label:
        customer.status === 'renewal_due'
          ? `Aviso automatico de renovacion para ${customer.name}${alertDate ? ` desde ${alertDate.toISOString().slice(0, 10)}` : ''}`
          : `Ficha consolidada para ${customer.name}`,
    },
    created_at: subDays(now, index).toISOString(),
  }
})

export const initialDemoState: DemoState = {
  organization,
  profiles,
  currentUserId: 'user-admin',
  isAuthenticated: false,
  leads,
  customers,
  energyProfiles,
  invoices,
  simulations,
  proposals,
  pipelineStages,
  deals,
  tasks,
  documents,
  contracts,
  installations,
  installationVisits,
  activityLogs,
}
