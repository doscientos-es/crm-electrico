import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable } from '../components/ui/table'
import { DealFormDialog } from '../features/deals/DealFormDialog'
import { formatDate, money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function DealsRoute() {
  const { deals, customers, pipelineStages, profiles, currentUser } = useDemoStore()
  const visibleDeals = currentUser.role === 'owner' || currentUser.role === 'admin' ? deals : deals.filter((deal) => deal.assigned_to === currentUser.id)
  return (
    <div>
      <PageHeader title="Oportunidades" description="Vista tabular del pipeline comercial." action={<DealFormDialog />} />
      <DataTable headers={['Oportunidad', 'Cliente', 'Fase', 'Valor', 'Prob.', 'Cierre', 'Asignado']}>
        {visibleDeals.map((deal) => (
          <tr key={deal.id} className="hover:bg-accent">
            <td className="px-4 py-3 font-medium text-foreground">{deal.title}</td>
            <td className="px-4 py-3 text-muted-foreground">
              {deal.customer_id ? (
                <Link className="text-primary hover:underline" to={`/customers/${deal.customer_id}`}>
                  {customers.find((customer) => customer.id === deal.customer_id)?.name}
                </Link>
              ) : (
                '-'
              )}
            </td>
            <td className="px-4 py-3">
              <StatusBadge value={pipelineStages.find((stage) => stage.id === deal.stage_id)?.name ?? deal.status} />
            </td>
            <td className="px-4 py-3 text-foreground">{money.format(deal.value_eur)}</td>
            <td className="px-4 py-3 text-muted-foreground">{deal.probability}%</td>
            <td className="px-4 py-3 text-muted-foreground">{formatDate(deal.expected_close_date)}</td>
            <td className="px-4 py-3 text-muted-foreground">{profiles.find((profile) => profile.id === deal.assigned_to)?.full_name ?? '-'}</td>
          </tr>
        ))}
      </DataTable>
      <Button asChild className="mt-4" variant="secondary">
        <Link to="/pipeline">Abrir Kanban</Link>
      </Button>
    </div>
  )
}
