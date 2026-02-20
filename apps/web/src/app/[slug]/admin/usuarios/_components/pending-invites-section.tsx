'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Mail,
  MoreVertical,
  RefreshCw,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  const [isOpen, setIsOpen] = useState(true)
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null)

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
      onSuccess: () => {
        toast.success('Convite reenviado com sucesso')
        queryClient.invalidateQueries({ queryKey: [['users', 'listInvites']] })
      },
      onError: (error) => {
        toast.error(error.message)
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
            <CardContent className="space-y-2 pt-0 pb-3">
              {data.invites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-muted/30 flex items-center justify-between rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                      <Mail className="text-primary h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {invite.email}
                      </p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        {formatTimeRemaining(invite.expiresAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        invite.role === 'admin' ? 'default' : 'secondary'
                      }
                      className="gap-1"
                    >
                      {invite.role === 'admin' ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {invite.role === 'admin' ? 'Admin' : 'Voluntário'}
                    </Badge>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            resendMutation.mutate({ inviteId: invite.id })
                          }
                          disabled={resendMutation.isPending}
                          className="gap-2"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Reenviar convite
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCancelInviteId(invite.id)}
                          className="text-destructive focus:text-destructive gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Cancelar convite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <AlertDialog
        open={!!cancelInviteId}
        onOpenChange={() => setCancelInviteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar este convite? A pessoa não poderá
              mais usar o link para criar uma conta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                cancelInviteId &&
                cancelMutation.mutate({ inviteId: cancelInviteId })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar convite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
