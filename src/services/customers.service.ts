import { useAuth } from '../features/auth/AuthContext'
import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Customer } from '../types/domain'
import { localMutation } from './local-mutation'

export type CustomerRow = Customer
type CustomerInput = Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>> &
  Pick<Customer, 'type' | 'name' | 'status' | 'products_services'>

export function useCustomers(filters: {
  search?: string
  status?: string
  assignedTo?: string
  type?: string
  page?: number
  pageSize?: number
} = {}) {
  const { profile } = useAuth()
  const all = useAppStore((state) => state.customers)
  const visible = profile?.role === 'sales' ? all.filter((item) => item.assigned_to === profile.id) : all
  const search = filters.search?.trim().toLowerCase()
  const filtered = visible.filter((item) => {
    if (filters.status && item.status !== filters.status) return false
    if (filters.assignedTo && item.assigned_to !== filters.assignedTo) return false
    if (filters.type && item.type !== filters.type) return false
    if (!search) return true
    return [item.name, item.company, item.dni, item.email, item.phone]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(search))
  })
  const page = filters.page ?? 0
  const pageSize = filters.pageSize ?? 25
  return { data: { data: filtered.slice(page * pageSize, (page + 1) * pageSize), count: filtered.length }, isLoading: false }
}

export function useCustomer(id?: string) {
  const customer = useAppStore((state) => state.customers.find((item) => item.id === id))
  return { data: customer, isLoading: false }
}

export function useCreateCustomer() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: CustomerInput) => {
    const customer: Customer = {
      id: newId('customer'),
      type: input.type,
      name: input.name,
      company: input.company ?? null,
      dni: input.dni ?? null,
      legal_name: input.legal_name ?? null,
      tax_id: input.tax_id ?? null,
      status: input.status,
      contact_name: input.contact_name ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      province: input.province ?? null,
      postal_code: input.postal_code ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      contract_signed_at: input.contract_signed_at ?? null,
      renewal_date: input.renewal_date ?? null,
      renewal_alert_months: input.renewal_alert_months ?? 10,
      products_services: input.products_services,
      assigned_to: input.assigned_to ?? null,
      last_contact_at: input.last_contact_at ?? null,
      notes: input.notes ?? null,
      energy_data: input.energy_data ?? null,
      created_at: timestamp(),
      updated_at: timestamp(),
    }
    add('customers', customer)
    return customer
  })
}

export function useUpdateCustomer() {
  const update = useAppStore((state) => state.update)
  return localMutation((input: Partial<Customer> & { id: string }) => {
    const { id, ...patch } = input
    update('customers', id, patch)
    return input
  })
}
