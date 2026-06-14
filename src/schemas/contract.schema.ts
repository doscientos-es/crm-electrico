import { z } from 'zod'

export const energyDataSchema = z.object({
  cups: z.string(),
  marketer: z.string(),
  product: z.string(),
  annualConsumptionKwh: z.coerce.number().min(0, 'El consumo no puede ser negativo'),
  tariff: z.string(),
  energyPrice: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  powerPrice: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  commission: z.coerce.number().min(0, 'La comisión no puede ser negativa'),
  estimatedMargin: z.coerce.number().min(0, 'El margen no puede ser negativo'),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string(),
}).superRefine((data, context) => {
  const hasEnergyData = Object.entries(data).some(([key, value]) =>
    key !== 'cups' && key !== 'notes' && value !== '' && value !== 0,
  )
  if (hasEnergyData && !data.cups.trim()) {
    context.addIssue({ code: 'custom', path: ['cups'], message: 'El CUPS es obligatorio al rellenar datos energéticos' })
  }
})

export const contractSchema = z.object({
  customer_id: z.string().min(1, 'Selecciona un cliente'),
  contract_number: z.string().min(1, 'El número de contrato es obligatorio'),
  status: z.enum(['PENDING_PROCESSING', 'PROCESSING', 'PENDING_SIGNATURE', 'ACTIVE', 'CANCELLED']),
  starts_at: z.string(),
  ends_at: z.string(),
  amount_eur: z.coerce.number().min(0, 'El importe no puede ser negativo'),
  commission_eur: z.coerce.number().min(0, 'La comisión no puede ser negativa'),
  energy_data: energyDataSchema,
})

export type ContractFormValues = z.infer<typeof contractSchema>
