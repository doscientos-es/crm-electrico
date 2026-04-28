import { ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Dialog } from '../components/ui/dialog'
import { Input, Select } from '../components/ui/input'
import { DataTable, EmptyState } from '../components/ui/table'
import { leadStatusLabels } from '../config/constants'
import { LeadFormDialog } from '../features/leads/LeadFormDialog'
import { money } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'
import type { Lead } from '../types/domain'

export function LeadsRoute() {
  const { leads, profiles, convertLead, currentUser } = useDemoStore()
  const [pendingConvert, setPendingConvert] = useState<Lead | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const visibleLeads = currentUser.role === 'owner' || currentUser.role === 'admin' ? leads : leads.filter((lead) => lead.assigned_to === currentUser.id)

  const filtered = visibleLeads.filter((lead) => {
    const name = (lead.company_name ?? lead.contact_name ?? '').toLowerCase()
    const matchesSearch = name.includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Captacion comercial con conversion directa a cliente y actividad trazada."
        action={<LeadFormDialog />}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Todos los estados</option>
          {Object.entries(leadStatusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>
      {visibleLeads.length === 0 ? (
        <EmptyState
          title="Sin leads todavía"
          description="Captura tu primer lead para empezar el proceso comercial."
          action={<LeadFormDialog />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Sin resultados" description="Prueba con otros filtros o términos de búsqueda." />
      ) : (
        <DataTable headers={['Lead', 'Origen', 'Estado', 'Factura estimada', 'Asignado', 'Acciones']}>
          {filtered.map((lead) => (
            <tr key={lead.id} className="hover:bg-accent">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{lead.company_name ?? lead.contact_name}</p>
                <p className="text-xs text-muted-foreground">
                  {lead.contact_name} · {lead.phone ?? lead.email}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{lead.source}</td>
              <td className="px-4 py-3">
                <StatusBadge value={leadStatusLabels[lead.status]} />
              </td>
              <td className="px-4 py-3 text-foreground">{lead.estimated_monthly_bill ? money.format(lead.estimated_monthly_bill) : '-'}</td>
              <td className="px-4 py-3 text-muted-foreground">{profiles.find((profile) => profile.id === lead.assigned_to)?.full_name ?? '-'}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <LeadFormDialog lead={lead} />
                  {lead.status !== 'converted' ? (
                    <Button size="sm" onClick={() => setPendingConvert(lead)}>
                      Convertir
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : lead.converted_customer_id ? (
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/customers/${lead.converted_customer_id}`}>Ver cliente</Link>
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Dialog
        open={!!pendingConvert}
        onOpenChange={(open) => { if (!open) setPendingConvert(null) }}
        title="Convertir lead en cliente"
      >
        <p className="text-sm text-muted-foreground">
          ¿Confirmas convertir <strong className="text-foreground">{pendingConvert?.company_name ?? pendingConvert?.contact_name}</strong> en cliente?
          Esta acción creará un cliente y no se puede deshacer.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setPendingConvert(null)}>Cancelar</Button>
          <Button onClick={() => { if (pendingConvert) { convertLead(pendingConvert.id); setPendingConvert(null) } }}>
            Confirmar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
