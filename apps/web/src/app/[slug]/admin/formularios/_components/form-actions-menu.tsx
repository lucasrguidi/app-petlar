'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy, MoreVertical, Pencil, Power, Trash2, TriangleAlert } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOrgHref } from '@/hooks/use-org-href'
import { trpc } from '@/utils/trpc'

interface Form {
  id: string
  name: string
  active: boolean
  linkedCatsCount: number
}

interface FormActionsMenuProps {
  form: Form
}

export function FormActionsMenu({ form }: FormActionsMenuProps) {
  const editHref = useOrgHref(`/admin/formularios/${form.id}`)
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: [['forms']] })
  }

  const duplicateMutation = useMutation(
    trpc.forms.duplicate.mutationOptions({
      onSuccess: () => {
        toast.success('Formulário duplicado com sucesso!')
        invalidateQueries()
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao duplicar formulário')
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.forms.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Formulário excluído com sucesso!')
        invalidateQueries()
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao excluir formulário')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.forms.update.mutationOptions({
      onSuccess: (_, variables) => {
        const newStatus = variables.form?.active ? 'ativado' : 'desativado'
        toast.success(`Formulário ${newStatus} com sucesso!`)
        invalidateQueries()
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar formulário')
      },
    })
  )

  const isPending =
    duplicateMutation.isPending ||
    deleteMutation.isPending ||
    updateMutation.isPending

  const hasLinkedCats = form.linkedCatsCount > 0

  const handleDuplicate = () => {
    setIsOpen(false)
    duplicateMutation.mutate({ id: form.id })
  }

  const handleToggleActive = () => {
    setIsOpen(false)
    updateMutation.mutate({
      id: form.id,
      form: { active: !form.active },
    })
  }

  const handleDelete = () => {
    setIsOpen(false)
    setIsDeleteOpen(true)
  }

  const confirmDelete = () => {
    deleteMutation.mutate({ id: form.id })
    setIsDeleteOpen(false)
  }

  return (
    <>
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
        {/* Primary action */}
        <DropdownMenuItem
          asChild
          className="hover:!bg-muted/80 focus:!bg-muted/80 hover:!text-foreground focus:!text-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <Link href={editHref}>
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

        <DropdownMenuSeparator className="bg-border/40 my-1" />

        {/* Toggle active status */}
        <DropdownMenuItem
          onClick={handleToggleActive}
          disabled={isPending}
          className="hover:!bg-muted/80 focus:!bg-muted/80 hover:!text-foreground focus:!text-foreground cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors"
        >
          <Power className="text-warning h-3.5 w-3.5" />
          <span>{form.active ? 'Desativar' : 'Ativar'}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/40 my-1" />

        {/* Danger */}
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isPending || hasLinkedCats}
          className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 hover:!text-destructive focus:!text-destructive cursor-pointer gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Excluir</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        variant="destructive"
        icon={TriangleAlert}
        title="Excluir formulário"
        description={`Tem certeza que deseja excluir "${form.name}"? Esta ação não pode ser desfeita.`}
        cancelLabel="Cancelar"
        actionLabel="Excluir"
        actionLoadingLabel="Excluindo..."
        isLoading={deleteMutation.isPending}
        onAction={confirmDelete}
      />
    </>
  )
}
