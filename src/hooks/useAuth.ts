import { useMutation } from '@tanstack/react-query'
import { useAuth } from '~/lib/auth/auth-context'
import { toast } from 'sonner'

export function useSignIn() {
  const { signIn } = useAuth()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { error } = await signIn(email, password)
      if (error) throw error
      return { success: true }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao fazer login')
    },
  })
}

export function useSignUp() {
  const { signUp } = useAuth()

  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      name 
    }: { 
      email: string; 
      password: string; 
      name: string 
    }) => {
      const { error } = await signUp(email, password, { name })
      if (error) throw error
      return { success: true }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao criar conta')
    },
  })
}

export function useSignOut() {
  const { signOut } = useAuth()

  return useMutation({
    mutationFn: async () => {
      await signOut()
      return { success: true }
    },
    onError: (error: any) => {
      toast.error('Erro ao fazer logout')
    },
  })
}

export function useResetPassword() {
  const { resetPassword } = useAuth()

  return useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      const { error } = await resetPassword(email)
      if (error) throw error
      return { success: true }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao enviar email de redefinição')
    },
  })
}

export function useUpdatePassword() {
  const { updatePassword } = useAuth()

  return useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      const { error } = await updatePassword(password)
      if (error) throw error
      return { success: true }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao atualizar senha')
    },
  })
} 