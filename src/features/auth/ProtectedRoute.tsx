import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background p-6" aria-busy="true">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" />
          Cargando aplicacion...
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
