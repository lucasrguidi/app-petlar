'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Copy,
  Heart,
  MoreVertical,
  Pencil,
  PenLine,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
import { type Route } from 'next'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isDuplicatingToEdit, setIsDuplicatingToEdit] = useState(false)

  // Query for fetching full cat data when duplicating to edit
  const { refetch: fetchCatData } = useQuery({
    ...trpc.cats.getById.queryOptions({ id: cat.id }),
    enabled: false, // Only fetch when triggered
  })

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
    updateStatusMutation.isPending ||
    isDuplicatingToEdit

  const handleDuplicate = () => {
    setIsOpen(false)
    duplicateMutation.mutate({ id: cat.id })
  }

  const handleDuplicateAndEdit = async () => {
    setIsOpen(false)
    setIsDuplicatingToEdit(true)

    try {
      const { data } = await fetchCatData()

      if (data) {
        const prefillData = {
          name: `${data.name} (cópia)`,
          ageYears: data.ageYears,
          ageMonths: data.ageMonths,
          sex: data.sex,
          fiv: data.fiv,
          felv: data.felv,
          castrated: data.castrated,
          vaccinated: data.vaccinated,
          vaccinationNotes: data.vaccinationNotes,
          dewormed: data.dewormed,
          dewormingNotes: data.dewormingNotes,
          description: data.description,
          formId: data.formId,
        }
        const encoded = btoa(JSON.stringify(prefillData))
        router.push(
          `/${slug}/admin/gatos/novo?prefill=${encoded}` as Route
        )
      } else {
        toast.error('Erro ao carregar dados do gato')
      }
    } catch {
      toast.error('Erro ao carregar dados do gato')
    } finally {
      setIsDuplicatingToEdit(false)
    }
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

        <DropdownMenuItem onClick={handleDuplicateAndEdit} disabled={isPending}>
          <PenLine className="mr-2 h-4 w-4" />
          Duplicar e editar
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
