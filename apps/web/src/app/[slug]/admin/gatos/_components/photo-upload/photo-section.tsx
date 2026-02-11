'use client'

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { Images } from 'lucide-react'

import { CompactDropzone } from './compact-dropzone'
import { CompactPhotoPreview } from './compact-photo-preview'

export interface PhotoState {
  id: string
  url: string
  order: number
  status: 'uploading' | 'uploaded' | 'error'
  progress: number
}

interface PhotoSectionProps {
  photos: PhotoState[]
  isUploading: boolean
  onFilesSelected: (files: File[]) => void
  onRemove: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
  maxPhotos?: number
}

export function PhotoSection({
  photos,
  isUploading,
  onFilesSelected,
  onRemove,
  onReorder,
  maxPhotos = 3,
}: PhotoSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id))
    }
  }

  const canAddMore = photos.length < maxPhotos

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Images className="text-primary h-4 w-4" />
            Fotos
          </h3>
          <p className="text-muted-foreground text-xs">
            A primeira foto será a principal
          </p>
        </div>
        <span className="border-border/60 bg-muted/30 rounded-md border px-2 py-0.5 text-xs font-medium">
          {photos.length}/{maxPhotos}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {canAddMore && (
          <CompactDropzone
            onFilesSelected={onFilesSelected}
            isUploading={isUploading}
          />
        )}

        {photos.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={photos}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex gap-2">
                {photos.map((photo, index) => (
                  <CompactPhotoPreview
                    key={photo.id}
                    photo={photo}
                    isPrimary={index === 0}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
