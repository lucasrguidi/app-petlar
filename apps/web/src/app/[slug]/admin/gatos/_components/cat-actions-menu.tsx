'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  Heart,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
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
import { useOrgSlug } from '@/hooks/use-org-slug'
import { trpc } from '@/utils/trpc'

interface Cat {
  id: string
  name: string
  status: 'available' | 'in_progress' | 'adopted'
}

interface CatActionsMenuProps {
  cat: Cat
}

export function CatActionsMenu({ cat }: CatActionsMenuProps) {
  const slug = useOrgSlug()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: [['cats', 'list']] })
  }

  const duplicateMutation = useMutation(
    trpc.cats.duplicate.mutationOptions({
      onSuccess: () => {
        toast.success('Gato duplicado com sucesso!')
        invalidateQueries()
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao duplicar gato')
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.cats.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Gato excluído com sucesso!')
        invalidateQueries()
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao excluir gato')
      },
    })
  )

  const updateStatusMutation = useMutation(
    trpc.cats.updateStatus.mutationOptions({
      onSuccess: (_, variables) => {
        if (variables.status === 'adopted') {
          toast.success(`${cat.name} foi adotado! 🎉`)
        } else {
          const label =
            variables.status === 'available' ? 'Disponível' : 'Em processo'
          toast.success(`Status alterado para "${label}"`)
        }
        invalidateQueries()
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar status')
      },
    })
  )

  const isPending =
    duplicateMutation.isPending ||
    deleteMutation.isPending ||
    updateStatusMutation.isPending

  const handleDuplicate = () => {
    setIsOpen(false)
    duplicateMutation.mutate({ id: cat.id })
  }

  const handleDelete = () => {
    setIsOpen(false)
    if (!confirm(`Tem certeza que deseja excluir "${cat.name}"?`)) return
    deleteMutation.mutate({ id: cat.id })
  }

  const handleToggleStatus = () => {
    const newStatus = cat.status === 'available' ? 'in_progress' : 'available'
    setIsOpen(false)
    updateStatusMutation.mutate({ id: cat.id, status: newStatus })
  }

  const handleMarkAsAdopted = () => {
    setIsOpen(false)
    if (
      !confirm(
        `Tem certeza que deseja marcar "${cat.name}" como adotado?\n\nEssa ação não pode ser desfeita.`
      )
    )
      return
    updateStatusMutation.mutate({ id: cat.id, status: 'adopted' })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={isPending}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl">
        {/* Navigation */}
        <DropdownMenuItem asChild>
          <a href={`/${slug}/admin/gatos/${cat.id}/editar`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDuplicate} disabled={isPending}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href={`/${slug}/admin/gatos/${cat.id}/interessados`}>
            <Users className="mr-2 h-4 w-4" />
            Ver interessados
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Status toggle */}
        <DropdownMenuItem onClick={handleToggleStatus} disabled={isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {cat.status === 'available'
            ? 'Marcar em processo'
            : 'Marcar disponível'}
        </DropdownMenuItem>

        {/* Mark as adopted */}
        <DropdownMenuItem onClick={handleMarkAsAdopted} disabled={isPending}>
          <Heart className="mr-2 h-4 w-4" />
          Marcar como adotado
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
