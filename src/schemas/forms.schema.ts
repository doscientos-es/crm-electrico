import { z } from 'zod'
import { positiveNumber } from './common'

export const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Este campo es obligatorio'),
  file_name: z.string().min(1, 'Este campo es obligatorio'),
  total_amount_eur: z.coerce.number().positive('Debe ser mayor que 0'),
  consumption_kwh: z.coerce.number().min(0).optional(),
  contracted_power_kw: z.coerce.number().min(0).optional(),
  tariff_type: z.string().optional(),
  provider: z.string().optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
})

export const proposalSchema = z.object({
  customer_id: z.string().min(1, 'Este campo es obligatorio'),
  simulation_id: z.string().optional(),
  deal_id: z.string().optional(),
  title: z.string().min(1, 'Este campo es obligatorio'),
  services: z.string().min(1, 'Este campo es obligatorio'),
  estimated_price_eur: positiveNumber,
  valid_until: z.string().min(1, 'Este campo es obligatorio'),
})

export const dealSchema = z.object({
  title: z.string().min(1, 'Este campo es obligatorio'),
  customer_id: z.string().optional(),
  lead_id: z.string().optional(),
  stage_id: z.string().min(1, 'Este campo es obligatorio'),
  value_eur: positiveNumber,
  probability: z.coerce.number().min(0).max(100),
  expected_close_date: z.string().optional(),
  assigned_to: z.string().optional(),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Este campo es obligatorio'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'done', 'cancelled']).default('pending'),
  due_at: z.string().min(1, 'Este campo es obligatorio'),
  assigned_to: z.string().min(1, 'Este campo es obligatorio'),
  customer_id: z.string().optional(),
  lead_id: z.string().optional(),
  deal_id: z.string().optional(),
  installation_id: z.string().optional(),
})

export const contractSchema = z.object({
  customer_id: z.string().min(1, 'Este campo es obligatorio'),
  deal_id: z.string().optional(),
  proposal_id: z.string().optional(),
  status: z.enum(['PENDING_PROCESSING', 'PROCESSING', 'PENDING_SIGNATURE', 'ACTIVE', 'CANCELLED']),
  contract_number: z.string().min(1, 'Este campo es obligatorio'),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  amount_eur: positiveNumber,
  file_path: z.string().optional(),
})

export const installationSchema = z.object({
  customer_id: z.string().min(1, 'Este campo es obligatorio'),
  deal_id: z.string().optional(),
  contract_id: z.string().optional(),
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  type: z.string().min(1, 'Este campo es obligatorio'),
  address: z.string().min(1, 'Este campo es obligatorio'),
  city: z.string().optional(),
  province: z.string().optional(),
  postal_code: z.string().optional(),
  assigned_technician: z.string().min(1, 'Este campo es obligatorio'),
  scheduled_at: z.string().optional(),
  notes: z.string().optional(),
})

export type InvoiceFormValues = z.infer<typeof invoiceSchema>
export type ProposalFormValues = z.infer<typeof proposalSchema>
export type DealFormValues = z.infer<typeof dealSchema>
export type TaskFormValues = z.infer<typeof taskSchema>
export type ContractFormValues = z.infer<typeof contractSchema>
export type InstallationFormValues = z.infer<typeof installationSchema>
