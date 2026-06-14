export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type AppRole = 'owner' | 'admin' | 'sales' | 'technician' | 'viewer'
export type CustomerStatus = 'active' | 'renewal_due' | 'renewed' | 'inactive' | 'lost'
export type CustomerType = 'RESIDENTIAL' | 'SME'
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost' | 'converted'
export type DealStatus = 'open' | 'won' | 'lost'
export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type ContractStatus = 'PENDING_PROCESSING' | 'PROCESSING' | 'PENDING_SIGNATURE' | 'ACTIVE' | 'CANCELLED'
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED'
export type IncidentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
export type InstallationStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type TaskStatus = 'pending' | 'in_progress' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type DocumentType = 'invoice' | 'proposal' | 'contract' | 'dni' | 'cif' | 'technical_photo' | 'other'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: AppRole
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          role?: AppRole
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string
          email?: string
          phone?: string | null
          role?: AppRole
          avatar_url?: string | null
          updated_at?: string
        }
      }
      organizations: {
        Row: {
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
          logo_path: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          legal_name?: string | null
          tax_id?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          logo_path?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          legal_name?: string | null
          tax_id?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          logo_path?: string | null
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          source: string
          status: LeadStatus
          company_name: string | null
          contact_name: string
          email: string | null
          phone: string | null
          address: string | null
          city: string | null
          province: string | null
          postal_code: string | null
          notes: string | null
          energy_data: Json | null
          estimated_monthly_bill: number | null
          assigned_to: string | null
          converted_customer_id: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          source?: string
          status?: LeadStatus
          company_name?: string | null
          contact_name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          notes?: string | null
          energy_data?: Json | null
          estimated_monthly_bill?: number | null
          assigned_to?: string | null
          converted_customer_id?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          source?: string
          status?: LeadStatus
          company_name?: string | null
          contact_name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          notes?: string | null
          energy_data?: Json | null
          estimated_monthly_bill?: number | null
          assigned_to?: string | null
          converted_customer_id?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          lead_id: string | null
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
          deleted_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          lead_id?: string | null
          type?: CustomerType
          name: string
          company?: string | null
          dni?: string | null
          legal_name?: string | null
          tax_id?: string | null
          status?: CustomerStatus
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          contract_signed_at?: string | null
          renewal_date?: string | null
          renewal_alert_months?: number
          products_services?: string[]
          assigned_to?: string | null
          last_contact_at?: string | null
          notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          lead_id?: string | null
          type?: CustomerType
          name?: string
          company?: string | null
          dni?: string | null
          legal_name?: string | null
          tax_id?: string | null
          status?: CustomerStatus
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          city?: string | null
          province?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          contract_signed_at?: string | null
          renewal_date?: string | null
          renewal_alert_months?: number
          products_services?: string[]
          assigned_to?: string | null
          last_contact_at?: string | null
          notes?: string | null
          deleted_at?: string | null
          updated_at?: string
        }
      }
      customer_energy_profiles: {
        Row: {
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
          created_by: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          cups?: string | null
          tariff_type?: string
          contracted_power_kw?: number
          monthly_consumption_kwh?: number
          monthly_cost_eur?: number
          annual_consumption_kwh?: number | null
          has_solar?: boolean
          roof_area_m2?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          cups?: string | null
          tariff_type?: string
          contracted_power_kw?: number
          monthly_consumption_kwh?: number
          monthly_cost_eur?: number
          annual_consumption_kwh?: number | null
          has_solar?: boolean
          roof_area_m2?: number | null
          notes?: string | null
          updated_at?: string
        }
      }
      invoices: {
        Row: {
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
        Insert: {
          id?: string
          customer_id: string
          energy_profile_id?: string | null
          file_path: string
          file_name: string
          period_start?: string | null
          period_end?: string | null
          total_amount_eur?: number
          consumption_kwh?: number | null
          contracted_power_kw?: number | null
          tariff_type?: string | null
          provider?: string | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          energy_profile_id?: string | null
          file_path?: string
          file_name?: string
          period_start?: string | null
          period_end?: string | null
          total_amount_eur?: number
          consumption_kwh?: number | null
          contracted_power_kw?: number | null
          tariff_type?: string | null
          provider?: string | null
          updated_at?: string
        }
      }
      saving_simulations: {
        Row: {
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
          created_by: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          energy_profile_id?: string | null
          invoice_id?: string | null
          current_monthly_cost_eur: number
          contracted_power_kw?: number | null
          monthly_consumption_kwh?: number | null
          tariff_type?: string | null
          estimated_saving_percent: number
          proposed_monthly_cost_eur: number
          monthly_saving_eur: number
          annual_saving_eur: number
          solar_investment_eur?: number | null
          roi_years?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          energy_profile_id?: string | null
          invoice_id?: string | null
          current_monthly_cost_eur?: number
          contracted_power_kw?: number | null
          monthly_consumption_kwh?: number | null
          tariff_type?: string | null
          estimated_saving_percent?: number
          proposed_monthly_cost_eur?: number
          monthly_saving_eur?: number
          annual_saving_eur?: number
          solar_investment_eur?: number | null
          roi_years?: number | null
          notes?: string | null
          updated_at?: string
        }
      }
      pipeline_stages: {
        Row: {
          id: string
          name: string
          position: number
          color: string
          is_won: boolean
          is_lost: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          position?: number
          color?: string
          is_won?: boolean
          is_lost?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          position?: number
          color?: string
          is_won?: boolean
          is_lost?: boolean
          updated_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          customer_id: string | null
          lead_id: string | null
          stage_id: string
          title: string
          status: DealStatus
          value_eur: number
          probability: number
          expected_close_date: string | null
          assigned_to: string | null
          won_at: string | null
          lost_reason: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          lead_id?: string | null
          stage_id: string
          title: string
          status?: DealStatus
          value_eur?: number
          probability?: number
          expected_close_date?: string | null
          assigned_to?: string | null
          won_at?: string | null
          lost_reason?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          customer_id?: string | null
          lead_id?: string | null
          stage_id?: string
          title?: string
          status?: DealStatus
          value_eur?: number
          probability?: number
          expected_close_date?: string | null
          assigned_to?: string | null
          won_at?: string | null
          lost_reason?: string | null
          updated_at?: string
        }
      }
      tasks: {
        Row: {
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
          created_by: string | null
        }
        Insert: {
          id?: string
          customer_id?: string | null
          lead_id?: string | null
          deal_id?: string | null
          installation_id?: string | null
          title: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_at: string
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          customer_id?: string | null
          lead_id?: string | null
          deal_id?: string | null
          installation_id?: string | null
          title?: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          due_at?: string
          assigned_to?: string | null
          completed_at?: string | null
          updated_at?: string
        }
      }
      contracts: {
        Row: {
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
          energy_data: Json | null
          file_path: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          deal_id?: string | null
          proposal_id?: string | null
          status?: ContractStatus
          contract_number: string
          signed_at?: string | null
          starts_at?: string | null
          ends_at?: string | null
          amount_eur?: number
          commission_eur?: number
          energy_data?: Json | null
          file_path?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          deal_id?: string | null
          proposal_id?: string | null
          status?: ContractStatus
          contract_number?: string
          signed_at?: string | null
          starts_at?: string | null
          ends_at?: string | null
          amount_eur?: number
          commission_eur?: number
          energy_data?: Json | null
          file_path?: string | null
          updated_at?: string
        }
      }
      incidents: {
        Row: {
          id: string
          title: string
          description: string
          status: IncidentStatus
          priority: IncidentPriority
          customer_id: string
          contract_id: string | null
          assigned_to: string | null
          internal_notes: string
          resolved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: IncidentStatus
          priority?: IncidentPriority
          customer_id: string
          contract_id?: string | null
          assigned_to?: string | null
          internal_notes?: string
          resolved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          status?: IncidentStatus
          priority?: IncidentPriority
          customer_id?: string
          contract_id?: string | null
          assigned_to?: string | null
          internal_notes?: string
          resolved_at?: string | null
          updated_at?: string
        }
      }
      proposals: {
        Row: {
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
          sent_at: string | null
          accepted_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          simulation_id?: string | null
          deal_id?: string | null
          status?: ProposalStatus
          title: string
          services?: string[]
          estimated_price_eur?: number
          valid_until: string
          html_snapshot?: string | null
          pdf_path?: string | null
          sent_at?: string | null
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          simulation_id?: string | null
          deal_id?: string | null
          status?: ProposalStatus
          title?: string
          services?: string[]
          estimated_price_eur?: number
          valid_until?: string
          html_snapshot?: string | null
          pdf_path?: string | null
          sent_at?: string | null
          accepted_at?: string | null
          updated_at?: string
        }
      }
      installations: {
        Row: {
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
          created_by: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          deal_id?: string | null
          contract_id?: string | null
          status?: InstallationStatus
          type: string
          address: string
          city?: string | null
          province?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          assigned_technician?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          deal_id?: string | null
          contract_id?: string | null
          status?: InstallationStatus
          type?: string
          address?: string
          city?: string | null
          province?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          assigned_technician?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      installation_visits: {
        Row: {
          id: string
          installation_id: string
          technician_id: string | null
          scheduled_at: string | null
          started_at: string | null
          completed_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          photo_paths: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          installation_id: string
          technician_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          photo_paths?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          technician_id?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          completed_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          photo_paths?: string[]
          updated_at?: string
        }
      }
      documents: {
        Row: {
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
        Insert: {
          id?: string
          customer_id?: string | null
          deal_id?: string | null
          installation_id?: string | null
          type?: DocumentType
          bucket?: string
          file_path: string
          file_name: string
          mime_type?: string | null
          size_bytes?: number | null
          uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          customer_id?: string | null
          deal_id?: string | null
          installation_id?: string | null
          type?: DocumentType
          file_path?: string
          file_name?: string
          mime_type?: string | null
          size_bytes?: number | null
          updated_at?: string
        }
      }
      activity_logs: {
        Row: {
          id: string
          actor_id: string | null
          entity_type: string
          entity_id: string
          action: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          entity_type: string
          entity_id: string
          action: string
          metadata?: Json
          created_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      get_my_role: {
        Args: Record<string, never>
        Returns: AppRole
      }
      is_authenticated: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      app_role: AppRole
      customer_status: CustomerStatus
      customer_type: CustomerType
      lead_status: LeadStatus
      deal_status: DealStatus
      proposal_status: ProposalStatus
      contract_status: ContractStatus
      incident_status: IncidentStatus
      incident_priority: IncidentPriority
      installation_status: InstallationStatus
      task_status: TaskStatus
      task_priority: TaskPriority
      document_type: DocumentType
    }
    CompositeTypes: Record<string, never>
  }
}

// Convenience row types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateDto<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
