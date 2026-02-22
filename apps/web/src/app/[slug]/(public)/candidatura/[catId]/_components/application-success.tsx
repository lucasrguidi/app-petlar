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
import { type Route } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
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
  slug: string
}

export function ApplicationSuccess({
  cat,
  applicantEmail,
  slug,
}: ApplicationSuccessProps) {
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
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-[#AEC7E2]/30 to-transparent blur-3xl" />

          {/* Floating hearts decoration */}
          <div className="absolute top-8 right-12 animate-pulse">
            <Heart className="h-4 w-4 fill-[#E35915]/20 text-[#E35915]/30" />
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
                  'ring-4 ring-white shadow-lg'
                )}
              >
                {cat.photoUrl ? (
                  <img
                    src={cat.photoUrl}
                    alt={cat.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#AEC7E2] to-[#AEC7E2]/70">
                    <Heart className="h-10 w-10 text-white" />
                  </div>
                )}
              </div>

              {/* Check badge */}
              <div
                className={cn(
                  'absolute -bottom-1 -right-1',
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
              className="mb-2 text-2xl font-bold text-[#783201] sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Candidatura enviada!
            </h2>
            <p className="text-lg text-[#8B5A2B]/80">
              Sua candidatura para adotar{' '}
              <span className="font-semibold text-[#783201]">
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
              'bg-gradient-to-br from-[#AEC7E2]/20 to-[#AEC7E2]/10',
              'border border-[#AEC7E2]/30'
            )}
          >
            <h3
              className="mb-4 flex items-center gap-2 text-base font-semibold text-[#783201]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Sparkles className="h-4 w-4 text-[#E35915]" />
              Próximos passos
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    'bg-white text-[#E35915] shadow-sm'
                  )}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#783201]">
                    Confirmação por e-mail
                  </p>
                  <p className="text-sm text-[#8B5A2B]/70">
                    Enviamos um e-mail de confirmação para{' '}
                    <span className="font-medium text-[#783201]">
                      {applicantEmail}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    'bg-white text-[#E35915] shadow-sm'
                  )}
                >
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#783201]">
                    Análise da ONG
                  </p>
                  <p className="text-sm text-[#8B5A2B]/70">
                    A equipe vai avaliar sua candidatura com carinho e atenção
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    'bg-white text-[#E35915] shadow-sm'
                  )}
                >
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#783201]">
                    Retorno em breve
                  </p>
                  <p className="text-sm text-[#8B5A2B]/70">
                    Entraremos em contato via WhatsApp ou e-mail
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Encouragement note */}
          <div
            className={cn(
              'mb-6 flex items-center gap-3 rounded-xl px-4 py-3',
              'bg-gradient-to-r from-[#E35915]/5 to-[#F07B3D]/5',
              'border border-[#E35915]/10'
            )}
          >
            <Heart className="h-5 w-5 shrink-0 fill-[#E35915]/20 text-[#E35915]" />
            <p className="text-sm text-[#783201]/80">
              <span className="font-medium text-[#783201]">
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
                'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
                'shadow-lg shadow-[#E35915]/25',
                'transition-all duration-200',
                'hover:shadow-xl hover:shadow-[#E35915]/35 hover:brightness-110'
              )}
            >
              <Link href={`/${slug}` as Route}>
                Ver outros gatos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Bottom decorative bar */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-[#E35915] to-[#F07B3D]" />
      </div>
    </div>
  )
}
