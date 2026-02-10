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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Fotos</h3>
        <span className="text-xs text-muted-foreground">
          {photos.length}/{maxPhotos}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
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
              <div className="flex gap-3">
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

      {photos.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Arraste para reordenar. A primeira foto sera a principal.
        </p>
      )}
    </div>
  )
}
