import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Checkbox } from '~/components/ui/checkbox'
import { toast } from 'sonner'
import { supabase } from '~/lib/supabase/client'
import { useForm } from '@tanstack/react-form'
import { useSignIn } from '~/hooks/useAuth'
import { useEffect } from 'react'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
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

function LoginPage() {
  const signInMutation = useSignIn()

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    onSubmit: async ({ value }) => {
      if (!value.email.trim() || !value.password.trim()) return

      await signInMutation.mutateAsync({
        email: value.email.trim(),
        password: value.password,
      })
    },
  })

  useEffect(() => {
    if (signInMutation.isSuccess) {
      window.location.href = '/'
    }
  }, [signInMutation.isSuccess])

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-10">
      <div className="hidden gradient-bg lg:col-span-7 lg:flex items-center justify-center p-6">
        <img
          src="/login-image.svg"
          alt="Bingo Game"
          width="1920"
          height="1080"
          className="h-auto w-full max-w-4xl object-contain"
        />
      </div>
      <div className="lg:col-span-3 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold text-primary">Entrar</h1>
            <p className="text-balance text-muted-foreground">
              Digite seu e-mail abaixo para entrar em sua conta
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
                    disabled={signInMutation.isPending}
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
                    disabled={signInMutation.isPending}
                  />
                  {field.state.meta.errors && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="flex items-center justify-between">
              <form.Field name="rememberMe">
                {(field) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(Boolean(checked))}
                    />
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      Lembrar-se
                    </Label>
                  </div>
                )}
              </form.Field>
              <Link
                to="/forgot-password"
                className="inline-block text-sm underline hover:text-primary transition-colors"
              >
                Esqueceu sua senha?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={signInMutation.isPending || !form.state.canSubmit}
            >
              {signInMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{' '}
            <Link to="/register" className="underline hover:text-primary transition-colors ">
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 