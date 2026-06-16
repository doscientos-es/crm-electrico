import { endOfDay, startOfMonth, startOfQuarter, startOfYear, subMonths } from 'date-fns'
import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr } from '../components/ui/table'
import { customerStatusLabels } from '../config/constants'
import { useAuth } from '../features/auth/AuthContext'
import { CustomerFormDialog } from '../features/customers/CustomerFormDialog'
import { useDebounce } from '../hooks/use-debounce'
import { exportToCSV } from '../lib/export'
import { formatDate } from '../lib/formatters'
import { fetchAllCustomersForExport, useCustomers } from '../services/customers.service'
import { useProfiles } from '../services/profiles.service'

type ExportPeriod = 'all' | 'month' | 'quarter' | 'year'

const PERIOD_LABELS: Record<ExportPeriod, string> = {
  all: 'Todo el tiempo',
  month: 'Último mes',
  quarter: 'Último trimestre',
  year: 'Este año',
}

function periodToDateFrom(period: ExportPeriod): string | undefined {
  const now = new Date()
  if (period === 'month') return startOfMonth(subMonths(now, 1)).toISOString()
  if (period === 'quarter') return startOfQuarter(subMonths(now, 3)).toISOString()
  if (period === 'year') return startOfYear(now).toISOString()
  return undefined
}

const PAGE_SIZE = 25

export function CustomersRoute() {
  const { profile: currentUser } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('all')
  const [isExporting, setIsExporting] = useState(false)

  const search = params.get('q') ?? ''
  const status = params.get('status') ?? 'all'
  const owner = params.get('owner') ?? 'all'
  const page = Math.max(1, Number(params.get('page') ?? '1'))

  function setSearch(v: string) { setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('q', v); else n.delete('q'); n.delete('page'); return n }, { replace: true }) }
  function setStatus(v: string) { setParams((p) => { const n = new URLSearchParams(p); if (v !== 'all') n.set('status', v); else n.delete('status'); n.delete('page'); return n }, { replace: true }) }
  function setOwner(v: string) { setParams((p) => { const n = new URLSearchParams(p); if (v !== 'all') n.set('owner', v); else n.delete('owner'); n.delete('page'); return n }, { replace: true }) }
  function setPage(p: number) { setParams((prev) => { const n = new URLSearchParams(prev); if (p > 1) n.set('page', String(p)); else n.delete('page'); return n }, { replace: true }) }

  const debouncedSearch = useDebounce(search, 250)

  const { data: result, isLoading } = useCustomers({
    search: debouncedSearch || undefined,
    status: status !== 'all' ? status : undefined,
    assignedTo: owner !== 'all' ? owner : undefined,
    page: page - 1, // service uses 0-based offset
    pageSize: PAGE_SIZE,
  })

  async function handleExport() {
    setIsExporting(true)
    try {
      const rows = await fetchAllCustomersForExport({
        search: debouncedSearch || undefined,
        status: status !== 'all' ? status : undefined,
        assignedTo: owner !== 'all' ? owner : undefined,
        dateFrom: periodToDateFrom(exportPeriod),
      })
      if (!rows.length) {
        toast.info('No hay clientes que exportar con los filtros actuales.')
        return
      }
      const statusLabel = status !== 'all' ? customerStatusLabels[status as keyof typeof customerStatusLabels] ?? status : 'todos'
      const periodLabel = PERIOD_LABELS[exportPeriod]
      const filename = `clientes_${statusLabel}_${periodLabel}_${new Date().toISOString().slice(0, 10)}`
      exportToCSV(
        rows.map((c) => ({
          Nombre: c.name,
          Empresa: c.company ?? '',
          DNI: c.dni ?? '',
          Estado: customerStatusLabels[c.status as keyof typeof customerStatusLabels] ?? c.status,
          Email: c.email ?? '',
          Teléfono: c.phone ?? '',
          Ciudad: c.city ?? '',
          Provincia: c.province ?? '',
          IBAN: c.iban ?? '',
          'Servicios contratados': (c.products_services as string[]).join(', '),
          'Contrato firmado': c.contract_signed_at ?? '',
          'Fecha renovación': c.renewal_date ?? '',
          'Alta en CRM': c.created_at ?? '',
        })),
        filename,
      )
      toast.success(`${rows.length} clientes exportados correctamente.`)
    } catch {
      toast.error('Error al exportar. Inténtalo de nuevo.')
    } finally {
      setIsExporting(false)
    }
  }

  const { data: profiles } = useProfiles()

  const profilesById = useMemo(
    () => Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name])),
    [profiles],
  )

  const customers = result?.data ?? []
  const total = result?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Base centralizada de clientes con contrato, renovacion, estado, comercial y servicios contratados."
        action={<CustomerFormDialog />}
      />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Field label="Buscar" className="min-w-52 flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre, DNI, empresa..." />
          </div>
        </Field>
        <Field label="Estado" className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="renewal_due">Renovacion pendiente</option>
            <option value="renewed">Renovados</option>
            <option value="inactive">Baja</option>
            <option value="lost">Perdidos</option>
          </Select>
        </Field>
        {currentUser?.role !== 'sales' && (
          <Field label="Comercial" className="w-44">
            <Select value={owner} onChange={(e) => setOwner(e.target.value)}>
              <option value="all">Todos</option>
              {(profiles ?? [])
                .filter((p) => ['owner', 'admin', 'sales'].includes(p.role))
                .map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="Alta desde" className="w-44">
          <Select value={exportPeriod} onChange={(e) => setExportPeriod(e.target.value as ExportPeriod)}>
            {Object.entries(PERIOD_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end">
          <Button variant="outline" size="default" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4" />
            {isExporting ? 'Exportando...' : 'Exportar Excel'}
          </Button>
        </div>
      </div>

      {!isLoading && customers.length === 0 ? (
        <EmptyState
          title={total === 0 && !debouncedSearch && status === 'all' ? 'Sin clientes' : 'Sin resultados'}
          description={total === 0 && !debouncedSearch && status === 'all' ? 'Crea el primer cliente para empezar a gestionar la cartera.' : 'Prueba a ajustar los filtros de busqueda.'}
          action={total === 0 && !debouncedSearch ? <CustomerFormDialog /> : undefined}
        />
      ) : (
        <DataTable
          headers={['Cliente', 'Estado', 'Contrato', 'Renovacion', 'Servicios', 'Comercial']}
          pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: setPage, onPageSizeChange: () => { } }}
        >
          {customers.map((customer) => (
            <Tr key={customer.id} hover className="cursor-pointer" onClick={() => navigate(`/customers/${customer.id}`)}>
              <Td>
                <p className="font-medium text-foreground">{customer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {customer.dni ?? 'Sin DNI'} · {customer.company ?? 'Sin empresa'}
                </p>
              </Td>
              <Td><StatusBadge value={customerStatusLabels[customer.status as keyof typeof customerStatusLabels] ?? customer.status} /></Td>
              <Td variant="muted">{formatDate(customer.contract_signed_at ?? undefined)}</Td>
              <Td variant="muted">{formatDate(customer.renewal_date ?? undefined)}</Td>
              <Td variant="muted">{(customer.products_services as string[]).join(', ') || '-'}</Td>
              <Td variant="muted">{profilesById[customer.assigned_to ?? ''] ?? '-'}</Td>
            </Tr>
          ))}
        </DataTable>
      )}
    </div>
  )
}
