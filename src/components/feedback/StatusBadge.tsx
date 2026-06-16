import type { ComponentProps } from 'react'
import { Badge } from '../ui/badge'

type BadgeVariant = ComponentProps<typeof Badge>['variant']

function inferVariant(value: string): BadgeVariant {
  // "Pendiente de firma" debe ir antes que la comprobación de "Firm".
  if (value === 'Nuevo') return 'violet'
  if (value.includes('Pendiente') || value.includes('Pend')) return 'amber'
  if (
    value.includes('Ganado') ||
    value.includes('Acept') ||
    value.includes('Firm') ||
    value.includes('Complet') ||
    value.includes('Convert') ||
    value.includes('Activo') ||
    value.includes('Renovado')
  )
    return 'emerald'
  if (value.includes('Perd') || value.includes('Rechaz') || value.includes('Cancel'))
    return 'destructive'
  if (
    value.includes('Urgente') ||
    value.includes('Alta') ||
    value.includes('Envi') ||
    value.includes('Renovacion')
  )
    return 'amber'
  if (value.includes('curso') || value.includes('Program') || value.includes('tramita'))
    return 'sky'
  return 'outline'
}

export function StatusBadge({ value, variant }: { value: string; variant?: BadgeVariant }) {
  return <Badge variant={variant ?? inferVariant(value)}>{value}</Badge>
}
