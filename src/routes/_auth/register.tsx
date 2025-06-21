import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { toast } from 'sonner'
import { supabase } from '~/lib/supabase/client'
import { useForm } from '@tanstack/react-form'
import { useSignUp } from '~/hooks/useAuth'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth/register')({
  component: RegisterPage,
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

function RegisterPage() {
  const signUpMutation = useSignUp()

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (!value.name.trim() || !value.email.trim() || !value.password.trim() || !value.confirmPassword.trim()) {
        return
      }

      if (value.password !== value.confirmPassword) {
        toast.error('As senhas não coincidem')
        return
      }

      if (value.password.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres')
        return
      }

      await signUpMutation.mutateAsync({
        email: value.email.trim(),
        password: value.password,
        name: value.name.trim(),
      })
    },
  })

  useEffect(() => {
    if (signUpMutation.isSuccess) {
      toast.success(
        'Conta criada com sucesso! Verifique seu email para confirmar.',
      )
      window.location.href = '/login'
    }
  }, [signUpMutation.isSuccess])

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-10">
      <div className="hidden gradient-bg lg:col-span-7 lg:flex items-center justify-center p-6">
        <img
          src="/register-image.svg"
          alt="Bingo Game"
          width="1920"
          height="1080"
          className="h-auto w-full max-w-4xl object-contain"
        />
      </div>
      <div className="lg:col-span-3 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold text-primary">Criar Conta</h1>
            <p className="text-balance text-muted-foreground">
              Digite seus dados para criar uma nova conta
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="grid gap-8"
          >
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return 'Nome é obrigatório'
                  if (value.length < 2) return 'Nome deve ter pelo menos 2 caracteres'
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Nome</Label>
                  <Input
                    id={field.name}
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    disabled={signUpMutation.isPending}
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

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
                    disabled={signUpMutation.isPending}
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return 'Senha é obrigatória'
                  if (value.length < 6) return 'Senha deve ter pelo menos 6 caracteres'
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Senha</Label>
                  <Input
                    id={field.name}
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Sua senha"
                    required
                    disabled={signUpMutation.isPending}
                    minLength={6}
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{
                onChange: ({ value, fieldApi }) => {
                  if (!value) return 'Confirmação de senha é obrigatória'
                  const password = fieldApi.form.getFieldValue('password')
                  if (value !== password) return 'As senhas não coincidem'
                },
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Confirmar Senha</Label>
                  <Input
                    id={field.name}
                    type="password"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Confirme sua senha"
                    required
                    disabled={signUpMutation.isPending}
                    minLength={6}
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={signUpMutation.isPending || !form.state.canSubmit}
            >
              {signUpMutation.isPending ? 'Criando conta...' : 'Criar Conta'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{' '}
            <Link to="/login" className="underline hover:text-primary transition-colors">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 