'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Cat,
  Download,
  FileText,
  Heart,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Save,
  User,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { trpc } from '@/utils/trpc'

interface AdoptionDetailsSheetProps {
  open: boolean
  adoptionId: string | null
  onOpenChange: (open: boolean) => void
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function toWhatsappLink(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/55${digits}`
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

function formatAge(years: number | null, months: number | null): string {
  if (years === null && months === null) return 'Idade desconhecida'
  const parts: string[] = []
  if (years && years > 0) parts.push(`${years} ano${years > 1 ? 's' : ''}`)
  if (months && months > 0)
    parts.push(`${months} ${months > 1 ? 'meses' : 'mês'}`)
  return parts.join(' e ') || 'Idade desconhecida'
}

function DetailsLoadingState() {
  return (
    <div className="space-y-5 p-5">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  )
}

export function AdoptionDetailsSheet({
  open,
  adoptionId,
  onOpenChange,
}: AdoptionDetailsSheetProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    adopterName: '',
    adopterPhone: '',
    adopterEmail: '',
    adoptionDate: '',
    notes: '',
  })

  const detailsQuery = useQuery({
    ...trpc.adoptions.getById.queryOptions({ id: adoptionId ?? '' }),
    enabled: open && Boolean(adoptionId),
  })

  const updateMutation = useMutation(
    trpc.adoptions.update.mutationOptions({
      onSuccess: () => {
        toast.success('Adoção atualizada com sucesso')
        queryClient.invalidateQueries({ queryKey: [['adoptions']] })
        setIsEditing(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar adoção')
      },
    })
  )

  const data = detailsQuery.data

  // Populate edit form when data loads
  useEffect(() => {
    if (data) {
      setEditData({
        adopterName: data.adopterName,
        adopterPhone: formatPhone(data.adopterPhone),
        adopterEmail: data.adopterEmail || '',
        adoptionDate: data.adoptionDate,
        notes: data.notes || '',
      })
    }
  }, [data])

  // Reset editing state when sheet closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
    }
  }, [open])

  const handleSave = () => {
    if (!adoptionId) return

    updateMutation.mutate({
      id: adoptionId,
      adopterName: editData.adopterName,
      adopterPhone: editData.adopterPhone.replace(/\D/g, ''),
      adopterEmail: editData.adopterEmail || undefined,
      adoptionDate: editData.adoptionDate,
      notes: editData.notes || undefined,
    })
  }

  const handleCancel = () => {
    if (data) {
      setEditData({
        adopterName: data.adopterName,
        adopterPhone: formatPhone(data.adopterPhone),
        adopterEmail: data.adopterEmail || '',
        adoptionDate: data.adoptionDate,
        notes: data.notes || '',
      })
    }
    setIsEditing(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="border-border/60 w-full overflow-y-auto p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-border/40 from-card to-card/95 sticky top-0 z-20 border-b bg-gradient-to-b px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <Heart className="text-primary h-5 w-5" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="font-display text-lg">
                  Detalhes da adoção
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Visualize e edite os dados da adoção
                </SheetDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg sm:hidden"
              onClick={() => onOpenChange(false)}
              aria-label="Fechar detalhes"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        {detailsQuery.isLoading ? (
          <DetailsLoadingState />
        ) : detailsQuery.isError ? (
          <div className="p-5">
            <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4">
              <p className="text-destructive text-sm font-medium">
                Não foi possível carregar os detalhes.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 rounded-lg"
                onClick={() => detailsQuery.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : !data ? null : (
          <div className="space-y-5 p-5">
            {/* Cat Info */}
            <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-4">
              <div className="flex items-center gap-3">
                <Avatar className="border-border/40 h-14 w-14 rounded-xl border">
                  {data.catPhotoUrl ? (
                    <AvatarImage
                      src={data.catPhotoUrl}
                      alt={data.catName}
                      className="object-cover"
                    />
                  ) : null}
                  <AvatarFallback className="bg-muted rounded-xl">
                    <Cat className="text-muted-foreground h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{data.catName}</h3>
                  <p className="text-muted-foreground text-sm">
                    {data.catSex === 'male' ? 'Macho' : 'Fêmea'} •{' '}
                    {formatAge(data.catAgeYears, data.catAgeMonths)}
                  </p>
                </div>
              </div>
            </div>

            {/* Adopter Info */}
            <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-semibold">Dados do adotante</h3>
                </div>
                {!isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 rounded-lg"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name" className="text-sm">
                      Nome
                    </Label>
                    <Input
                      id="edit-name"
                      value={editData.adopterName}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          adopterName: e.target.value,
                        }))
                      }
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone" className="text-sm">
                      Telefone
                    </Label>
                    <Input
                      id="edit-phone"
                      value={editData.adopterPhone}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          adopterPhone: e.target.value,
                        }))
                      }
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-email" className="text-sm">
                      E-mail
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editData.adopterEmail}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          adopterEmail: e.target.value,
                        }))
                      }
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-date" className="text-sm">
                      Data da adoção
                    </Label>
                    <Input
                      id="edit-date"
                      type="date"
                      value={editData.adoptionDate}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          adoptionDate: e.target.value,
                        }))
                      }
                      className="h-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-notes" className="text-sm">
                      Observações
                    </Label>
                    <Textarea
                      id="edit-notes"
                      value={editData.notes}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      className="min-h-[80px] resize-none rounded-xl"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 rounded-xl"
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-lg font-semibold">{data.adopterName}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                    <a
                      href={toWhatsappLink(data.adopterPhone)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {formatPhone(data.adopterPhone)}
                    </a>
                    {data.adopterEmail && (
                      <a
                        href={`mailto:${data.adopterEmail}`}
                        className="text-primary inline-flex items-center gap-1.5 text-sm hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        {data.adopterEmail}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Adoption Details */}
            {!isEditing && (
              <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-semibold">Detalhes da adoção</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Data da adoção
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(data.adoptionDate)}
                    </span>
                  </div>

                  {data.notes && (
                    <div>
                      <p className="text-muted-foreground mb-1 text-sm">
                        Observações
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {data.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Adoption Term */}
            {!isEditing && data.adoptionTermUrl && (
              <div className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-semibold">Termo de adoção</h3>
                </div>

                <a
                  href={data.adoptionTermUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Baixar PDF
                </a>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
