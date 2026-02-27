'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Loader2, SendHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ApplicationAlreadyConfirmed } from '../../../_components/application-already-confirmed'
import {
  ApplicationCodeConfirmation,
  type ApplicationPendingConfirmation,
} from '../../../_components/application-code-confirmation'
import { ApplicationConsent } from '../../../_components/application-consent'
import { ApplicationDynamicFields } from '../../../_components/application-dynamic-fields'
import { ApplicationFixedFields } from '../../../_components/application-fixed-fields'
import {
  createApplicationFormSchema,
  defaultApplicationFormValues,
  sanitizeApplicationFormPayload,
  type ApplicationFormField,
  type ApplicationFormValues,
} from '../../../_components/application-form-schema'

import { ApplicationFormCard } from './application-form-card'
import { ApplicationSidebar } from './application-sidebar'
import { ApplicationSuccess } from './application-success'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

interface ApplicationPageProps {
  slug: string
  catId: string
}

type ApplicationStep = 'form' | 'confirm' | 'already_confirmed' | 'success'
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

export function ApplicationPage({ slug, catId }: ApplicationPageProps) {
  const [step, setStep] = useState<ApplicationStep>('form')
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmationState | null>(null)
  const [confirmedApplicationContact, setConfirmedApplicationContact] =
    useState<ConfirmedApplicationContactState | null>(null)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [validationAttempted, setValidationAttempted] = useState(false)
  const [isRestored, setIsRestored] = useState(false)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const pendingStorageKey = useMemo(() => getPendingStorageKey(slug), [slug])

  const formQuery = useQuery({
    ...trpc.applications.getFormForCat.queryOptions({
      slug,
      catId,
    }),
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

  const clearPending = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(pendingStorageKey)
    }
    setPendingConfirmation(null)
  }, [pendingStorageKey])

  // Restore pending state from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const rawValue = sessionStorage.getItem(pendingStorageKey)
    const restoredPending = parsePendingFromStorage(rawValue)

    if (restoredPending && restoredPending.catId === catId) {
      setConfirmedApplicationContact(null)
      setPendingConfirmation(restoredPending)
      setStep('confirm')
      setConfirmationCode('')
      setIsRestored(true)
      return
    }

    setPendingConfirmation(null)
    setConfirmedApplicationContact(null)
    setStep('form')
    setConfirmationCode('')
    setValidationAttempted(false)
    setIsRestored(true)
    form.reset(defaultApplicationFormValues)
  }, [catId, form, pendingStorageKey])

  useEffect(() => {
    if (step !== 'confirm' || !pendingConfirmation) return

    setNowMs(Date.now())

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [pendingConfirmation, step])

  const createMutation = useMutation(
    trpc.applications.create.mutationOptions({
      onSuccess: (result) => {
        setConfirmedApplicationContact(null)

        const nextPending: PendingConfirmationState = {
          applicationId: result.applicationId,
          confirmationToken: result.confirmationToken,
          applicantEmail: result.applicantEmail,
          confirmationExpiresAt: result.confirmationExpiresAt,
          resendRemaining: result.resendRemaining,
          resendAvailableAt: result.resendAvailableAt,
          catId,
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
          error.message.includes(confirmedDuplicateMessage)

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
      onSuccess: () => {
        // Store email before clearing pending state
        const email = pendingConfirmation?.applicantEmail ?? ''
        setSuccessEmail(email)

        clearPending()
        form.reset(defaultApplicationFormValues)
        setConfirmationCode('')
        setStep('success')
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
    const payload = sanitizeApplicationFormPayload(values, dynamicFields)

    createMutation.mutate({
      slug,
      catId,
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

  const hasDynamicFields = dynamicFields.length > 0

  if (formQuery.isLoading || !isRestored) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Mobile: Sidebar skeleton at top */}
        <div className="lg:hidden">
          <div className="overflow-hidden rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm">
            <div className="h-24 animate-pulse bg-gradient-to-br from-background/30 to-white" />
            <div className="space-y-2 p-3">
              <div className="h-5 w-2/3 animate-pulse rounded-lg bg-background/30" />
              <div className="h-4 w-1/3 animate-pulse rounded-lg bg-background/20" />
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="space-y-4">
          {/* Header card */}
          <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <div className="h-6 w-3/4 animate-pulse rounded-lg bg-background/30" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded-lg bg-background/20" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-lg bg-background/15" />
          </div>

          {/* Contact fields card */}
          <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-background/30" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 animate-pulse rounded-lg bg-background/30" />
                <div className="h-3 w-40 animate-pulse rounded-lg bg-background/20" />
              </div>
            </div>
            <div className="mt-5 space-y-4 rounded-2xl border border-background/30 bg-white/50 p-4">
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 animate-pulse rounded bg-background/25" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-background/20" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-16 animate-pulse rounded bg-background/25" />
                  <div className="h-12 w-full animate-pulse rounded-xl bg-background/20" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3.5 w-20 animate-pulse rounded bg-background/25" />
                  <div className="h-12 w-full animate-pulse rounded-xl bg-background/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Questions card */}
          <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-background/30" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-32 animate-pulse rounded-lg bg-background/30" />
                <div className="h-3 w-24 animate-pulse rounded-lg bg-background/20" />
              </div>
            </div>
            <div className="mt-5 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-background/40 bg-gradient-to-br from-white to-muted/20 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 animate-pulse rounded-lg bg-background/30" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-20 animate-pulse rounded bg-background/20" />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-background/30" />
                    </div>
                  </div>
                  <div className="mt-3 h-12 w-full animate-pulse rounded-xl bg-background/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Submit button */}
          <div className="rounded-2xl border border-background/30 bg-white/95 p-4 shadow-lg">
            <div className="h-12 w-full animate-pulse rounded-xl bg-primary/20" />
          </div>
        </div>

        {/* Desktop: Sidebar skeleton */}
        <div className="hidden lg:block">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm">
              <div className="aspect-square animate-pulse bg-gradient-to-br from-background/30 to-white" />
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-24 animate-pulse rounded-lg bg-background/30" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-background/20" />
                </div>
                <div className="h-4 w-20 animate-pulse rounded-lg bg-background/20" />
              </div>
            </div>
            <div className="rounded-2xl bg-white/90 p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-background/30" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-background/30" />
                  <div className="h-3 w-full animate-pulse rounded bg-background/20" />
                  <div className="h-3 w-full animate-pulse rounded bg-background/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (formQuery.isError) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div
          className={cn(
            'rounded-2xl border border-red-200/70 bg-white/90 p-6',
            'shadow-lg backdrop-blur-sm'
          )}
        >
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-red-100 p-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-red-700">Erro ao carregar</p>
              <p className="mt-1 text-sm text-red-600/80">
                {formQuery.error?.message ||
                  'Não foi possível carregar o formulário desta candidatura.'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => formQuery.refetch()}
            className="mt-4 w-full rounded-xl border-red-200 text-red-700 hover:bg-red-50"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const catData = formQuery.data?.cat

  if (!catData) {
    return null
  }

  // Success state has its own full-width layout
  if (step === 'success' && successEmail) {
    return (
      <ApplicationSuccess
        cat={catData}
        applicantEmail={successEmail}
        slug={slug}
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Mobile: Sidebar compact at top */}
      <div className="lg:hidden">
        <ApplicationSidebar cat={catData} variant="compact" />
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {step === 'already_confirmed' && confirmedApplicationContact ? (
          <ApplicationFormCard title="Candidatura já confirmada">
            <ApplicationAlreadyConfirmed
              applicantEmail={confirmedApplicationContact.email}
              applicantWhatsapp={confirmedApplicationContact.whatsapp}
              slug={slug}
            />
          </ApplicationFormCard>
        ) : step === 'confirm' && pendingConfirmation ? (
          <ApplicationFormCard title="Confirme seu e-mail">
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
          </ApplicationFormCard>
        ) : (
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Header */}
              <ApplicationFormCard
                title="Candidatura para adoção"
                description={`Preencha com carinho para adotar ${catData.sex === 'female' ? 'a' : 'o'} ${catData.name}`}
              >
                <div className="text-sm text-muted-foreground/70">
                  <p>
                    A ONG analisará sua candidatura e entrará em contato. Campos
                    com <span className="text-primary">*</span> são
                    obrigatórios.
                  </p>
                </div>
              </ApplicationFormCard>

              {/* Fixed fields - contact info */}
              <ApplicationFormCard>
                <ApplicationFixedFields
                  form={form}
                  disabled={createMutation.isPending}
                />
              </ApplicationFormCard>

              {/* Dynamic fields */}
              {hasDynamicFields && (
                <ApplicationFormCard>
                  <ApplicationDynamicFields
                    fields={dynamicFields}
                    form={form}
                    disabled={createMutation.isPending}
                    showValidation={validationAttempted}
                  />
                </ApplicationFormCard>
              )}

              {/* Consent */}
              <ApplicationFormCard>
                <ApplicationConsent
                  form={form}
                  disabled={createMutation.isPending}
                  showValidation={validationAttempted}
                />
              </ApplicationFormCard>

              {/* Submit button */}
              <div
                className={cn(
                  'sticky bottom-4 rounded-2xl p-4',
                  'bg-white/95 shadow-lg backdrop-blur-sm',
                  'border border-background/30'
                )}
              >
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  onClick={() => {
                    setValidationAttempted(true)
                    // Trigger validation immediately to populate errors
                    void form.trigger()
                  }}
                  className={cn(
                    'h-12 w-full rounded-xl text-base font-semibold',
                    'bg-gradient-to-r from-primary to-accent',
                    'shadow-lg shadow-primary/25 transition-all duration-200',
                    'hover:shadow-xl hover:shadow-primary/35 hover:brightness-110',
                    'active:scale-[0.99]'
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
              </div>
            </form>
          </Form>
        )}
      </div>

      {/* Desktop: Sidebar sticky */}
      <div className="hidden lg:block">
        <ApplicationSidebar cat={catData} variant="full" />
      </div>
    </div>
  )
}
