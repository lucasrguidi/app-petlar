'use client'

import { AlertTriangle, Clock3, MailCheck, RefreshCw, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface ApplicationPendingConfirmation {
  applicationId: string
  confirmationToken: string
  applicantEmail: string
  confirmationExpiresAt: number | null
  resendRemaining: number
  resendAvailableAt: number | null
}

interface ApplicationCodeConfirmationProps {
  pending: ApplicationPendingConfirmation
  code: string
  nowMs: number
  isPendingExists: boolean
  isSubmitting: boolean
  isResending: boolean
  onCodeChange: (value: string) => void
  onSubmit: () => void
  onResend: () => void
}

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function ApplicationCodeConfirmation({
  pending,
  code,
  nowMs,
  isPendingExists,
  isSubmitting,
  isResending,
  onCodeChange,
  onSubmit,
  onResend,
}: ApplicationCodeConfirmationProps) {
  const expiresInSeconds =
    pending.confirmationExpiresAt !== null
      ? Math.max(0, Math.ceil((pending.confirmationExpiresAt - nowMs) / 1000))
      : 0

  const resendCooldownSeconds =
    pending.resendAvailableAt !== null
      ? Math.max(0, Math.ceil((pending.resendAvailableAt - nowMs) / 1000))
      : 0

  const hasExpired =
    pending.confirmationExpiresAt !== null && expiresInSeconds === 0
  const canResend =
    pending.resendRemaining > 0 &&
    resendCooldownSeconds === 0 &&
    !isResending &&
    !isSubmitting

  const canSubmit = code.length === 6 && !isSubmitting && !isResending

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-[#783201]">
          Confirme seu e-mail
        </h4>
        <p className="text-sm text-[#8B5A2B]/75">
          Digite o código de 6 dígitos enviado para continuar.
        </p>
      </div>

      {isPendingExists && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-xl border border-[#F59E0B]/35 bg-[#FFF7E8] p-3',
            'text-sm text-[#8B5A2B]'
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#F59E0B]" />
          <p>
            Já existe uma candidatura pendente para este e-mail neste gatinho.
            Use o código enviado para concluir.
          </p>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-[#AEC7E2]/35 bg-white/75 p-4">
        <div className="flex items-start gap-2 text-sm text-[#783201]">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#E35915]" />
          <div className="min-w-0">
            <p className="font-medium">Código enviado para:</p>
            <p className="truncate text-[#8B5A2B]/80">{pending.applicantEmail}</p>
            <p className="mt-1 text-xs text-[#8B5A2B]/70">
              Sua candidatura já foi registrada. Falta apenas confirmar o código.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-[#783201]">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#E35915]" />
          <div>
            <p className="font-medium">Validade do código</p>
            <p className="text-[#8B5A2B]/80">
              Código expira em 30 minutos
              {pending.confirmationExpiresAt !== null && (
                <>
                  {' '}
                  ({formatCountdown(expiresInSeconds)} restantes)
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl border border-[#AEC7E2]/35 bg-white/75 p-4">
        <label className="text-sm font-medium text-[#783201]">
          Código de confirmação
        </label>
        <Input
          value={code}
          onChange={(event) => {
            const onlyDigits = event.target.value.replace(/\D/g, '').slice(0, 6)
            onCodeChange(onlyDigits)
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className={cn(
            'h-12 rounded-xl border-[#AEC7E2]/50 bg-white text-center',
            'font-mono text-lg tracking-[0.25em] text-[#783201]',
            'placeholder:tracking-normal placeholder:text-[#8B5A2B]/45',
            'focus-visible:border-[#E35915]/30 focus-visible:ring-[#E35915]/20'
          )}
          disabled={isSubmitting}
        />
        <p className="text-xs text-[#8B5A2B]/70">
          Digite os 6 dígitos sem espaços.
        </p>
      </div>

      {hasExpired && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-xl border border-red-200/70 bg-red-50/75 p-3',
            'text-sm text-red-700'
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Código expirado. Solicite um novo código para continuar.</p>
        </div>
      )}

      <div className="space-y-2 rounded-xl border border-[#AEC7E2]/35 bg-white/75 p-4">
        <div className="flex items-center justify-between gap-3 text-sm text-[#783201]">
          <span className="font-medium">Reenvios restantes</span>
          <span className="font-semibold">
            {pending.resendRemaining} de 3
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={cn(
              'h-11 flex-1 rounded-xl text-sm font-semibold',
              'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
              'shadow-lg shadow-[#E35915]/25 transition-all duration-200',
              'hover:shadow-xl hover:shadow-[#E35915]/35 hover:brightness-110'
            )}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Confirmando...' : 'Confirmar candidatura'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onResend}
            disabled={!canResend}
            className="h-11 flex-1 rounded-xl border-[#AEC7E2]/60 bg-white text-[#783201] hover:bg-[#F7FBFF]"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isResending && 'animate-spin')} />
            {isResending
              ? 'Reenviando...'
              : resendCooldownSeconds > 0
                ? `Reenviar em ${resendCooldownSeconds}s`
                : 'Reenviar código'}
          </Button>
        </div>
      </div>
    </div>
  )
}
