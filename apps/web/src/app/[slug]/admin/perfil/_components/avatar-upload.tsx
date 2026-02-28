'use client'

import { useMutation } from '@tanstack/react-query'
import { Camera, Loader2 } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

interface AvatarUploadProps {
  currentImage: string | null
  name: string
  onImageChange: (url: string | null) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function AvatarUpload({
  currentImage,
  name,
  onImageChange,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const getPresignedUrlMutation = useMutation(
    trpc.upload.getPresignedUrl.mutationOptions()
  )

  const confirmUploadMutation = useMutation(
    trpc.upload.confirmUpload.mutationOptions()
  )

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        const { presignedUrl, key } = await getPresignedUrlMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        })

        // Upload to R2
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(new Error(`Upload failed: ${xhr.status}`))
            }
          })

          xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'))
          })

          xhr.open('PUT', presignedUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.send(file)
        })

        // Confirm upload and get public URL
        const { publicUrl } = await confirmUploadMutation.mutateAsync({ key })
        return publicUrl
      } catch {
        return null
      }
    },
    [getPresignedUrlMutation, confirmUploadMutation]
  )

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Tipo de arquivo nao suportado. Use JPG, PNG, WebP ou GIF.')
        return
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error('Arquivo muito grande. Maximo 5MB.')
        return
      }

      // Create preview
      const blobUrl = URL.createObjectURL(file)
      setPreviewUrl(blobUrl)
      setIsUploading(true)

      // Upload file
      const publicUrl = await uploadFile(file)

      // Cleanup blob URL
      URL.revokeObjectURL(blobUrl)
      setPreviewUrl(null)
      setIsUploading(false)

      if (publicUrl) {
        onImageChange(publicUrl)
        toast.success('Foto atualizada!')
      } else {
        toast.error('Erro ao fazer upload da foto.')
      }

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    },
    [uploadFile, onImageChange]
  )

  const displayImage = previewUrl || currentImage

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        className="group relative"
      >
        <Avatar className="border-primary/20 h-20 w-20 border-2">
          <AvatarImage src={displayImage ?? undefined} alt={name} />
          <AvatarFallback className="from-primary/20 to-accent/20 text-primary bg-gradient-to-br text-xl font-semibold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        {/* Overlay */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-full transition-opacity',
            isUploading
              ? 'bg-background/80 opacity-100'
              : 'bg-background/60 opacity-0 group-hover:opacity-100'
          )}
        >
          {isUploading ? (
            <Loader2 className="text-primary h-6 w-6 animate-spin" />
          ) : (
            <Camera className="text-primary h-6 w-6" />
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">Foto de perfil</p>
        <p className="text-muted-foreground text-xs">
          Clique na foto para alterar. JPG, PNG, WebP ou GIF (max 5MB)
        </p>
      </div>
    </div>
  )
}
