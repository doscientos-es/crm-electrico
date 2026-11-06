// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ForgotPasswordRoute } from './forgot-password'
import { SetPasswordRoute } from './set-password'

const mocks = vi.hoisted(() => ({
  auth: { isAuthenticated: false, isLoading: true },
  resetPasswordForEmail: vi.fn(),
}))
vi.mock('../features/auth/AuthContext', () => ({ useAuth: () => mocks.auth }))
vi.mock('../lib/supabase', () => ({ supabase: { auth: { resetPasswordForEmail: mocks.resetPasswordForEmail } } }))

describe('recuperación de contraseña', () => {
  let container: HTMLDivElement
  let root: Root
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    mocks.auth.isAuthenticated = false
    mocks.auth.isLoading = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  function renderReset() {
    root.render(<MemoryRouter initialEntries={['/set-password']}><Routes>
      <Route path="/set-password" element={<SetPasswordRoute />} />
      <Route path="/login" element={<p>Login</p>} />
    </Routes></MemoryRouter>)
  }

  it('espera a procesar el enlace y muestra el formulario si se obtiene sesión', () => {
    act(renderReset)
    expect(container.textContent).toContain('Comprobando enlace')
    expect(container.textContent).not.toContain('Login')
    mocks.auth.isLoading = false
    mocks.auth.isAuthenticated = true
    act(renderReset)
    expect(container.textContent).toContain('Nueva contraseña')
  })

  it('redirige al login si el enlace no produce una sesión', () => {
    mocks.auth.isLoading = false
    act(renderReset)
    expect(container.textContent).toBe('Login')
  })

  async function submitRecovery() {
    await act(async () => root.render(<MemoryRouter><ForgotPasswordRoute /></MemoryRouter>))
    const input = container.querySelector('input[type=email]')!
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'cliente@example.com')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await act(async () => {
      container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
  }

  it('no afirma que se haya entregado el correo cuando la solicitud es aceptada', async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null })
    await submitRecovery()
    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith('cliente@example.com', { redirectTo: `${window.location.origin}/set-password` })
    expect(container.textContent).toContain('Si existe una cuenta')
    expect(container.textContent).not.toContain('Email enviado')
  })

  it('muestra un error si falla la conexión', async () => {
    mocks.resetPasswordForEmail.mockRejectedValue(new Error('network'))
    await submitRecovery()
    expect(container.querySelector('[role=alert]')?.textContent).toContain('Comprueba tu conexión')
  })
})