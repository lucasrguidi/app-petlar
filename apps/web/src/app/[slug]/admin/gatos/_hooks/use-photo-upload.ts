'use client'

import { useMutation } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { trpc } from '@/utils/trpc'

export interface PhotoState {
  id: string
  url: string
  order: number
  status: 'uploading' | 'uploaded' | 'error'
  progress: number
  file?: File
  key?: string
}

interface Photo {
  id: string
  url: string
  order: number
}

interface UsePhotoUploadOptions {
  initialPhotos?: Photo[]
  maxPhotos?: number
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export function usePhotoUpload({
  initialPhotos,
  maxPhotos = 3,
}: UsePhotoUploadOptions = {}) {
  const [photos, setPhotos] = useState<PhotoState[]>(
    initialPhotos?.map((p) => ({
      id: p.id,
      url: p.url,
      order: p.order,
      status: 'uploaded' as const,
      progress: 100,
    })) ?? []
  )
  const [isUploading, setIsUploading] = useState(false)

  const getPresignedUrlMutation = useMutation(
    trpc.upload.getPresignedUrl.mutationOptions()
  )

  const confirmUploadMutation = useMutation(
    trpc.upload.confirmUpload.mutationOptions()
  )

  const deleteFileMutation = useMutation(
    trpc.upload.deleteFile.mutationOptions()
  )

  const uploadFile = useCallback(
    async (file: File, photoId: string): Promise<string | null> => {
      try {
        // Get presigned URL
        const { presignedUrl, key } = await getPresignedUrlMutation.mutateAsync(
          {
            filename: file.name,
            contentType: file.type,
            fileSize: file.size,
          }
        )

        // Update photo with key
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, key } : p))
        )

        // Upload to R2 with progress tracking
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100)
              setPhotos((prev) =>
                prev.map((p) => (p.id === photoId ? { ...p, progress } : p))
              )
            }
          })

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

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const availableSlots = maxPhotos - photos.length
      if (availableSlots <= 0) {
        toast.error(`Máximo de ${maxPhotos} fotos permitido`)
        return
      }

      const filesToUpload = files.slice(0, availableSlots)
      const invalidFiles: string[] = []
      const validFiles: File[] = []

      for (const file of filesToUpload) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          invalidFiles.push(`${file.name}: tipo não suportado`)
          continue
        }
        if (file.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${file.name}: arquivo muito grande (max 5MB)`)
          continue
        }
        validFiles.push(file)
      }

      if (invalidFiles.length > 0) {
        toast.error(invalidFiles.join('\n'))
      }

      if (validFiles.length === 0) return

      setIsUploading(true)

      // Create placeholder photos
      const newPhotos: PhotoState[] = validFiles.map((file, index) => ({
        id: nanoid(),
        url: URL.createObjectURL(file),
        order: photos.length + index + 1,
        status: 'uploading' as const,
        progress: 0,
        file,
      }))

      setPhotos((prev) => [...prev, ...newPhotos])

      // Upload files in parallel
      const uploadPromises = newPhotos.map(async (photo) => {
        const publicUrl = await uploadFile(photo.file!, photo.id)

        if (publicUrl) {
          // Revoke blob URL and update with public URL
          URL.revokeObjectURL(photo.url)
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id
                ? { ...p, url: publicUrl, status: 'uploaded' as const }
                : p
            )
          )
        } else {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photo.id ? { ...p, status: 'error' as const } : p
            )
          )
        }
      })

      await Promise.all(uploadPromises)
      setIsUploading(false)
    },
    [photos.length, maxPhotos, uploadFile]
  )

  const handleRemove = useCallback(
    async (id: string) => {
      const photo = photos.find((p) => p.id === id)
      if (!photo) return

      // Revoke blob URL if exists
      if (photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url)
      }

      // Delete from R2 if uploaded
      if (photo.status === 'uploaded' && !photo.url.startsWith('blob:')) {
        try {
          await deleteFileMutation.mutateAsync({ url: photo.url })
        } catch {
          // Continue with removal even if delete fails
        }
      }

      // Remove and reorder
      setPhotos((prev) => {
        const filtered = prev.filter((p) => p.id !== id)
        return filtered.map((p, index) => ({ ...p, order: index + 1 }))
      })
    },
    [photos, deleteFileMutation]
  )

  const handleReorder = useCallback((activeId: string, overId: string) => {
    setPhotos((prev) => {
      const activeIndex = prev.findIndex((p) => p.id === activeId)
      const overIndex = prev.findIndex((p) => p.id === overId)

      if (activeIndex === -1 || overIndex === -1) return prev

      const newPhotos = [...prev]
      const [removed] = newPhotos.splice(activeIndex, 1)
      newPhotos.splice(overIndex, 0, removed)

      return newPhotos.map((p, index) => ({ ...p, order: index + 1 }))
    })
  }, [])

  const getPhotosForSubmit = useCallback(() => {
    return photos
      .filter((p) => p.status === 'uploaded')
      .map((p) => ({ url: p.url, order: p.order }))
  }, [photos])

  return {
    photos,
    isUploading,
    handleFilesSelected,
    handleRemove,
    handleReorder,
    getPhotosForSubmit,
  }
}
