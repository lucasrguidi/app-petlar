'use client'

import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  Mail,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useOrgHref } from '@/hooks/use-org-href'
import { cn } from '@/lib/utils'

interface CatSummary {
  id: string
  name: string
  sex: 'male' | 'female'
  photoUrl: string | null
}

interface ApplicationSuccessProps {
  cat: CatSummary
  applicantEmail: string
}

export function ApplicationSuccess({
  cat,
  applicantEmail,
}: ApplicationSuccessProps) {
  const homeHref = useOrgHref('')
  return (
    <div className="mx-auto max-w-2xl">
      {/* Success Card */}
      <div
        className={cn(
          'relative overflow-hidden rounded-3xl',
          'bg-gradient-to-br from-white via-white to-emerald-50/50',
          'shadow-xl shadow-emerald-900/5',
          'border border-emerald-100'
        )}
      >
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Gradient orbs */}
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-200/30 to-transparent blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-muted/30 to-transparent blur-3xl" />

          {/* Floating hearts decoration */}
          <div className="absolute top-8 right-12 animate-pulse">
            <Heart className="h-4 w-4 fill-primary/20 text-primary/30" />
          </div>
          <div
            className="absolute top-16 right-24 animate-pulse"
            style={{ animationDelay: '300ms' }}
          >
            <Heart className="h-3 w-3 fill-emerald-300/40 text-emerald-400/50" />
          </div>
          <div
            className="absolute top-6 right-32 animate-pulse"
            style={{ animationDelay: '600ms' }}
          >
            <Sparkles className="h-4 w-4 text-amber-400/40" />
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 p-6 sm:p-8">
          {/* Success icon with cat photo */}
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              {/* Pulsing ring */}
              <div className="absolute -inset-3 animate-ping rounded-full bg-emerald-400/20" />
              <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-emerald-400/30 to-emerald-500/20" />

              {/* Cat photo or placeholder */}
              <div
                className={cn(
                  'relative h-24 w-24 overflow-hidden rounded-full',
                  'shadow-lg ring-4 ring-white'
                )}
              >
                {cat.photoUrl ? (
                  <img
                    src={cat.photoUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/70">
                    <Heart className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>

              {/* Check badge */}
              <div
                className={cn(
                  'absolute -right-1 -bottom-1',
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  'bg-gradient-to-br from-emerald-400 to-emerald-500',
                  'shadow-lg shadow-emerald-500/30',
                  'ring-4 ring-white'
                )}
              >
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

          {/* Success message */}
          <div className="mb-8 text-center">
            <h2
              className="mb-2 text-2xl font-bold text-foreground sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Candidatura enviada!
            </h2>
            <p className="text-lg text-muted-foreground/80">
              Sua candidatura para adotar{' '}
              <span className="font-semibold text-foreground">
                {cat.sex === 'female' ? 'a ' : 'o '}
                {cat.name}
              </span>{' '}
              foi confirmada com sucesso.
            </p>
          </div>

          {/* What happens next */}
          <div
            className={cn(
              'mb-8 rounded-2xl p-5',
              'bg-gradient-to-br from-muted/20 to-muted/10',
              'border border-muted/30'
            )}
          >
            <h3
              className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
              Próximos passos
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    'bg-white text-primary shadow-sm'
                  )}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Confirmação por e-mail
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Enviamos um e-mail de confirmação para{' '}
                    <span className="font-medium text-foreground">
                      {applicantEmail}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    'bg-white text-primary shadow-sm'
                  )}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Análise da ONG
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    A equipe vai avaliar sua candidatura com carinho e atenção
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    'bg-white text-primary shadow-sm'
                  )}
                >
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Aguarde nosso contato
                  </p>
                  <p className="text-sm text-muted-foreground/70">
                    Caso seja aprovado, entraremos em contato via WhatsApp ou
                    e-mail
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Encouragement note */}
          <div
            className={cn(
              'mb-6 flex items-center gap-3 rounded-xl px-4 py-3',
              'bg-gradient-to-r from-primary/5 to-accent/5',
              'border border-primary/10'
            )}
          >
            <Heart className="h-5 w-5 shrink-0 fill-primary/20 text-primary" />
            <p className="text-sm text-foreground/80">
              <span className="font-medium text-foreground">
                Obrigado por escolher adotar!
              </span>{' '}
              Cada candidatura é um passo importante para dar um lar a quem
              precisa.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              className={cn(
                'h-12 rounded-xl px-6 text-base font-semibold',
                'bg-gradient-to-r from-primary to-accent',
                'shadow-lg shadow-primary/25',
                'transition-all duration-200',
                'hover:shadow-xl hover:shadow-primary/35 hover:brightness-110'
              )}
            >
              <Link href={homeHref}>
                Ver outros gatos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom decorative bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-primary to-accent" />
      </div>
    </div>
  )
}
