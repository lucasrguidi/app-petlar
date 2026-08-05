'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AlertTriangle, Cat, Loader2, SendHorizontal, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { ApplicationAlreadyConfirmed } from '../../../../_components/application-already-confirmed'
import {
  ApplicationCodeConfirmation,
  type ApplicationPendingConfirmation,
} from '../../../../_components/application-code-confirmation'
import { ApplicationConsent } from '../../../../_components/application-consent'
import { ApplicationDynamicFields } from '../../../../_components/application-dynamic-fields'
import { ApplicationFixedFields } from '../../../../_components/application-fixed-fields'
import {
  createApplicationFormSchema,
  defaultApplicationFormValues,
  sanitizeApplicationFormPayload,
  type ApplicationFormField,
  type ApplicationFormValues,
} from '../../../../_components/application-form-schema'
import { ApplicationFormCard } from '../../../[catId]/_components/application-form-card'
import { ApplicationSuccess } from '../../../[catId]/_components/application-success'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

interface GroupApplicationPageProps {
  slug: string
  groupId: string
}

type ApplicationStep = 'form' | 'confirm' | 'already_confirmed' | 'success'
type PendingSource = 'created' | 'pending_exists'

interface PendingConfirmationState extends ApplicationPendingConfirmation {
  groupId: string
  source: PendingSource
}

interface ConfirmedApplicationContactState {
  email: string
  whatsapp: string
}

const pendingStoragePrefix = 'petlar:pending-application-group'
const confirmedDuplicateMessage =
  'Já existe uma candidatura confirmada para este grupo com este e-mail'

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
      typeof parsed.groupId !== 'string'
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
      groupId: parsed.groupId,
      source: isPendingSource(parsed.source) ? parsed.source : 'pending_exists',
    }
  } catch {
    return null
  }
}

interface GroupCatSummary {
  id: string
  name: string
  sex: 'male' | 'female' | 'unknown'
  ageYears: number | null
  ageMonths: number | null
  photoUrl: string | null
}

function formatAge(years: number | null, months: number | null): string {
  if (years && years > 0) {
    if (months && months > 0) {
      return `${years} ano${years > 1 ? 's' : ''} e ${months} ${months > 1 ? 'meses' : 'mês'}`
    }
    return `${years} ano${years > 1 ? 's' : ''}`
  }

  if (months && months > 0) {
    return `${months} ${months > 1 ? 'meses' : 'mês'}`
  }

  return 'Idade não informada'
}

