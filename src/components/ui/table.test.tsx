// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { DataTable, Td, Tr } from './table'

afterEach(() => vi.unstubAllGlobals())

it('muestra filas skeleton accesibles sin datos ni paginación hasta terminar la carga', () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  const render = (isLoading: boolean) => root.render(
    <DataTable headers={['Cliente', 'Estado']} isLoading={isLoading} loadingLabel="Cargando clientes…"
      pagination={{ page: 1, pageSize: 25, total: 1, totalPages: 1, onPageChange: vi.fn() }}>
      <Tr><Td>Cliente real</Td><Td>Activo</Td></Tr>
    </DataTable>,
  )

  act(() => render(true))
  expect(container.querySelector('[role="status"]')?.textContent).toBe('Cargando clientes…')
  expect(container.querySelector('table')?.getAttribute('aria-busy')).toBe('true')
  expect(container.querySelectorAll('tbody tr[aria-hidden="true"]')).toHaveLength(6)
  expect(container.querySelectorAll('tbody tr:first-child td')).toHaveLength(2)
  expect(container.textContent).not.toContain('Cliente real')
  expect(container.querySelector('[aria-label="Página siguiente"]')).toBeNull()

  act(() => render(false))
  expect(container.querySelector('[role="status"]')).toBeNull()
  expect(container.querySelector('table')?.hasAttribute('aria-busy')).toBe(false)
  expect(container.textContent).toContain('Cliente real')
  expect(container.querySelector('[aria-label="Página siguiente"]')).not.toBeNull()
  act(() => root.unmount())
  container.remove()
})