'use client'


import { usePhoneMask } from '../_hooks/use-phone-mask'

import type { ApplicationFormValues } from './application-form-schema'
import type { UseFormReturn } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface ApplicationFixedFieldsProps {
  form: UseFormReturn<ApplicationFormValues>
  disabled?: boolean
}

const inputClassName =
  'h-12 rounded-xl border-[#AEC7E2]/50 bg-white/80 text-[#783201] placeholder:text-[#8B5A2B]/50 focus-visible:border-[#E35915]/30 focus-visible:ring-[#E35915]/20'

export function ApplicationFixedFields({
  form,
  disabled = false,
}: ApplicationFixedFieldsProps) {
  const { formatPhone } = usePhoneMask()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-[#783201]">Seus dados</h4>
        <p className="text-sm text-[#8B5A2B]/70">
          Precisamos dessas informações para a ONG entrar em contato.
        </p>
      </div>

      <FormField
        control={form.control}
        name="applicantName"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-sm font-medium text-[#783201]">
              Nome completo *
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                placeholder="Seu nome completo"
                className={inputClassName}
                disabled={disabled}
                autoComplete="name"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="applicantEmail"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-sm font-medium text-[#783201]">
              E-mail *
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                type="email"
                placeholder="voce@email.com"
                className={inputClassName}
                disabled={disabled}
                autoComplete="email"
                inputMode="email"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="applicantWhatsapp"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="text-sm font-medium text-[#783201]">
              WhatsApp *
            </FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                onChange={(event) => {
                  field.onChange(formatPhone(event.target.value))
                }}
                placeholder="(11) 99999-9999"
                className={inputClassName}
                disabled={disabled}
                autoComplete="tel"
                inputMode="tel"
              />
            </FormControl>
            <FormDescription className="text-xs text-[#8B5A2B]/65">
              Usamos seu número apenas para contato sobre a adoção.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
