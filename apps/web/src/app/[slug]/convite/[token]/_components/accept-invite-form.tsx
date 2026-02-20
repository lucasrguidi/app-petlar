'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

const acceptInviteSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório').max(200),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  })

type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>

interface AcceptInviteFormProps {
  token: string
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton className="mx-auto h-20 w-20 rounded-2xl" />
        <div className="space-y-2 text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-5 w-64" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}

function ErrorState({
  reason,
  slug,
}: {
  reason: 'org_not_found' | 'invite_not_found' | 'expired' | 'already_used'
  slug: string
}) {
  const messages = {
    org_not_found: {
      icon: AlertTriangle,
      title: 'Organização não encontrada',
      description:
        'O link que você acessou não corresponde a uma organização válida.',
    },
    invite_not_found: {
      icon: AlertTriangle,
      title: 'Convite não encontrado',
      description:
        'Este convite pode ter sido cancelado ou o link está incorreto.',
    },
    expired: {
      icon: Clock,
      title: 'Convite expirado',
      description:
        'Este convite não está mais válido. Solicite um novo convite ao administrador.',
    },
    already_used: {
      icon: CheckCircle2,
      title: 'Convite já utilizado',
      description:
        'Este convite já foi aceito. Se você já criou sua conta, faça login.',
    },
  }

  const { icon: Icon, title, description } = messages[reason]

  return (
    <div className="space-y-6 text-center">
      <div className="bg-destructive/10 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl">
        <Icon className="text-destructive h-10 w-10" />
      </div>

      <div className="space-y-2">
        <h2 className="text-display text-foreground text-2xl font-bold tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground text-balance">{description}</p>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        {reason === 'already_used' && (
          <Button asChild className="gap-2">
            <Link href={`/${slug}/login`}>
              <ArrowRight className="h-4 w-4" />
              Ir para login
            </Link>
          </Button>
        )}
        <Button variant="outline" asChild>
          <Link href={`/${slug}`}>Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}

function InviteForm({
  invite,
  token,
}: {
  invite: { email: string; role: string; orgName: string }
  token: string
}) {
  const slug = useOrgSlug()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const form = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      name: '',
      password: '',
      confirmPassword: '',
    },
  })

  const acceptMutation = useMutation(
    trpc.users.acceptInvite.mutationOptions({
      onSuccess: () => {
        toast.success('Conta criada com sucesso!')
        router.push(`/${slug}/login`)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  function onSubmit(data: AcceptInviteFormValues) {
    acceptMutation.mutate({
      token,
      name: data.name,
      password: data.password,
    })
  }

  const isLoading = acceptMutation.isPending

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <p className="text-muted-foreground text-sm">
          Complete seu cadastro como
        </p>
        <Badge
          variant={invite.role === 'admin' ? 'default' : 'secondary'}
          className="gap-1.5"
        >
          {invite.role === 'admin' ? (
            <Shield className="h-3 w-3" />
          ) : (
            <User className="h-3 w-3" />
          )}
          {invite.role === 'admin' ? 'Administrador' : 'Voluntário'}
        </Badge>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* Email (readonly) */}
          <div className="space-y-2">
            <label className="text-foreground text-sm font-medium">
              E-mail
            </label>
            <div className="relative">
              <div className="bg-muted/50 text-muted-foreground absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-l-xl">
                <Mail className="h-4 w-4" />
              </div>
              <Input
                type="email"
                value={invite.email}
                disabled
                className="border-border/50 bg-muted/30 h-12 rounded-xl pl-14 text-sm"
              />
            </div>
          </div>

          {/* Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-foreground text-sm font-medium">
                  Nome completo
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <div
                      className={cn(
                        'absolute top-0 left-0 flex h-12 w-12 items-center justify-center rounded-l-xl transition-colors duration-200',
                        focusedField === 'name'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted/50 text-muted-foreground'
                      )}
                    >
                      <User className="h-4 w-4" />
                    </div>
                    <Input
                      placeholder="Seu nome"
                      disabled={isLoading}
                      className="border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-primary/20 h-12 rounded-xl pl-14 text-sm transition-all duration-200 focus:ring-2"
                      {...field}
                      onFocus={() => setFocusedField('name')}
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

          {/* Senha */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-foreground text-sm font-medium">
                  Senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
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
                      placeholder="Mínimo 6 caracteres"
                      disabled={isLoading}
                      className="border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-primary/20 h-12 rounded-xl pr-12 pl-14 text-sm transition-all duration-200 focus:ring-2"
                      {...field}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => {
                        field.onBlur()
                        setFocusedField(null)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex h-12 w-12 items-center justify-center rounded-r-xl transition-colors"
                      tabIndex={-1}
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

          {/* Confirmar Senha */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-foreground text-sm font-medium">
                  Confirmar senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
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
                      placeholder="Repita sua senha"
                      disabled={isLoading}
                      className="border-border/50 bg-muted/30 placeholder:text-muted-foreground/60 focus:border-primary focus:bg-card focus:ring-primary/20 h-12 rounded-xl pr-12 pl-14 text-sm transition-all duration-200 focus:ring-2"
                      {...field}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => {
                        field.onBlur()
                        setFocusedField(null)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="text-muted-foreground hover:text-foreground absolute top-0 right-0 flex h-12 w-12 items-center justify-center rounded-r-xl transition-colors"
                      tabIndex={-1}
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

          <Button
            type="submit"
            disabled={isLoading}
            className="group from-primary to-primary/90 shadow-primary-glow hover:shadow-primary-glow-hover h-12 w-full rounded-xl bg-gradient-to-r text-sm font-semibold transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando conta...
              </>
            ) : (
              <>
                Criar conta e entrar
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const slug = useOrgSlug()

  const { data, isLoading, isError } = useQuery(
    trpc.users.validateInvite.queryOptions({ token, slug })
  )

  if (isLoading) {
    return <LoadingState />
  }

  if (isError || !data) {
    return <ErrorState reason="invite_not_found" slug={slug} />
  }

  if (!data.valid && 'reason' in data) {
    return <ErrorState reason={data.reason} slug={slug} />
  }

  if (data.valid && 'invite' in data) {
    return <InviteForm invite={data.invite} token={token} />
  }

  return <ErrorState reason="invite_not_found" slug={slug} />
}
