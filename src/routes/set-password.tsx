import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import logoUrl from '../assets/media/logo.png'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Field, Input } from '../components/ui/input'
import { appBrand } from '../config/nav'
import { useAuth } from '../features/auth/AuthContext'
import { supabase } from '../lib/supabase'

const schema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] })

type Values = z.infer<typeof schema>

export function SetPasswordRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  // Wait for Supabase to process the recovery link before checking the session.
  if (isLoading) return <main className="grid min-h-dvh place-items-center" aria-busy="true">Comprobando enlace…</main>

  // If not coming from an auth link, redirect to login
  if (!isAuthenticated) return <Navigate to="/login" replace />

  async function onSubmit(values: Values) {
    setServerError(null)
    const { error } = await supabase.auth.updateUser({ password: values.password })
    if (error) setServerError(error.message)
    else navigate('/dashboard', { replace: true })
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8">
          <div className="mb-8">
            <img src={logoUrl} alt={`Logo de ${appBrand.name}`} className="mb-5 h-auto w-full rounded-md object-contain" />
            <h1 className="text-xl font-semibold text-foreground">Nueva contraseña</h1>
            <p className="mt-1 text-sm text-muted-foreground">Elige una contraseña segura para tu cuenta.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
            <Field label="Nueva contraseña" error={errors.password?.message} hint="Mínimo 8 caracteres" required>
              <Input {...register('password')} type="password" autoComplete="new-password" placeholder="••••••••" autoFocus />
            </Field>
            <Field label="Confirmar contraseña" error={errors.confirm?.message} required>
              <Input {...register('confirm')} type="password" autoComplete="new-password" placeholder="••••••••" />
            </Field>
            {serverError && (
              <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
