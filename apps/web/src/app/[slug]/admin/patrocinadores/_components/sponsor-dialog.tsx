'use client'

import { Handshake, ImagePlus, Loader2, Pencil, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useSponsorLogoUpload } from '../_hooks/use-sponsor-logo-upload'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

interface SponsorFormData {
  name: string
  websiteUrl: string
  logoUrl: string
  featured: boolean
}

interface SponsorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: SponsorFormData) => void
  isSubmitting: boolean
  initialData?: {
    name: string
    websiteUrl: string
    logoUrl: string
    featured: boolean
  }
}

export function SponsorDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initialData,
}: SponsorDialogProps) {
  const [name, setName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [featured, setFeatured] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevOpenRef = useRef(false)

  const {
    logoUrl,
    isUploading,
    progress,
    handleFileSelected,
    handleRemove,
    reset,
  } = useSponsorLogoUpload({
    initialUrl: initialData?.logoUrl,
  })

  const displayUrl = localPreview ?? logoUrl

  useEffect(() => {
    if (logoUrl && localPreview) {
      URL.revokeObjectURL(localPreview)
      setLocalPreview(null)
    }
  }, [logoUrl, localPreview])

  useEffect(() => {
    const justOpened = open && !prevOpenRef.current
    prevOpenRef.current = open

    if (justOpened) {
      setName(initialData?.name ?? '')
      setWebsiteUrl(initialData?.websiteUrl ?? '')
      setFeatured(initialData?.featured ?? false)
      setLocalPreview(null)
      reset(initialData?.logoUrl)
    }
  }, [open, initialData, reset])

  const isEditing = !!initialData
  const canSubmit =
    name.trim() && websiteUrl.trim() && logoUrl && !isUploading

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    onSubmit({
      name: name.trim(),
      websiteUrl: websiteUrl.trim(),
      logoUrl,
      featured,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="border-border/60 flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-border/40 border-b px-5 py-4 pr-11">
          <SheetTitle className="flex items-center gap-2">
            <Handshake className="text-primary h-5 w-5" />
            {isEditing ? 'Editar patrocinador' : 'Novo patrocinador'}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Atualize as informações do patrocinador.'
              : 'Adicione o logo e link do patrocinador.'}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-start gap-3">
                {/* Dropzone - visible when no image at all */}
                {!displayUrl && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shadow-warm-sm border-border/70 bg-sidebar-accent/50 hover:border-primary/40 hover:bg-muted/40 flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed transition-all duration-200"
                  >
                    <ImagePlus className="text-muted-foreground h-5 w-5" />
                    <span className="text-muted-foreground mt-1 text-[11px] font-medium">
                      Adicionar
                    </span>
                  </button>
                )}

                {/* Preview - shows image with upload overlay */}
                {displayUrl && (
                  <div className="shadow-warm-sm border-border/60 bg-muted/25 group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border">
                    <img
                      src={displayUrl}
                      alt="Logo preview"
                      className={cn(
                        'h-full w-full object-contain p-2 transition-opacity',
                        isUploading && 'opacity-40'
                      )}
                    />
                    {isUploading && (
                      <div className="bg-background/60 absolute inset-0 flex flex-col items-center justify-center">
                        <Loader2 className="text-primary h-6 w-6 animate-spin" />
                        <span className="text-primary mt-1 text-[11px] font-medium">
                          {progress}%
                        </span>
                      </div>
                    )}
                    {!isUploading && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 rounded-md opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:opacity-100"
                        onClick={() => {
                          if (localPreview) URL.revokeObjectURL(localPreview)
                          setLocalPreview(null)
                          handleRemove()
                        }}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remover logo</span>
                      </Button>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const blobUrl = URL.createObjectURL(file)
                      setLocalPreview(blobUrl)
                      handleFileSelected(file)
                    }
                    e.target.value = ''
                  }}
                />
                <div className="text-muted-foreground mt-1 text-xs">
                  <p>JPEG, PNG, WebP ou GIF</p>
                  <p>Máximo 5MB</p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="sponsor-name">Nome *</Label>
              <Input
                id="sponsor-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pet Shop Amigo"
                className="h-10 rounded-xl"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Website URL */}
            <div className="space-y-2">
              <Label htmlFor="sponsor-url">Site</Label>
              <Input
                id="sponsor-url"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://exemplo.com.br"
                className="h-10 rounded-xl"
                disabled={isSubmitting}
              />
            </div>

            {/* Featured */}
            <div className="border-border/50 bg-muted/20 flex items-center justify-between rounded-xl border p-3">
              <div>
                <Label
                  htmlFor="sponsor-featured"
                  className="text-sm font-medium"
                >
                  Destaque
                </Label>
                <p className="text-muted-foreground text-xs">
                  Patrocinadores destaque aparecem maiores no site
                </p>
              </div>
              <Switch
                id="sponsor-featured"
                checked={featured}
                onCheckedChange={setFeatured}
              />
            </div>
          </div>

          <SheetFooter className="border-border/40 bg-card/95 gap-2 border-t px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="shadow-primary-glow w-full gap-2 rounded-xl sm:w-auto sm:min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Salvar
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Adicionar
                </>
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
