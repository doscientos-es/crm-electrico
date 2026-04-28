import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, MapPin } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input, Select, Textarea } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { installationStatusLabels } from '../config/constants'
import { useGeolocation } from '../hooks/use-geolocation'
import { formatDateTime } from '../lib/formatters'
import { buildStoragePath } from '../lib/storage'
import { type InstallationFormValues, installationSchema } from '../schemas/forms.schema'
import { useDemoStore } from '../store/demo-store'

export function InstallationsRoute() {
  const store = useDemoStore()
  const { isLocating, getCurrentPosition } = useGeolocation()
  const form = useForm<InstallationFormValues>({
    resolver: zodResolver(installationSchema) as never,
    defaultValues: {
      customer_id: store.customers[0]?.id,
      status: 'pending',
      type: 'Autoconsumo solar',
      assigned_technician: 'user-tech',
    },
  })
  const watchedCustomerId = useWatch({ control: form.control, name: 'customer_id' })

  function selectCustomer(customerId: string) {
    const customer = store.customers.find((item) => item.id === customerId)
    form.setValue('customer_id', customerId)
    if (customer) {
      form.setValue('address', customer.address ?? '')
      form.setValue('city', customer.city ?? '')
      form.setValue('province', customer.province ?? '')
      form.setValue('postal_code', customer.postal_code ?? '')
    }
  }

  function onSubmit(values: InstallationFormValues) {
    store.createInstallation(values)
  }

  async function saveLocation(installationId: string) {
    const position = await getCurrentPosition()
    store.updateInstallation(installationId, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      status: 'in_progress',
    })
  }

  function mockPhotoUpload(installationId: string, customerId: string) {
    const visit = store.installationVisits.find((item) => item.installation_id === installationId) ?? store.createVisit({
      installation_id: installationId,
      technician_id: store.currentUser.id,
      photo_paths: [],
    })
    store.createDocument({
      customer_id: customerId,
      installation_id: installationId,
      type: 'technical_photo',
      bucket: 'installation-photos',
      file_name: 'foto-tecnica-demo.jpg',
      file_path: buildStoragePath(store.organization.id, customerId, visit.id, 'foto-tecnica-demo.jpg'),
      mime_type: 'image/jpeg',
      size_bytes: 860_000,
      uploaded_by: store.currentUser.id,
    })
  }

  return (
    <div>
      <PageHeader title="Instalaciones y visitas" description="Flujo tecnico con asignacion, geolocalizacion puntual y fotos en Storage." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nueva instalacion</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <Field label="Cliente" error={form.formState.errors.customer_id?.message}>
                <Select value={watchedCustomerId} onChange={(event) => selectCustomer(event.target.value)}>
                  {store.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tipo" error={form.formState.errors.type?.message}>
                <Input {...form.register('type')} />
              </Field>
              <Field label="Direccion" error={form.formState.errors.address?.message}>
                <Input {...form.register('address')} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Estado" error={form.formState.errors.status?.message}>
                  <Select {...form.register('status')}>
                    <option value="pending">Pendiente</option>
                    <option value="scheduled">Programada</option>
                    <option value="in_progress">En curso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </Select>
                </Field>
                <Field label="Fecha" error={form.formState.errors.scheduled_at?.message}>
                  <Input type="datetime-local" {...form.register('scheduled_at')} />
                </Field>
              </div>
              <Field label="Tecnico" error={form.formState.errors.assigned_technician?.message}>
                <Select {...form.register('assigned_technician')}>
                  {store.profiles.filter((profile) => ['technician', 'admin', 'owner'].includes(profile.role)).map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Notas" error={form.formState.errors.notes?.message}>
                <Textarea {...form.register('notes')} />
              </Field>
              <Button type="submit">Crear instalacion</Button>
            </form>
          </CardContent>
        </Card>
        <DataTable headers={['Instalacion', 'Cliente', 'Tecnico', 'Fecha', 'Estado', 'Ubicacion', 'Acciones']}>
          {store.installations.map((installation) => (
            <tr key={installation.id}>
              <td className="px-4 py-3 font-medium text-foreground">{installation.type}</td>
              <td className="px-4 py-3 text-muted-foreground">{store.customers.find((customer) => customer.id === installation.customer_id)?.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{store.profiles.find((profile) => profile.id === installation.assigned_technician)?.full_name}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(installation.scheduled_at)}</td>
              <td className="px-4 py-3">
                <StatusBadge value={installationStatusLabels[installation.status]} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {installation.latitude && installation.longitude ? `${installation.latitude.toFixed(4)}, ${installation.longitude.toFixed(4)}` : 'Pendiente'}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={isLocating} onClick={() => saveLocation(installation.id)}>
                    <MapPin className="h-4 w-4" />
                    GPS
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => mockPhotoUpload(installation.id, installation.customer_id)}>
                    <Camera className="h-4 w-4" />
                    Foto
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  )
}
