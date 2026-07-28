'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Cat as CatIcon,
  ChevronDown,
  HandHeart,
  ImageIcon,
  Loader2,
  Mars,
  PawPrint,
  Phone,
  Plus,
  Trash2,
  Users,
  Venus,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { defaultCatFormValues } from '../../_components/cat-form-schema'
import { PhotoSection } from '../../_components/photo-upload/photo-section'
import { usePhotoUpload } from '../../_hooks/use-photo-upload'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useOrgHref } from '@/hooks/use-org-href'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

type TestResult = 'positive' | 'negative' | 'not_tested'

interface NewCatEntry {
  tempId: string
  name: string
  ageYears: number | null
  ageMonths: number | null
  sex: 'male' | 'female'
  fiv: TestResult
  felv: TestResult
  castrated: boolean
  vaccinated: boolean
  vaccinationNotes: string | null
  dewormed: boolean
  dewormingNotes: string | null
  description: string | null
  donorName: string | null
  donorWhatsapp: string | null
}

interface ExistingCatEntry {
  id: string
  name: string
  sex: 'male' | 'female'
  photoUrl: string | null
}

interface GroupPhoto {
  id: string
  url: string
  order: number
}

interface GroupFormProps {
  mode: 'create' | 'edit'
  groupId?: string
  initialFormId?: string
  initialExistingCats?: ExistingCatEntry[]
  initialDonorName?: string | null
  initialDonorWhatsapp?: string | null
  initialPhotos?: GroupPhoto[]
}

function createEmptyCat(): NewCatEntry {
  return {
    tempId: crypto.randomUUID(),
    name: '',
    ageYears: null,
    ageMonths: null,
    sex: defaultCatFormValues.sex,
    fiv: defaultCatFormValues.fiv,
    felv: defaultCatFormValues.felv,
    castrated: defaultCatFormValues.castrated,
    vaccinated: defaultCatFormValues.vaccinated,
    vaccinationNotes: null,
    dewormed: defaultCatFormValues.dewormed,
    dewormingNotes: null,
    description: null,
    donorName: null,
    donorWhatsapp: null,
  }
}

function TestResultButtons({
  label,
  value,
  onChange,
}: {
  label: string
  value: TestResult
  onChange: (v: TestResult) => void
}) {
  const options: { value: TestResult; label: string }[] = [
    { value: 'negative', label: 'Neg' },
    { value: 'positive', label: 'Pos' },
    { value: 'not_tested', label: '?' },
  ]
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
              value === opt.value
                ? opt.value === 'positive'
                  ? 'bg-destructive text-destructive-foreground'
                  : opt.value === 'negative'
                    ? 'bg-success text-success-foreground'
                    : 'bg-muted text-muted-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function SexButtons({
  value,
  onChange,
}: {
  value: 'male' | 'female'
  onChange: (v: 'male' | 'female') => void
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Sexo</Label>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange('male')}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
            value === 'male'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          <Mars className="h-3 w-3" />
          M
        </button>
        <button
          type="button"
          onClick={() => onChange('female')}
          className={cn(
            'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
            value === 'female'
              ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}
        >
          <Venus className="h-3 w-3" />
          F
        </button>
      </div>
    </div>
  )
}

function BooleanToggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
        value
          ? 'bg-success/10 text-success'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
      )}
    >
      {label}
    </button>
  )
}

interface NewCatCardProps {
  cat: NewCatEntry
  index: number
  onUpdate: (tempId: string, data: Partial<NewCatEntry>) => void
  onRemove: (tempId: string) => void
  photoUpload: ReturnType<typeof usePhotoUpload>
}

