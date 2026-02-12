'use client'

import type { ApplicationFormValues } from './application-form-schema'
import type { UseFormReturn } from 'react-hook-form'


import { Checkbox } from '@/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

interface ApplicationConsentProps {
  form: UseFormReturn<ApplicationFormValues>
  disabled?: boolean
}

const consentBoxClassName = cn(
  'rounded-xl border border-[#AEC7E2]/40 bg-white/65 p-4',
  'space-y-2'
)

const checkboxClassName = cn(
  'mt-0.5 h-5 w-5 rounded-md border-[#AEC7E2]',
  'data-[state=checked]:border-[#E35915] data-[state=checked]:bg-[#E35915]',
  'focus-visible:ring-[#E35915]/25'
)

export function ApplicationConsent({
  form,
  disabled = false,
}: ApplicationConsentProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-[#783201]">Consentimentos</h4>
        <p className="text-sm text-[#8B5A2B]/70">
          Precisamos da sua autorização para continuar.
        </p>
      </div>

      <FormField
        control={form.control}
        name="lgpdConsent"
        render={({ field }) => (
          <FormItem className={consentBoxClassName}>
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={disabled}
                  className={checkboxClassName}
                />
              </FormControl>
              <FormLabel className="cursor-pointer text-sm leading-relaxed font-medium text-[#783201]">
                Autorizo o compartilhamento dos meus dados pessoais com a ONG para
                fins de avaliação da minha candidatura à adoção, conforme a Lei
                Geral de Proteção de Dados (LGPD).
              </FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="whatsappConsent"
        render={({ field }) => (
          <FormItem className={consentBoxClassName}>
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={disabled}
                  className={checkboxClassName}
                />
              </FormControl>
              <FormLabel className="cursor-pointer text-sm leading-relaxed font-medium text-[#783201]">
                Autorizo o contato via WhatsApp para acompanhamento do processo de
                adoção e comunicações relacionadas.
              </FormLabel>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
