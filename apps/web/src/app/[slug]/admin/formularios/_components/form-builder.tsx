'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CircleHelp,
  Eye,
  FileText,
  Loader2,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { type Route } from 'next'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useIsCustomDomain } from '@/components/custom-domain-provider'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { buildOrgHref } from '@/lib/org-href'
import { trpc } from '@/utils/trpc'

type FieldType = 'text' | 'textarea' | 'boolean' | 'select' | 'media' | 'date'
type MediaKind = 'image' | 'video'

interface BuilderCondition {
  fieldId: string
  operator: 'equals'
  value: string | boolean
}

interface BuilderField {
  id: string
  type: FieldType
  label: string
  required: boolean
  helpText: string | null
  options: string[] | null
  mediaConfig: { kind: MediaKind } | null
  condition: BuilderCondition | null
  order: number
}

interface FormBuilderInitialData {
  name: string
  description: string | null
  active: boolean
  fields: BuilderField[]
  linkedCatsCount?: number
}

interface FormBuilderProps {
  mode: 'create' | 'edit'
  formId?: string
  initialData?: FormBuilderInitialData
}

interface TypeOption {
  type: FieldType
  title: string
  description: string
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: 'text',
    title: 'Texto curto',
    description: 'Para respostas rápidas, como bairro ou profissão',
  },
  {
    type: 'textarea',
    title: 'Texto longo',
    description: 'Para respostas detalhadas',
  },
  {
    type: 'boolean',
    title: 'Sim/Não',
    description: 'Perguntas com resposta direta',
  },
  {
    type: 'select',
    title: 'Múltipla escolha',
    description: 'Usuário escolhe uma opção da lista',
  },
  {
    type: 'media',
    title: 'Upload de arquivo',
    description: 'Envio de foto ou documento',
  },
  {
    type: 'date',
    title: 'Data',
    description: 'Seleção de uma data',
  },
]

const TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto curto',
  textarea: 'Texto longo',
  boolean: 'Sim/Não',
  select: 'Múltipla escolha',
  media: 'Upload',
  date: 'Data',
}

const MEDIA_LIMITS: Record<
  MediaKind,
  {
    maxSizeMb: number
    maxDurationSec?: number
    acceptText: string
    accept: string
  }
> = {
  image: {
    maxSizeMb: 5,
    acceptText: 'JPG, PNG ou WEBP',
    accept: 'image/jpeg,image/png,image/webp',
  },
  video: {
    maxSizeMb: 50,
    maxDurationSec: 30,
    acceptText: 'MP4, MOV ou WEBM',
    accept: 'video/mp4,video/quicktime,video/webm',
  },
}

function getMediaLimitMessage(kind: MediaKind): string {
  const limit = MEDIA_LIMITS[kind]
  if (kind === 'video') {
    return `Tipos: ${limit.acceptText}. Limite: ${limit.maxSizeMb}MB e até ${limit.maxDurationSec}s.`
  }

  return `Tipos: ${limit.acceptText}. Limite: ${limit.maxSizeMb}MB.`
}

function getDefaultQuestionTitle(type: FieldType): string {
  const base: Record<FieldType, string> = {
    text: 'Nova pergunta',
    textarea: 'Nova pergunta detalhada',
    boolean: 'Nova pergunta de Sim/Não',
    select: 'Nova pergunta de escolha',
    media: 'Novo pedido de arquivo',
    date: 'Nova pergunta de data',
  }
  return base[type]
}

function createDefaultField(type: FieldType, order: number): BuilderField {
  return {
    id: nanoid(),
    type,
    label: getDefaultQuestionTitle(type),
    required: false,
    helpText: null,
    options: type === 'select' ? ['Opção 1', 'Opção 2'] : null,
    mediaConfig: type === 'media' ? { kind: 'image' } : null,
    condition: null,
    order,
  }
}

function getValidOptions(options: string[] | null | undefined): string[] {
  if (!options || options.length === 0) {
    return []
  }

  const unique = new Set<string>()
  for (const option of options) {
    const normalized = option.trim()
    if (normalized) {
      unique.add(normalized)
    }
  }

  return Array.from(unique)
}

