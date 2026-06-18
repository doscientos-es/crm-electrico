import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import logoUrl from '../assets/media/logo.png'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Field, Input } from '../components/ui/input'
import { appBrand } from '../config/nav'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../lib/supabase'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
})
type LoginValues = z.infer<typeof loginSchema>

function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })
    if (error) {
      setServerError(
        error.message.includes('Invalid login credentials')
          ? 'Email o contraseña incorrectos.'
          : error.message,
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <Field label="Email" error={errors.email?.message} required>
        <Input
          {...register('email')}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="ana@empresa.com"
          autoFocus
          aria-invalid={!!errors.email}
        />
      </Field>
      <Field label="Contraseña" error={errors.password?.message} required>
        <Input
          {...register('password')}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
        />
      </Field>
      {serverError && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        <Link to="/forgot-password" className="underline underline-offset-4 hover:text-foreground">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
    </form>
  )
}

export function LoginRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  if (isAuthenticated) return <Navigate to={destination} replace />

  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-[#06231f] p-4">
      <div
        className="absolute inset-0 -z-30 bg-[linear-gradient(118deg,rgba(3,27,25,0.97)_0%,rgba(5,46,42,0.93)_43%,rgba(10,72,64,0.84)_100%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_18%,rgba(251,191,36,0.46),transparent_24%),radial-gradient(circle_at_78%_16%,rgba(16,185,129,0.28),transparent_28%),linear-gradient(132deg,transparent_0_45%,rgba(255,255,255,0.14)_45%_45.7%,transparent_45.7%_52%,rgba(255,255,255,0.1)_52%_52.6%,transparent_52.6%)]"
        aria-hidden
      />
      <div
        className="absolute inset-x-[-12%] bottom-[-20%] -z-10 h-[48%] rotate-[-3deg] bg-[linear-gradient(90deg,rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[size:76px_56px] opacity-75"
        aria-hidden
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,35,31,0.08),rgba(6,35,31,0.84))]" aria-hidden />

      <Card className="w-full max-w-sm border-white/24 bg-white/95 shadow-2xl shadow-black/25 backdrop-blur-xl">
        <CardContent className="p-8">
          <div className="mb-8">
            <img src={logoUrl} alt={`Logo de ${appBrand.name}`} className="mb-5 h-auto max-h-30 w-auto rounded-md object-contain" />
            <h1 className="text-xl font-semibold text-foreground">{appBrand.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Inicia sesión con tu cuenta.</p>
          </div>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  )
}
