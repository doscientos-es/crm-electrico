import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './app/App'
import { AppProviders } from './app/providers'
import { ErrorBoundary } from './components/feedback/ErrorBoundary'
import { initializeTheme } from './lib/theme'
import './index.css'

initializeTheme()

const root = document.getElementById('root')

if (!root) {
  throw new Error('No se encontró el elemento root')
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary level="root">
      <BrowserRouter>
        <AppProviders>
          <App />
        </AppProviders>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
