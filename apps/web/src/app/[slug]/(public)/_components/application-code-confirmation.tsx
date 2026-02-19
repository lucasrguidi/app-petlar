'use client'

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
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

interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const digits = value.padEnd(6, '').split('').slice(0, 6)

  const focusInput = useCallback((index: number) => {
    const input = inputRefs.current[index]
    if (input) {
      input.focus()
      input.select()
    }
  }, [])

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      if (digits[index]) {
        const newValue = value.slice(0, index) + value.slice(index + 1)
        onChange(newValue)
      } else if (index > 0) {
        focusInput(index - 1)
        const newValue = value.slice(0, index - 1) + value.slice(index)
        onChange(newValue)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1)
    } else if (e.key === 'ArrowRight' && index < 5) {
      focusInput(index + 1)
    }
  }

  const handleInput = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = e.target.value.replace(/\D/g, '')
    if (!inputValue) return

    if (inputValue.length === 6) {
      onChange(inputValue)
      focusInput(5)
      return
    }

    const char = inputValue[inputValue.length - 1]
    const newValue = value.slice(0, index) + char + value.slice(index + 1)
    onChange(newValue.slice(0, 6))

    if (index < 5) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
    if (pastedData) {
      onChange(pastedData)
      focusInput(Math.min(pastedData.length, 5))
    }
  }

  useEffect(() => {
    if (value.length === 0) {
      focusInput(0)
    }
  }, [focusInput, value.length])

  return (
    <div
      className="flex items-center justify-center gap-2"
      onPaste={handlePaste}
    >
      {[0, 1, 2].map((index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          value={digits[index] || ''}
          onChange={(e) => handleInput(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={cn(
            'h-14 w-12 rounded-xl text-center',
            'text-2xl font-bold',
            'border-2 transition-all duration-150',
            'bg-white/90 text-[#783201]',
            digits[index]
              ? 'border-[#E35915]/50 bg-[#E35915]/5'
              : 'border-[#AEC7E2]',
            'focus:border-[#E35915] focus:ring-2 focus:ring-[#E35915]/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-[#8B5A2B]/30'
          )}
          placeholder="•"
          aria-label={`Dígito ${index + 1}`}
        />
      ))}

      <span className="mx-1 text-2xl font-light text-[#8B5A2B]/40">-</span>

      {[3, 4, 5].map((index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          maxLength={6}
          value={digits[index] || ''}
          onChange={(e) => handleInput(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          className={cn(
            'h-14 w-12 rounded-xl text-center',
            'text-2xl font-bold',
            'border-2 transition-all duration-150',
            'bg-white/90 text-[#783201]',
            digits[index]
              ? 'border-[#E35915]/50 bg-[#E35915]/5'
              : 'border-[#AEC7E2]',
            'focus:border-[#E35915] focus:ring-2 focus:ring-[#E35915]/20 focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'placeholder:text-[#8B5A2B]/30'
          )}
          placeholder="•"
          aria-label={`Dígito ${index + 1}`}
        />
      ))}
    </div>
  )
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
  const isCodeComplete = code.length === 6

  const timerMinutes = Math.floor(expiresInSeconds / 60)
  const isTimeLow = expiresInSeconds < 300 && expiresInSeconds > 0

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header */}
      <div className="text-center">
        <div
          className={cn(
            'mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl',
            'bg-gradient-to-br from-[#E35915]/15 to-[#F07B3D]/10',
            'ring-1 ring-[#E35915]/20'
          )}
        >
          <Mail className="h-8 w-8 text-[#E35915]" />
        </div>
        <h4
          className="text-xl font-bold text-[#783201]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Verifique seu e-mail
        </h4>
        <p className="mt-1 text-sm text-[#8B5A2B]/75">
          Enviamos um código de 6 dígitos para confirmar
        </p>
      </div>

      {/* Warning for pending exists */}
      {isPendingExists && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl p-4',
            'border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white'
          )}
        >
          <div className="rounded-lg bg-amber-100 p-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-amber-800">
              Candidatura já iniciada
            </p>
            <p className="mt-0.5 text-amber-700/80">
              Use o código enviado anteriormente para concluir.
            </p>
          </div>
        </div>
      )}

      {/* Email info card */}
      <div
        className={cn(
          'rounded-2xl p-4',
          'border border-[#AEC7E2]/40 bg-gradient-to-br from-white to-[#F8FBFF]'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-[#E35915]/10 p-2.5">
            <Mail className="h-5 w-5 text-[#E35915]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#8B5A2B]/60">
              Código enviado para
            </p>
            <p className="truncate font-medium text-[#783201]">
              {pending.applicantEmail}
            </p>
          </div>
        </div>
      </div>

      {/* OTP Input */}
      <div className="space-y-3">
        <OtpInput
          value={code}
          onChange={onCodeChange}
          disabled={isSubmitting}
        />

        {/* Code status indicator */}
        {isCodeComplete && !hasExpired && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="font-medium text-emerald-600">
              Código completo
            </span>
          </div>
        )}
      </div>

      {/* Timer */}
      {!hasExpired && pending.confirmationExpiresAt !== null && (
        <div
          className={cn(
            'flex items-center justify-center gap-3 rounded-xl p-3',
            isTimeLow
              ? 'border border-amber-200 bg-amber-50/50'
              : 'border border-[#AEC7E2]/30 bg-white/50'
          )}
        >
          <Clock3
            className={cn(
              'h-5 w-5',
              isTimeLow ? 'animate-pulse text-amber-500' : 'text-[#8B5A2B]/50'
            )}
          />
          <div className="text-center">
            <span
              className={cn(
                'text-lg font-bold tabular-nums',
                isTimeLow ? 'text-amber-600' : 'text-[#783201]'
              )}
            >
              {formatCountdown(expiresInSeconds)}
            </span>
            <span
              className={cn(
                'ml-2 text-sm',
                isTimeLow ? 'text-amber-600/80' : 'text-[#8B5A2B]/60'
              )}
            >
              {timerMinutes > 0 ? 'minutos restantes' : 'segundos restantes'}
            </span>
          </div>
        </div>
      )}

      {/* Expired warning */}
      {hasExpired && (
        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl p-4',
            'border border-red-200 bg-gradient-to-br from-red-50 to-white'
          )}
        >
          <div className="rounded-lg bg-red-100 p-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-red-700">Código expirado</p>
            <p className="text-red-600/80">
              Solicite um novo código para continuar.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className={cn(
            'h-12 w-full rounded-xl text-base font-semibold',
            'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
            'shadow-lg shadow-[#E35915]/25 transition-all duration-200',
            'hover:shadow-xl hover:shadow-[#E35915]/35 hover:brightness-110',
            'disabled:opacity-50 disabled:shadow-none'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-5 w-5" />
              Confirmar candidatura
            </>
          )}
        </Button>

        {/* Resend section */}
        <div
          className={cn(
            'flex items-center justify-between rounded-xl p-3',
            'border border-[#AEC7E2]/30 bg-white/50'
          )}
        >
          <div className="text-sm">
            <span className="text-[#8B5A2B]/60">Não recebeu? </span>
            <span className="font-medium text-[#783201]">
              {pending.resendRemaining} tentativa
              {pending.resendRemaining !== 1 ? 's' : ''} restante
              {pending.resendRemaining !== 1 ? 's' : ''}
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onResend}
            disabled={!canResend}
            className={cn(
              'h-9 rounded-lg px-3',
              'text-[#783201] hover:bg-[#AEC7E2]/20',
              'disabled:opacity-50'
            )}
          >
            <RefreshCw
              className={cn('mr-1.5 h-4 w-4', isResending && 'animate-spin')}
            />
            {isResending
              ? 'Enviando...'
              : resendCooldownSeconds > 0
                ? `${resendCooldownSeconds}s`
                : 'Reenviar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
