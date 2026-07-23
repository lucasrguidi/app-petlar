'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, MoreVertical, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/utils/trpc'

interface Adoption {
  id: string
  catId: string
  catName: string
  adopterName: string
}

interface AdoptionActionsMenuProps {
  adoption: Adoption
  onView?: () => void
}

export function AdoptionActionsMenu({
  adoption,
  onView,
}: AdoptionActionsMenuProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const isAdmin = user?.role === 'admin'

  const returnMutation = useMutation(
    trpc.adoptions.returnToAvailable.mutationOptions({
      onSuccess: () => {
        setReturnDialogOpen(false)
        toast.success('Adoção removida. Gato disponível novamente.')
        queryClient.invalidateQueries({
          queryKey: [['adoptions', 'list']],
        })
        queryClient.invalidateQueries({ queryKey: [['cats']] })
        queryClient.invalidateQueries({ queryKey: [['dashboard']] })
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao remover adoção')
      },
    })
  )

  const hardDeleteMutation = useMutation(
    trpc.cats.hardDelete.mutationOptions({
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setDeleteConfirmation('')
        toast.success('Gato e todo o histórico foram excluídos.')
        queryClient.invalidateQueries({
          queryKey: [['adoptions', 'list']],
        })
        queryClient.invalidateQueries({ queryKey: [['cats']] })
        queryClient.invalidateQueries({ queryKey: [['applications']] })
        queryClient.invalidateQueries({ queryKey: [['dashboard']] })
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível excluir o gato')
      },
    })
  )

  const handleReturn = () => {
    setIsOpen(false)
    setReturnDialogOpen(true)
  }

  const handleView = () => {
    setIsOpen(false)
    onView?.()
  }

  const handleDelete = () => {
    setIsOpen(false)
    setDeleteDialogOpen(true)
  }

  const isPending = returnMutation.isPending || hardDeleteMutation.isPending
  const isDeleteConfirmationValid =
    deleteConfirmation.trim().toLocaleLowerCase('pt-BR') ===
    adoption.catName.trim().toLocaleLowerCase('pt-BR')

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground h-8 w-8 rounded-lg transition-colors"
            disabled={isPending}
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          className="border-border/50 min-w-[140px] rounded-xl border p-1 shadow-lg"
        >
          {onView && (
            <DropdownMenuItem
              onClick={handleView}
              className="hover:!bg-muted/80 focus:!bg-muted/80 hover:!text-foreground focus:!text-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
            >
              <Eye className="text-primary h-3.5 w-3.5" />
              <span>Ver detalhes</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="bg-border/40 my-1" />

          <DropdownMenuItem
            onSelect={handleReturn}
            disabled={isPending}
            className="text-warning-foreground hover:!bg-warning/10 focus:!bg-warning/10 hover:!text-warning-foreground focus:!text-warning-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
          >
            <RotateCcw className="text-warning h-3.5 w-3.5" />
            <span>Devolver para disponíveis</span>
          </DropdownMenuItem>

          {isAdmin && (
            <>
              <DropdownMenuSeparator className="bg-border/40 my-1" />
              <DropdownMenuItem
                onSelect={handleDelete}
                disabled={isPending}
                className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 hover:!text-destructive focus:!text-destructive cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir gato definitivamente</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={returnDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!returnMutation.isPending) setReturnDialogOpen(nextOpen)
        }}
        variant="warning"
        icon={RotateCcw}
        title={`Devolver ${adoption.catName} para disponíveis?`}
        description="O registro desta adoção e o termo assinado serão apagados. O perfil do gato e todas as candidaturas permanecerão no sistema."
        note="O gato voltará a aparecer como disponível na página pública."
        actionLabel="Devolver para disponíveis"
        actionLoadingLabel="Devolvendo..."
        isLoading={returnMutation.isPending}
        onAction={() => returnMutation.mutate({ id: adoption.id })}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!hardDeleteMutation.isPending) {
            setDeleteDialogOpen(nextOpen)
            if (!nextOpen) setDeleteConfirmation('')
          }
        }}
        variant="destructive"
        icon={Trash2}
        title={`Excluir ${adoption.catName} definitivamente`}
        description="Esta ação remove o gato, a adoção, todas as candidaturas, fotos, mídias e o termo."
        note="A exclusão é permanente e não pode ser desfeita."
        actionLabel="Excluir tudo definitivamente"
        actionLoadingLabel="Excluindo..."
        isLoading={hardDeleteMutation.isPending}
        isActionDisabled={!isDeleteConfirmationValid}
        onAction={() =>
          hardDeleteMutation.mutate({
            id: adoption.catId,
            confirmationName: deleteConfirmation,
          })
        }
      >
        <div className="space-y-2">
          <Label htmlFor={`delete-cat-confirmation-${adoption.catId}`}>
            Digite <strong>{adoption.catName}</strong> para confirmar
          </Label>
          <Input
            id={`delete-cat-confirmation-${adoption.catId}`}
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            autoComplete="off"
            className="rounded-lg"
          />
        </div>
      </ConfirmDialog>
    </>
  )
}
