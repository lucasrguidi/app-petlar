'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2, SendHorizontal } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ApplicationConsent } from './application-consent'
import { ApplicationDynamicFields } from './application-dynamic-fields'
import { ApplicationFixedFields } from './application-fixed-fields'
import {
  createApplicationFormSchema,
  defaultApplicationFormValues,
  sanitizeApplicationFormPayload,
  type ApplicationFormField,
  type ApplicationFormValues,
} from './application-form-schema'
import {
  ApplicationSheetHeader,
  type ApplicationSheetCatSummary,
} from './application-sheet-header'

import type { PublicCatCardData } from './public-cat-card'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

interface ApplicationSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cat: PublicCatCardData | null
}

function mapCardCatToSheetSummary(cat: PublicCatCardData): ApplicationSheetCatSummary {
  return {
    id: cat.id,
    name: cat.name,
    sex: cat.sex,
    ageYears: cat.ageYears,
    ageMonths: cat.ageMonths,
    photoUrl: cat.photoUrl,
  }
}

export function ApplicationSheet({ open, onOpenChange, cat }: ApplicationSheetProps) {
  const slug = useOrgSlug()

  const catId = cat?.id ?? 'cat-unset'

  const formQuery = useQuery({
    ...trpc.applications.getFormForCat.queryOptions({
      slug,
      catId,
    }),
    enabled: open && Boolean(cat?.id),
  })

  const dynamicFields = useMemo(() => {
    return (formQuery.data?.fields ?? []) as ApplicationFormField[]
  }, [formQuery.data?.fields])

  const formSchema = useMemo(() => {
    return createApplicationFormSchema(dynamicFields)
  }, [dynamicFields])

  const form = useForm<ApplicationFormValues, unknown, ApplicationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultApplicationFormValues,
    mode: 'onBlur',
  })

  useEffect(() => {
    if (!open || !cat?.id) {
      return
    }

    form.reset(defaultApplicationFormValues)
  }, [cat?.id, form, open])

  const createMutation = useMutation(
    trpc.applications.create.mutationOptions({
      onSuccess: () => {
        toast.success('Candidatura enviada com sucesso!')
        form.reset(defaultApplicationFormValues)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao enviar candidatura')
      },
    })
  )

  const handleSubmit = form.handleSubmit((values) => {
    if (!cat) return

    const payload = sanitizeApplicationFormPayload(values, dynamicFields)

    createMutation.mutate({
      slug,
      catId: cat.id,
      applicantName: payload.applicantName,
      applicantEmail: payload.applicantEmail,
      applicantWhatsapp: payload.applicantWhatsapp,
      responses: payload.responses,
      files: payload.files,
      lgpdConsent: true,
      whatsappConsent: true,
    })
  })

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultApplicationFormValues)
    }
    onOpenChange(nextOpen)
  }

  const catSummary = formQuery.data?.cat
    ? (formQuery.data.cat as ApplicationSheetCatSummary)
    : cat
      ? mapCardCatToSheetSummary(cat)
      : null
  const formQueryErrorMessage =
    formQuery.error instanceof Error ? formQuery.error.message : null

  return (
    <Sheet open={open} onOpenChange={handleSheetOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          'w-full overflow-y-auto border-l border-[#AEC7E2]/40 p-0',
          'bg-gradient-to-b from-white via-white to-[#F0F7FF]',
          'sm:max-w-lg rounded-l-2xl'
        )}
      >
        <div className="flex min-h-full flex-col">
          <SheetHeader className="space-y-1 border-b border-[#AEC7E2]/30 px-5 py-4 sm:px-6">
            <SheetTitle
              className="text-2xl font-bold text-[#783201]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Candidatura para adoção
            </SheetTitle>
            <SheetDescription className="text-sm text-[#8B5A2B]/80">
              Preencha as informações com cuidado. A ONG vai analisar sua
              candidatura e entrar em contato.
            </SheetDescription>
          </SheetHeader>

          {!cat ? (
            <div className="px-6 py-8 text-sm text-[#8B5A2B]/80">
              Escolha um gatinho para iniciar a candidatura.
            </div>
          ) : formQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-10 text-[#8B5A2B]/75">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando formulário...
            </div>
          ) : formQuery.isError ? (
            <div className="space-y-3 px-6 py-8">
              <div
                className={cn(
                  'rounded-xl border border-red-200/70 bg-red-50/80 p-4 text-red-700',
                  'flex items-start gap-2'
                )}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-sm">
                  {formQueryErrorMessage ||
                    'Não foi possível carregar o formulário desta candidatura.'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => formQuery.refetch()}
                className="rounded-xl border-red-200 text-red-700 hover:bg-red-100"
              >
                Tentar novamente
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-6 px-5 py-5 sm:px-6">
                  {catSummary && <ApplicationSheetHeader cat={catSummary} />}

                  <ApplicationFixedFields
                    form={form}
                    disabled={createMutation.isPending}
                  />

                  <Separator className="bg-[#AEC7E2]/35" />

                  {dynamicFields.length > 0 ? (
                    <ApplicationDynamicFields
                      fields={dynamicFields}
                      form={form}
                      disabled={createMutation.isPending}
                    />
                  ) : (
                    <div className="rounded-xl border border-[#AEC7E2]/30 bg-white/65 p-4">
                      <p className="text-sm text-[#8B5A2B]/75">
                        Este formulário não possui perguntas adicionais ativas no
                        momento.
                      </p>
                    </div>
                  )}

                  <Separator className="bg-[#AEC7E2]/35" />

                  <ApplicationConsent
                    form={form}
                    disabled={createMutation.isPending}
                  />
                </div>

                <div className="mt-auto border-t border-[#AEC7E2]/30 bg-white/90 px-5 py-4 backdrop-blur-sm sm:px-6">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className={cn(
                      'h-12 w-full rounded-xl text-base font-semibold',
                      'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
                      'shadow-lg shadow-[#E35915]/25 transition-all duration-200',
                      'hover:shadow-xl hover:shadow-[#E35915]/35 hover:brightness-110'
                    )}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando candidatura...
                      </>
                    ) : (
                      <>
                        <SendHorizontal className="mr-2 h-4 w-4" />
                        Enviar candidatura
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
