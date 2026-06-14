import { newId, timestamp, useAppStore } from '../store/app-store'
import type { Deal } from '../types/domain'
import { localMutation } from './local-mutation'

export function useDeals() {
  return { data: useAppStore((state) => state.deals), isLoading: false }
}

export function usePipelineStages() {
  return { data: useAppStore((state) => state.pipelineStages), isLoading: false }
}

export function useCreateDeal() {
  const add = useAppStore((state) => state.add)
  return localMutation((input: Partial<Omit<Deal, 'id' | 'created_at' | 'updated_at'>> & Pick<Deal, 'title' | 'stage_id' | 'status' | 'value_eur' | 'probability'>) => {
    const deal: Deal = {
      id: newId('deal'), title: input.title, stage_id: input.stage_id, status: input.status,
      value_eur: input.value_eur, probability: input.probability, customer_id: input.customer_id ?? null,
      lead_id: input.lead_id ?? null, expected_close_date: input.expected_close_date ?? null,
      assigned_to: input.assigned_to ?? null, won_at: input.won_at ?? null, lost_reason: input.lost_reason ?? null,
      created_at: timestamp(), updated_at: timestamp(),
    }
    add('deals', deal)
    return deal
  })
}

export function useMoveDeals() {
  const update = useAppStore((state) => state.update)
  return localMutation((input: { ids?: string[]; dealId?: string; stageId: string }) => {
    const ids = input.ids ?? (input.dealId ? [input.dealId] : [])
    ids.forEach((id) => update('deals', id, { stage_id: input.stageId }))
    return input
  })
}
