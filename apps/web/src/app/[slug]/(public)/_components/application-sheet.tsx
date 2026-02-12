'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2, SendHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ApplicationAlreadyConfirmed } from './application-already-confirmed'
import {
  ApplicationCodeConfirmation,
  type ApplicationPendingConfirmation,
} from './application-code-confirmation'
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

type ApplicationSheetStep = 'form' | 'confirm' | 'already_confirmed'
type PendingSource = 'created' | 'pending_exists'

interface PendingConfirmationState extends ApplicationPendingConfirmation {
  catId: string
  source: PendingSource
}

interface ConfirmedApplicationContactState {
  email: string
  whatsapp: string
}

const pendingStoragePrefix = 'petlar:pending-application'
const confirmedDuplicateMessage =
  'Já existe uma candidatura confirmada para este gato com este e-mail'

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

function getPendingStorageKey(slug: string): string {
  return `${pendingStoragePrefix}:${slug}`
}

function isPendingSource(value: unknown): value is PendingSource {
  return value === 'created' || value === 'pending_exists'
}

function parsePendingFromStorage(rawValue: string | null): PendingConfirmationState | null {
  if (!rawValue) return null

  try {
    const parsed = JSON.parse(rawValue) as Record<string, unknown>

    if (
      typeof parsed.applicationId !== 'string' ||
      typeof parsed.confirmationToken !== 'string' ||
      typeof parsed.applicantEmail !== 'string' ||
      typeof parsed.resendRemaining !== 'number' ||
      typeof parsed.catId !== 'string'
    ) {
      return null
    }

    return {
      applicationId: parsed.applicationId,
      confirmationToken: parsed.confirmationToken,
      applicantEmail: parsed.applicantEmail,
      confirmationExpiresAt:
        typeof parsed.confirmationExpiresAt === 'number'
          ? parsed.confirmationExpiresAt
          : null,
      resendRemaining: parsed.resendRemaining,
      resendAvailableAt:
        typeof parsed.resendAvailableAt === 'number' ? parsed.resendAvailableAt : null,
      catId: parsed.catId,
      source: isPendingSource(parsed.source) ? parsed.source : 'pending_exists',
    }
  } catch {
    return null
  }
}

