import { AlertTriangle, Copy, ExternalLink, Eye, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStorageSignedUrl, isPdfDocument } from '../../lib/storage'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog } from '../ui/dialog'

type PdfSource = {
  bucket: string
  file_path: string
  file_name: string
  mime_type?: string
}

export function PdfViewerDialog({
  source,
  title,
  description,
  buttonLabel = 'Ver',
  buttonClassName,
  canDownload = true,
}: {
  source: PdfSource
  title?: string
  description?: string
  buttonLabel?: string
  buttonClassName?: string
  canDownload?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [urlError, setUrlError] = useState(false)
  const canPreview = isPdfDocument(source.file_name, source.mime_type)

  useEffect(() => {
    if (!open || !canPreview) return
    let active = true
    getStorageSignedUrl(source.bucket, source.file_path)
      .then((signed) => {
        if (active) setUrl(signed)
      })
      .catch(() => {
        if (active) setUrlError(true)
      })
    return () => {
      active = false
      setUrl(null)
      setUrlError(false)
    }
  }, [open, source.bucket, source.file_path, canPreview])

  async function copyPath() {
    await navigator.clipboard.writeText(source.file_path)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      title={title ?? source.file_name}
      description={description ?? source.file_path}
      size="xl"
      trigger={
        <Button variant="secondary" size="sm" className={cn('h-8 gap-1.5', buttonClassName)}>
          <Eye className="h-4 w-4" />
          {buttonLabel}
        </Button>
      }
    >
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{source.file_name}</p>
              <p className="truncate text-xs text-muted-foreground">{source.file_path}</p>
            </div>
          </div>
          <Badge variant={canPreview ? 'emerald' : 'amber'}>{canPreview ? 'Vista PDF lista' : 'Sin vista previa'}</Badge>
        </div>

        {canPreview && url ? (
          <iframe
            title={source.file_name}
            src={canDownload ? url : `${url}#toolbar=0&navpanes=0`}
            className="h-[70dvh] w-full rounded-lg border border-border bg-background"
          />
        ) : canPreview && !urlError ? (
          <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="text-sm text-muted-foreground">Cargando vista previa…</p>
          </div>
        ) : (
          <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <div className="max-w-md">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
              <h3 className="mt-3 text-base font-semibold text-foreground">No se puede mostrar el PDF</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No se pudo generar la URL firmada para este archivo.
              </p>
            </div>
          </div>
        )}

        {canDownload && (
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="ghost" onClick={copyPath}>
              <Copy className="h-4 w-4" />
              {copied ? 'Ruta copiada' : 'Copiar ruta'}
            </Button>
            {url ? (
              <Button asChild variant="secondary">
                <a href={url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Abrir en otra pestaña
                </a>
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </Dialog>
  )
}