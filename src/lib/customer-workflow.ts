import { addMonths, differenceInCalendarDays, isAfter, startOfDay } from 'date-fns'
import type { AppRole, Customer } from '../types/domain'

export function canViewAllCustomers(role: AppRole) {
  return role === 'owner' || role === 'admin'
}

export function getVisibleCustomers(customers: Customer[], userId: string, role: AppRole) {
  if (canViewAllCustomers(role)) return customers
  return customers.filter((customer) => customer.assigned_to === userId)
}

export function getRenewalAlertDate(customer: Customer) {
  const months = customer.renewal_alert_months ?? 10
  if (customer.contract_signed_at) {
    return addMonths(new Date(customer.contract_signed_at), months)
  }
  if (customer.renewal_date) {
    return addMonths(new Date(customer.renewal_date), months - 12)
  }
  return undefined
}

export function getRenewalStage(customer: Customer, today = new Date()) {
  const start = startOfDay(today)
  const renewalDate = customer.renewal_date ? startOfDay(new Date(customer.renewal_date)) : undefined
  const alertDate = getRenewalAlertDate(customer)
  const alertStart = alertDate ? startOfDay(alertDate) : undefined

  if (customer.status === 'lost' || customer.status === 'inactive') return 'closed'
  if (!renewalDate || !alertStart) return 'unscheduled'
  if (differenceInCalendarDays(renewalDate, start) < 0) return 'overdue'
  if (isAfter(alertStart, start)) return 'scheduled'
  if (differenceInCalendarDays(renewalDate, start) <= 30) return 'urgent'
  return 'due'
}

export function getDaysToRenewal(customer: Customer, today = new Date()) {
  if (!customer.renewal_date) return undefined
  return differenceInCalendarDays(startOfDay(new Date(customer.renewal_date)), startOfDay(today))
}