function NewCatCard({
  cat,
  index,
  onUpdate,
  onRemove,
  photoUpload,
}: NewCatCardProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
        <CardTitle className="text-display flex items-center gap-2 text-sm font-semibold">
          <CatIcon className="text-primary h-4 w-4" />
          Gato {index + 1}
          {cat.name && (
            <span className="text-muted-foreground font-normal">
              — {cat.name}
            </span>
          )}
        </CardTitle>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-7 w-7"
          onClick={() => onRemove(cat.tempId)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-3 pt-0">
        <PhotoSection
          photos={photoUpload.photos}
          isUploading={photoUpload.isUploading}
          onFilesSelected={photoUpload.handleFilesSelected}
          onRemove={photoUpload.handleRemove}
          onReorder={photoUpload.handleReorder}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Nome</Label>
            <Input
              value={cat.name}
              onChange={(e) =>
                onUpdate(cat.tempId, { name: e.target.value })
              }
              placeholder="Nome do gato"
              className="h-9 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Anos</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={cat.ageYears ?? ''}
                onChange={(e) =>
                  onUpdate(cat.tempId, {
                    ageYears:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Meses</Label>
              <Input
                type="number"
                min={0}
                max={11}
                value={cat.ageMonths ?? ''}
                onChange={(e) =>
                  onUpdate(cat.tempId, {
                    ageMonths:
                      e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="0"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <SexButtons
            value={cat.sex}
            onChange={(sex) => onUpdate(cat.tempId, { sex })}
          />
          <TestResultButtons
            label="FIV"
            value={cat.fiv}
            onChange={(fiv) => onUpdate(cat.tempId, { fiv })}
          />
          <TestResultButtons
            label="FeLV"
            value={cat.felv}
            onChange={(felv) => onUpdate(cat.tempId, { felv })}
          />
          <div className="space-y-1">
            <Label className="text-xs">Cuidados</Label>
            <div className="flex gap-1">
              <BooleanToggle
                label="Castrado"
                value={cat.castrated}
                onChange={(castrated) =>
                  onUpdate(cat.tempId, { castrated })
                }
              />
              <BooleanToggle
                label="Vacinado"
                value={cat.vaccinated}
                onChange={(vaccinated) =>
                  onUpdate(cat.tempId, { vaccinated })
                }
              />
              <BooleanToggle
                label="Vermifugado"
                value={cat.dewormed}
                onChange={(dewormed) =>
                  onUpdate(cat.tempId, { dewormed })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Descrição (opcional)</Label>
          <Textarea
            value={cat.description ?? ''}
            onChange={(e) =>
              onUpdate(cat.tempId, {
                description: e.target.value || null,
              })
            }
            placeholder="Personalidade, comportamento..."
            className="min-h-16 resize-y text-sm"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function ExistingCatBadge({
  cat,
  onRemove,
}: {
  cat: ExistingCatEntry
  onRemove: (id: string) => void
}) {
  return (
    <div className="border-border/60 bg-card flex items-center gap-2 rounded-xl border px-3 py-2">
      <div className="bg-muted relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
        {cat.photoUrl ? (
          <img
            src={cat.photoUrl}
            alt={cat.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <CatIcon className="text-muted-foreground h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{cat.name}</p>
        <p className="text-muted-foreground text-xs">
          {cat.sex === 'male' ? 'Macho' : 'Fêmea'}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive h-7 w-7 shrink-0"
        onClick={() => onRemove(cat.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function GroupForm({
  mode,
  groupId,
  initialFormId,
  initialExistingCats,
  initialDonorName,
  initialDonorWhatsapp,
  initialPhotos,
}: GroupFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const catListHref = useOrgHref('/admin/gatos')

  const [formId, setFormId] = useState(initialFormId ?? '')
  const [donorName, setDonorName] = useState(initialDonorName ?? '')
  const [donorWhatsapp, setDonorWhatsapp] = useState(
    initialDonorWhatsapp ? formatPhoneInput(initialDonorWhatsapp) : ''
  )
  const [isDonorOpen, setIsDonorOpen] = useState(
    Boolean(initialDonorName || initialDonorWhatsapp)
  )
  const [newCats, setNewCats] = useState<NewCatEntry[]>([])
  const [existingCats, setExistingCats] = useState<ExistingCatEntry[]>(
    initialExistingCats ?? []
  )
  const [removedCatIds, setRemovedCatIds] = useState<string[]>([])

  const groupPhotoUpload = usePhotoUpload({
    initialPhotos: initialPhotos,
    maxPhotos: 5,
  })

  const [catPhotoUploads, setCatPhotoUploads] = useState<
    Map<string, ReturnType<typeof usePhotoUpload>>
  >(new Map())

  const { data: formOptions, isLoading: isLoadingFormOptions } = useQuery(
    trpc.forms.options.queryOptions()
  )

  const { data: availableCats } = useQuery({
    ...trpc.cats.list.queryOptions({
      status: 'available',
      limit: 50,
    }),
    select: (data) =>
      data.cats.filter(
        (c) =>
          !c.groupId &&
          !existingCats.some((ec) => ec.id === c.id)
      ),
  })

  const createMutation = useMutation(
    trpc.catGroups.create.mutationOptions({
      onSuccess: () => {
        toast.success('Grupo criado com sucesso!')
        queryClient.invalidateQueries({ queryKey: [['cats']] })
        queryClient.invalidateQueries({ queryKey: [['catGroups']] })
        router.push(catListHref)
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar grupo')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.catGroups.update.mutationOptions({
      onSuccess: () => {
        toast.success('Grupo atualizado com sucesso!')
        queryClient.invalidateQueries({ queryKey: [['cats']] })
        queryClient.invalidateQueries({ queryKey: [['catGroups']] })
        router.push(catListHref)
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar grupo')
      },
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending
  const isAnyUploading =
    groupPhotoUpload.isUploadingRef.current ||
    Array.from(catPhotoUploads.values()).some(
      (u) => u.isUploadingRef.current
    )

  const totalCats = newCats.length + existingCats.length

  const handleAddNewCat = useCallback(() => {
    setNewCats((prev) => [...prev, createEmptyCat()])
  }, [])

  const handleUpdateNewCat = useCallback(
    (tempId: string, data: Partial<NewCatEntry>) => {
      setNewCats((prev) =>
        prev.map((c) => (c.tempId === tempId ? { ...c, ...data } : c))
      )
    },
    []
  )

  const handleRemoveNewCat = useCallback((tempId: string) => {
    setNewCats((prev) => prev.filter((c) => c.tempId !== tempId))
    setCatPhotoUploads((prev) => {
      const next = new Map(prev)
      next.delete(tempId)
      return next
    })
  }, [])

  const handleAddExistingCat = useCallback(
    (catId: string) => {
      const cat = availableCats?.find((c) => c.id === catId)
      if (!cat) return

      setExistingCats((prev) => [
        ...prev,
        {
          id: cat.id,
          name: cat.name,
          sex: cat.sex as 'male' | 'female',
          photoUrl: cat.photoUrl,
        },
      ])
    },
    [availableCats]
  )

  const handleRemoveExistingCat = useCallback(
    (catId: string) => {
      setExistingCats((prev) => prev.filter((c) => c.id !== catId))
      if (mode === 'edit') {
        setRemovedCatIds((prev) => [...prev, catId])
      }
    },
    [mode]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formId) {
      toast.error('Selecione um formulário')
      return
    }

    if (totalCats < 2) {
      toast.error('Um grupo precisa ter pelo menos 2 gatos')
      return
    }

    const invalidCats = newCats.filter((c) => !c.name.trim())
    if (invalidCats.length > 0) {
      toast.error('Todos os gatos precisam ter um nome')
      return
    }

    const groupDonorName = donorName.trim() || null
    const groupDonorWhatsapp = donorWhatsapp
      ? donorWhatsapp.replace(/\D/g, '')
      : null

    const newCatsData = newCats.map((cat) => {
      const photoUpload = catPhotoUploads.get(cat.tempId)
      const photos = photoUpload?.getPhotosForSubmit() ?? []
      return {
        name: cat.name.trim(),
        ageYears: cat.ageYears,
        ageMonths: cat.ageMonths,
        sex: cat.sex,
        fiv: cat.fiv,
        felv: cat.felv,
        castrated: cat.castrated,
        vaccinated: cat.vaccinated,
        vaccinationNotes: cat.vaccinationNotes,
        dewormed: cat.dewormed,
        dewormingNotes: cat.dewormingNotes,
        description: cat.description,
        donorName: groupDonorName,
        donorWhatsapp: groupDonorWhatsapp,
        photos,
      }
    })

    const groupPhotosForSubmit = groupPhotoUpload.getPhotosForSubmit()

    if (mode === 'create') {
      createMutation.mutate({
        formId,
        donorName: groupDonorName,
        donorWhatsapp: groupDonorWhatsapp,
        photos: groupPhotosForSubmit.length > 0
          ? groupPhotosForSubmit
          : undefined,
        newCats: newCatsData,
        existingCatIds: existingCats.map((c) => c.id),
      })
    } else if (groupId) {
      const addCatIds = existingCats
        .filter(
          (c) => !initialExistingCats?.some((ic) => ic.id === c.id)
        )
        .map((c) => c.id)

      updateMutation.mutate({
        id: groupId,
        formId: formId !== initialFormId ? formId : undefined,
        donorName: groupDonorName,
        donorWhatsapp: groupDonorWhatsapp,
        photos: groupPhotosForSubmit,
        addCatIds: addCatIds.length > 0 ? addCatIds : undefined,
        removeCatIds:
          removedCatIds.length > 0 ? removedCatIds : undefined,
        newCats: newCatsData.length > 0 ? newCatsData : undefined,
      })
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <Button
        variant="outline"
        size="sm"
        className="border-border/60 bg-card/80 shadow-warm-sm hover:bg-sidebar-accent gap-2 rounded-xl"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form selector */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
            <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
              <PawPrint className="text-primary h-4 w-4" />
              Configuração do grupo
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              O formulário selecionado será usado para todas as candidaturas do
              grupo
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="space-y-1.5">
              <Label>Formulário de candidatura</Label>
              <Select
                value={formId}
                onValueChange={setFormId}
                disabled={isLoadingFormOptions || (mode === 'edit')}
              >
                <SelectTrigger className="h-10 rounded-lg">
                  <SelectValue placeholder="Escolha um formulário" />
                </SelectTrigger>
                <SelectContent>
                  {formOptions?.map((option) => (
                    <SelectItem
                      key={option.id}
                      value={option.id}
                      disabled={!option.active}
                    >
                      {option.name}
                      {!option.active ? ' (inativo)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {mode === 'edit'
                  ? 'O formulário não pode ser alterado após a criação.'
                  : 'Esse formulário será usado quando alguém clicar em "Quero adotar" para este grupo.'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Group photos */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
            <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
              <ImageIcon className="text-primary h-4 w-4" />
              Fotos do grupo
              <Badge
                variant="secondary"
                className="text-[10px] font-normal"
              >
                Opcional
              </Badge>
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Fotos dos gatos juntos (máximo 5). Aparecem primeiro no
              carrossel público.
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
            <PhotoSection
              photos={groupPhotoUpload.photos}
              isUploading={groupPhotoUpload.isUploading}
              onFilesSelected={groupPhotoUpload.handleFilesSelected}
              onRemove={groupPhotoUpload.handleRemove}
              onReorder={groupPhotoUpload.handleReorder}
            />
          </CardContent>
        </Card>

        {/* Donor section */}
        <Collapsible open={isDonorOpen} onOpenChange={setIsDonorOpen}>
          <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer space-y-0 p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
                    <HandHeart className="text-primary h-4 w-4" />
                    Doador
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-normal"
                    >
                      Opcional
                    </Badge>
                  </CardTitle>
                  <ChevronDown
                    className={`text-muted-foreground h-4 w-4 transition-transform duration-200 ${isDonorOpen ? 'rotate-180' : ''}`}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  Informações de quem doou os gatos (uso interno, aplicado a
                  todos do grupo)
                </p>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
                <div className="space-y-1.5">
                  <Label>Nome do doador</Label>
                  <Input
                    placeholder="Ex.: Maria Silva"
                    className="h-10"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp</Label>
                  <div className="relative">
                    <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input
                      placeholder="(11) 99999-9999"
                      className="h-10 pl-10"
                      inputMode="tel"
                      value={donorWhatsapp}
                      onChange={(e) =>
                        setDonorWhatsapp(formatPhoneInput(e.target.value))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Cats section */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
                <Users className="text-primary h-4 w-4" />
                Gatos do grupo
                <Badge variant="secondary" className="text-[10px]">
                  {totalCats} gato{totalCats !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </div>
            <p className="text-muted-foreground text-xs">
              Mínimo de 2 gatos para formar um grupo
            </p>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
            {/* Existing cats */}
            {existingCats.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Gatos existentes
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {existingCats.map((cat) => (
                    <ExistingCatBadge
                      key={cat.id}
                      cat={cat}
                      onRemove={handleRemoveExistingCat}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add existing cat select */}
            {availableCats && availableCats.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Adicionar gato existente</Label>
                <Select onValueChange={handleAddExistingCat}>
                  <SelectTrigger className="h-9 rounded-lg text-sm">
                    <SelectValue placeholder="Selecione um gato disponível..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCats.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          {cat.sex === 'male' ? (
                            <Mars className="h-3 w-3 text-blue-500" />
                          ) : (
                            <Venus className="h-3 w-3 text-pink-500" />
                          )}
                          <span>{cat.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* New cats */}
            {newCats.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Novos gatos
                </p>
                <div className="space-y-3">
                  {newCats.map((cat, i) => (
                    <NewCatCardWrapper
                      key={cat.tempId}
                      cat={cat}
                      index={existingCats.length + i}
                      onUpdate={handleUpdateNewCat}
                      onRemove={handleRemoveNewCat}
                      onPhotoUploadReady={(tempId, upload) => {
                        setCatPhotoUploads((prev) => {
                          const next = new Map(prev)
                          next.set(tempId, upload)
                          return next
                        })
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="border-border/60 bg-card hover:bg-muted hover:text-foreground gap-2 rounded-xl"
                onClick={handleAddNewCat}
              >
                <Plus className="h-4 w-4" />
                Cadastrar novo gato
              </Button>
            </div>

            {totalCats < 2 && (
              <p className="text-destructive text-xs">
                Adicione pelo menos 2 gatos para criar o grupo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="bg-background/90 border-border/40 sticky bottom-0 z-10 -mx-4 border-t px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
          <Button
            type="submit"
            className="shadow-primary-glow hover:shadow-primary-glow-hover w-full rounded-xl transition-all duration-200 sm:w-auto"
            disabled={isPending || isAnyUploading || totalCats < 2}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === 'create' ? 'Criando grupo...' : 'Salvando...'}
              </>
            ) : mode === 'create' ? (
              'Criar Grupo'
            ) : (
              'Salvar Alterações'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

function NewCatCardWrapper({
  cat,
  index,
  onUpdate,
  onRemove,
  onPhotoUploadReady,
}: {
  cat: NewCatEntry
  index: number
  onUpdate: (tempId: string, data: Partial<NewCatEntry>) => void
  onRemove: (tempId: string) => void
  onPhotoUploadReady: (
    tempId: string,
    upload: ReturnType<typeof usePhotoUpload>
  ) => void
}) {
  const photoUpload = usePhotoUpload()

  useEffect(() => {
    onPhotoUploadReady(cat.tempId, photoUpload)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <NewCatCard
      cat={cat}
      index={index}
      onUpdate={onUpdate}
      onRemove={onRemove}
      photoUpload={photoUpload}
    />
  )
}
