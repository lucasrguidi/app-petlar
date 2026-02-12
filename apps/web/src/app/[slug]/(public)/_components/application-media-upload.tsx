'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2, Upload, X } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'

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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ''

    if (!selectedFile) return

    setErrorMessage(null)
    setProgress(0)

    const validationError = await validateFile(selectedFile)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsUploading(true)

    try {
      const { presignedUrl, key } = await getPresignedUrlMutation.mutateAsync({
        filename: selectedFile.name,
        contentType: selectedFile.type,
        fileSize: selectedFile.size,
      })

      await uploadWithProgress(selectedFile, presignedUrl)

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

  const handleSelectFile = () => {
    fileInputRef.current?.click()
  }

  const handleClear = () => {
    setErrorMessage(null)
    setProgress(0)
    onClear(fieldId)
  }

  return (
    <div className="space-y-2">
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
          disabled={isDisabled}
          className={cn(
            'w-full rounded-xl border border-dashed border-[#AEC7E2] p-4 text-left',
            'bg-white/70 transition-colors',
            'hover:border-[#E35915]/40 hover:bg-white',
            'disabled:cursor-not-allowed disabled:opacity-60'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#E35915]/10 p-2 text-[#E35915]">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#783201]">
                {isUploading
                  ? `Enviando arquivo (${progress}%)`
                  : `Enviar ${kind === 'image' ? 'imagem' : 'vídeo'}`}
              </p>
              <p className="text-xs text-[#8B5A2B]/70">
                {kind === 'image'
                  ? 'JPG, PNG ou WEBP • até 5MB'
                  : 'MP4, MOV ou WEBM • até 50MB e 30 segundos'}
              </p>
            </div>
          </div>
        </button>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#AEC7E2]/40 bg-white/80">
          {kind === 'image' ? (
            <img
              src={value}
              alt={`Arquivo enviado para ${label}`}
              className="h-44 w-full bg-[#AEC7E2]/15 object-contain"
              loading="lazy"
            />
          ) : (
            <video
              src={value}
              controls
              className="h-56 w-full bg-black/10 object-contain"
              preload="metadata"
            />
          )}

          <div className="flex items-center justify-between gap-2 border-t border-[#AEC7E2]/30 px-3 py-2">
            <p className="truncate text-xs font-medium text-emerald-700">
              Arquivo enviado com sucesso
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isDisabled}
              className="h-8 rounded-lg px-2 text-[#783201]/70 hover:bg-[#AEC7E2]/30 hover:text-[#783201]"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Remover
            </Button>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-[#AEC7E2]/35">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E35915] to-[#F07B3D] transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-right text-xs text-[#8B5A2B]/70">{progress}%</p>
        </div>
      )}

      {errorMessage && (
        <p className="text-sm font-medium text-red-600">{errorMessage}</p>
      )}
    </div>
  )
}
