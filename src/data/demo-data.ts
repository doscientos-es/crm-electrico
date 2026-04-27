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

const orgId = 'org-energiza-demo'
const now = new Date('2026-04-27T10:00:00.000Z').toISOString()

const organization: Organization = {
  id: orgId,
  name: 'Energiza Gestion Demo S.L.',
  legal_name: 'Energiza Gestion Demo S.L.',
  tax_id: 'B72845193',
  email: 'demo@energiza.local',
  phone: '+34 960 123 456',
  address: 'Av. de Aragon 30',
  city: 'Valencia',
  province: 'Valencia',
  postal_code: '46021',
  created_at: now,
  updated_at: now,
}

const profiles: Profile[] = [
  {
    id: 'user-owner',
    organization_id: orgId,
    full_name: 'Laura Martinez',
    email: 'laura@energiza.local',
    role: 'owner',
    phone: '+34 600 111 001',
    created_at: now,
  },
  {
    id: 'user-admin',
    organization_id: orgId,
    full_name: 'Carlos Rivas',
    email: 'carlos@energiza.local',
    role: 'admin',
    phone: '+34 600 111 002',
    created_at: now,
  },
  {
    id: 'user-sales',
    organization_id: orgId,
    full_name: 'Marta Soler',
    email: 'marta@energiza.local',
    role: 'sales',
    phone: '+34 600 111 003',
    created_at: now,
  },
  {
    id: 'user-tech',
    organization_id: orgId,
    full_name: 'Javier Nunez',
    email: 'javier@energiza.local',
    role: 'technician',
    phone: '+34 600 111 004',
    created_at: now,
  },
  {
    id: 'user-viewer',
    organization_id: orgId,
    full_name: 'Ana Beltran',
    email: 'ana@energiza.local',
    role: 'viewer',
    phone: '+34 600 111 005',
    created_at: now,
  },
]

const stageNames = [
  ['stage-new', 'Nuevo', '#0ea5e9'],
  ['stage-diagnosis', 'Diagnostico', '#6366f1'],
  ['stage-invoice', 'Factura recibida', '#8b5cf6'],
  ['stage-simulation', 'Simulacion enviada', '#06b6d4'],
  ['stage-proposal', 'Propuesta enviada', '#f59e0b'],
  ['stage-negotiation', 'Negociacion', '#f97316'],
  ['stage-won', 'Ganado', '#059669'],
  ['stage-lost', 'Perdido', '#dc2626'],
] as const

const pipelineStages: PipelineStage[] = stageNames.map(([id, name, color], index) => ({
  id,
  organization_id: orgId,
  name,
  color,
  position: index + 1,
  is_won: id === 'stage-won',
  is_lost: id === 'stage-lost',
  created_at: now,
  updated_at: now,
  created_by: 'user-owner',
}))

const leadSamples = [
  ['lead-001', 'Restaurante La Marina', 'Pablo Serra', 'web', 'new', 840, 'Valencia'],
  ['lead-002', 'Comunidad Residencial Azahar', 'Elena Vidal', 'referido', 'contacted', 1950, 'Castellon'],
  ['lead-003', 'Talleres Ferrer', 'Ramon Ferrer', 'llamada', 'qualified', 620, 'Alicante'],
  ['lead-004', 'Clinica Dental Benimaclet', 'Sofia Orts', 'campana local', 'contacted', 410, 'Valencia'],
  ['lead-005', 'Panaderia Sol', 'Ines Costa', 'feria solar', 'new', 530, 'Torrent'],
  ['lead-006', 'Hotel Rural Montgo', 'Vicent Llopis', 'web', 'qualified', 1280, 'Denia'],
  ['lead-007', 'Comunidad Plaza Mayor', 'Amparo Gil', 'referido', 'new', 2200, 'Paterna'],
  ['lead-008', 'Frutas Navarro', 'Jorge Navarro', 'llamada', 'contacted', 760, 'Alzira'],
  ['lead-009', 'Despacho Abogados Turia', 'Belen Grau', 'web', 'new', 290, 'Valencia'],
  ['lead-010', 'Gimnasio Activa', 'Nerea Rubio', 'campana local', 'qualified', 980, 'Sagunto'],
  ['lead-011', 'Farmacia Oliver', 'Mar Oliver', 'referido', 'contacted', 360, 'Mislata'],
  ['lead-012', 'Lavanderia Centro', 'Oscar Calvo', 'web', 'new', 690, 'Valencia'],
  ['lead-013', 'Cooperativa Horta Nord', 'Pere Moya', 'feria solar', 'qualified', 1750, 'Meliana'],
  ['lead-014', 'Residencial Malvarrosa', 'Carmen Roig', 'referido', 'contacted', 1460, 'Valencia'],
  ['lead-015', 'Autoescuela Avenida', 'Noelia Sanz', 'llamada', 'lost', 250, 'Aldaia'],
] as const

