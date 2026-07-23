'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ExternalLink,
  FileText,
  Heart,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCcw,
  Save,
  ShieldAlert,
  ShieldOff,
  UserRound,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { MarkAdoptedSheet } from '../../../_components/mark-adopted-sheet'

import {
  formatDate,
  formatDateTime,
  getStatusLabel,
  toWhatsappLink,
} from './helpers'

import type { ApplicationStatus } from './types'

import { useAuth } from '@/components/auth-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

interface ApplicantDetailsSheetProps {
  open: boolean
  applicationId: string | null
  onOpenChange: (open: boolean) => void
}

interface ApplicationFile {
  id: string
  fieldId: string
  fieldLabel: string
  fileType: 'image' | 'video'
  url: string
  createdAt: string | Date
}

function getStatusConfig(status: ApplicationStatus) {
  const config = {
    pending: {
      label: getStatusLabel(status),
      variant: 'warning' as const,
      dotClass: 'bg-warning',
    },
    reviewing: {
      label: getStatusLabel(status),
      variant: 'info' as const,
      dotClass: 'bg-info',
    },
    approved: {
      label: getStatusLabel(status),
      variant: 'success' as const,
      dotClass: 'bg-success',
    },
    rejected: {
      label: getStatusLabel(status),
      variant: 'destructive' as const,
      dotClass: 'bg-destructive',
    },
    permanently_rejected: {
      label: getStatusLabel(status),
      variant: 'destructive' as const,
      dotClass: 'bg-red-950',
    },
  }
  return config[status]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function MediaPreviewCard({ file }: { file: ApplicationFile }) {
  const [hasError, setHasError] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  const retry = () => {
    setHasError(false)
    setRetryKey((value) => value + 1)
  }

  return (
    <div className="border-border/60 bg-card/95 space-y-3 rounded-xl border p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{file.fieldLabel}</p>
          <p className="text-muted-foreground text-xs">
            Enviado em {formatDateTime(file.createdAt)}
          </p>
        </div>
        <a href={file.url} target="_blank" rel="noreferrer">
          <Button variant="outline" size="sm" className="rounded-lg">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Abrir
          </Button>
        </a>
      </div>

      {hasError ? (
        <div className="border-border/60 bg-muted/20 flex min-h-44 flex-col items-center justify-center rounded-xl border px-4 py-6 text-center">
          <AlertTriangle className="text-warning h-5 w-5" />
          <p className="mt-2 text-sm font-medium">
            Não foi possível carregar a mídia
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Tente novamente ou abra em nova aba.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={retry}
            className="mt-3 rounded-lg"
          >
            <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        </div>
      ) : file.fileType === 'image' ? (
        <div className="bg-muted/30 border-border/40 overflow-hidden rounded-xl border">
          <img
            key={retryKey}
            src={file.url}
            alt={file.fieldLabel}
            loading="lazy"
            onError={() => setHasError(true)}
            className="h-auto max-h-96 w-full object-contain"
          />
        </div>
      ) : (
        <div className="bg-muted/30 border-border/40 overflow-hidden rounded-xl border">
          <video
            key={retryKey}
            controls
            preload="metadata"
            onError={() => setHasError(true)}
            className="max-h-96 w-full"
          >
            <source src={file.url} />
          </video>
        </div>
      )}
    </div>
  )
}

function DetailsLoadingState() {
  return (
    <div className="space-y-5 p-5">
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  )
}

function renderResponseValue(value: string | boolean | null): string {
  if (value === null) return '-'
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não'
  }

  const trimmed = value.trim()
  if (!trimmed) return '-'

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return formatDate(trimmed)
  }

  return trimmed
}

