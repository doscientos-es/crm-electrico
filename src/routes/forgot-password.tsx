import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Field, Input } from '../components/ui/input'
import { appBrand } from '../config/nav'
import { supabase } from '../lib/supabase'

const schema = z.object({ email: z.string().email('Email inválido') })
type Values = z.infer<typeof schema>

export function ForgotPasswordRoute() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: Values) {
    setServerError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/set-password`,
    })
    if (error) setServerError(error.message)
    else setSent(true)
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-8">
          <div className="mb-8">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground">
              <appBrand.icon className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Recuperar contraseña</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>
          {sent ? (
            <div className="grid gap-4">
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                Email enviado. Revisa tu bandeja de entrada.
              </p>
              <Link to="/login" className="text-center text-sm underline underline-offset-4">
                Volver al login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
              <Field label="Email" error={errors.email?.message} required>
                <Input {...register('email')} type="email" autoComplete="email" placeholder="ana@empresa.com" autoFocus />
              </Field>
              {serverError && (
                <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </p>
              )}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Enviando…' : 'Enviar enlace'}
              </Button>
              <Link to="/login" className="text-center text-xs text-muted-foreground underline underline-offset-4">
                Volver al login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
