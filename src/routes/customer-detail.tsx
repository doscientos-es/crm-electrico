import { AlertTriangle, Bell, CheckCircle2, Clock, FileText, Mail, MessageSquare, Pencil, Phone, RefreshCw, Trash2, Upload, UserPlus } from 'lucide-react'
import { type ReactNode, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/data-table/Toolbar'
import { DocumentUploadDialog } from '../components/documents/DocumentUploadDialog'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { DataTable, EmptyState, Td, Tr, TruncatePath } from '../components/ui/table'
import { contractStatusLabels, customerStatusLabels, incidentPriorityLabels, incidentStatusLabels } from '../config/constants'
import { useAuth } from '../features/auth/AuthContext'
import { ContractFormDialog } from '../features/contracts/ContractFormDialog'
import { CustomerFormDialog } from '../features/customers/CustomerFormDialog'
import { IncidentFormDialog } from '../features/incidents/IncidentFormDialog'
import { usePagination } from '../hooks/use-pagination'
import { getDaysToContractEnd } from '../lib/customer-workflow'
import { formatDate, formatDateTime, relativeTime } from '../lib/formatters'
import { canDownloadPdf, canViewCompanyCommission } from '../lib/permissions'
import { isPdfDocument } from '../lib/storage'
import { type ActivityLogWithActor, getActivityLabel, getContactChannel, getContactNotes, useCustomerActivity } from '../services/activity.service'
import { useContracts, useDeleteContract } from '../services/contracts.service'
import { useCustomer } from '../services/customers.service'
import { useDeleteDocument, useDocuments } from '../services/documents.service'
import { useIncidents, useResolveIncident } from '../services/incidents.service'
import { useProfiles } from '../services/profiles.service'

function getActivityIcon(action: string, log: ActivityLogWithActor) {
  switch (action) {
    case 'customer_created': return <UserPlus className="size-4" />
    case 'customer_updated': return <Pencil className="size-4" />
    case 'contract_created': return <FileText className="size-4" />
    case 'contract_updated': return <RefreshCw className="size-4" />
    case 'contract_deleted': return <Trash2 className="size-4" />
    case 'incident_created': return <AlertTriangle className="size-4" />
    case 'incident_updated': return <AlertTriangle className="size-4" />
    case 'incident_deleted': return <Trash2 className="size-4" />
    case 'renewal_alert_sent': return <Bell className="size-4" />
    case 'renewal_contact': {
      const ch = getContactChannel(log)
      return ch === 'email' ? <Mail className="size-4" /> : <Phone className="size-4" />
    }
    default: return <Clock className="size-4" />
  }
}

function getActivityIconBg(action: string): string {
  if (action.includes('deleted')) return 'bg-destructive/10 text-destructive'
  if (action.includes('incident')) return 'bg-amber-100 text-amber-600'
  if (action.includes('contract')) return 'bg-blue-100 text-blue-600'
  if (action === 'renewal_contact') return 'bg-violet-100 text-violet-600'
  if (action === 'customer_created') return 'bg-emerald-100 text-emerald-600'
  return 'bg-muted text-muted-foreground'
}

export function CustomerDetailRoute() {
  const { id } = useParams()
  const { profile: currentUser } = useAuth()
  const showCompanyCommission = canViewCompanyCommission(currentUser?.role ?? 'viewer')

  const { data: customer, isLoading } = useCustomer(id)
  const { data: documents = [] } = useDocuments(id)
  const { data: contracts = [] } = useContracts({ customerId: id, includeCompanyCommission: showCompanyCommission })
  const { data: activityLogs = [], isLoading: activityLoading } = useCustomerActivity(id ?? '')
  const { data: profiles = [] } = useProfiles()
  const deleteContract = useDeleteContract()
  const deleteDocument = useDeleteDocument()
  const { data: incidents = [] } = useIncidents(id)
  const resolveIncident = useResolveIncident()

  const contractsPagination = usePagination(contracts, 25)
  const documentsPagination = usePagination(documents, 25)
  const incidentsPagination = usePagination(incidents, 25)

  const owner = useMemo(
    () => profiles.find((p) => p.id === customer?.assigned_to),
    [profiles, customer?.assigned_to],
  )
  const activeContracts = contracts.filter((c) => c.status === 'active').length

  // Derive renewal stats from the latest active contract
  const latestActiveContract = contracts
    .filter((c) => c.status === 'active' && c.ends_at)
    .sort((a, b) => (b.ends_at ?? '').localeCompare(a.ends_at ?? ''))[0]

  const daysToContractEnd = latestActiveContract ? getDaysToContractEnd(latestActiveContract) : undefined
  const contractTableHeaders = [
    'CUPS',
    'Comercializadora',
    'Canal de venta',
    'Producto',
    'Tarifa',
    'Importe',
    ...(showCompanyCommission ? ['Comisión empresa'] : []),
    'Comisión comercial',
    'Vigencia',
    'Estado',
    '',
  ]

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando...</p>
  }

  if (!customer) {
    return (
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-sm text-muted-foreground">Cliente no encontrado o sin permisos para verlo.</p>
        <Button asChild size="sm" variant="outline" className="w-fit">
          <Link to="/customers">Volver a clientes</Link>
        </Button>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{customer.company ?? 'Particular'}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{owner?.full_name ?? 'Sin comercial'}</span>
            {customer.phone && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <a href={`tel:${customer.phone}`} className="hover:text-foreground hover:underline transition-colors">{customer.phone}</a>
              </>
            )}
            {customer.email && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <a href={`mailto:${customer.email}`} className="hover:text-foreground hover:underline transition-colors">{customer.email}</a>
              </>
            )}
          </span>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            <DocumentUploadDialog
              customerId={customer.id}
              customerName={customer.name}
              trigger={
                <Button size="sm" variant="outline">
                  <Upload className="h-4 w-4" />Subir documento
                </Button>
              }
            />
            <CustomerFormDialog customer={customer} />
          </div>
        }
      />

      {/* KPI strip — flat, no individual card boxes */}
      <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4 border-b border-border pb-6">
        <Stat label="Estado">
          <StatusBadge value={customerStatusLabels[customer.status as keyof typeof customerStatusLabels] ?? customer.status} />
        </Stat>
        <Stat label="Contrato firmado">{formatDate(latestActiveContract?.starts_at ?? undefined)}</Stat>
        <Stat label="Vencimiento contrato">{formatDate(latestActiveContract?.ends_at ?? undefined)}</Stat>
        {typeof daysToContractEnd === 'number' && (
          <Stat label="Días para renovar">{daysToContractEnd} días</Stat>
        )}
        <Stat label="Contratos activos">{activeContracts} / {contracts.length}</Stat>
      </div>

      {/* Detail sections — two columns, divide-y rows, no card wrappers */}
      <section className="grid gap-8 xl:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Ficha del cliente</h3>
          <dl className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
            <DetailRow label="DNI" value={customer.dni ?? '—'} />
            <DetailRow label="Empresa" value={customer.company ?? '—'} />
            <DetailRow label="Email" value={customer.email ?? '—'} />
            <DetailRow label="Teléfono" value={customer.phone ?? '—'} />
            <DetailRow label="IBAN" value={customer.iban ?? '—'} />
            <DetailRow
              label="Dirección de correspondencia"
              value={formatAddress(customer.mailing_address, customer.mailing_postal_code, customer.mailing_city, customer.mailing_province)}
            />
            <DetailRow label="Productos y servicios" value={customer.products_services.join(', ') || '—'} />
            <DetailRow label="Comercial" value={owner?.full_name ?? '—'} />
            <DetailRow label="Notas" value={customer.notes ?? '—'} />
          </dl>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Resumen comercial</h3>
          <dl className="overflow-hidden rounded-lg border border-border bg-card divide-y divide-border">
            <DetailRow label="Contratos" value={String(contracts.length)} />
            <DetailRow label="Contratos activos" value={String(activeContracts)} />
            <DetailRow label="Documentos" value={String(documents.length)} />
          </dl>
        </div>
      </section>

      {/* Contracts — section heading + table */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Contratos energéticos</h3>
          <ContractFormDialog customerId={customer.id} />
        </div>
        {contracts.length === 0 ? (
          <EmptyState
            title="Sin contratos"
            description="Este cliente aún no tiene contratos energéticos registrados."
          />
        ) : (
          <DataTable
            headers={contractTableHeaders}
            pagination={{ page: contractsPagination.page, pageSize: contractsPagination.pageSize, total: contractsPagination.total, totalPages: contractsPagination.totalPages, onPageChange: contractsPagination.setPage, onPageSizeChange: contractsPagination.setPageSize }}
          >
            {contractsPagination.items.map((contract) => (
              <Tr key={contract.id} hover>
                <Td variant="primary">{contract.cups ?? '—'}</Td>
                <Td variant="muted">{contract.provider ?? '—'}</Td>
                <Td variant="muted">{contract.sales_channel ?? '—'}</Td>
                <Td variant="muted">{contract.product ?? '—'}</Td>
                <Td variant="muted">{contract.tariff_type ?? '—'}</Td>
                <Td variant="muted">{contract.amount_eur.toLocaleString('es-ES')} EUR</Td>
                {showCompanyCommission && (
                  <Td variant="muted">{contract.commission_company_eur.toLocaleString('es-ES')} EUR</Td>
                )}
                <Td variant="muted">{contract.commission_commercial_eur.toLocaleString('es-ES')} EUR</Td>
                <Td variant="muted">{formatDate(contract.starts_at ?? undefined)} – {formatDate(contract.ends_at ?? undefined)}</Td>
                <Td>
                  <StatusBadge value={contractStatusLabels[contract.status as keyof typeof contractStatusLabels] ?? contract.status} />
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-1">
                    <ContractFormDialog customerId={customer.id} contract={contract} />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Eliminar contrato"
                      onClick={() => {
                        if (window.confirm('¿Eliminar este contrato?')) deleteContract.mutate(contract.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </section>

      {/* Documents — section heading + table, no card wrapper */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Documentos del cliente</h3>
          <DocumentUploadDialog
            customerId={customer.id}
            customerName={customer.name}
            trigger={
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4" />Subir documento
              </Button>
            }
          />
        </div>
        <DataTable
          headers={['Archivo', 'Tipo', 'Fecha', 'Ruta', { label: 'Acciones', align: 'right' }]}
          pagination={{ page: documentsPagination.page, pageSize: documentsPagination.pageSize, total: documentsPagination.total, totalPages: documentsPagination.totalPages, onPageChange: documentsPagination.setPage, onPageSizeChange: documentsPagination.setPageSize }}
        >
          {documentsPagination.items.map((document) => (
            <Tr key={document.id} hover>
              <Td variant="primary">{document.file_name}</Td>
              <Td variant="muted">{document.type}</Td>
              <Td variant="muted">{formatDate(document.created_at)}</Td>
              <Td className="max-w-48"><TruncatePath path={document.file_path} /></Td>
              <Td>
                <div className="flex items-center justify-end gap-1">
                  {isPdfDocument(document.file_name, document.mime_type ?? undefined) ? (
                    <PdfViewerDialog
                      source={{ bucket: document.bucket, file_path: document.file_path, file_name: document.file_name, mime_type: document.mime_type ?? undefined }}
                      title={document.file_name}
                      description={`Archivo asociado a ${customer.name}`}
                      canDownload={canDownloadPdf(currentUser?.role ?? 'viewer')}
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">No PDF</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    disabled={deleteDocument.isPending}
                    onClick={() => deleteDocument.mutate(
                      { id: document.id, bucket: document.bucket, file_path: document.file_path },
                      { onSuccess: () => toast.success('Documento eliminado') }
                    )}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
        </DataTable>
      </section>

      {/* Incidents */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Incidencias abiertas</h3>
          <IncidentFormDialog customerId={customer.id} />
        </div>
        {incidents.length === 0 ? (
          <EmptyState
            title="Sin incidencias"
            description="Este cliente no tiene incidencias abiertas."
          />
        ) : (
          <DataTable
            headers={['Tipo / Título', 'Prioridad', 'Estado', 'Creada', { label: 'Acciones', align: 'right' }]}
            pagination={{ page: incidentsPagination.page, pageSize: incidentsPagination.pageSize, total: incidentsPagination.total, totalPages: incidentsPagination.totalPages, onPageChange: incidentsPagination.setPage, onPageSizeChange: incidentsPagination.setPageSize }}
          >
            {incidentsPagination.items.map((incident) => (
              <Tr key={incident.id} hover>
                <Td variant="primary">{incident.title}</Td>
                <Td variant="muted">
                  {incidentPriorityLabels[incident.priority as keyof typeof incidentPriorityLabels] ?? incident.priority}
                </Td>
                <Td>
                  <StatusBadge value={incidentStatusLabels[incident.status as keyof typeof incidentStatusLabels] ?? incident.status} />
                </Td>
                <Td variant="muted">{relativeTime(incident.created_at)}</Td>
                <Td align="right">
                  <div className="flex items-center justify-end gap-1">
                    <IncidentFormDialog customerId={customer.id} incident={incident} />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolveIncident.isPending}
                      onClick={() =>
                        resolveIncident.mutate(incident.id, {
                          onSuccess: () => toast.success('Incidencia resuelta'),
                        })
                      }
                      className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolver
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </DataTable>
        )}
      </section>

      {/* Activity history ─ all events */}
      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Historial de actividad</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Todos los cambios del cliente: contratos, incidencias, contactos y más.
            </p>
          </div>
          {activityLogs.length > 0 && (
            <span className="text-xs tabular-nums text-muted-foreground">
              {activityLogs.length} {activityLogs.length === 1 ? 'evento' : 'eventos'}
            </span>
          )}
        </div>

        {activityLoading ? (
          <div className="rounded-lg border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Cargando historial…
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center">
            <MessageSquare className="size-5 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">Sin actividad registrada</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Las acciones sobre este cliente aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card max-h-130 overflow-y-auto">
            {activityLogs.map((log) => {
              const m = (log.metadata && typeof log.metadata === 'object' && !Array.isArray(log.metadata))
                ? log.metadata as Record<string, unknown>
                : {}
              const notes = getContactNotes(log)
              return (
                <li key={log.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[auto_1fr_auto]">
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${getActivityIconBg(log.action)}`}>
                    {getActivityIcon(log.action, log)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {getActivityLabel(log.action, m)}
                      </p>
                      {log.actor?.full_name && (
                        <span className="text-xs text-muted-foreground">
                          por {log.actor.full_name}
                        </span>
                      )}
                    </div>
                    {notes && (
                      <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground leading-5">
                        {notes}
                      </p>
                    )}
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground sm:text-right"
                    dateTime={log.created_at}
                    title={formatDateTime(log.created_at)}
                  >
                    {relativeTime(log.created_at)}
                  </time>
                </li>
              )
            })}
          </ol>
        )}
      </section>

    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-24">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-foreground">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="text-right text-sm text-foreground">{value}</dd>
    </div>
  )
}

function formatAddress(
  address: string | null,
  postalCode: string | null,
  city: string | null,
  province: string | null,
): string {
  const locality = [postalCode, city].filter(Boolean).join(' ')
  const parts = [address, locality, province].map((p) => p?.trim()).filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}
