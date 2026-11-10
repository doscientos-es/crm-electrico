import { Search, Trash2, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '../components/data-table/Toolbar'
import { FileViewerDialog } from '../components/documents/FileViewerDialog'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, EmptyState, Td, Tr, TruncatePath } from '../components/ui/table'
import { useAuth } from '../features/auth/AuthContext'
import { useDebounce } from '../hooks/use-debounce'
import { useToastError } from '../hooks/use-toast-error'
import { formatDate } from '../lib/formatters'
import { canDownloadPdf } from '../lib/permissions'
import { isImageDocument, isPdfDocument } from '../lib/storage'
import { useCustomers } from '../services/customers.service'
import { type UploadStep, useAllDocuments, useDeleteDocument, useUploadDocument } from '../services/documents.service'
import type { DocumentRow } from '../services/documents.service'
import type { DocumentType } from '../types/database.types'

const PAGE_SIZE = 25

export function DocumentsRoute() {
  const { profile: currentUser } = useAuth()
  const { data: customersResult } = useCustomers({ pageSize: 500 })
  const uploadDocument = useUploadDocument()
  const deleteDocument = useDeleteDocument()
  const onError = useToastError()

  const customers = customersResult?.data ?? []

  // Upload form state (local — not URL-synced)
  const [customerId, setCustomerId] = useState('')
  const [type, setType] = useState<DocumentType>('other')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStep, setUploadStep] = useState<UploadStep | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter + pagination state in URL
  const [params, setParams] = useSearchParams()
  const search = params.get('q') ?? ''
  const typeFilter = params.get('type') ?? 'all'
  const page = Math.max(1, Number(params.get('page') ?? '1'))

  function setSearch(v: string) { setParams((p) => { const n = new URLSearchParams(p); if (v) n.set('q', v); else n.delete('q'); n.delete('page'); return n }, { replace: true }) }
  function setTypeFilter(v: string) { setParams((p) => { const n = new URLSearchParams(p); if (v !== 'all') n.set('type', v); else n.delete('type'); n.delete('page'); return n }, { replace: true }) }
  function setPage(p: number) { setParams((prev) => { const n = new URLSearchParams(prev); if (p > 1) n.set('page', String(p)); else n.delete('page'); return n }, { replace: true }) }

  const debouncedSearch = useDebounce(search, 250)

  const { data: result, isLoading, isError } = useAllDocuments({
    search: debouncedSearch || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page: page - 1,
    pageSize: PAGE_SIZE,
  })

  const documents = result?.data ?? []
  const total = result?.count ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const customerById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  )

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
    <div className="h-full overflow-y-auto">
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
                <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre de archivo..." />
              </div>
            </Field>
            <Field label="Tipo" className="w-36">
              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="invoice">Factura</option>
                <option value="dni">DNI</option>
                <option value="cif">CIF</option>
                <option value="other">Otro</option>
              </Select>
            </Field>
          </div>

          {isError ? (
            <p className="text-sm text-destructive">No se pudieron cargar los documentos.</p>
          ) : !isLoading && documents.length === 0 ? (
            <EmptyState title="Sin documentos" description="Sube un archivo (PDF, DNI, contrato) para un cliente y aparecera aqui." />
          ) : (
            <DataTable
              headers={['Archivo', 'Cliente', 'Tipo', 'Fecha', 'Ruta', { label: 'Acciones', align: 'right' }]}
              isLoading={isLoading}
              loadingLabel="Cargando documentos…"
              pagination={{ page, pageSize: PAGE_SIZE, total, totalPages, onPageChange: setPage }}
            >
              {documents.map((document: DocumentRow) => (
                <Tr key={document.id} hover>
                  <Td variant="primary">{document.file_name}</Td>
                  <Td variant="muted">{customerById[document.customer_id ?? ''] ?? '-'}</Td>
                  <Td variant="muted">{document.type}</Td>
                  <Td variant="muted">{formatDate(document.created_at)}</Td>
                  <Td className="max-w-48"><TruncatePath path={document.file_path} /></Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      {isPdfDocument(document.file_name, document.mime_type ?? undefined) ||
                        isImageDocument(document.file_name, document.mime_type ?? undefined) ? (
                        <FileViewerDialog
                          source={{ bucket: document.bucket, file_path: document.file_path, file_name: document.file_name, mime_type: document.mime_type ?? undefined }}
                          title={document.file_name}
                          description={`Documento asociado a ${customerById[document.customer_id ?? ''] ?? '-'}`}
                          canDownload={canDownloadPdf(currentUser?.role ?? 'viewer')}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin vista previa</span>
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
