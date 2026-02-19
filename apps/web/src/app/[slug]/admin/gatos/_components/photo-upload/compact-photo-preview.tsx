'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, GripVertical, Loader2, X } from 'lucide-react'

import type { PhotoState } from './photo-section'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CompactPhotoPreviewProps {
  photo: PhotoState
  isPrimary: boolean
  onRemove: (id: string) => void
}

export function CompactPhotoPreview({
  photo,
  isPrimary,
  onRemove,
}: CompactPhotoPreviewProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'shadow-warm-sm group border-border/60 bg-muted/25 relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border',
        isDragging && 'shadow-warm-lg ring-primary/40 z-50 ring-2'
      )}
    >
      <img
        src={photo.url}
        alt=""
        className={cn(
          'h-full w-full object-cover transition-opacity',
          photo.status === 'uploading' && 'opacity-50'
        )}
      />

      {photo.status === 'uploading' && (
        <div className="bg-background/80 absolute inset-0 flex flex-col items-center justify-center">
          <Loader2 className="text-primary h-5 w-5 animate-spin" />
          <span className="mt-1 text-xs font-medium">{photo.progress}%</span>
        </div>
      )}

      {photo.status === 'error' && (
        <div className="bg-destructive/20 absolute inset-0 flex flex-col items-center justify-center">
          <AlertCircle className="text-destructive h-5 w-5" />
          <span className="text-destructive mt-1 text-xs font-medium">
            Erro
          </span>
        </div>
      )}

      {isPrimary && photo.status === 'uploaded' && (
        <Badge
          variant="secondary"
          className="border-border/60 bg-card/90 absolute top-1 left-1 px-1.5 py-0.5 text-[10px] shadow-sm"
        >
          Capa
        </Badge>
      )}

      <button
        type="button"
        className={cn(
          'bg-background/90 absolute bottom-1 left-1 flex h-6 w-6 cursor-grab items-center justify-center rounded-md opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100',
          isDragging && 'cursor-grabbing'
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="text-muted-foreground h-3 w-3" />
      </button>

      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 right-1 h-6 w-6 rounded-md opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
        onClick={() => onRemove(photo.id)}
        disabled={photo.status === 'uploading'}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Remover foto</span>
      </Button>
    </div>
  )
}
