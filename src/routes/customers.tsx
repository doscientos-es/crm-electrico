import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { StatusBadge } from '../components/feedback/StatusBadge'
import { Button } from '../components/ui/button'
import { Input, Select } from '../components/ui/input'
import { DataTable, Td, Tr } from '../components/ui/table'
import { customerStatusLabels } from '../config/constants'
import { CustomerFormDialog } from '../features/customers/CustomerFormDialog'
import { getVisibleCustomers } from '../lib/customer-workflow'
import { formatDate } from '../lib/formatters'
import { useDemoStore } from '../store/demo-store'
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

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nombre, DNI, empresa..." />
        </div>
        <Select className="w-44" value={status} onChange={(event) => setStatus(event.target.value as 'all' | Customer['status'])}>
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="renewal_due">Renovacion pendiente</option>
          <option value="renewed">Renovados</option>
          <option value="inactive">Baja</option>
          <option value="lost">Perdidos</option>
        </Select>
        <Select className="w-44" value={owner} onChange={(event) => setOwner(event.target.value)}>
          <option value="all">Todos los comerciales</option>
          {store.profiles
            .filter((profile) => profile.role === 'owner' || profile.role === 'admin' || profile.role === 'sales')
            .map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name}
              </option>
            ))}
        </Select>
      </div>

      <DataTable headers={['Cliente', 'Estado', 'Contrato', 'Renovacion', 'Servicios', 'Comercial', 'Acciones']}>
        {filteredCustomers.map((customer) => (
          <Tr key={customer.id} hover>
            <Td>
              <p className="font-medium text-foreground">{customer.name}</p>
              <p className="text-xs text-muted-foreground">
                {customer.dni ?? 'Sin DNI'} · {customer.company ?? 'Sin empresa'}
              </p>
            </Td>
            <Td><StatusBadge value={customerStatusLabels[customer.status]} /></Td>
            <Td variant="muted">{formatDate(customer.contract_signed_at)}</Td>
            <Td variant="muted">{formatDate(customer.renewal_date)}</Td>
            <Td variant="muted">{customer.products_services.join(', ') || '-'}</Td>
            <Td variant="muted">{store.profiles.find((profile) => profile.id === customer.assigned_to)?.full_name ?? '-'}</Td>
            <Td>
              <Button asChild size="sm" variant="secondary">
                <Link to={`/customers/${customer.id}`}>Abrir ficha</Link>
              </Button>
            </Td>
          </Tr>
        ))}
      </DataTable>
    </div>
  )
}
