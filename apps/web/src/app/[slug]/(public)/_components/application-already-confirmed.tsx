'use client'

import { CheckCircle2, Heart, Mail, MessageCircle, PartyPopper, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ApplicationAlreadyConfirmedProps {
  applicantEmail: string
  applicantWhatsapp: string
  onClose: () => void
}

export function ApplicationAlreadyConfirmed({
  applicantEmail,
  applicantWhatsapp,
  onClose,
}: ApplicationAlreadyConfirmedProps) {
  return (
    <div className="space-y-5 animate-fade-in">
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
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl"
          aria-hidden="true"
        />
        <div
          className="absolute -left-4 -bottom-4 h-20 w-20 rounded-full bg-teal-400/10 blur-2xl"
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
              className="absolute -right-2 -top-2 h-6 w-6 text-amber-400 animate-pulse"
              aria-hidden="true"
            />
            <Heart
              className="absolute -left-1 top-1/2 h-4 w-4 fill-pink-400 text-pink-400 animate-pulse animation-delay-200"
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
          'border border-[#AEC7E2]/40 bg-gradient-to-br from-white to-[#F8FBFF]'
        )}
      >
        <h5 className="mb-3 text-sm font-semibold text-[#783201]">
          O que acontece agora?
        </h5>

        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
              1
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-[#783201]">Análise da candidatura</p>
              <p className="text-xs text-[#8B5A2B]/70">
                Nossa equipe vai avaliar suas respostas
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="ml-3.5 h-3 w-px bg-[#AEC7E2]/40" aria-hidden="true" />

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#AEC7E2]/30 text-xs font-bold text-[#8B5A2B]/70">
              2
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-[#783201]">Contato via WhatsApp</p>
              <p className="text-xs text-[#8B5A2B]/70">
                Entraremos em contato para os próximos passos
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="ml-3.5 h-3 w-px bg-[#AEC7E2]/40" aria-hidden="true" />

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#AEC7E2]/30 text-xs font-bold text-[#8B5A2B]/70">
              3
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-[#783201]">Conhecer o gatinho</p>
              <p className="text-xs text-[#8B5A2B]/70">
                Agendaremos uma visita para vocês se conhecerem
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div
        className={cn(
          'rounded-2xl p-4',
          'border border-[#AEC7E2]/40 bg-white/80'
        )}
      >
        <h5 className="mb-3 text-sm font-semibold text-[#783201]">
          Dados da sua candidatura
        </h5>

        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-[#AEC7E2]/15 p-3">
            <div className="rounded-lg bg-[#E35915]/10 p-2">
              <Mail className="h-4 w-4 text-[#E35915]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#8B5A2B]/60">E-mail</p>
              <p className="truncate text-sm font-medium text-[#783201]">{applicantEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-[#AEC7E2]/15 p-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#8B5A2B]/60">WhatsApp</p>
              <p className="truncate text-sm font-medium text-[#783201]">{applicantWhatsapp}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Close button */}
      <Button
        type="button"
        onClick={onClose}
        className={cn(
          'h-12 w-full rounded-xl text-base font-semibold',
          'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
          'shadow-lg shadow-[#E35915]/25 transition-all duration-200',
          'hover:shadow-xl hover:shadow-[#E35915]/35 hover:brightness-110'
        )}
      >
        <Heart className="mr-2 h-5 w-5" />
        Entendi, vou aguardar
      </Button>
    </div>
  )
}
