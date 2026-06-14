import { newId, timestamp, useAppStore } from '../store/app-store'
import type { DocumentRecord } from '../types/domain'
import { localMutation } from './local-mutation'

export type DocumentRow = DocumentRecord

export function useDocuments(customerId?: string) {
  const documents = useAppStore((state) => state.documents)
  return { data: customerId ? documents.filter((item) => item.customer_id === customerId) : documents, isLoading: false }
}

export function useUploadDocument() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: { file: File; customerId: string; type: DocumentRecord['type']; uploadedBy: string }) => {
    const document: DocumentRecord = {
      id: newId('document'),
      customer_id: input.customerId,
      deal_id: null,
      installation_id: null,
      type: input.type,
      bucket: 'customer-documents',
      file_path: `local/${input.customerId}/${input.file.name}`,
      file_name: input.file.name,
      mime_type: input.file.type || null,
      size_bytes: input.file.size,
      uploaded_by: input.uploadedBy,
      created_at: timestamp(),
      updated_at: timestamp(),
    }
    add('documents', document)
    return document
  })
}
