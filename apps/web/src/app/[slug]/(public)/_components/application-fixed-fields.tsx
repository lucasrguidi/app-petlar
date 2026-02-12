'use client'

import { CheckCircle2, Mail, Phone, User } from 'lucide-react'
import { type ReactNode } from 'react'

import { usePhoneMask } from '../_hooks/use-phone-mask'

import type { ApplicationFormValues } from './application-form-schema'
import type { UseFormReturn } from 'react-hook-form'



import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ApplicationFixedFieldsProps {
  form: UseFormReturn<ApplicationFormValues>
  disabled?: boolean
}

interface IconInputProps {
  icon: ReactNode
  isValid?: boolean
  children: ReactNode
}

function IconInput({ icon, isValid, children }: IconInputProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#783201]">
        {icon}
      </div>
      {children}
      {isValid && (
        <div className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        </div>
      )}
    </div>
  )
}

const baseInputClassName = cn(
  'h-12 rounded-xl pl-12 pr-4',
  'border border-[#AEC7E2]',
  'bg-white/90 backdrop-blur-sm',
  'text-[#783201] placeholder:text-[#8B5A2B]/45',
  'transition-all duration-200',
  'focus-visible:border-[#E35915] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#E35915]/20'
)

const validInputClassName = 'pr-12'

export function ApplicationFixedFields({
  form,
  disabled = false,
}: ApplicationFixedFieldsProps) {
  const { formatPhone } = usePhoneMask()

  const nameValue = form.watch('applicantName')
  const emailValue = form.watch('applicantEmail')
  const whatsappValue = form.watch('applicantWhatsapp')

  const isNameValid = Boolean(nameValue && nameValue.trim().length >= 3)
  const isEmailValid = Boolean(
    emailValue && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
  )
  const isWhatsappValid = Boolean(
    whatsappValue && whatsappValue.replace(/\D/g, '').length >= 10
  )

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-[#E35915]/10 to-[#F07B3D]/10',
            'ring-1 ring-[#E35915]/20'
          )}
        >
          <User className="h-5 w-5 text-[#E35915]" />
        </div>
        <div>
          <h4
            className="text-base font-semibold text-[#783201]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Seus dados
          </h4>
          <p className="text-sm text-[#8B5A2B]/70">
            Para a ONG entrar em contato com você
          </p>
        </div>
      </div>

      {/* Fields Container */}
      <div className="space-y-4 rounded-2xl border border-[#AEC7E2]/30 bg-white/50 p-4 backdrop-blur-sm">
        <FormField
          control={form.control}
          name="applicantName"
          render={({ field, fieldState }) => (
            <FormItem className="space-y-1.5">
              <FormLabel className="text-sm font-medium text-[#783201]">
                Nome completo
              </FormLabel>
              <FormControl>
                <IconInput
                  icon={<User className="h-5 w-5" />}
                  isValid={isNameValid && !fieldState.error}
                >
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Como você se chama?"
                    className={cn(
                      baseInputClassName,
                      isNameValid && !fieldState.error && validInputClassName,
                      fieldState.error && 'border-red-300 focus-visible:border-red-400'
                    )}
                    disabled={disabled}
                    autoComplete="name"
                  />
                </IconInput>
              </FormControl>
              <FormMessage className="animate-fade-in text-xs" />
            </FormItem>
          )}
        />

        {/* Email and WhatsApp - side by side on larger screens */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="applicantEmail"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium text-[#783201]">
                  E-mail
                </FormLabel>
                <FormControl>
                  <IconInput
                    icon={<Mail className="h-5 w-5" />}
                    isValid={isEmailValid && !fieldState.error}
                  >
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      type="email"
                      placeholder="seu@email.com"
                      className={cn(
                        baseInputClassName,
                        isEmailValid && !fieldState.error && validInputClassName,
                        fieldState.error && 'border-red-300 focus-visible:border-red-400'
                      )}
                      disabled={disabled}
                      autoComplete="email"
                      inputMode="email"
                    />
                  </IconInput>
                </FormControl>
                <FormMessage className="animate-fade-in text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applicantWhatsapp"
            render={({ field, fieldState }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-sm font-medium text-[#783201]">
                  WhatsApp
                </FormLabel>
                <FormControl>
                  <IconInput
                    icon={<Phone className="h-5 w-5" />}
                    isValid={isWhatsappValid && !fieldState.error}
                  >
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) => {
                        field.onChange(formatPhone(event.target.value))
                      }}
                      placeholder="(11) 99999-9999"
                      className={cn(
                        baseInputClassName,
                        isWhatsappValid && !fieldState.error && validInputClassName,
                        fieldState.error && 'border-red-300 focus-visible:border-red-400'
                      )}
                      disabled={disabled}
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </IconInput>
                </FormControl>
                <FormMessage className="animate-fade-in text-xs" />
              </FormItem>
            )}
          />
        </div>

        {/* Privacy note */}
        <p className="flex items-center gap-2 rounded-xl bg-[#AEC7E2]/15 px-3 py-2 text-xs text-[#8B5A2B]/70">
          <span className="shrink-0">🔒</span>
          <span>
            Seus dados são usados apenas para contato sobre a adoção e são
            protegidos conforme a LGPD.
          </span>
        </p>
      </div>
    </div>
  )
}
