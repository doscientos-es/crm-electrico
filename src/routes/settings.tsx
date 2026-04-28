import { Download, RotateCcw } from 'lucide-react'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Field, Input } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { formatDateTime } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'

export function SettingsRoute() {
  const store = useDemoStore()

  return (
    <div>
      <PageHeader
        title="Administracion"
        description="Permisos, backups automaticos y exportacion de la base de clientes."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={store.exportCustomersCsv}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="secondary" onClick={store.exportBackupJson}>
              <Download className="h-4 w-4" />
              Backup JSON
            </Button>
            <Button variant="secondary" onClick={store.resetDemo}>
              <RotateCcw className="h-4 w-4" />
              Restaurar demo
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Nombre">
              <Input value={store.organization.name} onChange={(event) => store.updateOrganization({ name: event.target.value })} />
            </Field>
            <Field label="Razon social">
              <Input value={store.organization.legal_name ?? ''} onChange={(event) => store.updateOrganization({ legal_name: event.target.value })} />
            </Field>
            <Field label="Telefono">
              <Input value={store.organization.phone ?? ''} onChange={(event) => store.updateOrganization({ phone: event.target.value })} />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permisos del equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable headers={['Usuario', 'Rol', 'Acceso', 'Clientes asignados']}>
              {store.profiles.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-4 py-3 font-medium text-slate-950">{profile.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{profile.role}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {profile.role === 'owner' || profile.role === 'admin' ? 'Ve toda la cartera' : 'Solo su cartera'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{store.customers.filter((customer) => customer.assigned_to === profile.id).length}</td>
                </tr>
              ))}
            </DataTable>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Backups automaticos recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable headers={['Fecha', 'Etiqueta', 'Clientes']}>
              {store.backupSnapshots.map((backup) => (
                <tr key={backup.id}>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(backup.created_at)}</td>
                  <td className="px-4 py-3 font-medium text-slate-950">{backup.label}</td>
                  <td className="px-4 py-3 text-slate-600">{backup.customers}</td>
                </tr>
              ))}
            </DataTable>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
