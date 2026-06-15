import { Upload } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../features/auth/AuthContext'
import { useToastError } from '../../hooks/use-toast-error'
import { useUploadDocument } from '../../services/documents.service'
import type { DocumentType } from '../../types/database.types'
import { Button } from '../ui/button'
import { Dialog } from '../ui/dialog'
import { Field, Input, Select } from '../ui/input'

export function DocumentUploadDialog({
  customerId,
  customerName,
  trigger,
}: {
  customerId: string
  customerName: string
  trigger: ReactNode
}) {
  const { profile: currentUser } = useAuth()
  const uploadDocument = useUploadDocument()
  const onError = useToastError()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<DocumentType>('other')
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setFile(null)
    setType('other')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleUpload() {
    if (!file || !currentUser) return
    uploadDocument.mutate(
      { file, organizationId: currentUser.organization_id, customerId, type, uploadedBy: currentUser.id },
      {
        onSuccess: () => {
          toast.success('Documento subido')
          reset()
          setOpen(false)
        },
        onError,
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset()
      }}
      title="Subir documento"
      description={`Archivo asociado a ${customerName}`}
      trigger={trigger}
    >
      <div className="grid gap-4">
        <Field label="Tipo">
          <Select value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
            <option value="contract">Contrato</option>
            <option value="dni">DNI</option>
            <option value="cif">CIF</option>
            <option value="other">Otro</option>
          </Select>
        </Field>
        <Field label="Archivo">
          <Input ref={fileInputRef} type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploadDocument.isPending}>
            <Upload className="h-4 w-4" />
            {uploadDocument.isPending ? 'Subiendo…' : 'Subir archivo'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
