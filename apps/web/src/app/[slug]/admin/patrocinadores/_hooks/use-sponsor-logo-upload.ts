'use client'

import { useMutation } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { trpc } from '@/utils/trpc'

interface UseSponsorLogoUploadOptions {
  initialUrl?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function useSponsorLogoUpload({
  initialUrl,
}: UseSponsorLogoUploadOptions = {}) {
  const [logoUrl, setLogoUrl] = useState<string | null>(initialUrl ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const getPresignedUrlMutation = useMutation(
    trpc.upload.getPresignedUrl.mutationOptions()
  )

  const confirmUploadMutation = useMutation(
    trpc.upload.confirmUpload.mutationOptions()
  )

  const handleFileSelected = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(
          'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.'
        )
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error('Arquivo muito grande. Máximo de 5MB.')
        return
      }

      setIsUploading(true)
      setProgress(0)

      // Show preview immediately
      const blobUrl = URL.createObjectURL(file)
      setPreviewUrl(blobUrl)

      try {
        const { presignedUrl, key } =
          await getPresignedUrlMutation.mutateAsync({
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          })

        // Upload to R2 with progress tracking
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
            } else {
              reject(new Error(`Upload falhou: ${xhr.status}`))
            }
          })
          xhr.addEventListener('error', () =>
            reject(new Error('Upload falhou'))
          )
          xhr.open('PUT', presignedUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.send(file)
        })

        // Confirm and get public URL
        const { publicUrl } = await confirmUploadMutation.mutateAsync({ key })

        URL.revokeObjectURL(blobUrl)
        setPreviewUrl(null)
        setLogoUrl(publicUrl)
      } catch {
        URL.revokeObjectURL(blobUrl)
        setPreviewUrl(null)
        toast.error('Erro ao fazer upload do logo.')
      } finally {
        setIsUploading(false)
        setProgress(0)
      }
    },
    [getPresignedUrlMutation, confirmUploadMutation]
  )

  const handleRemove = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setLogoUrl(null)
  }, [previewUrl])

  const reset = useCallback(
    (url?: string) => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setLogoUrl(url ?? null)
      setIsUploading(false)
      setProgress(0)
    },
    [previewUrl]
  )

  return {
    logoUrl,
    previewUrl,
    displayUrl: previewUrl ?? logoUrl,
    isUploading,
    progress,
    handleFileSelected,
    handleRemove,
    reset,
  }
}
