'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, MoreVertical, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { trpc } from '@/utils/trpc'

interface Adoption {
  id: string
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
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const deleteMutation = useMutation(
    trpc.adoptions.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Adoção removida. Status do gato revertido.')
        queryClient.invalidateQueries({ queryKey: [['adoptions']] })
        queryClient.invalidateQueries({ queryKey: [['cats']] })
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao remover adoção')
      },
    })
  )

  const handleDelete = () => {
    setIsOpen(false)
    if (
      !confirm(
        `Tem certeza que deseja remover o registro de adoção de ${adoption.catName}?\n\nO status do gato será revertido para "Em processo".`
      )
    ) {
      return
    }
    deleteMutation.mutate({ id: adoption.id })
  }

  const handleView = () => {
    setIsOpen(false)
    onView?.()
  }

  const isPending = deleteMutation.isPending

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground h-8 w-8 rounded-lg transition-colors"
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
          onClick={handleDelete}
          disabled={isPending}
          className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 hover:!text-destructive focus:!text-destructive cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Remover adoção</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