const leads: Lead[] = leadSamples.map(([id, company, contact, source, status, bill, city], index) => ({
  id,
  organization_id: orgId,
  source,
  status,
  company_name: company,
  contact_name: contact,
  email: `${contact.toLowerCase().split(' ')[0]}@demo.local`,
  phone: `+34 96${index} ${String(234000 + index)}`,
  city,
  province: city === 'Castellon' ? 'Castellon' : city === 'Alicante' || city === 'Denia' ? 'Alicante' : 'Valencia',
  notes: `Interesado en optimizacion de factura y posible autoconsumo. Factura aproximada ${bill} EUR/mes.`,
  estimated_monthly_bill: bill,
  assigned_to: index % 2 === 0 ? 'user-sales' : 'user-admin',
  created_at: new Date(Date.now() - (index + 1) * 86400000).toISOString(),
  updated_at: now,
  created_by: 'user-sales',
}))

const customerSamples = [
  ['customer-001', 'Bar Mediterraneo', 'business', 720, '3.0TD', 4800, true, 'Valencia'],
  ['customer-002', 'Vivienda Unifamiliar Godella', 'residential', 185, '2.0TD', 920, true, 'Godella'],
  ['customer-003', 'Comunidad Garbi', 'community', 2300, '3.0TD', 15100, false, 'Valencia'],
  ['customer-004', 'Ceramicas Norte', 'industrial', 1450, '6.1TD', 9400, false, 'Castellon'],
  ['customer-005', 'Supermercado Local Alzira', 'business', 1120, '3.0TD', 7200, true, 'Alzira'],
  ['customer-006', 'Residencial Turia 24', 'community', 980, '3.0TD', 6100, false, 'Valencia'],
  ['customer-007', 'Clinica Nova Salut', 'business', 640, '3.0TD', 3900, false, 'Torrent'],
  ['customer-008', 'Casa Rural La Safor', 'business', 430, '2.0TD', 2100, true, 'Gandia'],
  ['customer-009', 'Metalicas Levante', 'industrial', 1880, '6.1TD', 12800, false, 'Paterna'],
  ['customer-010', 'Restaurante El Puerto', 'business', 860, '3.0TD', 5600, true, 'Valencia'],
] as const

const customers: Customer[] = customerSamples.map(([id, name, type, , , , , city], index) => ({
  id,
  organization_id: orgId,
  type,
  name,
  legal_name: `${name} S.L.`,
  tax_id: `B46${String(100000 + index)}`,
  contact_name: ['Pablo Serra', 'Lucia Moreno', 'Jose Ferran', 'Nuria Prats', 'Jorge Navarro'][index % 5],
  email: `cliente${index + 1}@demo.local`,
  phone: `+34 650 21${String(index).padStart(2, '0')} 0${index}`,
  address: `Calle Energia ${index + 1}`,
  city,
  province: city === 'Castellon' ? 'Castellon' : 'Valencia',
  postal_code: `46${String(100 + index)}`,
  latitude: 39.4699 + index / 1000,
  longitude: -0.3763 - index / 1000,
  notes: 'Cliente demo con historico energetico preparado para simulacion comercial.',
  created_at: new Date(Date.now() - (index + 18) * 86400000).toISOString(),
  updated_at: now,
  created_by: 'user-sales',
}))

