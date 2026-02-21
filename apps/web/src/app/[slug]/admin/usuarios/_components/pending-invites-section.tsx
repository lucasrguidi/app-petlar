'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Mail,
  MailX,
  MoreVertical,
  RefreshCw,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { trpc } from '@/utils/trpc'

function formatTimeRemaining(expiresAt: Date | string): string {
  const now = Date.now()
  const expiresDate =
    typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const expiresMs = expiresDate.getTime()
  const diff = expiresMs - now

  if (diff <= 0) return 'Expirado'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `Expira em ${hours}h ${minutes}min`
  }
  return `Expira em ${minutes}min`
}

export function PendingInvitesSection() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null)
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(
    null
  )

  const { data, isLoading } = useQuery(
    trpc.users.listInvites.queryOptions({ page: 1, limit: 10 })
  )

  const cancelMutation = useMutation(
    trpc.users.cancelInvite.mutationOptions({
      onSuccess: () => {
        toast.success('Convite cancelado')
        queryClient.invalidateQueries({ queryKey: [['users', 'listInvites']] })
        setCancelInviteId(null)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const resendMutation = useMutation(
    trpc.users.resendInvite.mutationOptions({
      onMutate: ({ inviteId }) => {
        setResendingInviteId(inviteId)
      },
      onSuccess: () => {
        toast.success('Convite reenviado com sucesso')
        queryClient.invalidateQueries({ queryKey: [['users', 'listInvites']] })
      },
      onError: (error) => {
        toast.error(error.message)
      },
      onSettled: () => {
        setResendingInviteId(null)
      },
    })
  )

  if (isLoading || !data?.invites.length) {
    return null
  }

  return (
    <>
      <Card className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="py-3">
            <CollapsibleTrigger asChild>
              <button className="flex w-full items-center justify-between">
                <CardTitle className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
                  <Mail className="text-primary h-4 w-4" />
                  Convites pendentes ({data.pagination.total})
                </CardTitle>
                {isOpen ? (
                  <ChevronUp className="text-muted-foreground h-4 w-4" />
                ) : (
                  <ChevronDown className="text-muted-foreground h-4 w-4" />
                )}
              </button>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="max-h-72 space-y-2 overflow-y-auto pt-0 pb-3">
              {data.invites.map((invite) => {
                const isResendingThisInvite =
                  resendMutation.isPending && resendingInviteId === invite.id

                return (
                  <div
                    key={invite.id}
                    className="border-border/40 bg-muted/25 rounded-xl border px-3 py-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                        <Mail className="text-primary h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-foreground truncate text-sm font-medium">
                            {invite.email}
                          </p>
                          <Badge
                            variant={
                              invite.role === 'admin' ? 'default' : 'secondary'
                            }
                            className="hidden gap-1 px-2 py-0.5 text-[11px] sm:inline-flex"
                          >
                            {invite.role === 'admin' ? (
                              <Shield className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            {invite.role === 'admin' ? 'Admin' : 'Voluntário'}
                          </Badge>
                        </div>

                        <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{formatTimeRemaining(invite.expiresAt)}</span>
                        </div>

                        <Badge
                          variant={
                            invite.role === 'admin' ? 'default' : 'secondary'
                          }
                          className="mt-2 inline-flex gap-1 px-2 py-0.5 text-[11px] sm:hidden"
                        >
                          {invite.role === 'admin' ? (
                            <Shield className="h-3 w-3" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {invite.role === 'admin' ? 'Admin' : 'Voluntário'}
                        </Badge>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-lg"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Ações do convite</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              resendMutation.mutate({ inviteId: invite.id })
                            }
                            disabled={isResendingThisInvite}
                            className="gap-2"
                          >
                            {isResendingThisInvite ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Reenviando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3.5 w-3.5" />
                                Reenviar convite
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setCancelInviteId(invite.id)}
                            disabled={cancelMutation.isPending}
                            className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 hover:!text-destructive focus:!text-destructive gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Cancelar convite
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <ConfirmDialog
        open={!!cancelInviteId}
        onOpenChange={(open) => !open && setCancelInviteId(null)}
        variant="warning"
        icon={MailX}
        title="Cancelar convite"
        description="O link de convite será invalidado e a pessoa não poderá criar uma conta com ele."
        cancelLabel="Voltar"
        actionLabel="Cancelar convite"
        actionLoadingLabel="Cancelando..."
        isLoading={cancelMutation.isPending}
        onAction={() =>
          cancelInviteId && cancelMutation.mutate({ inviteId: cancelInviteId })
        }
      />
    </>
  )
}