function GroupSidebar({
  cats,
  variant,
}: {
  cats: GroupCatSummary[]
  variant: 'compact' | 'full'
}) {
  const isCompact = variant === 'compact'
  const names = cats.map((c) => c.name).join(' & ')

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl',
        'bg-white/95 backdrop-blur-sm',
        'shadow-lg shadow-foreground/5',
        'border border-white/60'
      )}
    >
      {/* Badge header */}
      <div className="flex items-center gap-2 bg-primary/10 px-4 py-2">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-primary">
          Adoção conjunta
        </span>
      </div>

      {/* Cat photos grid */}
      <div
        className={cn(
          'grid gap-1 p-1',
          cats.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        )}
      >
        {cats.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              'relative overflow-hidden bg-gradient-to-br from-background/30 to-white',
              isCompact ? 'h-20' : 'aspect-square'
            )}
          >
            {cat.photoUrl ? (
              <img
                src={cat.photoUrl}
                alt={`Foto de ${cat.name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Cat className="h-8 w-8 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
              <span className="text-xs font-medium text-white">
                {cat.name}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Cat info */}
      <div className={cn('space-y-2', isCompact ? 'p-3' : 'p-4')}>
        <h3
          className={cn(
            'font-bold text-foreground',
            isCompact ? 'text-lg' : 'text-xl'
          )}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {names}
        </h3>

        {!isCompact && (
          <div className="space-y-1">
            {cats.map((cat) => (
              <p key={cat.id} className="text-sm text-muted-foreground/70">
                {cat.name}: {formatAge(cat.ageYears, cat.ageMonths)}
              </p>
            ))}
          </div>
        )}

        {!isCompact && (
          <div className="mt-3 rounded-xl bg-primary/5 px-3 py-2">
            <p className="text-center text-xs font-medium text-foreground/80">
              Eles estão esperando por você
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export function GroupApplicationPage({
  slug,
  groupId,
}: GroupApplicationPageProps) {
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
    ...trpc.catGroups.getFormForGroup.queryOptions({
      slug,
      groupId,
    }),
  })

  const groupCats = useMemo<GroupCatSummary[]>(() => {
    return formQuery.data?.group?.cats ?? []
  }, [formQuery.data?.group?.cats])

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

  useEffect(() => {
    if (typeof window === 'undefined') return

    const rawValue = sessionStorage.getItem(pendingStorageKey)
    const restoredPending = parsePendingFromStorage(rawValue)

    if (restoredPending && restoredPending.groupId === groupId) {
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
  }, [groupId, form, pendingStorageKey])

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

        if (result.status === 'confirmed') {
          setSuccessEmail(result.applicantEmail)
          clearPending()
          form.reset(defaultApplicationFormValues)
          setConfirmationCode('')
          setStep('success')
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
          groupId,
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

  const names = groupCats.map((c) => c.name).join(' & ')

  const handleSubmit = form.handleSubmit((values) => {
    const payload = sanitizeApplicationFormPayload(values, dynamicFields)

    createMutation.mutate({
      slug,
      groupId,
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
        <div className="lg:hidden">
          <div className="overflow-hidden rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm">
            <div className="h-24 animate-pulse bg-gradient-to-br from-background/30 to-white" />
            <div className="space-y-2 p-3">
              <div className="h-5 w-2/3 animate-pulse rounded-lg bg-background/30" />
              <div className="h-4 w-1/3 animate-pulse rounded-lg bg-background/20" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:p-6">
            <div className="h-6 w-3/4 animate-pulse rounded-lg bg-background/30" />
            <div className="mt-2 h-4 w-1/2 animate-pulse rounded-lg bg-background/20" />
          </div>
          <div className="rounded-2xl bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:p-6">
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
        </div>
        <div className="hidden lg:block">
          <div className="overflow-hidden rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm">
            <div className="aspect-square animate-pulse bg-gradient-to-br from-background/30 to-white" />
            <div className="space-y-2 p-4">
              <div className="h-6 w-24 animate-pulse rounded-lg bg-background/30" />
              <div className="h-4 w-20 animate-pulse rounded-lg bg-background/20" />
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

  if (groupCats.length === 0) {
    return null
  }

  if (step === 'success' && successEmail) {
    return (
      <ApplicationSuccess
        cat={{
          id: groupId,
          name: names,
          sex: 'male',
          photoUrl: groupCats[0]?.photoUrl ?? null,
        }}
        applicantEmail={successEmail}
      />
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* Mobile: Sidebar compact at top */}
      <div className="lg:hidden">
        <GroupSidebar cats={groupCats} variant="compact" />
      </div>

      {/* Main content */}
      <div className="space-y-4">
        {step === 'already_confirmed' && confirmedApplicationContact ? (
          <ApplicationFormCard title="Candidatura já confirmada">
            <ApplicationAlreadyConfirmed
              applicantEmail={confirmedApplicationContact.email}
              applicantWhatsapp={confirmedApplicationContact.whatsapp}
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
                title="Candidatura para adoção conjunta"
                description={`Preencha com carinho para adotar ${names}`}
              >
                <div className="text-sm text-muted-foreground/70">
                  <p>
                    A ONG analisará sua candidatura e entrará em contato. Campos
                    com <span className="text-primary">*</span> são
                    obrigatórios.
                  </p>
                </div>
              </ApplicationFormCard>

              {/* Fixed fields */}
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
        <aside className="space-y-4 lg:sticky lg:top-6">
          <GroupSidebar cats={groupCats} variant="full" />
        </aside>
      </div>
    </div>
  )
}
