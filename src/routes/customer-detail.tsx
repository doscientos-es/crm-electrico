import { type ReactNode, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { DataTable, TruncatePath } from '../components/ui/table'
import { customerStatusLabels } from '../config/constants'
import { getDaysToRenewal, getRenewalAlertDate, getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { isPdfDocument } from '../lib/storage'
import { useDemoStore } from '../store/demo-store'

export function CustomerDetailRoute() {
  const { id } = useParams()
  const store = useDemoStore()
  const visibleCustomers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)
  const customer = visibleCustomers.find((item) => item.id === id)

  const documents = useMemo(
    () => store.documents.filter((item) => item.customer_id === customer?.id),
    [customer?.id, store.documents],
  )
  const contract = useMemo(() => store.contracts.find((item) => item.customer_id === customer?.id), [customer?.id, store.contracts])
  const owner = store.profiles.find((profile) => profile.id === customer?.assigned_to)
  const daysToRenewal = customer ? getDaysToRenewal(customer) : undefined
  const alertDate = customer ? getRenewalAlertDate(customer) : undefined

  if (!customer) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="text-muted-foreground">Cliente no encontrado o sin permisos para verlo.</p>
          <Button asChild className="mt-4">
            <Link to="/customers">Volver a clientes</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={`${customer.company ?? 'Particular'} · ${owner?.full_name ?? 'Sin comercial'} · ${customer.phone ?? customer.email ?? 'Sin contacto'}`}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Estado" value={<StatusBadge value={customerStatusLabels[customer.status]} />} />
        <SummaryCard title="Contrato" value={formatDate(customer.contract_signed_at)} />
        <SummaryCard title="Renovacion" value={formatDate(customer.renewal_date)} />
        <SummaryCard title="Aviso automatico" value={alertDate ? formatDate(alertDate.toISOString()) : '-'} />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ficha del cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-foreground">
            <Detail label="DNI" value={customer.dni ?? '-'} />
            <Detail label="Empresa" value={customer.company ?? '-'} />
            <Detail label="Fecha de renovacion" value={formatDate(customer.renewal_date)} />
            <Detail label="Dias para renovar" value={typeof daysToRenewal === 'number' ? `${daysToRenewal} dias` : '-'} />
            <Detail label="Productos y servicios" value={customer.products_services.join(', ') || '-'} />
            <Detail label="Notas" value={customer.notes ?? '-'} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contrato y documentacion</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-foreground">
            <Detail label="Numero de contrato" value={contract?.contract_number ?? '-'} />
            <Detail label="Vigencia" value={`${formatDate(contract?.starts_at)} - ${formatDate(contract?.ends_at)}`} />
            <Detail label="Importe" value={contract ? `${contract.amount_eur.toLocaleString('es-ES')} EUR` : '-'} />
            <Detail label="Documentos asociados" value={String(documents.length)} />
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Documentos del cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable headers={['Archivo', 'Tipo', 'Fecha', 'Ruta', 'Vista']}>
            {documents.map((document) => (
              <tr key={document.id}>
                <td className="px-4 py-3 font-medium text-foreground">{document.file_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{document.type}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(document.created_at)}</td>
                <td className="px-4 py-3 text-muted-foreground max-w-48"><TruncatePath path={document.file_path} /></td>
                <td className="px-4 py-3">
                  {isPdfDocument(document.file_name, document.mime_type) ? (
                    <PdfViewerDialog source={document} title={document.file_name} description={`Archivo asociado a ${customer.name}`} />
                  ) : (
                    <span className="text-xs text-muted-foreground">No PDF</span>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ title, value }: { title: string; value: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
      </CardContent>
    </Card>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 rounded-md border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  )
}

