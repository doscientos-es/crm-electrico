import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { PdfViewerDialog } from '../components/documents/PdfViewerDialog'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable, Td, Tr, TruncatePath } from '../components/ui/table'
import { contractStatusLabels } from '../config/constants'
import { money } from '../lib/formatters'
import { buildStoragePath } from '../lib/storage'
import { type ContractFormValues, contractSchema } from '../schemas/forms.schema'
import { useDemoStore } from '../store/demo-store'

export function ContractsRoute() {
  const store = useDemoStore()
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema) as never,
    defaultValues: {
      customer_id: store.customers[0]?.id,
      status: 'draft',
      contract_number: `EG-2026-${String(store.contracts.length + 1).padStart(4, '0')}`,
      amount_eur: 0,
    },
  })

  function onSubmit(values: ContractFormValues) {
    store.createContract({
      ...values,
      file_path: values.file_path || buildStoragePath(store.organization.id, values.customer_id, crypto.randomUUID(), 'contrato.pdf'),
    })
  }

  return (
    <div>
      <PageHeader title="Contratos" description="Registro de contratos y estado de firma mockeado para demo." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo contrato</CardTitle>
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
              <Field label="Numero" error={form.formState.errors.contract_number?.message}>
                <Input {...form.register('contract_number')} />
              </Field>
              <Field label="Estado" error={form.formState.errors.status?.message}>
                <Select {...form.register('status')}>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviado</option>
                  <option value="signed">Firmado</option>
                  <option value="cancelled">Cancelado</option>
                </Select>
              </Field>
              <Field label="Importe EUR" error={form.formState.errors.amount_eur?.message}>
                <Input type="number" step="0.01" {...form.register('amount_eur')} />
              </Field>
              <Button type="submit">Crear contrato</Button>
            </form>
          </CardContent>
        </Card>
        <DataTable headers={['Contrato', 'Cliente', 'Importe', 'Estado', 'Archivo', 'Vista']}>
          {store.contracts.map((contract) => (
            <Tr key={contract.id} hover>
              <Td variant="primary">{contract.contract_number}</Td>
              <Td variant="muted">{store.customers.find((customer) => customer.id === contract.customer_id)?.name}</Td>
              <Td>{money.format(contract.amount_eur)}</Td>
              <Td><StatusBadge value={contractStatusLabels[contract.status]} /></Td>
              <Td className="max-w-48"><TruncatePath path={contract.file_path ?? ''} /></Td>
              <Td>
                <PdfViewerDialog
                  source={{ bucket: 'contracts', file_path: contract.file_path ?? '', file_name: `${contract.contract_number}.pdf`, mime_type: 'application/pdf' }}
                  title={contract.contract_number}
                  description={`Contrato de ${store.customers.find((customer) => customer.id === contract.customer_id)?.name ?? '-'}`}
                />
              </Td>
            </Tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