const energyProfiles: CustomerEnergyProfile[] = customerSamples.map(([customerId, , , cost, tariff, consumption, solar], index) => ({
  id: `energy-${String(index + 1).padStart(3, '0')}`,
  organization_id: orgId,
  customer_id: customerId,
  cups: `ES00210000${String(1000000000 + index)}AB`,
  tariff_type: tariff,
  contracted_power_kw: tariff === '2.0TD' ? 5.75 : tariff === '6.1TD' ? 55 : 15,
  monthly_consumption_kwh: consumption,
  monthly_cost_eur: cost,
  annual_consumption_kwh: consumption * 12,
  has_solar: solar,
  roof_area_m2: solar ? 95 + index * 12 : undefined,
  notes: solar ? 'Cubierta apta para propuesta fotovoltaica.' : 'Priorizar optimizacion de potencia y tarifa.',
  created_at: now,
  updated_at: now,
  created_by: 'user-sales',
}))

const invoices: Invoice[] = customers.slice(0, 6).map((customer, index) => {
  const energy = energyProfiles.find((item) => item.customer_id === customer.id)
  return {
    id: `invoice-${String(index + 1).padStart(3, '0')}`,
    organization_id: orgId,
    customer_id: customer.id,
    energy_profile_id: energy?.id,
    file_path: `${orgId}/${customer.id}/invoice-${index + 1}/factura-demo.pdf`,
    file_name: `factura-${customer.name.toLowerCase().replaceAll(' ', '-')}.pdf`,
    period_start: '2026-03-01',
    period_end: '2026-03-31',
    total_amount_eur: energy?.monthly_cost_eur ?? 500,
    consumption_kwh: energy?.monthly_consumption_kwh,
    contracted_power_kw: energy?.contracted_power_kw,
    tariff_type: energy?.tariff_type,
    provider: ['Iberdrola', 'Endesa', 'Naturgy', 'TotalEnergies'][index % 4],
    uploaded_by: 'user-sales',
    created_at: now,
    updated_at: now,
    created_by: 'user-sales',
  }
})

function simulationFor(customer: Customer, index: number): SavingSimulation {
  const energy = energyProfiles.find((item) => item.customer_id === customer.id)!
  const percent = [18, 24, 14, 11, 27][index] ?? 16
  const monthlySaving = Number((energy.monthly_cost_eur * (percent / 100)).toFixed(2))
  const annualSaving = Number((monthlySaving * 12).toFixed(2))
  const solarInvestment = energy.has_solar ? 7800 + index * 1300 : undefined
  return {
    id: `simulation-${String(index + 1).padStart(3, '0')}`,
    organization_id: orgId,
    customer_id: customer.id,
    energy_profile_id: energy.id,
    invoice_id: invoices[index]?.id,
    current_monthly_cost_eur: energy.monthly_cost_eur,
    contracted_power_kw: energy.contracted_power_kw,
    monthly_consumption_kwh: energy.monthly_consumption_kwh,
    tariff_type: energy.tariff_type,
    estimated_saving_percent: percent,
    proposed_monthly_cost_eur: Number((energy.monthly_cost_eur - monthlySaving).toFixed(2)),
    monthly_saving_eur: monthlySaving,
    annual_saving_eur: annualSaving,
    solar_investment_eur: solarInvestment,
    roi_years: solarInvestment ? Number((solarInvestment / annualSaving).toFixed(2)) : undefined,
    notes: 'Simulacion demo con optimizacion tarifaria y autoconsumo si aplica.',
    created_at: now,
    updated_at: now,
    created_by: 'user-sales',
  }
}

const simulations = customers.slice(0, 5).map(simulationFor)

const dealSamples = [
  ['deal-001', 'customer-001', 'stage-negotiation', 'Optimizacion + solar Bar Mediterraneo', 18500, 70],
  ['deal-002', 'customer-002', 'stage-proposal', 'Autoconsumo vivienda Godella', 9200, 65],
  ['deal-003', 'customer-003', 'stage-invoice', 'Auditoria energetica Comunidad Garbi', 4200, 35],
  ['deal-004', 'customer-004', 'stage-diagnosis', 'Revision potencia Ceramicas Norte', 6800, 30],
  ['deal-005', 'customer-005', 'stage-won', 'Solar Supermercado Alzira', 23500, 100],
  ['deal-006', 'customer-006', 'stage-simulation', 'Servicios comunes Residencial Turia', 5400, 50],
  ['deal-007', 'customer-008', 'stage-new', 'Estudio fotovoltaico Casa Rural', 11800, 25],
  ['deal-008', 'customer-009', 'stage-lost', 'Contrato Metalicas Levante', 7300, 0],
] as const

