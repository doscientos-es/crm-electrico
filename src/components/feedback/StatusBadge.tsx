import { Badge } from '../ui/badge'

export function StatusBadge({ value }: { value: string }) {
  const tone =
    value.includes('Ganado') ||
    value.includes('Acept') ||
    value.includes('Firm') ||
    value.includes('Complet') ||
    value.includes('Convert')
      ? 'emerald'
      : value.includes('Perd') || value.includes('Rechaz') || value.includes('Cancel')
        ? 'red'
        : value.includes('Urgente') || value.includes('Alta') || value.includes('Envi') || value.includes('Renovacion')
          ? 'amber'
          : value.includes('curso') || value.includes('Program')
            ? 'sky'
            : 'slate'

  return <Badge tone={tone}>{value}</Badge>
}
