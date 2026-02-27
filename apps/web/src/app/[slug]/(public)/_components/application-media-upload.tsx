'use client'

import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, Image, Loader2, Upload, Video, X } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

interface ApplicationMediaUploadProps {
  fieldId: string
  label: string
  kind: 'image' | 'video'
  value: string | null
  disabled?: boolean
  onUploaded: (payload: {
    fieldId: string
    url: string
    fileType: 'image' | 'video'
  }) => void
  onClear: (fieldId: string) => void
}

const MEDIA_LIMITS = {
  image: {
    maxSizeMb: 5,
    maxSizeBytes: 5 * 1024 * 1024,
    accept: 'image/jpeg,image/png,image/webp',
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  video: {
    maxSizeMb: 50,
    maxSizeBytes: 50 * 1024 * 1024,
    maxDurationSeconds: 30,
    accept: 'video/mp4,video/quicktime,video/webm',
    acceptedTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
  },
} as const

async function getVideoDurationInSeconds(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file)

  try {
    return await new Promise<number>((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        resolve(video.duration)
      }

      video.onerror = () => {
        reject(new Error('Não foi possível validar a duração do vídeo'))
      }

      video.src = objectUrl
    })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export function ApplicationMediaUpload({
  fieldId,
  label,
  kind,
  value,
  disabled = false,
  onUploaded,
  onClear,
}: ApplicationMediaUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const getPresignedUrlMutation = useMutation(
    trpc.applications.getPresignedUrl.mutationOptions()
  )
  const confirmUploadMutation = useMutation(
    trpc.applications.confirmUpload.mutationOptions()
  )

  const limit = MEDIA_LIMITS[kind]
  const isDisabled = disabled || isUploading
  const MediaIcon = kind === 'image' ? Image : Video

  const validateFile = async (file: File) => {
    if (!(limit.acceptedTypes as readonly string[]).includes(file.type)) {
      return 'Formato inválido para este campo.'
    }

    if (file.size > limit.maxSizeBytes) {
      return `Arquivo muito grande. Máximo: ${limit.maxSizeMb}MB.`
    }

    if (kind === 'video') {
      const videoLimit = MEDIA_LIMITS.video

      try {
        const duration = await getVideoDurationInSeconds(file)
        if (duration > videoLimit.maxDurationSeconds) {
          return `Vídeo muito longo. Máximo: ${videoLimit.maxDurationSeconds} segundos.`
        }
      } catch (error) {
        if (error instanceof Error) {
          return error.message
        }
        return 'Não foi possível validar o vídeo selecionado.'
      }
    }

    return null
  }

  const uploadWithProgress = async (file: File, presignedUrl: string) => {
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
          return
        }
        reject(new Error(`Falha no upload (${xhr.status})`))
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Falha no upload'))
      })

      xhr.open('PUT', presignedUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  const processFile = async (file: File) => {
    setErrorMessage(null)
    setProgress(0)

    const validationError = await validateFile(file)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsUploading(true)

    try {
      const { presignedUrl, key } = await getPresignedUrlMutation.mutateAsync({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      })

      await uploadWithProgress(file, presignedUrl)

      const { publicUrl } = await confirmUploadMutation.mutateAsync({ key })

      onUploaded({
        fieldId,
        url: publicUrl,
        fileType: kind,
      })

      setProgress(100)
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Não foi possível concluir o upload.')
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''
    if (selectedFile) {
      await processFile(selectedFile)
    }
  }

  const handleDragEnter = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!isDisabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)

    if (isDisabled) return

    const droppedFile = event.dataTransfer.files[0]
    if (droppedFile) {
      await processFile(droppedFile)
    }
  }

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleClear = () => {
    setErrorMessage(null)
    setProgress(0)
    onClear(fieldId)
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={limit.accept}
        className="hidden"
        onChange={handleFileChange}
        disabled={isDisabled}
      />

      {!value ? (
        <button
          type="button"
          onClick={handleSelectFile}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          disabled={isDisabled}
          className={cn(
            'group relative w-full overflow-hidden rounded-2xl',
            'border-2 border-dashed',
            'bg-gradient-to-br from-white to-muted/20',
            'min-h-[140px] p-6',
            'flex flex-col items-center justify-center gap-3',
            'cursor-pointer transition-all duration-300',
            'hover:border-primary/50 hover:bg-white',
            isDragging && ['border-primary bg-primary/5', 'scale-[1.01]'],
            isDisabled && 'cursor-not-allowed opacity-60',
            !isDragging && !isDisabled && 'border-muted'
          )}
        >
          {/* Background decoration */}
          <div
            className={cn(
              'absolute inset-0 opacity-0 transition-opacity duration-300',
              'bg-gradient-to-br from-primary/5 via-transparent to-accent/5',
              (isDragging || isUploading) && 'opacity-100'
            )}
            aria-hidden="true"
          />

          {/* Icon */}
          <div
            className={cn(
              'relative flex h-14 w-14 items-center justify-center rounded-2xl',
              'bg-gradient-to-br from-primary/15 to-accent/10',
              'ring-1 ring-primary/20',
              'transition-all duration-300',
              'group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20',
              isDragging && 'scale-110 shadow-lg shadow-primary/20'
            )}
          >
            {isUploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : (
              <Upload className="h-7 w-7 text-primary" />
            )}
          </div>

          {/* Text */}
          <div className="relative text-center">
            <p className="font-medium text-foreground">
              {isUploading
                ? `Enviando... ${progress}%`
                : isDragging
                  ? 'Solte o arquivo aqui'
                  : `Arraste ou clique para enviar ${kind === 'image' ? 'imagem' : 'vídeo'}`}
            </p>
            <p className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground/70">
              <MediaIcon className="h-4 w-4" />
              {kind === 'image'
                ? 'JPG, PNG ou WEBP • até 5MB'
                : 'MP4, MOV ou WEBM • até 50MB e 30s'}
            </p>
          </div>

          {/* Progress bar during upload */}
          {isUploading && (
            <div className="relative mt-2 w-full max-w-xs">
              <div className="h-2 overflow-hidden rounded-full bg-muted/35">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </button>
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-2xl',
            'border border-emerald-200/60',
            'bg-gradient-to-br from-white to-emerald-50/30',
            'shadow-sm'
          )}
        >
          {/* Preview */}
          <div className="relative">
            {kind === 'image' ? (
              <img
                src={value}
                alt={`Arquivo enviado para ${label}`}
                className="h-48 w-full bg-muted/10 object-contain"
                loading="lazy"
              />
            ) : (
              <video
                src={value}
                controls
                className="h-56 w-full bg-black/5 object-contain"
                preload="metadata"
              />
            )}
          </div>

          {/* Success footer */}
          <div
            className={cn(
              'flex items-center justify-between gap-3',
              'border-t border-emerald-200/40',
              'bg-gradient-to-r from-emerald-50/80 to-white',
              'px-4 py-3'
            )}
          >
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-emerald-100 p-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-emerald-700">
                Enviado com sucesso
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isDisabled}
              className={cn(
                'h-9 rounded-xl px-3',
                'text-foreground/70 hover:bg-red-50 hover:text-red-600'
              )}
            >
              <X className="mr-1.5 h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl',
            'bg-red-50 px-4 py-3',
            'border border-red-200/60'
          )}
        >
          <span className="shrink-0 text-red-500">⚠️</span>
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
        </div>
      )}
    </div>
  )
}
