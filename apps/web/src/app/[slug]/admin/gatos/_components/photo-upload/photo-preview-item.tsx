'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertCircle, GripVertical, Loader2, X } from 'lucide-react'

import type { PhotoState } from './photo-upload'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PhotoPreviewItemProps {
  photo: PhotoState
  isPrimary: boolean
  onRemove: (id: string) => void
}

export function PhotoPreviewItem({
  photo,
  isPrimary,
  onRemove,
}: PhotoPreviewItemProps) {
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
        'group bg-muted relative aspect-square overflow-hidden rounded-lg border',
        isDragging && 'ring-primary z-50 shadow-lg ring-2'
      )}
    >
      {/* Image */}
      <img
        src={photo.url}
        alt=""
        className={cn(
          'h-full w-full object-cover transition-opacity',
          photo.status === 'uploading' && 'opacity-50'
        )}
      />

      {/* Uploading overlay */}
      {photo.status === 'uploading' && (
        <div className="bg-background/80 absolute inset-0 flex flex-col items-center justify-center">
          <Loader2 className="text-primary h-6 w-6 animate-spin" />
          <span className="mt-2 text-xs font-medium">{photo.progress}%</span>
        </div>
      )}

      {/* Error overlay */}
      {photo.status === 'error' && (
        <div className="bg-destructive/20 absolute inset-0 flex flex-col items-center justify-center">
          <AlertCircle className="text-destructive h-6 w-6" />
          <span className="text-destructive mt-2 text-xs font-medium">
            Erro no upload
          </span>
        </div>
      )}

      {/* Primary badge */}
      {isPrimary && photo.status === 'uploaded' && (
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 text-xs shadow-sm"
        >
          Principal
        </Badge>
      )}

      {/* Drag handle */}
      <button
        type="button"
        className={cn(
          'bg-background/90 absolute bottom-2 left-2 flex h-8 w-8 cursor-grab items-center justify-center rounded-lg opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100',
          isDragging && 'cursor-grabbing'
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="text-muted-foreground h-4 w-4" />
      </button>

      {/* Remove button */}
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
        onClick={() => onRemove(photo.id)}
        disabled={photo.status === 'uploading'}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remover foto</span>
      </Button>
    </div>
  )
}
