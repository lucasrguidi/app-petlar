'use client'

import { ImagePlus, Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface CompactDropzoneProps {
  onFilesSelected: (files: File[]) => void
  isUploading: boolean
}

export function CompactDropzone({
  onFilesSelected,
  isUploading,
}: CompactDropzoneProps) {
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
      e.target.value = ''
    },
    [onFilesSelected]
  )

  return (
    <div
      className={cn(
        'flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors',
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

      {isUploading ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <>
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <span className="mt-1 text-xs text-muted-foreground">Adicionar</span>
        </>
      )}
    </div>
  )
}
