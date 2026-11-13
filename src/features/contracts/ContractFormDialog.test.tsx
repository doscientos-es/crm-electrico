// @vitest-environment jsdom
import { act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ContractRow } from '../../services/contracts.service'
import { ContractFormDialog } from './ContractFormDialog'

const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn() }))
vi.mock('../../components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))
vi.mock('../auth/AuthContext', () => ({ useAuth: () => ({ profile: { role: 'sales' } }) }))
vi.mock('../../services/customers.service', () => ({ useCustomer: () => ({ data: null }) }))
vi.mock('../../hooks/use-toast-error', () => ({ useToastError: () => vi.fn() }))
vi.mock('../../services/contracts.service', () => ({
  useCreateContract: () => ({ mutate: mocks.create, isPending: false }),
  useUpdateContract: () => ({ mutate: mocks.update, isPending: false }),
  useDeleteContract: () => ({ mutate: vi.fn(), isPending: false }),
}))

describe('formulario de contrato con incidencia', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it.each(['crear', 'editar'])('pide y guarda el motivo al %s un contrato', async (mode) => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const contract =
      mode === 'editar' ? ({ id: 'contract', status: 'active' } as ContractRow) : undefined
    await act(async () =>
      root.render(<ContractFormDialog customerId="customer" contract={contract} open />),
    )

    expect(container.querySelector('[name="incident_reason"]')).toBeNull()
    const status = container.querySelector<HTMLSelectElement>('[name="status"]')!
    await act(async () => {
      status.value = 'incident'
      status.dispatchEvent(new Event('change', { bubbles: true }))
    })
    const reason = container.querySelector<HTMLTextAreaElement>('[name="incident_reason"]')!
    expect(reason).not.toBeNull()
    const form = container.querySelector('form')!
    await act(async () =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    )
    expect(container.textContent).toContain('Indica el motivo de la incidencia')
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()

    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(
        reason,
        '  Falta la firma  ',
      )
      reason.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () =>
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    )
    const mutation = mode === 'crear' ? mocks.create : mocks.update
    expect(mutation).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'incident', incident_reason: 'Falta la firma' }),
      expect.anything(),
    )

    act(() => root.unmount())
    container.remove()
  })

  it.each(['crear', 'editar'])(
    'guarda el estado vencido como contrato activo al %s',
    async (mode) => {
      vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
      const container = document.createElement('div')
      document.body.appendChild(container)
      const root = createRoot(container)
      const contract =
        mode === 'editar' ? ({ id: 'contract', status: 'active' } as ContractRow) : undefined
      await act(async () =>
        root.render(<ContractFormDialog customerId="customer" contract={contract} open />),
      )
      const status = container.querySelector<HTMLSelectElement>('[name="status"]')!
      await act(async () => {
        status.value = 'active_renewal_expired'
        status.dispatchEvent(new Event('change', { bubbles: true }))
      })
      await act(async () =>
        container
          .querySelector('form')!
          .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
      )
      expect(container.textContent).toContain('Indica la fecha final de renovación')
      expect(mocks.create).not.toHaveBeenCalled()
      expect(mocks.update).not.toHaveBeenCalled()
      const date = container.querySelector<HTMLInputElement>('[name="renewal_ends_at"]')!
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(
          date,
          '2026-01-15',
        )
        date.dispatchEvent(new Event('input', { bubbles: true }))
        date.dispatchEvent(new Event('change', { bubbles: true }))
      })
      await act(async () =>
        container
          .querySelector('form')!
          .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
      )
      expect(mode === 'crear' ? mocks.create : mocks.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          renewal_followup_status: 'expired',
          renewal_ends_at: '2026-01-15',
        }),
        expect.anything(),
      )
      act(() => root.unmount())
      container.remove()
    },
  )

  it('muestra el estado sincronizado y lo limpia al seleccionar activo', async () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const contract = {
      id: 'contract',
      status: 'active',
      renewal_followup_status: 'expired',
      renewal_ends_at: '2026-01-01',
    } as ContractRow
    await act(async () =>
      root.render(<ContractFormDialog customerId="customer" contract={contract} open />),
    )
    const status = container.querySelector<HTMLSelectElement>('[name="status"]')!
    expect(status.value).toBe('active_renewal_expired')
    await act(async () => {
      status.value = 'active'
      status.dispatchEvent(new Event('change', { bubbles: true }))
    })
    await act(async () =>
      container
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
    )
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'active',
        renewal_followup_status: null,
        renewal_ends_at: null,
      }),
      expect.anything(),
    )
    act(() => root.unmount())
    container.remove()
  })
})
