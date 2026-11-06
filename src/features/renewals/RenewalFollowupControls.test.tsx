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
    expect(container.querySelector('[role=group]')?.getAttribute('aria-label')).toBe('Seguimiento: Sin marcar')
    expect(mocks.updateContract).not.toHaveBeenCalled()
    const buttons = container.querySelectorAll('button')
    expect(buttons[0].getAttribute('aria-label')).toBe('Pendiente de renovar')
    expect(buttons[1].getAttribute('aria-label')).toBe('Renovación vencida / en pausa')
    act(() => buttons[1].click())
    expect(mocks.updateContract).toHaveBeenCalledWith(
      { id: 'c1', renewal_followup_status: 'paused' }, expect.any(Object),
    )
    act(() => root.render(<RenewalStatusControls contractId="c1" status="paused" canEdit />))
    expect(container.querySelector('[role=group]')?.getAttribute('aria-label')).toBe('Seguimiento: Renovación vencida / en pausa')
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true')
    act(() => buttons[0].click())
    expect(mocks.updateContract).toHaveBeenLastCalledWith(
      { id: 'c1', renewal_followup_status: 'pending' }, expect.any(Object),
    )
  })

  it('impide editar tanto estados como notas a usuarios de solo lectura', () => {
    act(() => root.render(<><RenewalStatusControls contractId="c1" status="pending" canEdit={false} />
      <RenewalCustomerNotes customerId="u1" customerName="Cliente" notes="Nota existente" updatedAt="v1" canEdit={false} /></>))
    expect([...container.querySelectorAll('button')].every((button) => button.disabled)).toBe(true)
    expect(container.textContent).toContain('Nota existente')
    expect(container.querySelector('[aria-label="Editar notas del cliente"]')).toBeNull()
  })

  it('permite usar los controles sin activar la navegación de la fila', () => {
    const navigate = vi.fn()
    act(() => root.render(<div onClick={navigate}>
      <RenewalStatusControls contractId="c1" status={null} canEdit />
      <RenewalCustomerNotes customerId="u1" customerName="Cliente" notes={null} updatedAt="v1" canEdit />
    </div>))
    act(() => container.querySelector<HTMLButtonElement>('[aria-label="Pendiente de renovar"]')!.click())
    act(() => container.querySelector<HTMLButtonElement>('[aria-label="Editar notas del cliente"]')!.click())
    expect(navigate).not.toHaveBeenCalled()
    expect(container.querySelector('textarea')).not.toBeNull()
  })

  it('edita las notas del cliente sin perder la versión inicial si cambian mientras el diálogo está abierto', () => {
    const render = (notes: string, updatedAt: string) => root.render(<RenewalCustomerNotes customerId="u1" customerName="Cliente" notes={notes} updatedAt={updatedAt} canEdit />)
    act(() => render('Nota inicial', 'v1'))
    act(() => container.querySelector<HTMLButtonElement>('[aria-label="Editar notas del cliente"]')!.click())
    const textarea = container.querySelector('textarea')!
    expect(textarea.value).toBe('Nota inicial')
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, 'Nueva nota')
      textarea.dispatchEvent(new Event('input', { bubbles: true }))
    })
    act(() => render('Nota cambiada por otro usuario', 'v2'))
    act(() => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    expect(mocks.updateNotes).toHaveBeenCalledWith(
      { id: 'u1', notes: 'Nueva nota', expectedUpdatedAt: 'v1' }, expect.any(Object),
    )
  })
})