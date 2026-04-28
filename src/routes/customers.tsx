import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Field, Input, Select } from '../components/ui/input'
import { DataTable } from '../components/ui/table'
import { customerStatusLabels } from '../config/constants'
import { getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'
import { CustomerFormDialog } from '../features/customers/CustomerFormDialog'
import type { Customer } from '../types/domain'

export function CustomersRoute() {
  const store = useDemoStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | Customer['status']>('all')
  const [owner, setOwner] = useState<'all' | string>('all')

  const baseCustomers = getVisibleCustomers(store.customers, store.currentUser.id, store.currentUser.role)
  const filteredCustomers = useMemo(() => {
    return baseCustomers.filter((customer) => {
      const matchesSearch =
        !search ||
        [customer.name, customer.company, customer.dni, customer.phone, customer.email]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(search.toLowerCase()))
      const matchesStatus = status === 'all' || customer.status === status
      const matchesOwner = owner === 'all' || customer.assigned_to === owner
      return matchesSearch && matchesStatus && matchesOwner
    })
  }, [baseCustomers, owner, search, status])

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Base centralizada de clientes con contrato, renovacion, estado, comercial y servicios contratados."
        action={<CustomerFormDialog />}
      />

      <div className="mb-5 grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
        <Field label="Busqueda">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, DNI, empresa..." />
          </div>
        </Field>
        <Field label="Estado">
          <Select value={status} onChange={(event) => setStatus(event.target.value as 'all' | Customer['status'])}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="renewal_due">Renovacion pendiente</option>
            <option value="renewed">Renovados</option>
            <option value="inactive">Baja</option>
            <option value="lost">Perdidos</option>
          </Select>
        </Field>
        <Field label="Comercial">
          <Select value={owner} onChange={(event) => setOwner(event.target.value)}>
            <option value="all">Todos</option>
            {store.profiles
              .filter((profile) => profile.role === 'owner' || profile.role === 'admin' || profile.role === 'sales')
              .map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name}
                </option>
              ))}
          </Select>
        </Field>
      </div>

      <DataTable headers={['Cliente', 'Estado', 'Contrato', 'Renovacion', 'Servicios', 'Comercial', 'Acciones']}>
        {filteredCustomers.map((customer) => (
          <tr key={customer.id} className="hover:bg-slate-50">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-950">{customer.name}</p>
              <p className="text-xs text-slate-500">
                {customer.dni ?? 'Sin DNI'} · {customer.company ?? 'Sin empresa'}
              </p>
            </td>
            <td className="px-4 py-3">
              <StatusBadge value={customerStatusLabels[customer.status]} />
            </td>
            <td className="px-4 py-3 text-slate-600">{formatDate(customer.contract_signed_at)}</td>
            <td className="px-4 py-3 text-slate-600">{formatDate(customer.renewal_date)}</td>
            <td className="px-4 py-3 text-slate-600">{customer.products_services.join(', ') || '-'}</td>
            <td className="px-4 py-3 text-slate-600">{store.profiles.find((profile) => profile.id === customer.assigned_to)?.full_name ?? '-'}</td>
            <td className="px-4 py-3">
              <Button asChild size="sm" variant="secondary">
                <Link to={`/customers/${customer.id}`}>Abrir ficha</Link>
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  )
}
