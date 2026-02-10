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
        'group relative aspect-square overflow-hidden rounded-lg border bg-muted',
        isDragging && 'z-50 shadow-lg ring-2 ring-primary'
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="mt-2 text-xs font-medium">{photo.progress}%</span>
        </div>
      )}

      {/* Error overlay */}
      {photo.status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/20">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <span className="mt-2 text-xs font-medium text-destructive">
            Erro no upload
          </span>
        </div>
      )}

      {/* Primary badge */}
      {isPrimary && photo.status === 'uploaded' && (
        <Badge
          variant="secondary"
          className="absolute left-2 top-2 text-xs shadow-sm"
        >
          Principal
        </Badge>
      )}

      {/* Drag handle */}
      <button
        type="button"
        className={cn(
          'absolute left-2 bottom-2 flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-background/90 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100',
          isDragging && 'cursor-grabbing'
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Remove button */}
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute right-2 top-2 h-7 w-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
        onClick={() => onRemove(photo.id)}
        disabled={photo.status === 'uploading'}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remover foto</span>
      </Button>
    </div>
  )
}
