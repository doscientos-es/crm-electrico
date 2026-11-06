// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RenewalCustomerNotes, RenewalStatusControls } from './RenewalFollowupControls'

const mocks = vi.hoisted(() => ({ updateContract: vi.fn(), updateNotes: vi.fn() }))
vi.mock('../../services/contracts.service', () => ({ useUpdateContract: () => ({ mutate: mocks.updateContract, isPending: false }) }))
vi.mock('../../services/customers.service', () => ({ useUpdateCustomerNotes: () => ({ mutate: mocks.updateNotes, isPending: false }) }))
vi.mock('../../hooks/use-toast-error', () => ({ useToastError: () => vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('../../components/ui/dialog', () => ({ Dialog: ({ children }: { children: React.ReactNode }) => children }))

describe('seguimiento de renovaciones', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  it('solo cambia el seguimiento al pulsar un botón y nunca modifica el estado del contrato', () => {
    act(() => root.render(<RenewalStatusControls contractId="c1" status={null} canEdit />))
    expect(container.textContent).toContain('Sin marcar')
    expect(mocks.updateContract).not.toHaveBeenCalled()
    const buttons = container.querySelectorAll('button')
    act(() => buttons[1].click())
    expect(mocks.updateContract).toHaveBeenCalledWith(
      { id: 'c1', renewal_followup_status: 'paused' }, expect.any(Object),
    )
    act(() => root.render(<RenewalStatusControls contractId="c1" status="paused" canEdit />))
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true')
    act(() => buttons[0].click())
    expect(mocks.updateContract).toHaveBeenLastCalledWith(
      { id: 'c1', renewal_followup_status: 'pending' }, expect.any(Object),
    )
  })

  it('impide editar tanto estados como notas a usuarios de solo lectura', () => {
    act(() => root.render(<><RenewalStatusControls contractId="c1" status="pending" canEdit={false} />
      <RenewalCustomerNotes customerId="u1" customerName="Cliente" notes="Nota existente" canEdit={false} /></>))
    expect([...container.querySelectorAll('button')].every((button) => button.disabled)).toBe(true)
    expect(container.textContent).toContain('Nota existente')
    expect(container.textContent).not.toContain('Editar notas')
  })

  it('edita las notas del cliente sin perder la versión inicial si cambian mientras el diálogo está abierto', () => {
    const render = (notes: string) => root.render(<RenewalCustomerNotes customerId="u1" customerName="Cliente" notes={notes} canEdit />)
    act(() => render('Nota inicial'))
    act(() => container.querySelector('button')!.click())
    const textarea = container.querySelector('textarea')!
    expect(textarea.value).toBe('Nota inicial')
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, 'Nueva nota')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => render('Nota cambiada por otro usuario'))
    act(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    expect(mocks.updateNotes).toHaveBeenCalledWith(
      { id: 'u1', notes: 'Nueva nota', previousNotes: 'Nota inicial' }, expect.any(Object),
    )
  })
})