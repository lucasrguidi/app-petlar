'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarClock,
  Copy,
  FileText,
  Plus,
  SquarePen,
  Trash2,
} from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { FormsLoadingSkeleton } from './forms-loading-skeleton'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { trpc } from '@/utils/trpc'

function formatUpdatedAt(date: number | string | Date): string {
  const normalizedDate = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(normalizedDate)
}

export function FormsPageContent() {
  const slug = useOrgSlug()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery(
    trpc.forms.list.queryOptions()
  )

  const duplicateMutation = useMutation(
    trpc.forms.duplicate.mutationOptions({
      onSuccess: () => {
        toast.success('Modelo duplicado com sucesso')
        queryClient.invalidateQueries({ queryKey: [['forms']] })
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao duplicar modelo')
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.forms.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Modelo excluído com sucesso')
        queryClient.invalidateQueries({ queryKey: [['forms']] })
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao excluir modelo')
      },
    })
  )

  if (isLoading) {
    return <FormsLoadingSkeleton />
  }

  if (isError) {
    return (
      <div className="border-destructive/20 bg-destructive/5 shadow-warm-sm rounded-xl border p-5">
        <p className="text-destructive text-sm font-medium">
          Não foi possível carregar os formulários.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 rounded-lg"
          onClick={() => refetch()}
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-8 text-center">
        <div className="bg-primary/10 mx-auto flex h-12 w-12 items-center justify-center rounded-xl">
          <FileText className="text-primary h-6 w-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Nenhum formulário criado</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Crie seu primeiro modelo para usar nas candidaturas dos gatos.
        </p>
        <Button asChild className="shadow-primary-glow mt-5 gap-2 rounded-xl">
          <Link href={`/${slug}/admin/formularios/novo` as Route}>
            <Plus className="h-4 w-4" />
            Criar novo formulário
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map((form) => {
        const isDeleting = deleteMutation.isPending
        const isDuplicating = duplicateMutation.isPending
        const hasLinkedCats = form.linkedCatsCount > 0

        return (
          <div
            key={form.id}
            className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-4"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-display text-base font-semibold">
                  {form.name}
                </h2>
                <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Editado em {formatUpdatedAt(form.updatedAt)}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-md">
                    {form.fieldsCount} pergunta
                    {form.fieldsCount === 1 ? '' : 's'}
                  </Badge>
                  <Badge
                    variant={hasLinkedCats ? 'info' : 'secondary'}
                    className="rounded-md"
                  >
                    {form.linkedCatsCount} gato
                    {form.linkedCatsCount === 1 ? '' : 's'} usando
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:flex">
                <Button
                  variant="outline"
                  className="rounded-lg"
                  onClick={() =>
                    router.push(`/${slug}/admin/formularios/${form.id}` as Route)
                  }
                >
                  <SquarePen className="mr-2 h-4 w-4" />
                  Editar
                </Button>

                <Button
                  variant="outline"
                  className="rounded-lg"
                  disabled={isDuplicating || isDeleting}
                  onClick={() => duplicateMutation.mutate({ id: form.id })}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </Button>

                <Button
                  variant="outline"
                  className="text-destructive border-destructive/30 hover:text-destructive rounded-lg"
                  disabled={hasLinkedCats || isDeleting || isDuplicating}
                  onClick={() => {
                    if (
                      !confirm(
                        `Deseja excluir o formulário "${form.name}"? Essa ação não pode ser desfeita.`
                      )
                    ) {
                      return
                    }
                    deleteMutation.mutate({ id: form.id })
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </div>

            {hasLinkedCats && (
              <p className="text-muted-foreground mt-2 text-xs">
                Este formulário está em uso por gatos cadastrados e não pode ser
                excluído.
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
