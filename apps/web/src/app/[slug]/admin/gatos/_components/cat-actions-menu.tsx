'use client'

import { useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  Heart,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { deleteCat } from '../_actions/delete-cat'
import { duplicateCat } from '../_actions/duplicate-cat'
import { updateCatStatus } from '../_actions/update-cat-status'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Cat {
  id: string
  name: string
  status: 'available' | 'in_progress' | 'adopted'
}

interface CatActionsMenuProps {
  cat: Cat
  orgSlug: string
}

export function CatActionsMenu({ cat, orgSlug }: CatActionsMenuProps) {
  const queryClient = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: [['cats', 'list']] })
  }

  const handleDuplicate = () => {
    setIsOpen(false)
    startTransition(async () => {
      const result = await duplicateCat(cat.id)
      if (result.success) {
        toast.success('Gato duplicado com sucesso!')
        invalidateQueries()
      } else {
        toast.error(result.error || 'Erro ao duplicar gato')
      }
    })
  }

  const handleDelete = () => {
    setIsOpen(false)
    if (!confirm(`Tem certeza que deseja excluir "${cat.name}"?`)) return

    startTransition(async () => {
      const result = await deleteCat(cat.id)
      if (result.success) {
        toast.success('Gato excluído com sucesso!')
        invalidateQueries()
      } else {
        toast.error(result.error || 'Erro ao excluir gato')
      }
    })
  }

  const handleToggleStatus = () => {
    const newStatus = cat.status === 'available' ? 'in_progress' : 'available'
    setIsOpen(false)
    startTransition(async () => {
      const result = await updateCatStatus(cat.id, newStatus)
      if (result.success) {
        const label = newStatus === 'available' ? 'Disponível' : 'Em processo'
        toast.success(`Status alterado para "${label}"`)
        invalidateQueries()
      } else {
        toast.error(result.error || 'Erro ao atualizar status')
      }
    })
  }

  const handleMarkAsAdopted = () => {
    setIsOpen(false)
    if (
      !confirm(
        `Tem certeza que deseja marcar "${cat.name}" como adotado?\n\nEssa ação não pode ser desfeita.`
      )
    )
      return

    startTransition(async () => {
      const result = await updateCatStatus(cat.id, 'adopted')
      if (result.success) {
        toast.success(`${cat.name} foi adotado! 🎉`)
        invalidateQueries()
      } else {
        toast.error(result.error || 'Erro ao marcar como adotado')
      }
    })
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
          <a href={`/${orgSlug}/admin/gatos/${cat.id}/editar`}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDuplicate} disabled={isPending}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href={`/${orgSlug}/admin/gatos/${cat.id}/interessados`}>
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
