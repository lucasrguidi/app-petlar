'use client'

import { MessageCircle, Shield, ShieldCheck } from 'lucide-react'

import type { ApplicationFormValues } from './application-form-schema'
import type { ReactNode } from 'react'
import type { UseFormReturn } from 'react-hook-form'

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

interface ApplicationConsentProps {
  form: UseFormReturn<ApplicationFormValues>
  disabled?: boolean
  showValidation?: boolean
}

interface ConsentCardProps {
  icon: ReactNode
  iconChecked: ReactNode
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled: boolean
  hasError?: boolean
}

function ConsentCard({
  icon,
  iconChecked,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  hasError,
}: ConsentCardProps) {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
      aria-pressed={checked}
      className={cn(
        'w-full rounded-2xl p-4 text-left',
        'border-2 transition-all duration-200',
        'group cursor-pointer select-none',
        'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:outline-none',
        checked
          ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/80 to-white'
          : 'border-muted/40 bg-white/65 hover:border-muted/60 hover:bg-white/80',
        hasError && !checked && 'border-red-300 bg-red-50/30',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'shrink-0 rounded-xl p-3 transition-all duration-200',
            checked
              ? 'bg-emerald-100 text-emerald-600'
              : 'bg-muted/25 text-muted-foreground/60 group-hover:bg-muted/35'
          )}
        >
          {checked ? iconChecked : icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {/* Visual checkbox indicator (not interactive) */}
            <div
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg',
                'border-2 transition-all duration-200',
                checked
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-muted bg-white'
              )}
            >
              {checked && (
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <span
              className={cn(
                'text-sm font-semibold transition-colors',
                checked ? 'text-emerald-700' : 'text-foreground'
              )}
            >
              {title}
            </span>
          </div>
          <p
            className={cn(
              'mt-2 text-sm leading-relaxed',
              checked ? 'text-emerald-700/80' : 'text-muted-foreground/70'
            )}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ApplicationConsent({
  form,
  disabled = false,
  showValidation = false,
}: ApplicationConsentProps) {
  const lgpdValue = form.watch('lgpdConsent')
  const whatsappValue = form.watch('whatsappConsent')
  const bothChecked = lgpdValue && whatsappValue

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300',
            bothChecked
              ? 'bg-gradient-to-br from-emerald-100 to-emerald-50 ring-1 ring-emerald-200'
              : 'bg-gradient-to-br from-muted/30 to-muted/10 ring-1 ring-muted/40'
          )}
        >
          {bothChecked ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          ) : (
            <Shield className="h-5 w-5 text-foreground/70" />
          )}
        </div>
        <div>
          <h4
            className={cn(
              'text-base font-semibold transition-colors',
              bothChecked ? 'text-emerald-700' : 'text-foreground'
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {bothChecked ? 'Tudo certo!' : 'Quase lá!'}
          </h4>
          <p className="text-sm text-muted-foreground/70">
            {bothChecked
              ? 'Você autorizou os termos necessários'
              : 'Precisamos da sua autorização para continuar'}
          </p>
        </div>
      </div>

      {/* Consent Cards */}
      <div className="space-y-3">
        <FormField
          control={form.control}
          name="lgpdConsent"
          render={({ field, fieldState }) => {
            // Only show error after user tried to submit
            const showError = Boolean(fieldState.error) && showValidation
            return (
              <FormItem>
                <FormControl>
                  <ConsentCard
                    icon={<Shield className="h-5 w-5" />}
                    iconChecked={<ShieldCheck className="h-5 w-5" />}
                    title="Proteção de dados (LGPD)"
                    description="Autorizo o compartilhamento dos meus dados pessoais com a ONG para avaliação da minha candidatura à adoção."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                    hasError={showError}
                  />
                </FormControl>
                {showError && <FormMessage className="mt-1 ml-4" />}
              </FormItem>
            )
          }}
        />

        <FormField
          control={form.control}
          name="whatsappConsent"
          render={({ field, fieldState }) => {
            // Only show error after user tried to submit
            const showError = Boolean(fieldState.error) && showValidation
            return (
              <FormItem>
                <FormControl>
                  <ConsentCard
                    icon={<MessageCircle className="h-5 w-5" />}
                    iconChecked={<MessageCircle className="h-5 w-5" />}
                    title="Contato via WhatsApp"
                    description="Autorizo o contato via WhatsApp para acompanhamento do processo de adoção e comunicações relacionadas."
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={disabled}
                    hasError={showError}
                  />
                </FormControl>
                {showError && <FormMessage className="mt-1 ml-4" />}
              </FormItem>
            )
          }}
        />
      </div>

      {/* Helper text */}
      {!bothChecked && (
        <p className="text-center text-xs text-muted-foreground/60">
          Marque ambas as autorizações para enviar sua candidatura
        </p>
      )}
    </div>
  )
}