const normalizedDeals: Deal[] = dealSamples.map((item, index) => ({
  id: item[0],
  organization_id: orgId,
  customer_id: item[1],
  stage_id: item[2],
  title: item[3],
  status: item[2] === 'stage-won' ? 'won' : item[2] === 'stage-lost' ? 'lost' : 'open',
  value_eur: item[4],
  probability: item[5],
  expected_close_date: new Date(Date.now() + (index + 3) * 86400000).toISOString().slice(0, 10),
  assigned_to: index % 2 === 0 ? 'user-sales' : 'user-admin',
  won_at: item[2] === 'stage-won' ? now : undefined,
  lost_reason: item[2] === 'stage-lost' ? 'Cliente pospone inversion hasta Q3.' : undefined,
  created_at: new Date(Date.now() - (index + 4) * 86400000).toISOString(),
  updated_at: now,
  created_by: 'user-sales',
}))

const proposals: Proposal[] = simulations.slice(0, 4).map((simulation, index) => ({
  id: `proposal-${String(index + 1).padStart(3, '0')}`,
  organization_id: orgId,
  customer_id: simulation.customer_id,
  simulation_id: simulation.id,
  deal_id: normalizedDeals[index]?.id,
  status: ['sent', 'draft', 'accepted', 'rejected'][index] as Proposal['status'],
  title: `Propuesta ahorro energetico ${index + 1}`,
  services: ['Optimizacion de potencia', 'Cambio de tarifa', simulation.solar_investment_eur ? 'Instalacion fotovoltaica' : 'Seguimiento trimestral'].filter(Boolean),
  estimated_price_eur: simulation.solar_investment_eur ?? 1200 + index * 450,
  valid_until: new Date(Date.now() + (15 + index * 5) * 86400000).toISOString().slice(0, 10),
  sent_at: index === 0 ? now : undefined,
  accepted_at: index === 2 ? now : undefined,
  created_at: now,
  updated_at: now,
  created_by: 'user-sales',
}))

const contracts: Contract[] = proposals.slice(0, 3).map((proposal, index) => ({
  id: `contract-${String(index + 1).padStart(3, '0')}`,
  organization_id: orgId,
  customer_id: proposal.customer_id,
  deal_id: proposal.deal_id,
  proposal_id: proposal.id,
  status: ['signed', 'sent', 'draft'][index] as Contract['status'],
  contract_number: `EG-2026-${String(index + 1).padStart(4, '0')}`,
  signed_at: index === 0 ? now : undefined,
  starts_at: '2026-05-01',
  ends_at: '2027-04-30',
  amount_eur: proposal.estimated_price_eur,
  file_path: `${orgId}/${proposal.customer_id}/contract-${index + 1}/contrato.pdf`,
  created_at: now,
  updated_at: now,
  created_by: 'user-admin',
}))

const installations: Installation[] = customers.slice(0, 5).map((customer, index) => ({
  id: `installation-${String(index + 1).padStart(3, '0')}`,
  organization_id: orgId,
  customer_id: customer.id,
  deal_id: normalizedDeals[index]?.id,
  contract_id: contracts[index]?.id,
  status: ['scheduled', 'pending', 'in_progress', 'completed', 'scheduled'][index] as Installation['status'],
  type: energyProfiles[index].has_solar ? 'Autoconsumo solar' : 'Visita tecnica energetica',
  address: customer.address ?? 'Direccion pendiente',
  city: customer.city,
  province: customer.province,
  postal_code: customer.postal_code,
  latitude: customer.latitude,
  longitude: customer.longitude,
  assigned_technician: 'user-tech',
  scheduled_at: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
  completed_at: index === 3 ? now : undefined,
  notes: 'Revisar cuadro electrico, cubierta y consumo por franjas.',
  created_at: now,
  updated_at: now,
  created_by: 'user-admin',
}))

