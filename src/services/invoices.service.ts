import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Invoice } from '../types/domain'
import { localMutation } from './local-mutation'

export function useInvoices() {
  return { data: useAppStore((state) => state.invoices), isLoading: false }
}

export function useCreateInvoice() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: { file: File; dto: Omit<Invoice, 'id' | 'file_path' | 'file_name' | 'created_at' | 'updated_at' | 'energy_profile_id' | 'period_start' | 'period_end'> & Partial<Pick<Invoice, 'energy_profile_id' | 'period_start' | 'period_end'>> }) => {
    const invoice: Invoice = {
      ...input.dto,
      id: newId('invoice'),
      energy_profile_id: input.dto.energy_profile_id ?? null,
      file_path: `local/invoices/${input.file.name}`,
      file_name: input.file.name,
      period_start: input.dto.period_start ?? null,
      period_end: input.dto.period_end ?? null,
      created_at: timestamp(),
      updated_at: timestamp(),
    }
    add('invoices', invoice)
    return invoice
  })
}