function normalizeFieldsOrder(fields: BuilderField[]): BuilderField[] {
  const reindexed = fields.map((field, index) => ({
    ...field,
    mediaConfig:
      field.type === 'media' ? (field.mediaConfig ?? { kind: 'image' }) : null,
    order: index + 1,
  }))

  return reindexed.map((field, index) => {
    if (!field.condition) return field

    const parentIndex = reindexed.findIndex(
      (candidate) => candidate.id === field.condition?.fieldId
    )

    if (parentIndex < 0 || parentIndex >= index) {
      return { ...field, condition: null }
    }

    const parent = reindexed[parentIndex]
    if (
      parent.type === 'select' &&
      (typeof field.condition.value !== 'string' ||
        !(parent.options ?? []).includes(field.condition.value))
    ) {
      return { ...field, condition: null }
    }

    if (
      parent.type === 'boolean' &&
      typeof field.condition.value !== 'boolean'
    ) {
      return { ...field, condition: null }
    }

    if (
      parent.type !== 'select' &&
      parent.type !== 'boolean' &&
      typeof field.condition.value !== 'string'
    ) {
      return { ...field, condition: null }
    }

    return field
  })
}

function isFieldVisible(
  field: BuilderField,
  values: Record<string, string | boolean>
): boolean {
  if (!field.condition) return true

  const parentValue = values[field.condition.fieldId]
  if (parentValue === undefined || parentValue === null || parentValue === '') {
    return false
  }

  return parentValue === field.condition.value
}

