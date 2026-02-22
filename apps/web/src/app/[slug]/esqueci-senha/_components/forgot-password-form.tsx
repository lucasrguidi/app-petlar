'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react'
import { type Route } from 'next'
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
import { useOrgSlug } from '@/hooks/use-org-slug'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const slug = useOrgSlug()
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const isLoading = form.formState.isSubmitting

  async function onSubmit(data: ForgotPasswordFormValues) {
    try {
      const { error } = await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: `/${slug}/redefinir-senha`,
      })

      if (error) {
        // Don't reveal if email exists - show success anyway
        console.error('Forgot password error:', error)
      }

      // Always show success to prevent email enumeration
      setIsSuccess(true)
    } catch {
      toast.error('Não foi possível processar a solicitação. Tente novamente.')
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Instruções enviadas!
          </h3>
          <p className="text-sm text-muted-foreground text-balance">
            Se existe uma conta com este e-mail, você receberá as instruções
            para redefinir sua senha em instantes.
          </p>
        </div>

        <div className="pt-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/${slug}/login` as Route}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para login
            </Link>
          </Button>
        </div>
      </div>
    )
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

        {/* Botão de submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="group from-primary to-primary/90 shadow-primary-glow hover:shadow-primary-glow-hover h-12 w-full rounded-xl bg-gradient-to-r text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-70 disabled:hover:brightness-100"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar instruções
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </>
          )}
        </Button>

        {/* Link para voltar */}
        <div className="text-center">
          <Link
            href={`/${slug}/login` as Route}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar para login
          </Link>
        </div>
      </form>
    </Form>
  )
}
