'use client'

import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Mail,
  MessageCircle,
  PartyPopper,
  Sparkles,
} from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ApplicationAlreadyConfirmedProps {
  applicantEmail: string
  applicantWhatsapp: string
  slug: string
}

export function ApplicationAlreadyConfirmed({
  applicantEmail,
  applicantWhatsapp,
  slug,
}: ApplicationAlreadyConfirmedProps) {
  return (
    <div className="animate-fade-in space-y-5">
      {/* Celebration header */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Background decoration */}
        <div
          className={cn(
            'absolute inset-0',
            'bg-gradient-to-br from-emerald-400/20 via-emerald-100/40 to-teal-50/30'
          )}
          aria-hidden="true"
        />
        <div
          className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-teal-400/10 blur-2xl"
          aria-hidden="true"
        />

        <div className="relative p-6 text-center">
          {/* Animated icon */}
          <div className="relative mx-auto mb-4 inline-block">
            <div
              className={cn(
                'flex h-20 w-20 items-center justify-center rounded-2xl',
                'bg-gradient-to-br from-emerald-400 to-emerald-500',
                'shadow-xl shadow-emerald-500/30',
                'animate-bounce-subtle'
              )}
            >
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            {/* Floating decorations */}
            <Sparkles
              className="absolute -top-2 -right-2 h-6 w-6 animate-pulse text-amber-400"
              aria-hidden="true"
            />
            <Heart
              className="animation-delay-200 absolute top-1/2 -left-1 h-4 w-4 animate-pulse fill-pink-400 text-pink-400"
              aria-hidden="true"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <PartyPopper className="h-5 w-5 text-amber-500" />
            <h4
              className="text-xl font-bold text-emerald-700"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Boa notícia!
            </h4>
            <PartyPopper className="h-5 w-5 -scale-x-100 text-amber-500" />
          </div>

          <p className="mt-2 text-sm leading-relaxed text-emerald-800/80">
            Você já possui uma candidatura confirmada para este gatinho.
            <br />
            Agora é só aguardar nosso contato!
          </p>
        </div>
      </div>

      {/* Timeline - What happens next */}
      <div
        className={cn(
          'rounded-2xl p-4',
          'border border-muted/40 bg-gradient-to-br from-white to-muted/20'
        )}
      >
        <h5 className="mb-3 text-sm font-semibold text-foreground">
          O que acontece agora?
        </h5>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              1
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-foreground">
                Análise da candidatura
              </p>
              <p className="text-xs text-muted-foreground/70">
                Nossa equipe vai avaliar suas respostas
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="ml-3.5 h-3 w-px bg-muted/40" aria-hidden="true" />

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/30 text-xs font-bold text-muted-foreground/70">
              2
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-foreground">
                Aguarde nosso contato
              </p>
              <p className="text-xs text-muted-foreground/70">
                Caso seja aprovado, entraremos em contato via WhatsApp
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div
        className={cn(
          'rounded-2xl p-4',
          'border border-muted/40 bg-white/80'
        )}
      >
        <h5 className="mb-3 text-sm font-semibold text-foreground">
          Dados da sua candidatura
        </h5>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-muted/15 p-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground/60">E-mail</p>
              <p className="truncate text-sm font-medium text-foreground">
                {applicantEmail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-muted/15 p-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground/60">WhatsApp</p>
              <p className="truncate text-sm font-medium text-foreground">
                {applicantWhatsapp}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA to see other cats */}
      <Button
        asChild
        className={cn(
          'h-12 w-full rounded-xl text-base font-semibold',
          'bg-gradient-to-r from-primary to-accent',
          'shadow-lg shadow-primary/25 transition-all duration-200',
          'hover:shadow-xl hover:shadow-primary/35 hover:brightness-110'
        )}
      >
        <Link href={`/${slug}` as Route}>
          Que tal conhecer outros gatinhos?
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    </div>
  )
}
