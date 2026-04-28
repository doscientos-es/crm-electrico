import { zodResolver } from '@hookform/resolvers/zod'
import { Upload } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, Td, Tr } from '../components/ui/table'
import { formatDate, money } from '../lib/formatters'
import { buildStoragePath } from '../lib/storage'
import { type InvoiceFormValues, invoiceSchema } from '../schemas/forms.schema'
import { useDemoStore } from '../store/demo-store'

export function InvoicesRoute() {
  const store = useDemoStore()
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema) as never,
    defaultValues: { customer_id: store.customers[0]?.id, file_name: 'factura-demo.pdf', total_amount_eur: 0 },
  })

  function onSubmit(values: InvoiceFormValues) {
    const profile = store.energyProfiles.find((item) => item.customer_id === values.customer_id)
    const id = crypto.randomUUID()
    store.createInvoice({
      ...values,
      energy_profile_id: profile?.id,
      file_path: buildStoragePath(store.organization.id, values.customer_id, id, values.file_name),
      uploaded_by: store.currentUser.id,
    })
    form.reset({ customer_id: values.customer_id, file_name: 'factura-demo.pdf', total_amount_eur: 0 })
  }

  return (
    <div>
      <PageHeader title="Facturas PDF" description="Subida real preparada para Supabase Storage; en demo se registra el path y datos manuales de factura." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Registrar factura</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select {...form.register('customer_id')}>
                  {store.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Archivo PDF" error={form.formState.errors.file_name?.message}>
                <Input type="file" accept="application/pdf" onChange={(event) => form.setValue('file_name', event.target.files?.[0]?.name ?? 'factura-demo.pdf')} />
              </Field>
              <Field label="Importe total EUR" error={form.formState.errors.total_amount_eur?.message}>
                <Input type="number" step="0.01" {...form.register('total_amount_eur')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Consumo kWh" error={form.formState.errors.consumption_kwh?.message}>
                  <Input type="number" step="0.01" {...form.register('consumption_kwh')} />
                </Field>
                <Field label="Potencia kW" error={form.formState.errors.contracted_power_kw?.message}>
                  <Input type="number" step="0.01" {...form.register('contracted_power_kw')} />
                </Field>
              </div>
              <Field label="Tarifa" error={form.formState.errors.tariff_type?.message}>
                <Select {...form.register('tariff_type')}>
                  <option value="2.0TD">2.0TD</option>
                  <option value="3.0TD">3.0TD</option>
                  <option value="6.1TD">6.1TD</option>
                </Select>
              </Field>
              <Field label="Comercializadora" error={form.formState.errors.provider?.message}>
                <Input {...form.register('provider')} />
              </Field>
              <Button type="submit">
                <Upload className="h-4 w-4" />
                Registrar factura
              </Button>
            </form>
          </CardContent>
        </Card>
        <DataTable headers={['Factura', 'Cliente', 'Periodo', 'Importe', 'kWh', 'Proveedor', 'Vista']}>
          {store.invoices.map((invoice) => (
            <Tr key={invoice.id} hover>
              <Td variant="primary">{invoice.file_name}</Td>
              <Td variant="muted">{store.customers.find((customer) => customer.id === invoice.customer_id)?.name}</Td>
              <Td variant="muted">{formatDate(invoice.period_start)}</Td>
              <Td>{money.format(invoice.total_amount_eur)}</Td>
              <Td variant="muted">{invoice.consumption_kwh?.toLocaleString('es-ES') ?? '-'}</Td>
              <Td variant="muted">{invoice.provider ?? '-'}</Td>
              <Td>
                <PdfViewerDialog
                  source={{ bucket: 'invoices', file_path: invoice.file_path, file_name: invoice.file_name, mime_type: 'application/pdf' }}
                  title={invoice.file_name}
                  description={`Factura de ${store.customers.find((customer) => customer.id === invoice.customer_id)?.name ?? '-'}`}
                />
              </Td>
            </Tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
