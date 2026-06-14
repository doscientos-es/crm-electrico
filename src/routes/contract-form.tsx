import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../components/data-table/Toolbar'
import { Button } from '../components/ui/button'
import { ContractForm } from '../features/contracts/ContractForm'
import { useContract } from '../services/contracts.service'

export function ContractFormRoute() {
  const { id } = useParams()
  const { data: contract } = useContract(id)
  const editing = Boolean(id)

  if (editing && !contract) {
    return <div className="grid gap-4"><p className="text-sm text-muted-foreground">Contrato no encontrado.</p><Button asChild variant="secondary" className="w-fit"><Link to="/contracts">Volver</Link></Button></div>
  }

  return (
    <div>
      <PageHeader title={editing ? 'Editar contrato' : 'Nuevo contrato'} description="Completa los datos comerciales, de vigencia y suministro energético." />
      <ContractForm contract={contract} />
    </div>
  )
}
