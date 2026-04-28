import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { isSupabaseConfigured } from '../lib/supabase'
import { useDemoStore } from '../store/demo-store'

export function LoginRoute() {
  const { isAuthenticated, profiles, loginDemo } = useDemoStore()
  const location = useLocation()

  if (isAuthenticated) {
    return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/dashboard'} replace />
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">E</div>
            <h1 className="text-2xl font-semibold text-foreground">Renovaciones CRM</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Demo centrada en cartera de clientes, contratos y avisos de renovacion.
            </p>
          </div>
          <div className="grid gap-3">
            {profiles.map((profile) => (
              <Button key={profile.id} variant={profile.role === 'admin' ? 'default' : 'secondary'} onClick={() => loginDemo(profile.id)}>
                Entrar como {profile.full_name} · {profile.role}
              </Button>
            ))}
          </div>
          <p className="mt-6 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Supabase: {isSupabaseConfigured ? 'configurado por variables de entorno' : 'modo demo local activo hasta configurar .env'}.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
