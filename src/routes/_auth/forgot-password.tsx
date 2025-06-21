import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '~/lib/supabase/client'
import { useForm } from '@tanstack/react-form'
import { useResetPassword } from '~/hooks/useAuth'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
  beforeLoad: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      throw redirect({
        to: '/',
      })
    }
  },
})

function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false)
  const resetPasswordMutation = useResetPassword()

  const form = useForm({
    defaultValues: {
      email: '',
    },
    onSubmit: async ({ value }) => {
      if (!value.email.trim()) return

      await resetPasswordMutation.mutateAsync({
        email: value.email.trim(),
      })
    },
  })

  useEffect(() => {
    if (resetPasswordMutation.isSuccess) {
      setIsSent(true)
      toast.success(
        'Email de redefinição enviado! Verifique sua caixa de entrada.',
      )
    }
  }, [resetPasswordMutation.isSuccess])

  const SentState = () => (
    <div className="mx-auto grid w-full gap-6 text-center ">
      <div className="grid gap-2">
        <h1 className="text-3xl font-bold text-green-600">Email Enviado!</h1>
        <p className="text-balance text-muted-foreground">
          Verifique sua caixa de entrada para redefinir sua senha
        </p>
      </div>
      <div className="text-sm text-muted-foreground">
        <p>
          Enviamos um link de redefinição de senha para{' '}
          <strong>{form.getFieldValue('email')}</strong>.
        </p>
        <p>Clique no link no email para criar uma nova senha.</p>
      </div>
      <Button
        variant="outline"
        onClick={() => {
          setIsSent(false)
          form.setFieldValue('email', '')
        }}
        className="w-full"
      >
        Enviar novamente
      </Button>
      <div className="mt-4 text-center text-sm">
        <Link to="/login" className="underline">
          Voltar para o login
        </Link>
      </div>
    </div>
  )

  const FormState = () => (
    <>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold text-primary">Esqueceu sua senha?</h1>
        <p className="text-balance text-muted-foreground">
          Digite seu email para receber um link de redefinição
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="grid gap-4"
      >
        <form.Field
          name="email"
          validators={{
            onChange: ({ value }) => {
              if (!value) return 'Email é obrigatório'
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return 'Email inválido'
              }
            },
          }}
        >
          {(field) => (
            <div className="grid gap-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="seu@email.com"
                required
                disabled={resetPasswordMutation.isPending}
              />
              {field.state.meta.errors && (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors.join(', ')}
                </p>
              )}
            </div>
          )}
        </form.Field>
        <Button type="submit" className="w-full" disabled={resetPasswordMutation.isPending || !form.state.canSubmit}>
          {resetPasswordMutation.isPending ? 'Enviando...' : 'Enviar Email de Redefinição'}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        Lembrou sua senha?{' '}
        <Link to="/login" className="underline hover:text-primary transition-colors">
          Fazer login
        </Link>
      </div>
    </>
  )

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-10">
      <div className="hidden gradient-bg lg:col-span-7 lg:flex items-center justify-center p-6">
        <img
          src="/reset-image.svg"
          alt="Bingo Game"
          width="1920"
          height="1080"
          className="h-auto w-full max-w-4xl object-contain"
        />
      </div>
      <div className="lg:col-span-3 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {isSent ? <SentState /> : <FormState />}
        </div>
      </div>
    </div>
  )
} 