const installationVisits: InstallationVisit[] = installations.slice(0, 3).map((installation, index) => ({
  id: `visit-${String(index + 1).padStart(3, '0')}`,
  organization_id: orgId,
  installation_id: installation.id,
  technician_id: 'user-tech',
  scheduled_at: installation.scheduled_at,
  started_at: index === 2 ? now : undefined,
  completed_at: index === 0 ? now : undefined,
  latitude: installation.latitude,
  longitude: installation.longitude,
  notes: 'Fotos de cuadro electrico pendientes de revision.',
  photo_paths: index === 0 ? [`${orgId}/${installation.customer_id}/${installation.id}/visit-${index + 1}/foto-1.jpg`] : [],
  created_at: now,
  updated_at: now,
  created_by: 'user-tech',
}))

const taskSamples = [
  ['task-001', 'Llamar a Restaurante La Marina', 'lead-001', undefined, 'high'],
  ['task-002', 'Enviar propuesta a Vivienda Godella', undefined, 'customer-002', 'medium'],
  ['task-003', 'Revisar factura Comunidad Garbi', undefined, 'customer-003', 'high'],
  ['task-004', 'Confirmar visita Supermercado Alzira', undefined, 'customer-005', 'urgent'],
  ['task-005', 'Actualizar contrato Bar Mediterraneo', undefined, 'customer-001', 'medium'],
  ['task-006', 'Pedir CUPS a Clinica Nova Salut', undefined, 'customer-007', 'low'],
  ['task-007', 'Cerrar perdida Metalicas Levante', undefined, 'customer-009', 'medium'],
  ['task-008', 'Preparar ROI solar Casa Rural', undefined, 'customer-008', 'high'],
  ['task-009', 'Subir fotos visita tecnica', undefined, 'customer-004', 'medium'],
  ['task-010', 'Reunion trimestral Residencial Turia', undefined, 'customer-006', 'low'],
] as const

const normalizedTasks: Task[] = taskSamples.map((item, index) => ({
  id: item[0],
  organization_id: orgId,
  title: item[1],
  lead_id: item[2],
  customer_id: item[3],
  status: index === 6 ? 'done' : index === 8 ? 'in_progress' : 'pending',
  priority: item[4],
  due_at: new Date(Date.now() + (index + 1) * 12 * 3600000).toISOString(),
  assigned_to: index % 3 === 0 ? 'user-tech' : 'user-sales',
  completed_at: index === 6 ? now : undefined,
  created_at: now,
  updated_at: now,
  created_by: 'user-sales',
}))

const documents: Document[] = [
  ...invoices.map((invoice) => ({
    id: `doc-${invoice.id}`,
    organization_id: orgId,
    customer_id: invoice.customer_id,
    type: 'invoice' as const,
    bucket: 'invoices',
    file_path: invoice.file_path,
    file_name: invoice.file_name,
    mime_type: 'application/pdf',
    size_bytes: 420_000,
    uploaded_by: invoice.uploaded_by,
    created_at: invoice.created_at,
    updated_at: invoice.updated_at,
    created_by: invoice.created_by,
  })),
]

const activityLogs: ActivityLog[] = [
  ['lead_created', 'lead-001', 'Lead creado: Restaurante La Marina'],
  ['invoice_uploaded', 'invoice-001', 'Factura subida para Bar Mediterraneo'],
  ['simulation_created', 'simulation-001', 'Simulacion creada con ahorro anual de 1.555 EUR'],
  ['proposal_sent', 'proposal-001', 'Propuesta enviada a Bar Mediterraneo'],
  ['deal_won', 'deal-005', 'Oportunidad ganada: Solar Supermercado Alzira'],
  ['visit_scheduled', 'installation-001', 'Visita tecnica programada'],
].map(([action, entityId, label], index) => ({
  id: `activity-${index + 1}`,
  organization_id: orgId,
  actor_id: index % 2 === 0 ? 'user-sales' : 'user-admin',
  entity_type: action.split('_')[0],
  entity_id: entityId,
  action,
  metadata: { label },
  created_at: new Date(Date.now() - index * 3600000).toISOString(),
}))

export const initialDemoState: DemoState = {
  organization,
  profiles,
  currentUserId: 'user-owner',
  isAuthenticated: true,
  leads,
  customers,
  energyProfiles,
  invoices,
  simulations,
  proposals,
  pipelineStages,
  deals: normalizedDeals,
  tasks: normalizedTasks,
  documents,
  contracts,
  installations,
  installationVisits,
  activityLogs,
}
