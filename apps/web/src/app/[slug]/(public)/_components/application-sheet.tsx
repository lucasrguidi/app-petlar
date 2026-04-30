'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  SendHorizontal,
} from 'lucide-react'
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
import { ApplicationStepper } from './application-stepper'

import type { PublicCatCardData } from './public-cat-card'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
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
type FormStep = 1 | 2 | 3

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

function mapCardCatToSheetSummary(
  cat: PublicCatCardData
): ApplicationSheetCatSummary {
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

function parsePendingFromStorage(
  rawValue: string | null
): PendingConfirmationState | null {
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
        typeof parsed.resendAvailableAt === 'number'
          ? parsed.resendAvailableAt
          : null,
      catId: parsed.catId,
      source: isPendingSource(parsed.source) ? parsed.source : 'pending_exists',
    }
  } catch {
    return null
  }
}

export function ApplicationSheet({
  open,
  onOpenChange,
  cat,
}: ApplicationSheetProps) {
  const slug = useOrgSlug()
  const [step, setStep] = useState<ApplicationSheetStep>('form')
  const [formStep, setFormStep] = useState<FormStep>(1)
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmationState | null>(null)
  const [confirmedApplicationContact, setConfirmedApplicationContact] =
    useState<ConfirmedApplicationContactState | null>(null)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [consentValidationAttempted, setConsentValidationAttempted] =
    useState(false)

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
    setFormStep(1)
    setConfirmationCode('')
    setConsentValidationAttempted(false)
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

        // Handle auto-confirmed applications (SKIP_EMAIL_CONFIRMATION)
        if (result.status === 'confirmed') {
          clearPending()
          form.reset(defaultApplicationFormValues)
          setConfirmationCode('')
          setStep('form')
          onOpenChange(false)
          toast.success('Candidatura enviada com sucesso!')
          return
        }

        const nextPending: PendingConfirmationState = {
          applicationId: result.applicationId,
          confirmationToken: result.confirmationToken!,
          applicantEmail: result.applicantEmail,
          confirmationExpiresAt: result.confirmationExpiresAt!,
          resendRemaining: result.resendRemaining!,
          resendAvailableAt: result.resendAvailableAt!,
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

        toast.success(
          'Candidatura recebida! Enviamos um código para seu e-mail.'
        )
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

  const handleSheetOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(defaultApplicationFormValues)
      setStep('form')
      setFormStep(1)
      setPendingConfirmation(null)
      setConfirmedApplicationContact(null)
      setConfirmationCode('')
      setConsentValidationAttempted(false)
      setNowMs(Date.now())
    }
    onOpenChange(nextOpen)
  }

  // Determine total steps based on dynamic fields
  const hasDynamicFields = dynamicFields.length > 0

  const stepperSteps = hasDynamicFields
    ? [
        { id: 1, label: 'Seus Dados', shortLabel: 'Dados' },
        { id: 2, label: 'Perguntas', shortLabel: 'Perguntas' },
        { id: 3, label: 'Finalizar', shortLabel: 'Finalizar' },
      ]
    : [
        { id: 1, label: 'Seus Dados', shortLabel: 'Dados' },
        { id: 2, label: 'Finalizar', shortLabel: 'Finalizar' },
      ]

  // Validate current step fields for navigation
  const canGoToStep2 = async () => {
    const result = await form.trigger([
      'applicantName',
      'applicantEmail',
      'applicantWhatsapp',
    ])
    return result
  }

  const canGoToStep3 = async () => {
    // For step 2 -> 3 (dynamic fields to consent), validate dynamic fields
    const result = await form.trigger('responses')
    return result
  }

  const handleNextStep = async () => {
    if (formStep === 1) {
      const isValid = await canGoToStep2()
      if (isValid) {
        setFormStep(hasDynamicFields ? 2 : 2)
      }
    } else if (formStep === 2 && hasDynamicFields) {
      const isValid = await canGoToStep3()
      if (isValid) {
        setFormStep(3)
      }
    }
  }

  const handlePrevStep = () => {
    if (formStep === 2) {
      setFormStep(1)
    } else if (formStep === 3) {
      setFormStep(2)
    }
  }

  // Determine if we're on the final step (consent step)
  const isFinalStep = hasDynamicFields ? formStep === 3 : formStep === 2
  const showBackButton = formStep > 1

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
          'w-full overflow-hidden border-l border-background/40 p-0',
          'bg-gradient-to-b from-white via-white to-muted/30',
          'rounded-l-2xl sm:max-w-lg',
          'flex flex-col'
        )}
      >
        {/* Header */}
        <SheetHeader
          className={cn(
            'shrink-0 space-y-1 border-b border-background/30 px-5 py-4 sm:px-6',
            'bg-gradient-to-r from-white to-muted/20'
          )}
        >
          <SheetTitle
            className="text-xl font-bold text-foreground sm:text-2xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Candidatura para adoção
          </SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground/80">
            {step === 'form'
              ? 'Preencha as informações com cuidado'
              : step === 'confirm'
                ? 'Confirme seu e-mail para finalizar'
                : 'Sua candidatura foi confirmada'}
          </SheetDescription>
        </SheetHeader>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {!cat ? (
            <div className="px-6 py-8 text-sm text-muted-foreground/80">
              Escolha um gatinho para iniciar a candidatura.
            </div>
          ) : formQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center gap-3 px-6 py-10">
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  'bg-primary/10'
                )}
              >
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Carregando...</p>
                <p className="text-sm text-muted-foreground/70">
                  Preparando o formulário
                </p>
              </div>
            </div>
          ) : formQuery.isError ? (
            <div className="space-y-3 px-6 py-8">
              <div
                className={cn(
                  'rounded-2xl border border-red-200/70 bg-red-50/80 p-4 text-red-700',
                  'flex items-start gap-3'
                )}
              >
                <div className="rounded-lg bg-red-100 p-2">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">Erro ao carregar</p>
                  <p className="mt-1 text-sm text-red-600/80">
                    {formQueryErrorMessage ||
                      'Não foi possível carregar o formulário desta candidatura.'}
                  </p>
                </div>
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
              <div className="space-y-5">
                {catSummary && <ApplicationSheetHeader cat={catSummary} />}
                <ApplicationAlreadyConfirmed
                  applicantEmail={confirmedApplicationContact.email}
                  applicantWhatsapp={confirmedApplicationContact.whatsapp}
                />
              </div>
            </div>
          ) : step === 'confirm' && pendingConfirmation ? (
            <div className="px-5 py-5 sm:px-6">
              <div className="space-y-5">
                {catSummary && <ApplicationSheetHeader cat={catSummary} />}

                <ApplicationCodeConfirmation
                  pending={pendingConfirmation}
                  code={confirmationCode}
                  nowMs={nowMs}
                  isPendingExists={
                    pendingConfirmation.source === 'pending_exists'
                  }
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
              <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
              >
                {/* Stepper */}
                <div
                  className={cn(
                    'shrink-0 border-b border-background/25 px-5 py-4 sm:px-6',
                    'bg-gradient-to-b from-muted/20 to-white'
                  )}
                >
                  <ApplicationStepper
                    currentStep={formStep}
                    steps={stepperSteps}
                  />
                </div>

                {/* Cat summary - always visible */}
                <div className="shrink-0 px-5 pt-5 sm:px-6">
                  {catSummary && <ApplicationSheetHeader cat={catSummary} />}
                </div>

                {/* Step content with animation */}
                <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                  {/* Step 1: Fixed Fields (Contact Info) */}
                  {formStep === 1 && (
                    <div className="animate-fade-in">
                      <ApplicationFixedFields
                        form={form}
                        disabled={createMutation.isPending}
                      />
                    </div>
                  )}

                  {/* Step 2: Dynamic Fields (if any) or Consent (if no dynamic fields) */}
                  {formStep === 2 && (
                    <div className="animate-fade-in">
                      {hasDynamicFields ? (
                        <ApplicationDynamicFields
                          fields={dynamicFields}
                          form={form}
                          disabled={createMutation.isPending}
                        />
                      ) : (
                        <ApplicationConsent
                          form={form}
                          disabled={createMutation.isPending}
                          showValidation={consentValidationAttempted}
                        />
                      )}
                    </div>
                  )}

                  {/* Step 3: Consent (only when there are dynamic fields) */}
                  {formStep === 3 && hasDynamicFields && (
                    <div className="animate-fade-in">
                      <ApplicationConsent
                        form={form}
                        disabled={createMutation.isPending}
                        showValidation={consentValidationAttempted}
                      />
                    </div>
                  )}
                </div>

                {/* Footer with navigation */}
                <div
                  className={cn(
                    'shrink-0 border-t border-background/30',
                    'bg-white/95 px-5 py-4 backdrop-blur-md sm:px-6'
                  )}
                >
                  <div className="flex gap-3">
                    {/* Back button */}
                    {showBackButton && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevStep}
                        disabled={createMutation.isPending}
                        className={cn(
                          'h-12 rounded-xl px-4',
                          'border-background/60 text-foreground',
                          'hover:bg-background/15'
                        )}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                      </Button>
                    )}

                    {/* Next/Submit button */}
                    {isFinalStep ? (
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        onClick={() => setConsentValidationAttempted(true)}
                        className={cn(
                          'h-12 flex-1 rounded-xl text-base font-semibold',
                          'bg-gradient-to-r from-primary to-accent',
                          'shadow-lg shadow-primary/25 transition-all duration-200',
                          'hover:shadow-xl hover:shadow-primary/35 hover:brightness-110'
                        )}
                      >
                        {createMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <SendHorizontal className="mr-2 h-5 w-5" />
                            Enviar candidatura
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleNextStep}
                        disabled={createMutation.isPending}
                        className={cn(
                          'h-12 flex-1 rounded-xl text-base font-semibold',
                          'bg-gradient-to-r from-primary to-accent',
                          'shadow-lg shadow-primary/25 transition-all duration-200',
                          'hover:shadow-xl hover:shadow-primary/35 hover:brightness-110'
                        )}
                      >
                        Continuar
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
