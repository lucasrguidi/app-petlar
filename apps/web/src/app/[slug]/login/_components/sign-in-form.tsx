'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useOrgHref } from '@/hooks/use-org-href'
import { authClient } from '@/lib/auth-client'
import { buildOrgScopedAuthEmail } from '@/lib/org-auth-identity'
import { cn } from '@/lib/utils'
import { trpcClient } from '@/utils/trpc'

const signInSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type SignInFormValues = z.infer<typeof signInSchema>

interface SignInFormProps {
  orgId: string
  callbackUrl?: string | null
}

export function SignInForm({ orgId, callbackUrl }: SignInFormProps) {
  const adminHref = useOrgHref('/admin')
  const forgotPasswordHref = useOrgHref('/esqueci-senha')
  const [showPassword, setShowPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(data: SignInFormValues) {
    try {
      const authEmail = await buildOrgScopedAuthEmail({
        orgId,
        email: data.email,
      })

      const { data: session, error } = await authClient.signIn.email({
        email: authEmail,
        password: data.password,
      })

      if (error) {
        toast.error('Não foi possível entrar com estas credenciais.')
        return
      }

      if (!session?.user) {
        toast.error('Não foi possível entrar com estas credenciais.')
        return
      }

      const { data: userData } = await authClient.getSession()
      const userOrgId = (userData?.user as { orgId?: string })?.orgId

      if (!userOrgId) {
        await authClient.signOut()
        toast.error('Não foi possível entrar com estas credenciais.')
        return
      }

      if (userOrgId !== orgId) {
        await authClient.signOut()
        toast.error('Não foi possível entrar com estas credenciais.')
        return
      }

      // Update last login timestamp
      try {
        await trpcClient.users.updateLastLogin.mutate()
      } catch {
        // Non-blocking, continue with login
      }

      toast.success('Login realizado com sucesso!')
      window.location.assign(callbackUrl ?? adminHref)
    } catch {
      toast.error('Não foi possível entrar. Tente novamente.')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Campo E-mail */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-foreground text-sm font-medium">
                E-mail
              </FormLabel>
              <FormControl>
                <div className="relative">
                  {/* Icon container */}
                  <div
                    className={cn(
                      'absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-l-xl transition-colors duration-200',
                      focusedField === 'email'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    disabled={isLoading}
                    className="border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-primary/20 h-12 rounded-xl pl-14 text-sm transition-all duration-200 focus:ring-2"
                    {...field}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => {
                      field.onBlur()
                      setFocusedField(null)
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Campo Senha */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-foreground text-sm font-medium">
                  Senha
                </FormLabel>
                <Link
                  href={forgotPasswordHref}
                  className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <FormControl>
                <div className="relative">
                  {/* Icon container */}
                  <div
                    className={cn(
                      'absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-l-xl transition-colors duration-200',
                      focusedField === 'password'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-primary/20 h-12 rounded-xl pr-12 pl-14 text-sm transition-all duration-200 focus:ring-2"
                    {...field}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => {
                      field.onBlur()
                      setFocusedField(null)
                    }}
                  />
                  {/* Toggle password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex h-12 w-12 items-center justify-center rounded-r-xl transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* Botão de submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="group from-primary to-primary/90 shadow-primary-glow hover:shadow-primary-glow-hover h-12 w-full rounded-xl bg-gradient-to-r text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:hover:brightness-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              Entrar no Painel
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
