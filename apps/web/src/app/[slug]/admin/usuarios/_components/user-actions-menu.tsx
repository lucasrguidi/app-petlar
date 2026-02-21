'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  MoreVertical,
  UserCheck,
  UserCog,
  UserX,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ChangeRoleDialog } from './change-role-dialog'

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
import { Button } from '@/components/ui/button'
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

      <AlertDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      >
        <AlertDialogContent className="overflow-hidden rounded-xl p-0 sm:max-w-sm">
          <div className="bg-destructive/10 border-destructive/20 flex items-center gap-3 border-b px-5 py-4">
            <div className="bg-destructive/15 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
              <AlertTriangle className="text-destructive h-5 w-5" />
            </div>
            <AlertDialogHeader className="space-y-0">
              <AlertDialogTitle className="text-base font-semibold">
                Desativar usuário
              </AlertDialogTitle>
            </AlertDialogHeader>
          </div>
          <div className="px-5 pt-4 pb-5">
            <AlertDialogDescription className="text-foreground/80 text-sm leading-relaxed">
              <strong className="text-foreground">{user.name}</strong> perderá
              o acesso ao sistema imediatamente. O histórico de atividades será
              preservado.
            </AlertDialogDescription>
          </div>
          <AlertDialogFooter className="border-border/40 gap-2 border-t bg-card px-5 py-3 sm:flex-row sm:justify-end sm:space-x-0">
            <AlertDialogCancel className="h-9 rounded-lg sm:mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateMutation.mutate({ userId: user.id })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 rounded-lg"
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? 'Desativando...' : 'Desativar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
