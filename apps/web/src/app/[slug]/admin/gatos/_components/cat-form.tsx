'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  FileText,
  HeartPulse,
  Loader2,
  PawPrint,
} from 'lucide-react'
import { type Route } from 'next'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { usePhotoUpload } from '../_hooks/use-photo-upload'

import {
  catFormSchema,
  defaultCatFormValues,
  type CatFormData,
} from './cat-form-schema'
import { CatFormSuccess } from './cat-form-success'
import { HealthToggle, SexToggle, TestResultToggle } from './form-fields'
import { PhotoSection } from './photo-upload/photo-section'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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
import { useOrgSlug } from '@/hooks/use-org-slug'
import { trpc } from '@/utils/trpc'

interface Photo {
  id: string
  url: string
  order: number
}

interface CatFormProps {
  mode: 'create' | 'edit'
  initialData?: Partial<CatFormData> & { photos?: Photo[] }
  catId?: string
}

type FormState = 'editing' | 'success'

export function CatForm({ mode, initialData, catId }: CatFormProps) {
  const [formState, setFormState] = useState<FormState>('editing')
  const slug = useOrgSlug()
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEditMode = mode === 'edit'

  const normalizedInitialData: Partial<CatFormData> | undefined = initialData
    ? {
        ...initialData,
        formId: initialData.formId ?? defaultCatFormValues.formId,
      }
    : undefined

  const form = useForm<CatFormData>({
    resolver: zodResolver(catFormSchema),
    defaultValues: {
      ...defaultCatFormValues,
      ...normalizedInitialData,
    },
  })

  const {
    photos,
    isUploading,
    handleFilesSelected,
    handleRemove,
    handleReorder,
    getPhotosForSubmit,
    resetPhotos,
  } = usePhotoUpload({
    initialPhotos: initialData?.photos,
  })

  const { data: formOptions, isLoading: isLoadingFormOptions } = useQuery(
    trpc.forms.options.queryOptions()
  )

  const createMutation = useMutation(
    trpc.cats.create.mutationOptions({
      onSuccess: () => {
        toast.success('Gato cadastrado com sucesso!')
        queryClient.invalidateQueries({ queryKey: [['cats']] })
        setFormState('success')
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao cadastrar gato')
      },
    })
  )

  const updateMutation = useMutation(
    trpc.cats.update.mutationOptions({
      onSuccess: () => {
        toast.success('Alterações salvas com sucesso!')
        queryClient.invalidateQueries({ queryKey: [['cats']] })
        router.push(`/${slug}/admin/gatos` as Route)
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao atualizar gato')
      },
    })
  )

  const isPending = createMutation.isPending || updateMutation.isPending

  const onSubmit = (data: CatFormData) => {
    const photosForSubmit = getPhotosForSubmit()

    if (mode === 'create') {
      createMutation.mutate({
        cat: data,
        photos: photosForSubmit,
      })
    } else if (catId) {
      updateMutation.mutate({
        id: catId,
        cat: data,
        photos: photosForSubmit,
      })
    }
  }

  const handleRegisterAnother = () => {
    form.reset(defaultCatFormValues)
    resetPhotos()
    setFormState('editing')
    requestAnimationFrame(() => {
      form.setFocus('name')
    })
  }

  const handleGoToList = () => {
    router.push(`/${slug}/admin/gatos` as Route)
  }

  // Show success screen after create
  if (formState === 'success') {
    return (
      <CatFormSuccess
        onRegisterAnother={handleRegisterAnother}
        onGoToList={handleGoToList}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <Button
        variant="outline"
        size="sm"
        className="border-border/60 bg-card/80 shadow-warm-sm hover:bg-sidebar-accent gap-2 rounded-xl"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
            <CardContent className="p-4 sm:p-5">
              <PhotoSection
                photos={photos}
                isUploading={isUploading}
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemove}
                onReorder={handleReorder}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
            <div className="space-y-4">
              <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
                <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
                  <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
                    <PawPrint className="text-primary h-4 w-4" />
                    Informações básicas
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    Dados essenciais para identificação
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nome do gato"
                            className="h-10"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-1.5">
                    <Label>Idade</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="ageYears"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  max={30}
                                  placeholder="0"
                                  className="h-10 pr-11"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    field.onChange(
                                      val === '' ? null : Number(val)
                                    )
                                  }}
                                />
                                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                                  anos
                                </span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="ageMonths"
                        render={({ field }) => (
                          <FormItem className="space-y-0">
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={0}
                                  max={11}
                                  placeholder="0"
                                  className="h-10 pr-12"
                                  {...field}
                                  value={field.value ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    field.onChange(
                                      val === '' ? null : Number(val)
                                    )
                                  }}
                                />
                                <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
                                  meses
                                </span>
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="formId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Formulário de candidatura</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isLoadingFormOptions || isEditMode}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-lg">
                              <SelectValue placeholder="Escolha um formulário" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {formOptions?.map((option) => {
                              const isCurrent = option.id === field.value
                              return (
                                <SelectItem
                                  key={option.id}
                                  value={option.id}
                                  disabled={!option.active && !isCurrent}
                                >
                                  {option.name}
                                  {!option.active ? ' (inativo)' : ''}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                        <p className="text-muted-foreground text-xs">
                          {isEditMode
                            ? 'Após criar o gato, o formulário não pode ser alterado para manter consistência das candidaturas.'
                            : 'Esse formulário é obrigatório e será usado quando alguém clicar em "Quero adotar".'}
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <SexToggle control={form.control} />
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
                <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
                  <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
                    <FileText className="text-primary h-4 w-4" />
                    Descrição
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    Resumo rápido para a equipe de adoção
                  </p>
                </CardHeader>
                <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel>Sobre o gato (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Personalidade, comportamento e histórico..."
                            className="min-h-20 resize-y"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value || null)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
              <CardHeader className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
                <CardTitle className="text-display flex items-center gap-2 text-base font-semibold">
                  <HeartPulse className="text-primary h-4 w-4" />
                  Saúde
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Testes e cuidados essenciais
                </p>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TestResultToggle
                    control={form.control}
                    name="fiv"
                    label="FIV"
                  />
                  <TestResultToggle
                    control={form.control}
                    name="felv"
                    label="FeLV"
                  />
                </div>

                <div className="space-y-2">
                  <HealthToggle
                    control={form.control}
                    name="castrated"
                    label="Castrado"
                  />
                  <HealthToggle
                    control={form.control}
                    name="vaccinated"
                    label="Vacinado"
                    notesName="vaccinationNotes"
                    notesPlaceholder="Ex.: V4, antirrábica e reforços..."
                  />
                  <HealthToggle
                    control={form.control}
                    name="dewormed"
                    label="Vermifugado"
                    notesName="dewormingNotes"
                    notesPlaceholder="Ex.: Data da última dose e produto..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-background/90 border-border/40 sticky bottom-0 z-10 -mx-4 border-t px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
            <Button
              type="submit"
              className="shadow-primary-glow hover:shadow-primary-glow-hover w-full rounded-xl transition-all duration-200 sm:w-auto"
              disabled={isPending || isUploading}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Cadastrando...' : 'Salvando...'}
                </>
              ) : mode === 'create' ? (
                'Cadastrar Gato'
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
