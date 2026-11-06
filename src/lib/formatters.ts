import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const money = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

export const decimal = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 2,
})

export function formatDate(value?: string) {
  if (!value) return '-'
  return format(parseISO(value), 'dd MMM yyyy', { locale: es })
}

export function formatDateTime(value?: string) {
  if (!value) return '-'
  return format(new Date(value), 'dd MMM yyyy HH:mm', { locale: es })
}

export function relativeTime(value?: string) {
  if (!value) return '-'
  return formatDistanceToNow(new Date(value), { addSuffix: true, locale: es })
}
