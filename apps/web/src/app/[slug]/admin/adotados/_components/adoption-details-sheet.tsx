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
  MoreVertical,
  Pencil,
  RotateCcw,
  Save,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PdfUpload } from '../../gatos/_components/mark-adopted-sheet/pdf-upload'

import { useAuth } from '@/components/auth-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isTermUploading, setIsTermUploading] = useState(false)
  const [returnDialogOpen, setReturnDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [editData, setEditData] = useState({
    adopterName: '',
    adopterPhone: '',
    adopterEmail: '',
    adoptionDate: '',
    adoptionTermUrl: null as string | null,
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

  const discardDraftMutation = useMutation(
    trpc.adoptions.discardTermUpload.mutationOptions()
  )

  const returnMutation = useMutation(
    trpc.adoptions.returnToAvailable.mutationOptions({
      onSuccess: () => {
        toast.success('Adoção removida e gato devolvido para disponíveis')
        queryClient.invalidateQueries({ queryKey: [['adoptions']] })
        queryClient.invalidateQueries({ queryKey: [['cats']] })
        queryClient.invalidateQueries({ queryKey: [['dashboard']] })
        setReturnDialogOpen(false)
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível devolver o gato')
      },
    })
  )

  const hardDeleteMutation = useMutation(
    trpc.cats.hardDelete.mutationOptions({
      onSuccess: () => {
        toast.success('Gato e todo o histórico foram excluídos')
        queryClient.invalidateQueries({ queryKey: [['adoptions']] })
        queryClient.invalidateQueries({ queryKey: [['cats']] })
        queryClient.invalidateQueries({ queryKey: [['applications']] })
        queryClient.invalidateQueries({ queryKey: [['dashboard']] })
        setDeleteDialogOpen(false)
        setDeleteConfirmation('')
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message || 'Não foi possível excluir o gato')
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
        adoptionTermUrl: data.adoptionTermUrl,
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
      adoptionTermUrl: editData.adoptionTermUrl,
      notes: editData.notes || undefined,
    })
  }

  const startEditing = () => {
    if (data) {
      setEditData({
        adopterName: data.adopterName,
        adopterPhone: formatPhone(data.adopterPhone),
        adopterEmail: data.adopterEmail || '',
        adoptionDate: data.adoptionDate,
        adoptionTermUrl: data.adoptionTermUrl,
        notes: data.notes || '',
      })
    }
    setIsEditing(true)
  }

  const discardUncommittedTerm = async () => {
    if (
      editData.adoptionTermUrl &&
      editData.adoptionTermUrl !== data?.adoptionTermUrl
    ) {
      await discardDraftMutation.mutateAsync({
        url: editData.adoptionTermUrl,
      })
    }
  }

  const handleCancel = async () => {
    try {
      await discardUncommittedTerm()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível descartar o novo termo'
      )
      return
    }

    if (data) {
      setEditData({
        adopterName: data.adopterName,
        adopterPhone: formatPhone(data.adopterPhone),
        adopterEmail: data.adopterEmail || '',
        adoptionDate: data.adoptionDate,
        adoptionTermUrl: data.adoptionTermUrl,
        notes: data.notes || '',
      })
    }
    setIsEditing(false)
  }

  const handleSheetOpenChange = async (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (isEditing) {
      try {
        await discardUncommittedTerm()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Não foi possível descartar o novo termo'
        )
        return
      }
    }

    onOpenChange(false)
  }

  const isAdmin = user?.role === 'admin'
  const isManaging = returnMutation.isPending || hardDeleteMutation.isPending

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => void handleSheetOpenChange(nextOpen)}
      >
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

              <div className="flex items-center gap-1">
                {data && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 gap-1.5 rounded-lg"
                        disabled={isManaging}
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="hidden sm:inline">Gerenciar</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 rounded-xl"
                    >
                      <DropdownMenuItem
                        className="cursor-pointer gap-2 rounded-lg"
                        onSelect={() => setReturnDialogOpen(true)}
                      >
                        <RotateCcw className="text-primary h-4 w-4" />
                        <div>
                          <p className="text-sm font-medium">
                            Devolver para disponíveis
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Preserva gato e candidaturas
                          </p>
                        </div>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2 rounded-lg"
                            onSelect={() => setDeleteDialogOpen(true)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <div>
                              <p className="text-sm font-medium">
                                Excluir gato definitivamente
                              </p>
                              <p className="text-destructive/75 text-xs">
                                Apaga todo o histórico
                              </p>
                            </div>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg sm:hidden"
                  onClick={() => void handleSheetOpenChange(false)}
                  aria-label="Fechar detalhes"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
                      onClick={startEditing}
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
                      <Label className="text-sm">Termo de adoção</Label>
                      <PdfUpload
                        value={editData.adoptionTermUrl}
                        committedValue={data.adoptionTermUrl}
                        onUploadingChange={setIsTermUploading}
                        onChange={(url) =>
                          setEditData((current) => ({
                            ...current,
                            adoptionTermUrl: url,
                          }))
                        }
                        disabled={
                          updateMutation.isPending ||
                          discardDraftMutation.isPending
                        }
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
                        onClick={() => void handleCancel()}
                        disabled={
                          updateMutation.isPending ||
                          discardDraftMutation.isPending ||
                          isTermUploading
                        }
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 rounded-xl"
                        onClick={handleSave}
                        disabled={updateMutation.isPending || isTermUploading}
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
                      <p className="text-lg font-semibold">
                        {data.adopterName}
                      </p>
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
                    <h3 className="text-sm font-semibold">
                      Detalhes da adoção
                    </h3>
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

      <Dialog
        open={returnDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!returnMutation.isPending) setReturnDialogOpen(nextOpen)
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="text-primary h-5 w-5" />
              Devolver {data?.catName} para disponíveis?
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              O registro desta adoção e o termo assinado serão apagados. O
              perfil do gato e todas as candidaturas permanecerão no sistema, e
              ele voltará a aparecer na página pública.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
              disabled={returnMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!adoptionId || returnMutation.isPending}
              onClick={() => {
                if (adoptionId) returnMutation.mutate({ id: adoptionId })
              }}
            >
              {returnMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar devolução
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!hardDeleteMutation.isPending) {
            setDeleteDialogOpen(nextOpen)
            if (!nextOpen) setDeleteConfirmation('')
          }
        }}
      >
        <DialogContent className="overflow-hidden rounded-2xl p-0 sm:max-w-lg">
          <div className="from-destructive/12 via-card to-card border-destructive/15 border-b bg-gradient-to-br p-6">
            <div className="bg-destructive/10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl">
              <Trash2 className="text-destructive h-5 w-5" />
            </div>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                Excluir {data?.catName} definitivamente
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                Esta ação remove o gato, a adoção, todas as candidaturas, fotos,
                mídias e o termo. Ela não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-2 px-6">
            <Label htmlFor="delete-cat-confirmation">
              Digite <strong>{data?.catName}</strong> para confirmar
            </Label>
            <Input
              id="delete-cat-confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={hardDeleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={
                !data ||
                deleteConfirmation.trim().toLocaleLowerCase('pt-BR') !==
                  data.catName.trim().toLocaleLowerCase('pt-BR') ||
                hardDeleteMutation.isPending
              }
              onClick={() => {
                if (!data) return
                hardDeleteMutation.mutate({
                  id: data.catId,
                  confirmationName: deleteConfirmation,
                })
              }}
            >
              {hardDeleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Excluir tudo definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
