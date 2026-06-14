import { z } from 'zod'
import { contactRefinement, optionalEmail, optionalPhone } from './common'

export const customerSchema = z
  .object({
    name: z.string().min(1, 'Este campo es obligatorio'),
    type: z.enum(['RESIDENTIAL', 'SME']),
    status: z.enum(['active', 'renewal_due', 'renewed', 'inactive', 'lost']),
    legal_name: z.string().optional(),
    tax_id: z.string().optional(),
    contact_name: z.string().optional(),
    email: optionalEmail,
    phone: optionalPhone,
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postal_code: z.string().regex(/^\d{5}$/, 'El codigo postal debe tener 5 digitos').optional().or(z.literal('')),
    contract_signed_at: z.string().min(1, 'La fecha de contrato es obligatoria'),
    renewal_date: z.string().min(1, 'La fecha de renovacion es obligatoria'),
    assigned_to: z.string().min(1, 'Selecciona un comercial responsable'),
    products_services: z.string(),
    notes: z.string().optional(),
    cups: z.string(),
    marketer: z.string(),
    product: z.string(),
    annual_consumption_kwh: z.coerce.number().min(0),
    tariff: z.string(),
    energy_price: z.coerce.number().min(0),
    power_price: z.coerce.number().min(0),
    commission: z.coerce.number().min(0),
    estimated_margin: z.coerce.number().min(0),
    energy_start_date: z.string(),
    energy_end_date: z.string(),
    energy_notes: z.string(),
  })
  .refine((data) => Boolean(data.email || data.phone), contactRefinement)
  .refine(
    (data) => !(data.marketer || data.product || data.tariff || data.annual_consumption_kwh > 0 || data.energy_price > 0 || data.power_price > 0 || data.commission > 0 || data.estimated_margin > 0 || data.energy_start_date || data.energy_end_date) || Boolean(data.cups),
    { path: ['cups'], message: 'El CUPS es obligatorio al rellenar datos energéticos' },
  )

export type CustomerFormValues = z.infer<typeof customerSchema>
