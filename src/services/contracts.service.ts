import { newId, timestamp, useAppStore } from '../store/app-store'
import { normalizeContractStatus } from '../lib/contract-status'
import type { Contract } from '../types/domain'
import { localMutation } from './local-mutation'

export type ContractRow = Contract
type ContractInput = Omit<Contract, 'id' | 'created_at' | 'updated_at'>

export function useContracts(customerId?: string) {
  const contracts = useAppStore((state) => state.contracts)
  const normalized = contracts.map((contract) => ({
    ...contract,
    status: normalizeContractStatus(contract.status),
    contract_number: contract.contract_number || 'Sin número',
    customer_id: contract.customer_id || '',
    amount_eur: Number(contract.amount_eur ?? 0),
    commission_eur: Number(contract.commission_eur ?? 0),
  }))
  return { data: customerId ? normalized.filter((item) => item.customer_id === customerId) : normalized, isLoading: false }
}

export function useContract(id?: string) {
  const contract = useAppStore((state) => state.contracts.find((item) => item.id === id))
  return {
    data: contract ? {
      ...contract,
      status: normalizeContractStatus(contract.status),
      contract_number: contract.contract_number || 'Sin número',
      customer_id: contract.customer_id || '',
      amount_eur: Number(contract.amount_eur ?? 0),
      commission_eur: Number(contract.commission_eur ?? 0),
    } : undefined,
    isLoading: false,
  }
}

export function useCreateContract() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: ContractInput) => {
    const contract: Contract = { ...input, id: newId('contract'), created_at: timestamp(), updated_at: timestamp() }
    add('contracts', contract)
    return contract
  })
}

export function useUpdateContract() {
  const update = useAppStore((state) => state.update)
  return localMutation((input: Partial<Contract> & { id: string }) => {
    const { id, ...patch } = input
    update('contracts', id, patch)
    return input
  })
}
