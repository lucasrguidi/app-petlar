'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
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
import {
  HealthToggle,
  SexToggle,
  TestResultToggle,
} from './form-fields'
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

  const form = useForm<CatFormData>({
    resolver: zodResolver(catFormSchema),
    defaultValues: {
      ...defaultCatFormValues,
      ...initialData,
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
        toast.success('Alteracoes salvas com sucesso!')
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
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[name="name"]')?.focus()
    }, 100)
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
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* PHOTOS - Full width at top */}
          <Card className="rounded-xl">
            <CardContent className="pt-6">
              <PhotoSection
                photos={photos}
                isUploading={isUploading}
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemove}
                onReorder={handleReorder}
              />
            </CardContent>
          </Card>

          {/* TWO COLUMN LAYOUT */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* LEFT COLUMN - Basic Info */}
            <Card className="rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Informacoes Basicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do gato"
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Age - inline years/months */}
                <div className="space-y-2">
                  <Label>Idade</Label>
                  <div className="flex gap-3">
                    <FormField
                      control={form.control}
                      name="ageYears"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={30}
                                placeholder="0"
                                className="h-11 pr-12"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  field.onChange(val === '' ? null : Number(val))
                                }}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
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
                        <FormItem className="flex-1">
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min={0}
                                max={11}
                                placeholder="0"
                                className="h-11 pr-14"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value
                                  field.onChange(val === '' ? null : Number(val))
                                }}
                              />
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                meses
                              </span>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Sex */}
                <SexToggle control={form.control} />
              </CardContent>
            </Card>

            {/* RIGHT COLUMN - Health */}
            <Card className="rounded-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Saude</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* FIV/FeLV - inline toggle groups */}
                <div className="grid gap-4 sm:grid-cols-2">
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

                {/* Health toggles - compact */}
                <div className="space-y-4 pt-2">
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
                    notesPlaceholder="Ex: V4, antirrabica..."
                  />
                  <HealthToggle
                    control={form.control}
                    name="dewormed"
                    label="Vermifugado"
                    notesName="dewormingNotes"
                    notesPlaceholder="Ex: Data da ultima dose..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DESCRIPTION - Full width, shorter */}
          <Card className="rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Descricao</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sobre o gato (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conte sobre a personalidade, comportamento e historia do gato..."
                        className="min-h-24 resize-y"
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

          {/* SUBMIT */}
          <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-background via-background to-transparent px-4 pb-4 pt-6 sm:static sm:mx-0 sm:bg-none sm:p-0">
            <Button
              type="submit"
              className="w-full rounded-lg sm:w-auto"
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
                'Salvar Alteracoes'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
