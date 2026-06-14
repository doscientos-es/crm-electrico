import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { appBrand } from '../config/nav'
import { useAuth } from '../features/auth/AuthContext'

function LoginForm() {
  const { profiles, login } = useAuth()

  return (
    <div className="grid gap-3">
      {profiles.map((profile) => (
        <Button key={profile.id} variant="secondary" className="h-auto justify-start px-4 py-3" onClick={() => login(profile.id)}>
          <span className="text-left">
            <span className="block font-medium">{profile.full_name}</span>
            <span className="block text-xs font-normal text-muted-foreground">{profile.role === 'admin' ? 'Administrador' : 'Comercial'}</span>
          </span>
        </Button>
      ))}
    </div>
  )
}

export function LoginRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (isAuthenticated) return <Navigate to={destination} replace />

  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
              <appBrand.icon className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">{appBrand.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Selecciona un perfil para abrir la demo local.</p>
          </div>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  )
}
