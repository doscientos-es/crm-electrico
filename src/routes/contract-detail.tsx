import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { contractStatusLabels } from '../config/constants'
import { formatDate, money } from '../lib/formatters'
import { useContract } from '../services/contracts.service'
import { useCustomer } from '../services/customers.service'

export function ContractDetailRoute() {
  const { id } = useParams()
  const { data: contract } = useContract(id)
  const { data: customer } = useCustomer(contract?.customer_id)

  if (!contract) return <p className="text-sm text-muted-foreground">Contrato no encontrado.</p>
  const energy = contract.energy_data

  return (
    <div>
      <PageHeader
        title={contract.contract_number}
        description={customer?.name ?? 'Cliente no disponible'}
        action={<div className="flex gap-2"><Button asChild variant="secondary"><Link to="/contracts">Volver</Link></Button><Button asChild><Link to={`/contracts/${contract.id}/edit`}>Editar</Link></Button></div>}
      />
      <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4 border-b border-border pb-6">
        <Stat label="Estado"><StatusBadge value={contractStatusLabels[contract.status]} /></Stat>
        <Stat label="Inicio">{formatDate(contract.starts_at ?? undefined)}</Stat>
        <Stat label="Fin">{formatDate(contract.ends_at ?? undefined)}</Stat>
        <Stat label="Importe">{money.format(contract.amount_eur)}</Stat>
        <Stat label="Comisión">{money.format(contract.commission_eur)}</Stat>
      </div>
      <section className="grid gap-8 xl:grid-cols-2">
        <DetailSection title="Contrato" rows={[
          ['Cliente', customer?.name ?? '—'],
          ['Número', contract.contract_number],
          ['Fecha de firma', formatDate(contract.signed_at ?? undefined)],
          ['Vigencia', `${formatDate(contract.starts_at ?? undefined)} – ${formatDate(contract.ends_at ?? undefined)}`],
        ]} />
        <DetailSection title="Datos energéticos" rows={[
          ['CUPS', energy?.cups || '—'],
          ['Comercializadora', energy?.marketer || '—'],
          ['Producto', energy?.product || '—'],
          ['Tarifa', energy?.tariff || '—'],
          ['Consumo anual', energy ? `${energy.annualConsumptionKwh.toLocaleString('es-ES')} kWh` : '—'],
          ['Precio energía', energy ? `${energy.energyPrice.toLocaleString('es-ES')} €/kWh` : '—'],
          ['Precio potencia', energy ? money.format(energy.powerPrice) : '—'],
          ['Margen estimado', energy ? money.format(energy.estimatedMargin) : '—'],
          ['Observaciones', energy?.notes || '—'],
        ]} />
      </section>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><div className="mt-1 text-sm font-semibold">{children}</div></div>
}

function DetailSection({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <div><h2 className="mb-3 text-sm font-semibold">{title}</h2><dl className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4 px-4 py-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-right text-sm">{value}</dd></div>)}</dl></div>
}
