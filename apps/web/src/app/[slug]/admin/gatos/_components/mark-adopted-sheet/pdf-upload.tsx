'use client'

import { useMutation } from '@tanstack/react-query'
import { FileText, Loader2, Trash2, Upload } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

interface PdfUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  committedValue?: string | null
  onUploadingChange?: (isUploading: boolean) => void
  disabled?: boolean
}

export function PdfUpload({
  value,
  onChange,
  committedValue = null,
  onUploadingChange,
  disabled,
}: PdfUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const presignedUrlMutation = useMutation(
    trpc.adoptions.getPresignedUrl.mutationOptions()
  )

  const confirmUploadMutation = useMutation(
    trpc.adoptions.confirmUpload.mutationOptions()
  )

  const discardUploadMutation = useMutation(
    trpc.adoptions.discardTermUpload.mutationOptions()
  )

  const uploadFile = useCallback(
    async (file: File) => {
      setIsUploading(true)
      onUploadingChange?.(true)
      setUploadProgress(10)

      try {
        // Get presigned URL
        const { presignedUrl, key } = await presignedUrlMutation.mutateAsync({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        })

        setUploadProgress(30)

        // Upload to R2
        const response = await fetch(presignedUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        })

        if (!response.ok) {
          throw new Error('Erro ao fazer upload do arquivo')
        }

        setUploadProgress(70)

        // Confirm upload and get public URL
        const { publicUrl } = await confirmUploadMutation.mutateAsync({ key })

        setUploadProgress(100)
        onChange(publicUrl)
        toast.success('PDF enviado com sucesso')
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Erro ao enviar PDF'
        )
      } finally {
        setIsUploading(false)
        onUploadingChange?.(false)
        setUploadProgress(0)
      }
    },
    [presignedUrlMutation, confirmUploadMutation, onChange, onUploadingChange]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        uploadFile(file)
      }
    },
    [uploadFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: disabled || isUploading,
    onDropRejected: (rejections) => {
      const rejection = rejections[0]
      if (rejection?.errors[0]?.code === 'file-too-large') {
        toast.error('Arquivo muito grande. Máximo: 10MB')
      } else if (rejection?.errors[0]?.code === 'file-invalid-type') {
        toast.error('Apenas arquivos PDF são aceitos')
      } else {
        toast.error('Arquivo inválido')
      }
    },
  })

  const handleRemove = async () => {
    if (value && value !== committedValue) {
      try {
        await discardUploadMutation.mutateAsync({ url: value })
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível descartar o PDF'
        )
        return
      }
    }

    onChange(null)
  }

  if (value) {
    return (
      <div className="border-border/60 bg-success/5 flex items-center gap-3 rounded-xl border p-3">
        <div className="bg-success/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <FileText className="text-success h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">Termo de adoção</p>
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="text-primary text-xs hover:underline"
          >
            Visualizar PDF
          </a>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
          onClick={handleRemove}
          disabled={disabled || discardUploadMutation.isPending}
          aria-label="Remover PDF"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  if (isUploading) {
    return (
      <div className="border-border/60 bg-muted/20 flex items-center gap-3 rounded-xl border p-4">
        <Loader2 className="text-primary h-5 w-5 shrink-0 animate-spin" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Enviando PDF...</p>
          <div className="bg-muted mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-border/60 bg-muted/10 hover:border-primary/50 hover:bg-muted/20',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <input {...getInputProps()} />
      <Upload className="text-muted-foreground h-6 w-6" />
      <p className="mt-2 text-sm font-medium">
        {isDragActive ? 'Solte o PDF aqui' : 'Clique ou arraste o PDF'}
      </p>
      <p className="text-muted-foreground mt-0.5 text-xs">Máximo 10MB</p>
    </div>
  )
}
