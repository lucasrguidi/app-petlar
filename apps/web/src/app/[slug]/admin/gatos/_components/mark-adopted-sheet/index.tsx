'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Heart,
  Loader2,
  Mail,
  MessageCircle,
  User,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AdopterSelect, type Applicant } from './adopter-select'
import { PdfUpload } from './pdf-upload'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/utils/trpc'

interface Cat {
  id: string
  name: string
}

interface InitialApplicant {
  applicationId: string
  name: string
  phone: string
  email: string | null
}

interface MarkAdoptedSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cat: Cat
  initialApplicant?: InitialApplicant
  onSuccess?: () => void
}

interface FormData {
  adopterName: string
  adopterPhone: string
  adopterEmail: string
  adoptionDate: string
  adoptionTermUrl: string | null
  notes: string
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0] ?? ''
}

function toWhatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/55${digits}`
}

export function MarkAdoptedSheet({
  open,
  onOpenChange,
  cat,
  initialApplicant,
  onSuccess,
}: MarkAdoptedSheetProps) {
  const queryClient = useQueryClient()
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null)
  const [isTermUploading, setIsTermUploading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    adopterName: '',
    adopterPhone: '',
    adopterEmail: '',
    adoptionDate: getTodayISODate(),
    adoptionTermUrl: null,
    notes: '',
  })

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (initialApplicant) {
        setSelectedApplicationId(initialApplicant.applicationId)
        setFormData({
          adopterName: initialApplicant.name,
          adopterPhone: formatPhoneInput(initialApplicant.phone),
          adopterEmail: initialApplicant.email ?? '',
          adoptionDate: getTodayISODate(),
          adoptionTermUrl: null,
          notes: '',
        })
      } else {
        setSelectedApplicationId(null)
        setFormData({
          adopterName: '',
          adopterPhone: '',
          adopterEmail: '',
          adoptionDate: getTodayISODate(),
          adoptionTermUrl: null,
          notes: '',
        })
      }
    }
  }, [open, initialApplicant])

  const createAdoptionMutation = useMutation(
    trpc.adoptions.create.mutationOptions({
      onSuccess: () => {
        toast.success(`${cat.name} foi marcado como adotado!`)
        queryClient.invalidateQueries({ queryKey: [['cats', 'list']] })
        queryClient.invalidateQueries({ queryKey: [['adoptions']] })
        queryClient.invalidateQueries({ queryKey: [['applications']] })
        setFormData((current) => ({ ...current, adoptionTermUrl: null }))
        onOpenChange(false)
        onSuccess?.()
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao registrar adoção')
      },
    })
  )

  const discardDraftMutation = useMutation(
    trpc.adoptions.discardTermUpload.mutationOptions()
  )

  const handleOpenChange = async (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (formData.adoptionTermUrl) {
      try {
        await discardDraftMutation.mutateAsync({
          url: formData.adoptionTermUrl,
        })
        setFormData((current) => ({
          ...current,
          adoptionTermUrl: null,
        }))
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível descartar o termo enviado'
        )
        return
      }
    }

    onOpenChange(false)
  }

  const handleApplicantChange = (applicant: Applicant | null) => {
    if (applicant) {
      setSelectedApplicationId(applicant.id)
      setFormData((prev) => ({
        ...prev,
        adopterName: applicant.applicantName,
        adopterPhone: formatPhoneInput(applicant.applicantWhatsapp),
        adopterEmail: applicant.applicantEmail,
      }))
    } else {
      setSelectedApplicationId(null)
      setFormData((prev) => ({
        ...prev,
        adopterName: '',
        adopterPhone: '',
        adopterEmail: '',
      }))
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePhoneChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      adopterPhone: formatPhoneInput(value),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.adopterName.trim()) {
      toast.error('Informe o nome do adotante')
      return
    }

    if (
      !formData.adopterPhone.trim() ||
      formData.adopterPhone.replace(/\D/g, '').length < 10
    ) {
      toast.error('Informe um telefone válido')
      return
    }

    if (!formData.adoptionDate) {
      toast.error('Informe a data da adoção')
      return
    }

    createAdoptionMutation.mutate({
      catId: cat.id,
      applicationId: selectedApplicationId ?? undefined,
      adopterName: formData.adopterName.trim(),
      adopterPhone: formData.adopterPhone.replace(/\D/g, ''),
      adopterEmail: formData.adopterEmail.trim() || undefined,
      adoptionDate: formData.adoptionDate,
      adoptionTermUrl: formData.adoptionTermUrl ?? undefined,
      notes: formData.notes.trim() || undefined,
    })
  }

  const isPending =
    createAdoptionMutation.isPending || discardDraftMutation.isPending

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => void handleOpenChange(nextOpen)}
    >
      <SheetContent
        side="right"
        className="border-border/60 w-full overflow-y-auto p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-border/40 from-card to-card/95 sticky top-0 z-20 border-b bg-gradient-to-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-success/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Heart className="text-success h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="font-display text-lg">
                  Marcar como adotado
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Registre a adoção de <strong>{cat.name}</strong>
                </SheetDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-lg"
              onClick={() => void handleOpenChange(false)}
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {/* Adopter Selection */}
          {initialApplicant ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Candidato selecionado
              </Label>
              <div className="border-border/60 bg-muted/20 flex items-center gap-2 rounded-xl border px-3 py-2.5">
                <User className="text-primary h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">
                  {initialApplicant.name}
                </span>
              </div>
            </div>
          ) : (
            <AdopterSelect
              catId={cat.id}
              value={selectedApplicationId}
              onChange={handleApplicantChange}
              disabled={isPending}
            />
          )}

          {/* Adopter Name */}
          <div className="space-y-2">
            <Label htmlFor="adopterName" className="text-sm font-medium">
              Nome do adotante <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="adopterName"
                type="text"
                value={formData.adopterName}
                onChange={(e) =>
                  handleInputChange('adopterName', e.target.value)
                }
                placeholder="Nome completo do adotante"
                className="h-10 rounded-xl pl-10"
                disabled={isPending}
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="adopterPhone" className="text-sm font-medium">
              Telefone / WhatsApp <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <MessageCircle className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="adopterPhone"
                type="tel"
                value={formData.adopterPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="(11) 99999-9999"
                className="h-10 rounded-xl pl-10"
                disabled={isPending}
                required
              />
            </div>
            {formData.adopterPhone.replace(/\D/g, '').length >= 10 && (
              <a
                href={toWhatsappLink(formData.adopterPhone)}
                target="_blank"
                rel="noreferrer"
                className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
              >
                <MessageCircle className="h-3 w-3" />
                Abrir WhatsApp
              </a>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="adopterEmail" className="text-sm font-medium">
              E-mail{' '}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <div className="relative">
              <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="adopterEmail"
                type="email"
                value={formData.adopterEmail}
                onChange={(e) =>
                  handleInputChange('adopterEmail', e.target.value)
                }
                placeholder="email@exemplo.com"
                className="h-10 rounded-xl pl-10"
                disabled={isPending}
              />
            </div>
          </div>

          {/* Adoption Date */}
          <div className="space-y-2">
            <Label htmlFor="adoptionDate" className="text-sm font-medium">
              Data da adoção <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Calendar className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                id="adoptionDate"
                type="date"
                value={formData.adoptionDate}
                onChange={(e) =>
                  handleInputChange('adoptionDate', e.target.value)
                }
                className="h-10 rounded-xl pl-10"
                disabled={isPending}
                required
              />
            </div>
          </div>

          {/* PDF Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Termo de adoção{' '}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <PdfUpload
              value={formData.adoptionTermUrl}
              onChange={(url) => handleInputChange('adoptionTermUrl', url)}
              onUploadingChange={setIsTermUploading}
              disabled={isPending}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Observações{' '}
              <span className="text-muted-foreground text-xs">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Anotações sobre a adoção..."
              className="min-h-[80px] resize-none rounded-xl"
              disabled={isPending || isTermUploading}
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              className="shadow-primary-glow w-full rounded-xl"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando adoção...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Confirmar adoção
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
