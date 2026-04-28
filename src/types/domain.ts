export type AppRole = "owner" | "admin" | "sales" | "technician" | "viewer";
export type CustomerStatus =
	| "active"
	| "renewal_due"
	| "renewed"
	| "inactive"
	| "lost";
export type LeadStatus =
	| "new"
	| "contacted"
	| "qualified"
	| "lost"
	| "converted";
export type CustomerType =
	| "residential"
	| "business"
	| "community"
	| "industrial";
export type DealStatus = "open" | "won" | "lost";
export type ProposalStatus = "draft" | "sent" | "accepted" | "rejected";
export type ContractStatus = "draft" | "sent" | "signed" | "cancelled";
export type InstallationStatus =
	| "pending"
	| "scheduled"
	| "in_progress"
	| "completed"
	| "cancelled";
export type TaskStatus = "pending" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type DocumentType =
	| "invoice"
	| "proposal"
	| "contract"
	| "dni"
	| "cif"
	| "technical_photo"
	| "other";

export type EntityBase = {
	id: string;
	organization_id: string;
	created_at: string;
	updated_at?: string;
	created_by?: string;
};

export type Organization = {
	id: string;
	name: string;
	legal_name?: string;
	tax_id?: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	province?: string;
	postal_code?: string;
	logo_path?: string;
	created_at: string;
	updated_at?: string;
};

export type Profile = {
	id: string;
	organization_id: string;
	full_name: string;
	email: string;
	role: AppRole;
	phone?: string;
	avatar_url?: string;
	created_at: string;
	updated_at?: string;
};

export type Lead = EntityBase & {
	source: string;
	status: LeadStatus;
	company_name?: string;
	contact_name: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	province?: string;
	postal_code?: string;
	notes?: string;
	estimated_monthly_bill?: number;
	assigned_to?: string;
	converted_customer_id?: string;
	deleted_at?: string;
};

export type Customer = EntityBase & {
	lead_id?: string;
	type: CustomerType;
	name: string;
	company?: string;
	dni?: string;
	legal_name?: string;
	tax_id?: string;
	status: CustomerStatus;
	contact_name?: string;
	email?: string;
	phone?: string;
	address?: string;
	city?: string;
	province?: string;
	postal_code?: string;
	latitude?: number;
	longitude?: number;
	contract_signed_at?: string;
	renewal_date?: string;
	renewal_alert_months?: number;
	products_services: string[];
	assigned_to?: string;
	last_contact_at?: string;
	notes?: string;
	deleted_at?: string;
};

export type CustomerEnergyProfile = EntityBase & {
	customer_id: string;
	cups?: string;
	tariff_type: string;
	contracted_power_kw: number;
	monthly_consumption_kwh: number;
	monthly_cost_eur: number;
	annual_consumption_kwh?: number;
	has_solar: boolean;
	roof_area_m2?: number;
	notes?: string;
};

export type Invoice = EntityBase & {
	customer_id: string;
	energy_profile_id?: string;
	file_path: string;
	file_name: string;
	period_start?: string;
	period_end?: string;
	total_amount_eur: number;
	consumption_kwh?: number;
	contracted_power_kw?: number;
	tariff_type?: string;
	provider?: string;
	uploaded_by?: string;
};

export type SavingSimulation = EntityBase & {
	customer_id: string;
	energy_profile_id?: string;
	invoice_id?: string;
	current_monthly_cost_eur: number;
	contracted_power_kw?: number;
	monthly_consumption_kwh?: number;
	tariff_type?: string;
	estimated_saving_percent: number;
	proposed_monthly_cost_eur: number;
	monthly_saving_eur: number;
	annual_saving_eur: number;
	solar_investment_eur?: number;
	roi_years?: number;
	notes?: string;
};

export type Proposal = EntityBase & {
	customer_id: string;
	simulation_id?: string;
	deal_id?: string;
	status: ProposalStatus;
	title: string;
	services: string[];
	estimated_price_eur: number;
	valid_until: string;
	html_snapshot?: string;
	pdf_path?: string;
	sent_at?: string;
	accepted_at?: string;
};

export type PipelineStage = EntityBase & {
	name: string;
	position: number;
	color: string;
	is_won?: boolean;
	is_lost?: boolean;
};

export type Deal = EntityBase & {
	customer_id?: string;
	lead_id?: string;
	stage_id: string;
	title: string;
	status: DealStatus;
	value_eur: number;
	probability: number;
	expected_close_date?: string;
	assigned_to?: string;
	won_at?: string;
	lost_reason?: string;
};

export type Task = EntityBase & {
	customer_id?: string;
	lead_id?: string;
	deal_id?: string;
	installation_id?: string;
	title: string;
	description?: string;
	status: TaskStatus;
	priority: TaskPriority;
	due_at: string;
	assigned_to?: string;
	completed_at?: string;
};

export type Document = EntityBase & {
	customer_id?: string;
	deal_id?: string;
	installation_id?: string;
	type: DocumentType;
	bucket: string;
	file_path: string;
	file_name: string;
	mime_type?: string;
	size_bytes?: number;
	uploaded_by?: string;
};

export type Contract = EntityBase & {
	customer_id: string;
	deal_id?: string;
	proposal_id?: string;
	status: ContractStatus;
	contract_number: string;
	signed_at?: string;
	starts_at?: string;
	ends_at?: string;
	amount_eur: number;
	file_path?: string;
};

export type Installation = EntityBase & {
	customer_id: string;
	deal_id?: string;
	contract_id?: string;
	status: InstallationStatus;
	type: string;
	address: string;
	city?: string;
	province?: string;
	postal_code?: string;
	latitude?: number;
	longitude?: number;
	assigned_technician?: string;
	scheduled_at?: string;
	completed_at?: string;
	notes?: string;
};

export type InstallationVisit = EntityBase & {
	installation_id: string;
	technician_id?: string;
	scheduled_at?: string;
	started_at?: string;
	completed_at?: string;
	latitude?: number;
	longitude?: number;
	notes?: string;
	photo_paths: string[];
};

export type ActivityLog = {
	id: string;
	organization_id: string;
	actor_id?: string;
	entity_type: string;
	entity_id: string;
	action: string;
	metadata: Record<string, unknown>;
	created_at: string;
};

export type DemoState = {
	organization: Organization;
	profiles: Profile[];
	currentUserId: string;
	isAuthenticated: boolean;
	leads: Lead[];
	customers: Customer[];
	energyProfiles: CustomerEnergyProfile[];
	invoices: Invoice[];
	simulations: SavingSimulation[];
	proposals: Proposal[];
	pipelineStages: PipelineStage[];
	deals: Deal[];
	tasks: Task[];
	documents: Document[];
	contracts: Contract[];
	installations: Installation[];
	installationVisits: InstallationVisit[];
	activityLogs: ActivityLog[];
};
