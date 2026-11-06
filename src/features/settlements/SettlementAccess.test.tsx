// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { visibleNavItems } from '../../config/nav'
import type { AppRole } from '../../types/database.types'
import { SettlementAccess } from './SettlementAccess'

const auth = vi.hoisted(() => ({ role: null as string | null }))
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({ profile: auth.role ? { role: auth.role } : null }),
}))

describe('acceso a Mis liquidaciones', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ['owner', true], ['admin', true], ['sales', false],
    ['technician', false], ['viewer', false], [null, false],
  ] as const)('controla navegación y acceso directo para %s', (role, allowed) => {
    auth.role = role
    expect(visibleNavItems(role as AppRole | null).some((item) => item.href === '/settlements')).toBe(allowed)
    expect(visibleNavItems(role as AppRole | null).some((item) => item.href === '/contracts')).toBe(true)

    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const SettlementsPage = vi.fn(() => <p>Contenido de liquidaciones</p>)
    act(() => root.render(
      <MemoryRouter initialEntries={['/settlements']}>
        <Routes>
          <Route path="/settlements" element={<SettlementAccess><SettlementsPage /></SettlementAccess>} />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    ))
    expect(container.textContent).toBe(allowed ? 'Contenido de liquidaciones' : 'Dashboard')
    expect(SettlementsPage).toHaveBeenCalledTimes(allowed ? 1 : 0)
    act(() => root.unmount())
    container.remove()
  })
})