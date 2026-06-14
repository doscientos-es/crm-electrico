import { z } from 'zod'

export const incidentSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  customerId: z.string().min(1, 'Selecciona un cliente'),
  contractId: z.string(),
  assignedTo: z.string(),
  internalNotes: z.string(),
})

export type IncidentFormValues = z.infer<typeof incidentSchema>
