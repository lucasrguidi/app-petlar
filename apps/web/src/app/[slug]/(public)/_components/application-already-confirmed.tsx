'use client'

import { CheckCircle2, Clock3, MailCheck, MessageCircle } from 'lucide-react'

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
    <div className="space-y-5">
      <div
        className={cn(
          'rounded-2xl border border-emerald-200/65 bg-gradient-to-br',
          'from-emerald-50 via-white to-[#F2FBF5] p-5 shadow-[0_10px_30px_rgba(22,163,74,0.14)]'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-100 p-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-semibold text-[#783201]">
              Candidatura já confirmada
            </h4>
            <p className="text-sm leading-relaxed text-[#8B5A2B]/85">
              Este e-mail já possui uma candidatura confirmada para este gatinho.
              Iremos continuar por essa candidatura e entraremos em contato
              somente pelo WhatsApp informado.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-[#AEC7E2]/35 bg-white/80 p-4">
        <div className="flex items-start gap-2 text-sm text-[#783201]">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#E35915]" />
          <div className="min-w-0">
            <p className="font-medium">E-mail da candidatura</p>
            <p className="truncate text-[#8B5A2B]/80">{applicantEmail}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-[#783201]">
          <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#E35915]" />
          <div className="min-w-0">
            <p className="font-medium">WhatsApp da candidatura</p>
            <p className="truncate text-[#8B5A2B]/80">{applicantWhatsapp}</p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-[#783201]">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#E35915]" />
          <p className="text-[#8B5A2B]/80">
            Iremos te chamar nesse WhatsApp quando houver atualização da
            candidatura.
          </p>
        </div>
      </div>

      <Button
        type="button"
        onClick={onClose}
        className={cn(
          'h-11 w-full rounded-xl text-sm font-semibold',
          'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
          'shadow-lg shadow-[#E35915]/25 transition-all duration-200',
          'hover:shadow-xl hover:shadow-[#E35915]/35 hover:brightness-110'
        )}
      >
        Entendi, vou aguardar
      </Button>
    </div>
  )
}
