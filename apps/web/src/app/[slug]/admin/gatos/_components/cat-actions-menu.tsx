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
} from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
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
          formId: data.formId ?? '',
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
        className="border-border/50 min-w-[160px] rounded-xl border p-1 shadow-lg"
      >
        {/* Primary actions */}
        <DropdownMenuItem
          asChild
          className="hover:!bg-muted/80 focus:!bg-muted/80 hover:!text-foreground focus:!text-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <Link href={`/${slug}/admin/gatos/${cat.id}/editar`}>
            <Pencil className="text-primary h-3.5 w-3.5" />
            <span className="font-medium">Editar</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleDuplicate}
          disabled={isPending}
          className="hover:!bg-muted/80 focus:!bg-muted/80 hover:!text-foreground focus:!text-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <Copy className="text-muted-foreground h-3.5 w-3.5" />
          <span>Duplicar</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleDuplicateAndEdit}
          disabled={isPending}
          className="hover:!bg-muted/80 focus:!bg-muted/80 hover:!text-foreground focus:!text-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <PenLine className="text-muted-foreground h-3.5 w-3.5" />
          <span>Duplicar e editar</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/40 my-1" />

        {/* Status actions */}
        <DropdownMenuItem
          onClick={handleToggleStatus}
          disabled={isPending}
          className="hover:!bg-muted/80 focus:!bg-muted/80 hover:!text-foreground focus:!text-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <RefreshCw className="text-warning h-3.5 w-3.5" />
          <span>
            {cat.status === 'available' ? 'Em processo' : 'Disponível'}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleMarkAsAdopted}
          disabled={isPending}
          className="hover:!bg-muted/80 focus:!bg-muted/80 hover:!text-foreground focus:!text-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <Heart className="text-success h-3.5 w-3.5" />
          <span>Adotado</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/40 my-1" />

        {/* Danger */}
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPending}
          className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 hover:!text-destructive focus:!text-destructive cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Excluir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
