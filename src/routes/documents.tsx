import { Upload } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/data-table/Toolbar'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, TruncatePath } from '../components/ui/table'
import { getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { isPdfDocument } from '../lib/storage'
import { useDemoStore } from '../store/demo-store'
import type { DocumentType } from '../types/domain'

export function DocumentsRoute() {
  const store = useDemoStore()
  const customers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')
  const [fileName, setFileName] = useState('documento.pdf')
  const [type, setType] = useState<DocumentType>('other')

  const visibleDocuments = store.documents.filter((document) => customers.some((customer) => customer.id === document.customer_id))

  function createDocument() {
    if (!customerId) return
    store.createDocument({
      customer_id: customerId,
      type,
      bucket: 'customer-documents',
      file_name: fileName,
      file_path: `${store.organization.id}/${customerId}/manual/${crypto.randomUUID()}-${fileName}`,
      mime_type: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
      size_bytes: 512_000,
      uploaded_by: store.currentUser.id,
    })
  }

  return (
    <div>
      <PageHeader title="Documentos" description="Contratos, DNI y archivos varios asociados a cada cliente." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Registrar documento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Cliente">
              <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={type} onChange={(event) => setType(event.target.value as DocumentType)}>
                <option value="contract">Contrato</option>
                <option value="dni">DNI</option>
                <option value="cif">CIF</option>
                <option value="other">Otro</option>
              </Select>
            </Field>
            <Field label="Archivo">
              <Input type="file" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? 'documento.pdf')} />
            </Field>
            <Button onClick={createDocument}>
              <Upload className="h-4 w-4" />
              Guardar referencia
            </Button>
          </CardContent>
        </Card>

        <DataTable headers={['Archivo', 'Cliente', 'Tipo', 'Fecha', 'Ruta', 'Vista']}>
          {visibleDocuments.map((document) => (
            <tr key={document.id}>
              <td className="px-4 py-3 font-medium text-foreground">{document.file_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{customers.find((customer) => customer.id === document.customer_id)?.name ?? '-'}</td>
              <td className="px-4 py-3 text-muted-foreground">{document.type}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(document.created_at)}</td>
              <td className="px-4 py-3 text-muted-foreground max-w-48"><TruncatePath path={document.file_path} /></td>
              <td className="px-4 py-3">
                {isPdfDocument(document.file_name, document.mime_type) ? (
                  <PdfViewerDialog
                    source={document}
                    title={document.file_name}
                    description={`Documento asociado a ${customers.find((customer) => customer.id === document.customer_id)?.name ?? '-'}`}
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No PDF</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