export function ApplicantDetailsSheet({
  open,
  applicationId,
  onOpenChange,
}: ApplicantDetailsSheetProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [selectedStatus, setSelectedStatus] =
    useState<ApplicationStatus>('pending')
  const [permanentDialogOpen, setPermanentDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [permanentReason, setPermanentReason] = useState('')
  const [adoptionModalData, setAdoptionModalData] = useState<{
    cat: { id: string; name: string }
    applicant: {
      applicationId: string
      name: string
      phone: string
      email: string | null
    }
  } | null>(null)

  const detailsQuery = useQuery({
    ...trpc.applications.getById.queryOptions({ id: applicationId ?? '' }),
    enabled: open && Boolean(applicationId),
  })

  const updateStatusMutation = useMutation(
    trpc.applications.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success('Status atualizado com sucesso')
        queryClient.invalidateQueries({ queryKey: [['applications']] })
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível atualizar o status')
      },
    })
  )

  const permanentRejectMutation = useMutation(
    trpc.applications.permanentlyReject.mutationOptions({
      onSuccess: ({ affectedCount }) => {
        toast.success(
          `${affectedCount} candidatura${affectedCount === 1 ? '' : 's'} marcada${affectedCount === 1 ? '' : 's'} permanentemente`
        )
        queryClient.invalidateQueries({ queryKey: [['applications']] })
        setPermanentReason('')
        setPermanentDialogOpen(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível aplicar o bloqueio')
      },
    })
  )

  const revokePermanentMutation = useMutation(
    trpc.applications.revokePermanentRejection.mutationOptions({
      onSuccess: () => {
        toast.success('Bloqueio removido para candidaturas futuras')
        queryClient.invalidateQueries({ queryKey: [['applications']] })
        setRevokeDialogOpen(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível remover o bloqueio')
      },
    })
  )

  const data = detailsQuery.data

  useEffect(() => {
    if (data?.application.status) {
      setSelectedStatus(data.application.status)
    }
  }, [data?.application.status])

  const visibleResponses = useMemo(
    () =>
      (data?.responses ?? []).filter(
        (response) => response.type !== 'media' && response.value !== null
      ),
    [data?.responses]
  )

  const hasStatusChange = data && selectedStatus !== data.application.status
  const isPermanentlyRejected =
    data?.application.status === 'permanently_rejected'
  const isPermanentBlockActive = Boolean(
    data?.application.isPermanentRejectionActive
  )
  const isAdmin = user?.role === 'admin'

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="border-border/60 w-full overflow-y-auto p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-border/40 from-card to-card/95 sticky top-0 z-20 border-b bg-gradient-to-b px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                  <UserRound className="text-primary h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <SheetTitle className="font-display text-lg">
                    Detalhes da candidatura
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Visualize e gerencie esta candidatura
                  </SheetDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg sm:hidden"
                onClick={() => onOpenChange(false)}
                aria-label="Fechar detalhes"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {detailsQuery.isLoading ? (
            <DetailsLoadingState />
          ) : detailsQuery.isError ? (
            <div className="p-5">
              <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4">
                <p className="text-destructive text-sm font-medium">
                  Não foi possível carregar os detalhes.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 rounded-lg"
                  onClick={() => detailsQuery.refetch()}
                >
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : !data ? null : (
            <div className="space-y-5 p-5">
              <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-4">
                <div className="flex gap-4">
                  <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                    <span className="text-primary text-lg font-semibold">
                      {getInitials(data.application.applicantName)}
                    </span>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {data.application.applicantName}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          Confirmada em{' '}
                          {formatDateTime(
                            data.application.confirmedAt ??
                              data.application.createdAt
                          )}
                        </p>
                      </div>
                      {(() => {
                        const config = getStatusConfig(data.application.status)
                        return (
                          <Badge
                            variant={config.variant}
                            className="gap-1.5 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                          >
                            <span
                              className={cn(
                                'h-1.5 w-1.5 rounded-full',
                                config.dotClass
                              )}
                            />
                            {config.label}
                          </Badge>
                        )
                      })()}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <a
                        href={`mailto:${data.application.applicantEmail}`}
                        className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {data.application.applicantEmail}
                      </a>
                      <a
                        href={toWhatsappLink(
                          data.application.applicantWhatsapp
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {isPermanentlyRejected && (
                <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-destructive/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                      <ShieldAlert className="text-destructive h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-destructive text-sm font-semibold">
                          Rejeição permanente por e-mail
                        </h3>
                        <Badge
                          variant={
                            isPermanentBlockActive ? 'destructive' : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {isPermanentBlockActive
                            ? 'Bloqueio ativo'
                            : 'Bloqueio removido'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                        Todas as candidaturas desta pessoa na ONG receberam esta
                        marcação. Novas candidaturas só serão bloqueadas
                        enquanto o bloqueio estiver ativo.
                      </p>
                      <div className="bg-card/70 border-destructive/15 mt-3 rounded-lg border p-3">
                        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                          Motivo registrado
                        </p>
                        <p className="mt-1 text-sm whitespace-pre-wrap">
                          {data.application.permanentRejectionReason ||
                            'Motivo não informado'}
                        </p>
                        {data.application.permanentlyRejectedAt && (
                          <p className="text-muted-foreground mt-2 text-xs">
                            Aplicado em{' '}
                            {formatDateTime(
                              data.application.permanentlyRejectedAt
                            )}
                          </p>
                        )}
                      </div>
                      {isPermanentBlockActive && isAdmin && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-3 rounded-lg"
                          onClick={() => setRevokeDialogOpen(true)}
                        >
                          <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                          Remover bloqueio futuro
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="border-border/60 bg-card/95 shadow-warm-sm space-y-3 rounded-xl border p-4">
                <Label className="text-sm font-semibold">
                  Atualizar status
                </Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select
                    value={selectedStatus}
                    disabled={isPermanentBlockActive}
                    onValueChange={(value) =>
                      setSelectedStatus(value as ApplicationStatus)
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl sm:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="reviewing">Em análise</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Recusado</SelectItem>
                      <SelectItem value="permanently_rejected" disabled>
                        Rejeição permanente
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: data.application.id,
                        status: selectedStatus,
                      })
                    }
                    disabled={
                      !hasStatusChange ||
                      updateStatusMutation.isPending ||
                      isPermanentBlockActive ||
                      selectedStatus === 'permanently_rejected'
                    }
                    className="shadow-primary-glow rounded-xl"
                  >
                    {updateStatusMutation.isPending ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <Save className="mr-2 h-4 w-4" />
                        Salvar status
                      </span>
                    )}
                  </Button>
                </div>
                {isPermanentBlockActive ? (
                  <p className="text-muted-foreground text-xs">
                    Remova o bloqueio permanente antes de alterar este status.
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive w-full rounded-xl"
                    onClick={() => setPermanentDialogOpen(true)}
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    {isPermanentlyRejected
                      ? 'Aplicar novo bloqueio permanente'
                      : 'Rejeitar permanentemente'}
                  </Button>
                )}
              </div>

              <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-4">
                <Button
                  type="button"
                  onClick={() => {
                    // Salvar dados antes de fechar o Sheet
                    setAdoptionModalData({
                      cat: { id: data.cat.id, name: data.cat.name },
                      applicant: {
                        applicationId: data.application.id,
                        name: data.application.applicantName,
                        phone: data.application.applicantWhatsapp,
                        email: data.application.applicantEmail,
                      },
                    })
                    // Fechar o Sheet
                    onOpenChange(false)
                  }}
                  className="bg-success hover:bg-success/90 text-success-foreground shadow-success/25 hover:shadow-success/35 w-full rounded-xl shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Registrar adoção
                </Button>
              </div>

              <div className="border-border/60 bg-card/95 space-y-3 rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-semibold">
                    Respostas do formulário
                  </h3>
                </div>
                {visibleResponses.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Não há respostas textuais para esta candidatura.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {visibleResponses.map((response) => (
                      <div
                        key={response.fieldId}
                        className="border-border/60 bg-muted/20 rounded-lg border p-3"
                      >
                        <p className="text-sm font-medium">{response.label}</p>
                        <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                          {renderResponseValue(
                            response.value as string | boolean | null
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-border/60 bg-card/95 space-y-3 rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <Video className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-semibold">Mídias enviadas</h3>
                </div>

                {data.files.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    Nenhuma mídia foi enviada nesta candidatura.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {data.files.map((file) => (
                      <MediaPreviewCard key={file.id} file={file} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={permanentDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!permanentRejectMutation.isPending) {
            setPermanentDialogOpen(nextOpen)
            if (!nextOpen) setPermanentReason('')
          }
        }}
      >
        <DialogContent className="overflow-hidden rounded-2xl p-0 sm:max-w-lg">
          <div className="from-destructive/12 via-card to-card border-destructive/15 border-b bg-gradient-to-br p-6">
            <div className="bg-destructive/10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
              <ShieldAlert className="text-destructive h-5 w-5" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Rejeitar permanentemente
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                O e-mail <strong>{data?.application.applicantEmail}</strong>{' '}
                será bloqueado nesta ONG. Todas as candidaturas existentes e
                futuras receberão o mesmo motivo.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-2 px-6">
            <Label htmlFor="permanent-rejection-reason">
              Motivo da rejeição <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="permanent-rejection-reason"
              value={permanentReason}
              onChange={(event) => setPermanentReason(event.target.value)}
              maxLength={1000}
              placeholder="Registre um motivo objetivo para orientar toda a equipe..."
              className="min-h-32 resize-none rounded-xl"
              autoFocus
            />
            <p className="text-muted-foreground text-right text-xs tabular-nums">
              {permanentReason.length}/1000
            </p>
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPermanentDialogOpen(false)}
              disabled={permanentRejectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !data ||
                permanentReason.trim().length === 0 ||
                permanentRejectMutation.isPending
              }
              onClick={() => {
                if (!data) return
                permanentRejectMutation.mutate({
                  id: data.application.id,
                  reason: permanentReason,
                })
              }}
            >
              {permanentRejectMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar rejeição permanente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={revokeDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!revokePermanentMutation.isPending) {
            setRevokeDialogOpen(nextOpen)
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover bloqueio futuro?</DialogTitle>
            <DialogDescription className="leading-relaxed">
              Novas candidaturas de{' '}
              <strong>{data?.application.applicantEmail}</strong> voltarão a
              entrar como pendentes. As rejeições já registradas permanecerão no
              histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRevokeDialogOpen(false)}
              disabled={revokePermanentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!data || revokePermanentMutation.isPending}
              onClick={() => {
                if (!data) return
                revokePermanentMutation.mutate({
                  email: data.application.applicantEmail,
                })
              }}
            >
              {revokePermanentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remover bloqueio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {adoptionModalData && (
        <MarkAdoptedSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) setAdoptionModalData(null)
          }}
          cat={adoptionModalData.cat}
          initialApplicant={adoptionModalData.applicant}
        />
      )}
    </>
  )
}
