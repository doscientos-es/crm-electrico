import { Search, Upload } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '../components/data-table/Toolbar'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr, TruncatePath } from '../components/ui/table'
import { useDebounce } from '../hooks/use-debounce'
import { usePagination } from '../hooks/use-pagination'
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
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 250)

  const customerById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

  const allDocuments = useMemo(
    () => store.documents.filter((d) => customers.some((c) => c.id === d.customer_id)),
    [store.documents, customers],
  )

  const filteredDocuments = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return allDocuments
    return allDocuments.filter(
      (d) =>
        d.file_name.toLowerCase().includes(q) ||
        (customerById[d.customer_id ?? ''] ?? '').toLowerCase().includes(q),
    )
  }, [allDocuments, debouncedSearch, customerById])

  const pagination = usePagination(filteredDocuments, 25)

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
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
                <option value="contract">Contrato</option>
                <option value="dni">DNI</option>
                <option value="cif">CIF</option>
                <option value="other">Otro</option>
              </Select>
            </Field>
            <Field label="Archivo">
              <Input type="file" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? 'documento.pdf')} />
            </Field>
            <Button onClick={createDocument}>
              <Upload className="h-4 w-4" />
              Guardar referencia
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Buscar" className="min-w-48 flex-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Archivo o cliente..." />
              </div>
            </Field>
          </div>

          {filteredDocuments.length === 0 ? (
            <EmptyState title="Sin documentos" description="Registra un archivo (PDF, DNI, contrato) para un cliente y aparecera aqui." />
          ) : (
            <DataTable
              headers={['Archivo', 'Cliente', 'Tipo', 'Fecha', 'Ruta', 'Vista']}
              pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize }}
            >
              {pagination.items.map((document) => (
                <Tr key={document.id} hover>
                  <Td variant="primary">{document.file_name}</Td>
                  <Td variant="muted">{customerById[document.customer_id ?? ''] ?? '-'}</Td>
                  <Td variant="muted">{document.type}</Td>
                  <Td variant="muted">{formatDate(document.created_at)}</Td>
                  <Td className="max-w-48"><TruncatePath path={document.file_path} /></Td>
                  <Td>
                    {isPdfDocument(document.file_name, document.mime_type) ? (
                      <PdfViewerDialog
                        source={document}
                        title={document.file_name}
                        description={`Documento asociado a ${customerById[document.customer_id ?? ''] ?? '-'}`}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">No PDF</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </DataTable>
          )}
        </div>
      </div>
    </div>
  )
}
