'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  RefreshCw,
} from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { useOrgSlug } from '@/hooks/use-org-slug'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const slug = useOrgSlug()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState(false)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(data: ResetPasswordFormValues) {
    try {
      const { error } = await authClient.resetPassword({
        token,
        newPassword: data.password,
      })

      if (error) {
        if (
          error.message?.includes('invalid') ||
          error.message?.includes('expired')
        ) {
          setTokenError(true)
          return
        }
        toast.error('Não foi possível redefinir a senha. Tente novamente.')
        return
      }

      toast.success(
        'Senha redefinida com sucesso! Faça login com sua nova senha.'
      )
      router.push(`/${slug}/login`)
    } catch {
      toast.error('Não foi possível redefinir a senha. Tente novamente.')
    }
  }

  if (tokenError) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground text-lg font-semibold">
            Link inválido ou expirado
          </h3>
          <p className="text-muted-foreground text-sm text-balance">
            Este link de redefinição não é mais válido. Isso pode acontecer se:
          </p>
          <ul className="text-muted-foreground mx-auto mt-3 max-w-xs space-y-1 text-left text-sm">
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground/60">•</span>O link já foi
              utilizado
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground/60">•</span>O link expirou
              (válido por 1 hora)
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button asChild className="rounded-xl">
            <Link href={`/${slug}/esqueci-senha` as Route}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Solicitar novo link
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/${slug}/login` as Route}>Voltar para login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Campo Nova Senha */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-foreground text-sm font-medium">
                Nova senha
              </FormLabel>
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

        {/* Campo Confirmar Senha */}
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="text-foreground text-sm font-medium">
                Confirmar nova senha
              </FormLabel>
              <FormControl>
                <div className="relative">
                  {/* Icon container */}
                  <div
                    className={cn(
                      'absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-l-xl transition-colors duration-200',
                      focusedField === 'confirmPassword'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted/50 text-muted-foreground'
                    )}
                  >
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-primary/20 h-12 rounded-xl pr-12 pl-14 text-sm transition-all duration-200 focus:ring-2"
                    {...field}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => {
                      field.onBlur()
                      setFocusedField(null)
                    }}
                  />
                  {/* Toggle password visibility */}
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex h-12 w-12 items-center justify-center rounded-r-xl transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'
                    }
                  >
                    {showConfirmPassword ? (
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
              Redefinindo...
            </>
          ) : (
            <>
              Redefinir senha
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>
    </Form>
  )
}
