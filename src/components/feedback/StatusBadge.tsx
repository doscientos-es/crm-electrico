import { Badge } from '../ui/badge'

export function StatusBadge({ value }: { value?: string | null }) {
  const label = value?.trim() || 'Sin estado'
  const variant =
    label.includes('Ganado') ||
      label.includes('Acept') ||
      label.includes('Firm') ||
      label === 'Activo' ||
      label.includes('Resuelta') ||
      label.includes('Complet') ||
      label.includes('Convert')
      ? 'emerald'
      : label.includes('Perd') || label.includes('Rechaz') || label.includes('Cancel')
        ? 'destructive'
        : label.includes('Urgente') || label.includes('Alta') || label.includes('Envi') || label.includes('Renovacion') || label.includes('Pendiente')
          ? 'amber'
          : label.includes('curso') || label.includes('Program')
            ? 'sky'
            : 'outline'

  return <Badge variant={variant}>{label}</Badge>
}
