'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { SponsorDialog } from './sponsor-dialog'
import { SponsorsEmptyState } from './sponsors-empty-state'
import { SponsorsList } from './sponsors-list'
import { SponsorsLoadingSkeleton } from './sponsors-loading-skeleton'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { trpc } from '@/utils/trpc'


interface Sponsor {
  id: string
  name: string
  logoUrl: string
  websiteUrl: string
  featured: boolean
  order: number
}

export function SponsorsPageContent() {
  const queryClient = useQueryClient()

  const listQueryOptions = trpc.sponsors.list.queryOptions()
  const { data: sponsors = [], isLoading } = useQuery(listQueryOptions)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null)

  // Delete confirm state
  const [deletingSponsor, setDeletingSponsor] = useState<Sponsor | null>(null)

  const invalidateList = () => {
    queryClient.invalidateQueries({ queryKey: [['sponsors']] })
  }

  const createMutation = useMutation(
    trpc.sponsors.create.mutationOptions({
      onSuccess: () => {
        toast.success('Patrocinador adicionado!')
        invalidateList()
        setDialogOpen(false)
      },
    })
  )

  const updateMutation = useMutation(
    trpc.sponsors.update.mutationOptions({
      onSuccess: () => {
        toast.success('Patrocinador atualizado!')
        invalidateList()
        setDialogOpen(false)
        setEditingSponsor(null)
      },
    })
  )

  const deleteMutation = useMutation(
    trpc.sponsors.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Patrocinador removido!')
        invalidateList()
        setDeletingSponsor(null)
      },
    })
  )

  const reorderMutation = useMutation(
    trpc.sponsors.reorder.mutationOptions()
  )

  function handleOpenCreate() {
    setEditingSponsor(null)
    setDialogOpen(true)
  }

  function handleEdit(sponsor: Sponsor) {
    setEditingSponsor(sponsor)
    setDialogOpen(true)
  }

  function handleSubmit(data: {
    name: string
    websiteUrl: string
    logoUrl: string
    featured: boolean
  }) {
    if (editingSponsor) {
      updateMutation.mutate({ id: editingSponsor.id, ...data })
    } else {
      createMutation.mutate(data)
    }
  }

  function handleReorder(activeId: string, overId: string) {
    const activeSponsor = sponsors.find((s) => s.id === activeId)
    if (!activeSponsor) return

    // Reorder within the same group (featured or regular)
    const group = sponsors.filter(
      (s) => s.featured === activeSponsor.featured
    )
    const otherGroup = sponsors.filter(
      (s) => s.featured !== activeSponsor.featured
    )

    const oldIndex = group.findIndex((s) => s.id === activeId)
    const newIndex = group.findIndex((s) => s.id === overId)
    if (oldIndex === -1 || newIndex === -1) return

    const reorderedGroup = [...group]
    const [moved] = reorderedGroup.splice(oldIndex, 1)
    reorderedGroup.splice(newIndex, 0, moved)

    // Rebuild full list: featured first, then regular
    const featured = activeSponsor.featured ? reorderedGroup : otherGroup
    const regular = activeSponsor.featured ? otherGroup : reorderedGroup
    const reordered = [...featured, ...regular]

    const items = reordered.map((s, i) => ({ id: s.id, order: i + 1 }))

    // Optimistic update
    queryClient.setQueryData(
      listQueryOptions.queryKey,
      reordered.map((s, i) => ({ ...s, order: i + 1 }))
    )

    reorderMutation.mutate(
      { items },
      {
        onSuccess: () => {
          invalidateList()
        },
        onError: () => {
          toast.error('Erro ao reordenar. Tente novamente.')
          invalidateList()
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex justify-end">
        <Button onClick={handleOpenCreate} className="shadow-primary-glow gap-2 rounded-xl">
          <Plus className="h-4 w-4" />
          Adicionar patrocinador
        </Button>
      </div>

      {/* List, Loading, or Empty State */}
      {isLoading ? (
        <SponsorsLoadingSkeleton />
      ) : sponsors.length > 0 ? (
        <SponsorsList
          sponsors={sponsors}
          onReorder={handleReorder}
          onEdit={handleEdit}
          onDelete={setDeletingSponsor}
        />
      ) : (
        <SponsorsEmptyState />
      )}

      {/* Create/Edit Dialog */}
      <SponsorDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingSponsor(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        initialData={editingSponsor ?? undefined}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingSponsor}
        onOpenChange={(open) => {
          if (!open) setDeletingSponsor(null)
        }}
        variant="destructive"
        icon={Trash2}
        title="Remover patrocinador"
        description={`Tem certeza que deseja remover "${deletingSponsor?.name}"? O logo será excluído permanentemente.`}
        actionLabel="Remover"
        actionLoadingLabel="Removendo..."
        isLoading={deleteMutation.isPending}
        onAction={() => {
          if (deletingSponsor) {
            deleteMutation.mutate({ id: deletingSponsor.id })
          }
        }}
      />
    </div>
  )
}