export function ApplicationSheet({ open, onOpenChange, cat }: ApplicationSheetProps) {
  const slug = useOrgSlug()
  const [step, setStep] = useState<ApplicationSheetStep>('form')
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmationState | null>(null)
  const [confirmedApplicationContact, setConfirmedApplicationContact] =
    useState<ConfirmedApplicationContactState | null>(null)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())

  const catId = cat?.id ?? 'cat-unset'
  const pendingStorageKey = useMemo(() => getPendingStorageKey(slug), [slug])

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

  const persistPending = useCallback(
    (value: PendingConfirmationState) => {
      if (typeof window === 'undefined') return
      sessionStorage.setItem(pendingStorageKey, JSON.stringify(value))
    },
    [pendingStorageKey]
  )

  const readPending = useCallback((): PendingConfirmationState | null => {
    if (typeof window === 'undefined') return null
    const rawValue = sessionStorage.getItem(pendingStorageKey)
    return parsePendingFromStorage(rawValue)
  }, [pendingStorageKey])

  const clearPending = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(pendingStorageKey)
    }
    setPendingConfirmation(null)
  }, [pendingStorageKey])

  useEffect(() => {
    if (!open || !cat?.id) return

    const restoredPending = readPending()
    if (restoredPending && restoredPending.catId === cat.id) {
      setConfirmedApplicationContact(null)
      setPendingConfirmation(restoredPending)
      setStep('confirm')
      setConfirmationCode('')
      return
    }

    setPendingConfirmation(null)
    setConfirmedApplicationContact(null)
    setStep('form')
    setConfirmationCode('')
    form.reset(defaultApplicationFormValues)
  }, [cat?.id, form, open, readPending])

  useEffect(() => {
    if (!open || step !== 'confirm' || !pendingConfirmation) return

    setNowMs(Date.now())

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [open, pendingConfirmation, step])

  const createMutation = useMutation(
    trpc.applications.create.mutationOptions({
      onSuccess: (result) => {
        if (!cat) return

        setConfirmedApplicationContact(null)

        const nextPending: PendingConfirmationState = {
          applicationId: result.applicationId,
          confirmationToken: result.confirmationToken,
          applicantEmail: result.applicantEmail,
          confirmationExpiresAt: result.confirmationExpiresAt,
          resendRemaining: result.resendRemaining,
          resendAvailableAt: result.resendAvailableAt,
          catId: cat.id,
          source: result.status,
        }

        setPendingConfirmation(nextPending)
        persistPending(nextPending)
        setStep('confirm')
        setConfirmationCode('')
        setNowMs(Date.now())

        if (result.status === 'pending_exists') {
          toast.message(
            'Já existe uma candidatura pendente para este e-mail. Confirme com o código enviado.'
          )
          return
        }

        toast.success('Candidatura recebida! Enviamos um código para seu e-mail.')
      },
      onError: (error, variables) => {
        const isAlreadyConfirmedError =
          error.data?.code === 'CONFLICT' ||
          error.message === confirmedDuplicateMessage

        if (isAlreadyConfirmedError) {
          clearPending()
          setConfirmationCode('')
          setNowMs(Date.now())
          setConfirmedApplicationContact({
            email: variables.applicantEmail,
            whatsapp: variables.applicantWhatsapp,
          })
          setStep('already_confirmed')
          return
        }

        toast.error(error.message || 'Erro ao enviar candidatura')
      },
    })
  )

  const confirmCodeMutation = useMutation(
    trpc.applications.confirmCode.mutationOptions({
      onSuccess: (result) => {
        if (result.status === 'already_confirmed') {
          toast.success('Esta candidatura já estava confirmada.')
        } else {
          toast.success('Candidatura confirmada com sucesso!')
        }

        clearPending()
        form.reset(defaultApplicationFormValues)
        setConfirmationCode('')
        setStep('form')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível confirmar o código')
      },
    })
  )

  const resendCodeMutation = useMutation(
    trpc.applications.resendCode.mutationOptions({
      onSuccess: (result) => {
        if (!pendingConfirmation) return

        const nextPending: PendingConfirmationState = {
          ...pendingConfirmation,
          applicationId: result.applicationId,
          confirmationToken: result.confirmationToken,
          applicantEmail: result.applicantEmail,
          confirmationExpiresAt: result.confirmationExpiresAt,
          resendRemaining: result.resendRemaining,
          resendAvailableAt: result.resendAvailableAt,
        }

        setPendingConfirmation(nextPending)
        persistPending(nextPending)
        setNowMs(Date.now())
        toast.success('Novo código enviado para seu e-mail.')
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível reenviar o código')
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

  const handleConfirmCode = () => {
    if (!pendingConfirmation) return

    if (confirmationCode.trim().length !== 6) {
      toast.error('Digite os 6 dígitos do código de confirmação')
      return
    }

    confirmCodeMutation.mutate({
      confirmationToken: pendingConfirmation.confirmationToken,
      code: confirmationCode.trim(),
    })
  }

  const handleResendCode = () => {
    if (!pendingConfirmation) return

    resendCodeMutation.mutate({
      confirmationToken: pendingConfirmation.confirmationToken,
    })
  }

  const handleAlreadyConfirmedClose = () => {
    form.reset(defaultApplicationFormValues)
    setStep('form')
    clearPending()
    setConfirmedApplicationContact(null)
    setConfirmationCode('')
    setNowMs(Date.now())
    onOpenChange(false)
  }

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultApplicationFormValues)
      setStep('form')
      setPendingConfirmation(null)
      setConfirmedApplicationContact(null)
      setConfirmationCode('')
      setNowMs(Date.now())
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
              Preencha as informações com cuidado. Iremos analisar sua
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
          ) : step === 'already_confirmed' && confirmedApplicationContact ? (
            <div className="px-5 py-5 sm:px-6">
              <div className="space-y-6">
                {catSummary && <ApplicationSheetHeader cat={catSummary} />}
                <ApplicationAlreadyConfirmed
                  applicantEmail={confirmedApplicationContact.email}
                  applicantWhatsapp={confirmedApplicationContact.whatsapp}
                  onClose={handleAlreadyConfirmedClose}
                />
              </div>
            </div>
          ) : step === 'confirm' && pendingConfirmation ? (
            <div className="px-5 py-5 sm:px-6">
              <div className="space-y-6">
                {catSummary && <ApplicationSheetHeader cat={catSummary} />}

                <ApplicationCodeConfirmation
                  pending={pendingConfirmation}
                  code={confirmationCode}
                  nowMs={nowMs}
                  isPendingExists={pendingConfirmation.source === 'pending_exists'}
                  isSubmitting={confirmCodeMutation.isPending}
                  isResending={resendCodeMutation.isPending}
                  onCodeChange={setConfirmationCode}
                  onSubmit={handleConfirmCode}
                  onResend={handleResendCode}
                />
              </div>
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
