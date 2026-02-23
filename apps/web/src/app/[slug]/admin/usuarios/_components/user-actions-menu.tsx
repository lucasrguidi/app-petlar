'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, MoreVertical, UserCheck, UserCog, UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ChangeRoleDialog } from './change-role-dialog'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { trpc } from '@/utils/trpc'

interface UserActionsMenuProps {
  user: {
    id: string
    name: string
    role: 'admin' | 'volunteer'
    active: boolean
  }
  isCurrentUser: boolean
  isLastAdmin: boolean
}

export function UserActionsMenu({
  user,
  isCurrentUser,
  isLastAdmin,
}: UserActionsMenuProps) {
  const queryClient = useQueryClient()
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)

  const deactivateMutation = useMutation(
    trpc.users.deactivate.mutationOptions({
      onSuccess: () => {
        toast.success('Usuário desativado com sucesso')
        setDeactivateDialogOpen(false)
        queryClient.invalidateQueries({ queryKey: [['users', 'list']] })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const reactivateMutation = useMutation(
    trpc.users.reactivate.mutationOptions({
      onSuccess: () => {
        toast.success('Usuário reativado com sucesso')
        queryClient.invalidateQueries({ queryKey: [['users', 'list']] })
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const canChangeRole = !isCurrentUser && user.active
  const canDeactivate =
    !isCurrentUser && user.active && !(user.role === 'admin' && isLastAdmin)
  const canReactivate = !user.active

  const changeRoleTooltip = isCurrentUser
    ? 'Você não pode alterar seu próprio papel'
    : null

  const deactivateTooltip = isCurrentUser
    ? 'Você não pode desativar a si mesmo'
    : user.role === 'admin' && isLastAdmin
      ? 'A organização precisa ter pelo menos 1 admin'
      : null

  return (
    <>
      <TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={isCurrentUser}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Ações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <DropdownMenuItem
                    onClick={() => canChangeRole && setRoleDialogOpen(true)}
                    disabled={!canChangeRole}
                    className="gap-2"
                  >
                    <UserCog className="h-3.5 w-3.5" />
                    Alterar papel
                  </DropdownMenuItem>
                </div>
              </TooltipTrigger>
              {changeRoleTooltip && (
                <TooltipContent side="left">
                  <p>{changeRoleTooltip}</p>
                </TooltipContent>
              )}
            </Tooltip>

            <DropdownMenuSeparator />

            {canReactivate ? (
              <DropdownMenuItem
                onClick={() => reactivateMutation.mutate({ userId: user.id })}
                className="text-success hover:!bg-success/10 focus:!bg-success/10 hover:!text-success focus:!text-success gap-2"
              >
                <UserCheck className="h-3.5 w-3.5" />
                Reativar usuário
              </DropdownMenuItem>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <DropdownMenuItem
                      onClick={() =>
                        canDeactivate && setDeactivateDialogOpen(true)
                      }
                      disabled={!canDeactivate}
                      className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 hover:!text-destructive focus:!text-destructive gap-2"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Desativar usuário
                    </DropdownMenuItem>
                  </div>
                </TooltipTrigger>
                {deactivateTooltip && (
                  <TooltipContent side="left">
                    <p>{deactivateTooltip}</p>
                  </TooltipContent>
                )}
              </Tooltip>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>

      <ChangeRoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        user={user}
      />

      <ConfirmDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        variant="destructive"
        icon={AlertTriangle}
        title="Desativar usuário"
        description={
          <>
            <strong className="text-foreground">{user.name}</strong> perderá o
            acesso ao sistema imediatamente. O histórico de atividades será
            preservado.
          </>
        }
        actionLabel="Desativar"
        actionLoadingLabel="Desativando..."
        isLoading={deactivateMutation.isPending}
        onAction={() => deactivateMutation.mutate({ userId: user.id })}
      />
    </>
  )
}
