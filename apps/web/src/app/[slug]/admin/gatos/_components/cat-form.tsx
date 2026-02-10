'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { type Route } from 'next'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { usePhotoUpload } from '../_hooks/use-photo-upload'

import {
  catFormSchema,
  defaultCatFormValues,
  type CatFormData,
} from './cat-form-schema'
import { PhotoUpload } from './photo-upload/photo-upload'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
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

export function CatForm({ mode, initialData, catId }: CatFormProps) {
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
  } = usePhotoUpload({
    initialPhotos: initialData?.photos,
  })

  const createMutation = useMutation(
    trpc.cats.create.mutationOptions({
      onSuccess: () => {
        toast.success('Gato cadastrado com sucesso!')
        router.push(`/${slug}/admin/gatos` as Route)
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

  const watchVaccinated = form.watch('vaccinated')
  const watchDewormed = form.watch('dewormed')

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
          {/* Basic Info */}
          <Card className="rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do gato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="ageYears"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anos</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={30}
                          placeholder="0"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            field.onChange(val === '' ? null : Number(val))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ageMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meses</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={11}
                          placeholder="0"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value
                            field.onChange(val === '' ? null : Number(val))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem className="col-span-2 sm:col-span-1">
                      <FormLabel>Sexo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Macho</SelectItem>
                          <SelectItem value="female">Fêmea</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Health */}
          <Card className="rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Saúde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fiv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FIV</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="negative">Negativo</SelectItem>
                          <SelectItem value="positive">Positivo</SelectItem>
                          <SelectItem value="not_tested">Não testado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="felv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>FeLV</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="negative">Negativo</SelectItem>
                          <SelectItem value="positive">Positivo</SelectItem>
                          <SelectItem value="not_tested">Não testado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="castrated"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Castrado</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="vaccinated"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Vacinado</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchVaccinated && (
                  <FormField
                    control={form.control}
                    name="vaccinationNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas sobre vacinação</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: V4, antirrábica..."
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
                )}
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="dewormed"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Vermifugado</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {watchDewormed && (
                  <FormField
                    control={form.control}
                    name="dewormingNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas sobre vermifugação</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Data da última dose..."
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
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Descrição</CardTitle>
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
                        placeholder="Conte sobre a personalidade, comportamento e história do gato..."
                        className="min-h-32 resize-y"
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

          {/* Photos */}
          <Card className="rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <PhotoUpload
                photos={photos}
                isUploading={isUploading}
                onFilesSelected={handleFilesSelected}
                onRemove={handleRemove}
                onReorder={handleReorder}
              />
            </CardContent>
          </Card>

          {/* Submit */}
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
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
