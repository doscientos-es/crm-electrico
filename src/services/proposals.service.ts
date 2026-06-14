import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Proposal } from '../types/domain'
import { localMutation } from './local-mutation'

export function useProposals() {
  return { data: useAppStore((state) => state.proposals), isLoading: false }
}

export function useCreateProposal() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: Partial<Omit<Proposal, 'id' | 'created_at' | 'updated_at'>> & Pick<Proposal, 'customer_id' | 'status' | 'title' | 'services' | 'estimated_price_eur' | 'valid_until'>) => {
    const proposal: Proposal = {
      id: newId('proposal'), customer_id: input.customer_id, status: input.status, title: input.title,
      services: input.services, estimated_price_eur: input.estimated_price_eur, valid_until: input.valid_until,
      simulation_id: input.simulation_id ?? null, deal_id: input.deal_id ?? null,
      html_snapshot: input.html_snapshot ?? null, pdf_path: input.pdf_path ?? null,
      created_at: timestamp(), updated_at: timestamp(),
    }
    add('proposals', proposal)
    return proposal
  })
}

export function useUpdateProposal() {
  const update = useAppStore((state) => state.update)
  return localMutation((input: Partial<Proposal> & { id: string }) => {
    const { id, ...patch } = input
    update('proposals', id, patch)
    return input
  })
}
