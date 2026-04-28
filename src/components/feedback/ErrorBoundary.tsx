import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react'
import { Component, type ReactNode } from 'react'
import { Button } from '../ui/button'

type Level = 'root' | 'page' | 'section'

type Props = {
  children: ReactNode
  level?: Level
  fallback?: ReactNode
}

type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    const { children, fallback, level = 'page' } = this.props

    if (!error) return children
    if (fallback) return fallback

    if (level === 'root') return <RootError error={error} onReset={this.reset} />
    if (level === 'section') return <SectionError error={error} onReset={this.reset} />
    return <PageError error={error} onReset={this.reset} />
  }
}

/* ── Root: pantalla completa ── */
function RootError({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-slate-50 p-8 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-red-100">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Algo ha ido mal</h1>
        <p className="mt-2 max-w-md text-slate-500">
          La aplicacion ha encontrado un error inesperado. Puedes intentar recargar la pagina.
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-w-lg rounded-md bg-red-50 p-4 text-left text-xs text-red-700 overflow-auto">
            {error.message}
          </pre>
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Recargar pagina
        </Button>
      </div>
    </div>
  )
}

/* ── Page: error dentro del layout (nav visible) ── */
function PageError({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-xl border border-red-200 bg-red-50 p-10 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-red-100">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <div>
        <p className="font-semibold text-slate-950">Error al cargar esta seccion</p>
        <p className="mt-1 text-sm text-slate-500">Ocurrio un problema inesperado. El resto de la aplicacion sigue funcionando.</p>
        {import.meta.env.DEV && (
          <pre className="mt-3 rounded-md bg-red-100 p-3 text-left text-xs text-red-700 overflow-auto max-w-lg">
            {error.message}
          </pre>
        )}
      </div>
      <Button variant="secondary" size="sm" onClick={onReset}>
        <RotateCcw className="h-3.5 w-3.5 mr-2" />
        Reintentar
      </Button>
    </div>
  )
}

/* ── Section: inline, para secciones dentro de una pagina ── */
function SectionError({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
        <div>
          <p className="text-sm font-medium text-slate-900">Error en este componente</p>
          {import.meta.env.DEV && <p className="text-xs text-red-600">{error.message}</p>}
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onReset}>
        <RotateCcw className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
