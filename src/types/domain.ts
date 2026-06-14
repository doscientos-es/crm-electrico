import type {
  AppRole,
  CustomerStatus,
  DocumentType,
  InstallationStatus,
  LeadStatus,
  ProposalStatus,
  TaskPriority,
  TaskStatus,
} from './database.types'

export type CustomerType = 'RESIDENTIAL' | 'SME'
export type ContractStatus =
  | 'PENDING_PROCESSING'
  | 'PROCESSING'
  | 'PENDING_SIGNATURE'
  | 'ACTIVE'
  | 'CANCELLED'
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED'
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type EnergyData = {
  cups: string
  marketer: string
  product: string
  annualConsumptionKwh: number
  tariff: string
  energyPrice: number
  powerPrice: number
  commission: number
  estimatedMargin: number
  startDate: string
  endDate: string
  notes: string
}

export type Organization = {
  id: string
  name: string
  legal_name: string | null
  tax_id: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
}

export type Profile = {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: AppRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Customer = {
  id: string
  type: CustomerType
  name: string
  company: string | null
  dni: string | null
  legal_name: string | null
  tax_id: string | null
  status: CustomerStatus
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  contract_signed_at: string | null
  renewal_date: string | null
  renewal_alert_months: number
  products_services: string[]
  assigned_to: string | null
  last_contact_at: string | null
  notes: string | null
  energy_data: EnergyData | null
  created_at: string
  updated_at: string
}

export type Contract = {
  id: string
  customer_id: string
  deal_id: string | null
  proposal_id: string | null
  status: ContractStatus
  contract_number: string
  signed_at: string | null
  starts_at: string | null
  ends_at: string | null
  amount_eur: number
  commission_eur: number
  file_path: string | null
  energy_data: EnergyData | null
  created_at: string
  updated_at: string
}

export type Incident = {
  id: string
  title: string
  description: string
  status: IncidentStatus
  priority: IncidentPriority
  customerId: string
  contractId: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  assignedTo: string | null
  internalNotes: string
}

export type Lead = {
  id: string
  source: string
  status: LeadStatus
  company_name: string | null
  contact_name: string
  email: string | null
  phone: string | null
  city: string | null
  notes: string | null
  estimated_monthly_bill: number | null
  assigned_to: string | null
  converted_customer_id: string | null
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  customer_id: string | null
  lead_id: string | null
  deal_id: string | null
  installation_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_at: string
  assigned_to: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type DocumentRecord = {
  id: string
  customer_id: string | null
  deal_id: string | null
  installation_id: string | null
  type: DocumentType
  bucket: string
  file_path: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export type ActivityLog = {
  id: string
  actor_id: string | null
  entity_type: string
  entity_id: string
  action: string
  metadata: Record<string, unknown>
  created_at: string
}

export type EnergyProfile = {
  id: string
  customer_id: string
  cups: string | null
  tariff_type: string
  contracted_power_kw: number
  monthly_consumption_kwh: number
  monthly_cost_eur: number
  annual_consumption_kwh: number | null
  has_solar: boolean
  roof_area_m2: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Invoice = {
  id: string
  customer_id: string
  energy_profile_id: string | null
  file_path: string
  file_name: string
  period_start: string | null
  period_end: string | null
  total_amount_eur: number
  consumption_kwh: number | null
  contracted_power_kw: number | null
  tariff_type: string | null
  provider: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export type Simulation = {
  id: string
  customer_id: string
  energy_profile_id: string | null
  invoice_id: string | null
  current_monthly_cost_eur: number
  contracted_power_kw: number | null
  monthly_consumption_kwh: number | null
  tariff_type: string | null
  estimated_saving_percent: number
  proposed_monthly_cost_eur: number
  monthly_saving_eur: number
  annual_saving_eur: number
  solar_investment_eur: number | null
  roi_years: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Proposal = {
  id: string
  customer_id: string
  simulation_id: string | null
  deal_id: string | null
  status: ProposalStatus
  title: string
  services: string[]
  estimated_price_eur: number
  valid_until: string
  html_snapshot: string | null
  pdf_path: string | null
  created_at: string
  updated_at: string
}

export type PipelineStage = {
  id: string
  name: string
  position: number
  color: string
  is_won: boolean
  is_lost: boolean
  created_at: string
  updated_at: string
}

export type Deal = {
  id: string
  customer_id: string | null
  lead_id: string | null
  stage_id: string
  title: string
  status: 'open' | 'won' | 'lost'
  value_eur: number
  probability: number
  expected_close_date: string | null
  assigned_to: string | null
  won_at: string | null
  lost_reason: string | null
  created_at: string
  updated_at: string
}

export type Installation = {
  id: string
  customer_id: string
  deal_id: string | null
  contract_id: string | null
  status: InstallationStatus
  type: string
  address: string
  city: string | null
  province: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  assigned_technician: string | null
  scheduled_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
