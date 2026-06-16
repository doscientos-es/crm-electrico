import { Search, Trash2, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../components/data-table/Toolbar'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr, TruncatePath } from '../components/ui/table'
import { useAuth } from '../features/auth/AuthContext'
import { useDebounce } from '../hooks/use-debounce'
import { usePagination } from '../hooks/use-pagination'
import { useToastError } from '../hooks/use-toast-error'
import { formatDate } from '../lib/formatters'
import { canDownloadPdf } from '../lib/permissions'
import { isPdfDocument } from '../lib/storage'
import { useCustomers } from '../services/customers.service'
import { type UploadStep, useDeleteDocument, useDocuments, useUploadDocument } from '../services/documents.service'
import type { DocumentRow } from '../services/documents.service'
import type { DocumentType } from '../types/database.types'

export function DocumentsRoute() {
  const { profile: currentUser } = useAuth()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const { data: documents = [] } = useDocuments()
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const onError = useToastError()

  const customers = customersResult?.data ?? []
  const [customerId, setCustomerId] = useState('')
  const [type, setType] = useState<DocumentType>('other')
  const [search, setSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStep, setUploadStep] = useState<UploadStep | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const debouncedSearch = useDebounce(search, 250)

  const customerById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

  const filteredDocuments = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!q) return documents
    return documents.filter(
      (d) =>
        d.file_name.toLowerCase().includes(q) ||
        (customerById[d.customer_id ?? ''] ?? '').toLowerCase().includes(q),
    )
  }, [documents, debouncedSearch, customerById])

  const pagination = usePagination(filteredDocuments, 25)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null)
  }

  function handleUpload() {
    if (!selectedFile || !customerId || !currentUser) return
    uploadDocument.mutate(
      {
        file: selectedFile,
        customerId,
        type,
        uploadedBy: currentUser.id,
        onProgress: setUploadStep,
      },
      {
        onSuccess: () => {
          toast.success('Documento subido correctamente')
          setSelectedFile(null)
          setUploadStep(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        },
        onError,
      },
    )
  }

  return (
    <div>
      <PageHeader title="Documentos" description="Contratos, DNI y archivos varios asociados a cada cliente." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Subir documento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Cliente">
              <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="" disabled>— Selecciona cliente —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
            <Field label="Tipo">
              <Select value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
                <option value="invoice">Factura</option>
                <option value="dni">DNI</option>
                <option value="cif">CIF</option>
                <option value="other">Otro</option>
              </Select>
            </Field>
            <Field label="Archivo">
              <Input ref={fileInputRef} type="file" onChange={handleFileChange} />
            </Field>
            <Button onClick={handleUpload} disabled={!selectedFile || !customerId || uploadDocument.isPending}>
              <Upload className="h-4 w-4" />
              {uploadDocument.isPending
                ? uploadStep === 'uploading'
                  ? 'Subiendo archivo…'
                  : uploadStep === 'saving'
                    ? 'Guardando registro…'
                    : 'Preparando…'
                : 'Subir archivo'}
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
            <EmptyState title="Sin documentos" description="Sube un archivo (PDF, DNI, contrato) para un cliente y aparecera aqui." />
          ) : (
            <DataTable
              headers={['Archivo', 'Cliente', 'Tipo', 'Fecha', 'Ruta', { label: 'Acciones', align: 'right' }]}
              pagination={{ page: pagination.page, pageSize: pagination.pageSize, total: pagination.total, totalPages: pagination.totalPages, onPageChange: pagination.setPage, onPageSizeChange: pagination.setPageSize }}
            >
              {pagination.items.map((document: DocumentRow) => (
                <Tr key={document.id} hover>
                  <Td variant="primary">{document.file_name}</Td>
                  <Td variant="muted">{customerById[document.customer_id ?? ''] ?? '-'}</Td>
                  <Td variant="muted">{document.type}</Td>
                  <Td variant="muted">{formatDate(document.created_at)}</Td>
                  <Td className="max-w-48"><TruncatePath path={document.file_path} /></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      {isPdfDocument(document.file_name, document.mime_type ?? undefined) ? (
                        <PdfViewerDialog
                          source={{ bucket: document.bucket, file_path: document.file_path, file_name: document.file_name, mime_type: document.mime_type ?? undefined }}
                          title={document.file_name}
                          description={`Documento asociado a ${customerById[document.customer_id ?? ''] ?? '-'}`}
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
                          {
                            onSuccess: () => toast.success('Documento eliminado'),
                            onError,
                          }
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
