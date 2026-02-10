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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import { PhotoDropzone } from './photo-dropzone'
import { PhotoPreviewItem } from './photo-preview-item'

export interface PhotoState {
  id: string
  url: string
  order: number
  status: 'uploading' | 'uploaded' | 'error'
  progress: number
}

interface PhotoUploadProps {
  photos: PhotoState[]
  isUploading: boolean
  onFilesSelected: (files: File[]) => void
  onRemove: (id: string) => void
  onReorder: (activeId: string, overId: string) => void
  maxPhotos?: number
}

export function PhotoUpload({
  photos,
  isUploading,
  onFilesSelected,
  onRemove,
  onReorder,
  maxPhotos = 3,
}: PhotoUploadProps) {
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
    <div className="space-y-4">
      {canAddMore && (
        <PhotoDropzone
          onFilesSelected={onFilesSelected}
          isUploading={isUploading}
          remainingSlots={maxPhotos - photos.length}
        />
      )}

      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={photos} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <PhotoPreviewItem
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

      {photos.length > 0 && (
        <p className="text-muted-foreground text-sm">
          Arraste para reordenar. A primeira foto será a foto principal.
        </p>
      )}
    </div>
  )
}
