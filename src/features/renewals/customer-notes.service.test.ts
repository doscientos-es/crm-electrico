import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const calls: Array<[string, ...unknown[]]> = []
  const result = { data: { id: 'customer' } as { id: string } | null, error: null }
  const query = new Proxy({}, {
    get: (_, name) => name === 'maybeSingle'
      ? () => Promise.resolve(result)
      : (...args: unknown[]) => { calls.push([String(name), ...args]); return query },
  })
  return { calls, result, query }
})
vi.mock('../../lib/supabase', () => ({ supabase: { from: () => mocks.query } }))
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: unknown) => options,
}))

import { useUpdateCustomerNotes } from '../../services/customers.service'

describe('persistencia de notas del cliente', () => {
  beforeEach(() => { mocks.calls.length = 0; mocks.result.data = { id: 'customer' } })

  it('actualiza solo si la versión del cliente sigue igual', async () => {
    const mutation = useUpdateCustomerNotes() as unknown as { mutationFn: (input: unknown) => Promise<void> }
    await mutation.mutationFn({ id: 'customer', notes: 'Nueva', expectedUpdatedAt: 'v1' })
    expect(mocks.calls).toContainEqual(['update', { notes: 'Nueva' }])
    expect(mocks.calls).toContainEqual(['eq', 'id', 'customer'])
    expect(mocks.calls).toContainEqual(['eq', 'updated_at', 'v1'])
  })

  it('detecta conflictos y conserva las notas existentes', async () => {
    mocks.result.data = null
    const mutation = useUpdateCustomerNotes() as unknown as { mutationFn: (input: unknown) => Promise<void> }
    await expect(mutation.mutationFn({ id: 'customer', notes: 'Nueva', expectedUpdatedAt: 'v1' }))
      .rejects.toThrow('El cliente ha cambiado o no tienes permiso')
    expect(mocks.calls).toContainEqual(['eq', 'updated_at', 'v1'])
  })
})