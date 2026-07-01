import { AlertTriangle, ExternalLink, Eye, FileText, ImageIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getStorageSignedUrl, isImageDocument, isPdfDocument } from '../../lib/storage'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Dialog } from '../ui/dialog'

type FileSource = {
  bucket: string
  file_path: string
  file_name: string
  mime_type?: string
}

export function FileViewerDialog({
  source,
  title,
  description,
  buttonLabel = 'Ver',
  buttonClassName,
  canDownload = true,
}: {
  source: FileSource
  title?: string
  description?: string
  buttonLabel?: string
  buttonClassName?: string
  canDownload?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [urlError, setUrlError] = useState(false)

  const isPdf = isPdfDocument(source.file_name, source.mime_type)
  const isImage = isImageDocument(source.file_name, source.mime_type)
  const canPreview = isPdf || isImage

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

  const previewBadge = isPdf ? 'Vista PDF lista' : isImage ? 'Vista imagen lista' : 'Sin vista previa'

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
              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{source.file_name}</p>
              <p className="truncate text-xs text-muted-foreground">{source.file_path}</p>
            </div>
          </div>
          <Badge variant={canPreview ? 'emerald' : 'amber'}>{previewBadge}</Badge>
        </div>

        {canPreview && url ? (
          isPdf ? (
            <iframe
              title={source.file_name}
              src={canDownload ? url : `${url}#toolbar=0&navpanes=0`}
              className="h-[70dvh] w-full rounded-lg border border-border bg-background"
            />
          ) : (
            <div className="grid max-h-[70dvh] place-items-center overflow-auto rounded-lg border border-border bg-background p-2">
              <img
                src={url}
                alt={source.file_name}
                className="max-h-[68dvh] w-auto object-contain"
              />
            </div>
          )
        ) : canPreview && !urlError ? (
          <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <p className="text-sm text-muted-foreground">Cargando vista previa…</p>
          </div>
        ) : (
          <div className="grid place-items-center rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
            <div className="max-w-md">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
              <h3 className="mt-3 text-base font-semibold text-foreground">No se puede mostrar el archivo</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                No se pudo generar la URL firmada para este archivo.
              </p>
            </div>
          </div>
        )}

        {canDownload && url ? (
          <div className="flex flex-wrap justify-end gap-3">
            <Button asChild variant="secondary">
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                Abrir en otra pestaña
              </a>
            </Button>
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}