export function FormBuilder({ mode, formId, initialData }: FormBuilderProps) {
  const slug = useOrgSlug()
  const isCustomDomain = useIsCustomDomain()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [active, setActive] = useState(initialData?.active ?? true)
  const [fields, setFields] = useState<BuilderField[]>(
    initialData?.fields?.length ? normalizeFieldsOrder(initialData.fields) : []
  )
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    initialData?.fields?.[0]?.id ?? null
  )
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false)
  const [removingField, setRemovingField] = useState<BuilderField | null>(null)
  const [previewValues, setPreviewValues] = useState<
    Record<string, string | boolean>
  >({})

  const selectedField = useMemo(
    () => fields.find((field) => field.id === selectedFieldId) ?? null,
    [fields, selectedFieldId]
  )

  const selectedIndex = useMemo(
    () => fields.findIndex((field) => field.id === selectedFieldId),
    [fields, selectedFieldId]
  )

  const previousFields = useMemo(() => {
    if (selectedIndex <= 0) return []
    return fields.slice(0, selectedIndex).filter((field) => {
      if (field.type === 'media') return false
      if (field.type === 'select')
        return getValidOptions(field.options).length > 0
      return true
    })
  }, [fields, selectedIndex])

  const conditionParentField = useMemo(() => {
    if (!selectedField?.condition) return null
    return (
      fields.find((field) => field.id === selectedField.condition?.fieldId) ??
      null
    )
  }, [fields, selectedField])

  const createMutation = useMutation(
    trpc.forms.create.mutationOptions({
      onSuccess: (result) => {
        toast.success('Formulário criado com sucesso')
        queryClient.invalidateQueries({ queryKey: [['forms']] })
        router.push(buildOrgHref(`/admin/formularios/${result.id}`, slug, isCustomDomain) as Route)
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao criar formulário')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.forms.update.mutationOptions({
      onSuccess: () => {
        toast.success('Formulário salvo com sucesso')
        queryClient.invalidateQueries({ queryKey: [['forms']] })
        if (formId) {
          queryClient.invalidateQueries({
            queryKey: [
              ['forms', 'getById'],
              { input: { id: formId }, type: 'query' },
            ],
          })
        }
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao salvar formulário')
      },
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const addField = (type: FieldType) => {
    const nextField = createDefaultField(type, fields.length + 1)
    const nextFields = normalizeFieldsOrder([...fields, nextField])
    setFields(nextFields)
    setSelectedFieldId(nextField.id)
    setIsAddQuestionOpen(false)
  }

  const updateSelectedField = (
    updater: (field: BuilderField) => BuilderField
  ) => {
    if (!selectedFieldId) return
    setFields((current) =>
      normalizeFieldsOrder(
        current.map((field) =>
          field.id === selectedFieldId ? updater(field) : field
        )
      )
    )
  }

  const removeField = (fieldId: string) => {
    const target = fields.find((field) => field.id === fieldId)
    if (!target) return
    setRemovingField(target)
  }

  const confirmRemoveField = () => {
    if (!removingField) return

    const fieldId = removingField.id
    const next = normalizeFieldsOrder(
      fields
        .filter((field) => field.id !== fieldId)
        .map((field) =>
          field.condition?.fieldId === fieldId
            ? { ...field, condition: null }
            : field
        )
    )

    setFields(next)
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(next[0]?.id ?? null)
    }
    setRemovingField(null)
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex((field) => field.id === fieldId)
    if (currentIndex < 0) return

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= fields.length) return

    const next = [...fields]
    const [moved] = next.splice(currentIndex, 1)
    next.splice(targetIndex, 0, moved)
    setFields(normalizeFieldsOrder(next))
  }

  const saveForm = () => {
    if (!name.trim()) {
      toast.error('Informe o nome do formulário')
      return
    }

    if (fields.length === 0) {
      toast.error('Adicione pelo menos uma pergunta')
      return
    }

    const normalizedFields = normalizeFieldsOrder(fields).map(
      (field, index) => ({
        id: field.id,
        type: field.type,
        label: field.label.trim(),
        required: field.required,
        helpText: field.helpText?.trim() || null,
        options:
          field.type === 'select'
            ? (field.options ?? [])
                .map((option) => option.trim())
                .filter(Boolean)
            : null,
        mediaConfig:
          field.type === 'media'
            ? {
                kind: field.mediaConfig?.kind ?? 'image',
              }
            : null,
        condition: field.condition,
        order: index + 1,
      })
    )

    const payload = {
      form: {
        name: name.trim(),
        description: description.trim() || null,
        active,
      },
      fields: normalizedFields,
    }

    if (mode === 'create') {
      createMutation.mutate(payload)
      return
    }

    if (!formId) {
      toast.error('Formulário inválido')
      return
    }

    updateMutation.mutate({
      id: formId,
      ...payload,
    })
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-2">
      <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
        <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
          <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
            <FileText className="text-primary h-4 w-4" />
            Dados do formulário
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Use um nome simples para sua equipe reconhecer este modelo.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="form-name">Nome do formulário</Label>
              <Input
                id="form-name"
                className="h-10 rounded-lg"
                placeholder="Ex.: Gato de apartamento"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="form-description">Descrição (opcional)</Label>
              <Input
                id="form-description"
                className="h-10 rounded-lg"
                placeholder="Ex.: Perguntas para adoção em apartamento"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>

          <div className="border-border/60 flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Formulário ativo</p>
              <p className="text-muted-foreground text-xs">
                Formulários inativos não aparecem ao cadastrar gatos.
              </p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          {mode === 'edit' && (
            <div className="border-warning/30 bg-warning/10 flex items-start gap-2 rounded-lg border px-3 py-2.5">
              <AlertTriangle className="text-warning mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-xs text-[#783201]">
                Alterações feitas aqui serão aplicadas a todos os gatos
                vinculados que ainda não possuem candidaturas, além de valer
                para novos cadastros.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.1fr]">
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-display text-base font-semibold">
                  Perguntas
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Adicione e organize as perguntas do formulário.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-lg"
                onClick={() => setIsAddQuestionOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0 sm:p-5 sm:pt-0">
            {fields.length === 0 ? (
              <div className="border-border/60 bg-muted/20 rounded-lg border px-4 py-6 text-center">
                <p className="text-sm font-medium">Nenhuma pergunta ainda</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Clique em "Adicionar" para começar.
                </p>
              </div>
            ) : (
              fields.map((field, index) => {
                const isSelected = field.id === selectedFieldId
                return (
                  <div
                    key={field.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedFieldId(field.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedFieldId(field.id)
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 hover:border-border hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium">
                          {index + 1}. {field.label}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <Badge
                            variant="secondary"
                            className="rounded-md text-[10px]"
                          >
                            {TYPE_LABELS[field.type]}
                          </Badge>
                          {field.required && (
                            <Badge
                              variant="secondary"
                              className="rounded-md text-[10px]"
                            >
                              Obrigatória
                            </Badge>
                          )}
                          {field.condition && (
                            <Badge
                              variant="info"
                              className="rounded-md text-[10px]"
                            >
                              Condicional
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md"
                          onClick={(event) => {
                            event.stopPropagation()
                            moveField(field.id, 'up')
                          }}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md"
                          onClick={(event) => {
                            event.stopPropagation()
                            moveField(field.id, 'down')
                          }}
                          disabled={index === fields.length - 1}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive h-7 w-7 rounded-md"
                          onClick={(event) => {
                            event.stopPropagation()
                            removeField(field.id)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
            <CardTitle className="text-display text-base font-semibold">
              Configurar pergunta
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Selecione uma pergunta à esquerda para editar.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
            {!selectedField ? (
              <div className="border-border/60 bg-muted/20 rounded-lg border px-4 py-6 text-center">
                <p className="text-sm font-medium">
                  Selecione uma pergunta para continuar
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="question-title">Título da pergunta</Label>
                  <Input
                    id="question-title"
                    className="h-10 rounded-lg"
                    value={selectedField.label}
                    onChange={(event) =>
                      updateSelectedField((field) => ({
                        ...field,
                        label: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="border-border/60 flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Obrigatória</p>
                    <p className="text-muted-foreground text-xs">
                      O candidato precisa responder esta pergunta.
                    </p>
                  </div>
                  <Switch
                    checked={selectedField.required}
                    onCheckedChange={(checked) =>
                      updateSelectedField((field) => ({
                        ...field,
                        required: checked,
                      }))
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="question-help">
                    Texto de ajuda (opcional)
                  </Label>
                  <Textarea
                    id="question-help"
                    className="min-h-20 resize-y rounded-lg"
                    placeholder="Ex.: Explique com detalhes, se necessário"
                    value={selectedField.helpText ?? ''}
                    onChange={(event) =>
                      updateSelectedField((field) => ({
                        ...field,
                        helpText: event.target.value || null,
                      }))
                    }
                  />
                </div>

                {selectedField.type === 'select' && (
                  <div className="space-y-2">
                    <Label>Opções</Label>
                    <div className="border-border/60 space-y-2 rounded-lg border p-3">
                      {(selectedField.options ?? []).map(
                        (option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-2"
                          >
                            <Input
                              className="h-9 rounded-lg"
                              value={option}
                              onChange={(event) =>
                                updateSelectedField((field) => {
                                  const nextOptions = [...(field.options ?? [])]
                                  nextOptions[optionIndex] = event.target.value
                                  return {
                                    ...field,
                                    options: nextOptions,
                                  }
                                })
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-lg"
                              onClick={() =>
                                updateSelectedField((field) => {
                                  const nextOptions = [...(field.options ?? [])]
                                  nextOptions.splice(optionIndex, 1)
                                  return {
                                    ...field,
                                    options: nextOptions.length
                                      ? nextOptions
                                      : ['Nova opção'],
                                  }
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-lg"
                        onClick={() =>
                          updateSelectedField((field) => ({
                            ...field,
                            options: [
                              ...(field.options ?? []),
                              `Nova opção ${(field.options?.length ?? 0) + 1}`,
                            ],
                          }))
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar opção
                      </Button>
                    </div>
                  </div>
                )}

                {selectedField.type === 'media' && (
                  <div className="border-border/60 space-y-2 rounded-lg border p-3">
                    <div className="flex items-center gap-1.5">
                      <Label className="text-sm">Tipo de arquivo</Label>
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground inline-flex h-5 w-5 items-center justify-center rounded-full"
                              aria-label="Ver limites de upload"
                            >
                              <CircleHelp className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            {getMediaLimitMessage(
                              selectedField.mediaConfig?.kind ?? 'image'
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <Select
                      value={selectedField.mediaConfig?.kind ?? 'image'}
                      onValueChange={(value: MediaKind) =>
                        updateSelectedField((field) => ({
                          ...field,
                          mediaConfig: { kind: value },
                        }))
                      }
                    >
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Foto</SelectItem>
                        <SelectItem value="video">Vídeo curto</SelectItem>
                      </SelectContent>
                    </Select>

                    <p className="text-muted-foreground text-xs">
                      {getMediaLimitMessage(
                        selectedField.mediaConfig?.kind ?? 'image'
                      )}
                    </p>
                  </div>
                )}

                <div className="border-border/60 space-y-2 rounded-lg border p-3">
                  <p className="text-sm font-medium">
                    Mostrar esta pergunta se...
                  </p>
                  {previousFields.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      Não há perguntas anteriores para criar uma condição.
                    </p>
                  ) : (
                    <div className="grid gap-2 md:grid-cols-3">
                      <Select
                        value={selectedField.condition?.fieldId ?? 'none'}
                        onValueChange={(value) => {
                          if (value === 'none') {
                            updateSelectedField((field) => ({
                              ...field,
                              condition: null,
                            }))
                            return
                          }

                          const parent = previousFields.find(
                            (field) => field.id === value
                          )
                          if (!parent) return

                          const parentOptions =
                            parent.type === 'select'
                              ? getValidOptions(parent.options)
                              : []
                          const initialValue =
                            parent.type === 'boolean'
                              ? false
                              : parent.type === 'select'
                                ? (parentOptions[0] ?? 'Opção')
                                : ''

                          updateSelectedField((field) => ({
                            ...field,
                            condition: {
                              fieldId: value,
                              operator: 'equals',
                              value: initialValue,
                            },
                          }))
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-lg">
                          <SelectValue placeholder="Escolher pergunta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sempre mostrar</SelectItem>
                          {previousFields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        value="é igual a"
                        className="h-10 rounded-lg"
                        disabled
                        readOnly
                      />

                      {!selectedField.condition || !conditionParentField ? (
                        <Input
                          value=""
                          className="h-10 rounded-lg"
                          placeholder="Valor"
                          disabled
                          readOnly
                        />
                      ) : conditionParentField.type === 'boolean' ? (
                        <Select
                          value={
                            selectedField.condition.value === true
                              ? 'yes'
                              : 'no'
                          }
                          onValueChange={(value) =>
                            updateSelectedField((field) => ({
                              ...field,
                              condition: field.condition
                                ? {
                                    ...field.condition,
                                    value: value === 'yes',
                                  }
                                : null,
                            }))
                          }
                        >
                          <SelectTrigger className="h-10 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Sim</SelectItem>
                            <SelectItem value="no">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : conditionParentField.type === 'select' ? (
                        <Select
                          value={String(selectedField.condition.value)}
                          onValueChange={(value) =>
                            updateSelectedField((field) => ({
                              ...field,
                              condition: field.condition
                                ? {
                                    ...field.condition,
                                    value,
                                  }
                                : null,
                            }))
                          }
                        >
                          <SelectTrigger className="h-10 rounded-lg">
                            <SelectValue placeholder="Escolher valor" />
                          </SelectTrigger>
                          <SelectContent>
                            {getValidOptions(conditionParentField.options).map(
                              (option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          className="h-10 rounded-lg"
                          placeholder="Valor"
                          value={String(selectedField.condition.value)}
                          onChange={(event) =>
                            updateSelectedField((field) => ({
                              ...field,
                              condition: field.condition
                                ? {
                                    ...field.condition,
                                    value: event.target.value,
                                  }
                                : null,
                            }))
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
        <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
          <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
            <Eye className="text-primary h-4 w-4" />
            Preview do candidato
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            Veja como o formulário aparecerá para quem deseja adotar.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
          {fields.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Adicione perguntas para visualizar o preview.
            </p>
          ) : (
            normalizeFieldsOrder(fields)
              .filter((field) => isFieldVisible(field, previewValues))
              .map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    {field.label}
                    {field.required && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  {field.helpText && (
                    <p className="text-muted-foreground text-xs">
                      {field.helpText}
                    </p>
                  )}

                  {field.type === 'textarea' && (
                    <Textarea
                      className="min-h-20 resize-y rounded-lg"
                      placeholder="Digite sua resposta"
                      value={String(previewValues[field.id] ?? '')}
                      onChange={(event) =>
                        setPreviewValues((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                    />
                  )}

                  {field.type === 'text' && (
                    <Input
                      className="h-10 rounded-lg"
                      placeholder="Digite sua resposta"
                      value={String(previewValues[field.id] ?? '')}
                      onChange={(event) =>
                        setPreviewValues((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                    />
                  )}

                  {field.type === 'date' && (
                    <Input
                      type="date"
                      className="h-10 rounded-lg"
                      value={String(previewValues[field.id] ?? '')}
                      onChange={(event) =>
                        setPreviewValues((current) => ({
                          ...current,
                          [field.id]: event.target.value,
                        }))
                      }
                    />
                  )}

                  {field.type === 'boolean' && (
                    <Select
                      value={
                        previewValues[field.id] === undefined
                          ? 'none'
                          : previewValues[field.id] === true
                            ? 'yes'
                            : 'no'
                      }
                      onValueChange={(value) =>
                        setPreviewValues((current) => {
                          const next = { ...current }
                          if (value === 'none') {
                            delete next[field.id]
                            return next
                          }
                          next[field.id] = value === 'yes'
                          return next
                        })
                      }
                    >
                      <SelectTrigger className="h-10 rounded-lg">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Selecione</SelectItem>
                        <SelectItem value="yes">Sim</SelectItem>
                        <SelectItem value="no">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === 'select' &&
                    (() => {
                      const validOptions = getValidOptions(field.options)
                      if (validOptions.length === 0) {
                        return (
                          <p className="text-muted-foreground text-xs">
                            Adicione opções para visualizar esta pergunta.
                          </p>
                        )
                      }

                      return (
                        <Select
                          value={String(previewValues[field.id] ?? '')}
                          onValueChange={(value) =>
                            setPreviewValues((current) => ({
                              ...current,
                              [field.id]: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-10 rounded-lg">
                            <SelectValue placeholder="Selecione uma opção" />
                          </SelectTrigger>
                          <SelectContent>
                            {validOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    })()}

                  {field.type === 'media' && (
                    <div className="space-y-1.5">
                      <Input
                        type="file"
                        accept={
                          MEDIA_LIMITS[field.mediaConfig?.kind ?? 'image']
                            .accept
                        }
                        className="h-10 rounded-lg"
                        onChange={(event) =>
                          setPreviewValues((current) => ({
                            ...current,
                            [field.id]: event.target.files?.[0]?.name ?? '',
                          }))
                        }
                      />
                      <p className="text-muted-foreground text-xs">
                        {getMediaLimitMessage(
                          field.mediaConfig?.kind ?? 'image'
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ))
          )}
        </CardContent>
      </Card>

      <div className="bg-background/90 border-border/40 sticky bottom-0 z-10 -mx-4 border-t px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        <Button
          type="button"
          className="shadow-primary-glow hover:shadow-primary-glow-hover w-full rounded-xl transition-all duration-200 sm:w-auto"
          disabled={isPending}
          onClick={saveForm}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : mode === 'create' ? (
            'Criar formulário'
          ) : (
            'Salvar alterações'
          )}
        </Button>
      </div>

      <Sheet open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Adicionar pergunta</SheetTitle>
            <SheetDescription>
              Escolha o tipo que melhor representa a resposta esperada.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => addField(option.type)}
                className="border-border/60 hover:border-border hover:bg-muted/30 w-full rounded-lg border px-3 py-2.5 text-left transition-all duration-200"
              >
                <p className="text-sm font-medium">{option.title}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!removingField}
        onOpenChange={(open) => {
          if (!open) setRemovingField(null)
        }}
        variant="destructive"
        icon={TriangleAlert}
        title="Remover pergunta"
        description={`Tem certeza que deseja remover a pergunta "${removingField?.label}"? Perguntas condicionadas a esta também perderão a condição.`}
        cancelLabel="Cancelar"
        actionLabel="Remover"
        onAction={confirmRemoveField}
      />
    </div>
  )
}
