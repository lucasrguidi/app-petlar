'use client'

import { ImagePlus, Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface PhotoDropzoneProps {
  onFilesSelected: (files: File[]) => void
  isUploading: boolean
  remainingSlots: number
}

export function PhotoDropzone({
  onFilesSelected,
  isUploading,
  remainingSlots,
}: PhotoDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      )

      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (files.length > 0) {
        onFilesSelected(files)
      }
      // Reset input to allow selecting the same file again
      e.target.value = ''
    },
    [onFilesSelected]
  )

  return (
    <div
      className={cn(
        'relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragOver
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        isUploading && 'pointer-events-none opacity-50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <div className="flex flex-col items-center gap-2">
        {isUploading ? (
          <Loader2 className="text-primary h-10 w-10 animate-spin" />
        ) : (
          <ImagePlus className="text-muted-foreground h-10 w-10" />
        )}
        <div className="space-y-1">
          <p className="text-foreground text-sm font-medium">
            {isUploading
              ? 'Enviando...'
              : isDragOver
                ? 'Solte para enviar'
                : 'Arraste fotos ou clique para selecionar'}
          </p>
          <p className="text-muted-foreground text-xs">
            {remainingSlots === 1
              ? 'Você pode adicionar mais 1 foto'
              : `Você pode adicionar mais ${remainingSlots} fotos`}
          </p>
          <p className="text-muted-foreground text-xs">
            JPG, PNG, WebP ou GIF (max. 5MB)
          </p>
        </div>
      </div>
    </div>
  )
}
