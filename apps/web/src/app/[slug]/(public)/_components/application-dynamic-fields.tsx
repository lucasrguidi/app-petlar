'use client'

import {
  Calendar,
  FileQuestion,
  List,
  MessageSquare,
  ToggleLeft,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import {
  useFormState,
  useWatch,
  type FieldErrors,
  type UseFormReturn,
} from 'react-hook-form'

import {
  getValidOptions,
  hasResponseValue,
  isFieldVisible,
  type ApplicationFormField,
  type ApplicationFormFileInput,
  type ApplicationFormValues,
  type ApplicationResponseValue,
} from './application-form-schema'
import { ApplicationMediaUpload } from './application-media-upload'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ApplicationDynamicFieldsProps {
  fields: ApplicationFormField[]
  form: UseFormReturn<ApplicationFormValues>
  disabled?: boolean
  showValidation?: boolean
}

const baseInputClassName = cn(
  'h-12 rounded-xl',
  'border border-muted',
  'bg-white/90 backdrop-blur-sm',
  'text-foreground placeholder:text-muted-foreground/45',
  'transition-all duration-200',
  'focus-visible:border-primary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20'
)

const emptySelectValue = '__empty__'

function getFieldIcon(type: ApplicationFormField['type']) {
  switch (type) {
    case 'text':
      return MessageSquare
    case 'textarea':
      return FileQuestion
    case 'date':
      return Calendar
    case 'boolean':
      return ToggleLeft
    case 'select':
      return List
    default:
      return FileQuestion
  }
}

function getResponseErrorMessage(
  errors: FieldErrors<ApplicationFormValues>,
  fieldId: string
): string | null {
  const responseErrors = errors.responses as
    | Record<string, { message?: string }>
    | undefined

  const rawMessage = responseErrors?.[fieldId]?.message
  if (typeof rawMessage !== 'string' || rawMessage.length === 0) {
    return null
  }

  return rawMessage
}

function upsertFileByFieldId(
  files: ApplicationFormFileInput[],
  nextFile: ApplicationFormFileInput
) {
  const existingIndex = files.findIndex(
    (file) => file.fieldId === nextFile.fieldId
  )
  if (existingIndex === -1) {
    return [...files, nextFile]
  }

  const updatedFiles = [...files]
  updatedFiles[existingIndex] = nextFile
  return updatedFiles
}

export function ApplicationDynamicFields({
  fields,
  form,
  disabled = false,
  showValidation = false,
}: ApplicationDynamicFieldsProps) {
  const responses = useWatch({
    control: form.control,
    name: 'responses',
  })

  // Subscribe to errors reactively - this ensures re-renders when validation errors change
  const { errors } = useFormState({ control: form.control })

  const responseValues = useMemo(() => responses ?? {}, [responses])

  const visibleFields = useMemo(() => {
    return fields.filter((field) => isFieldVisible(field, responseValues))
  }, [fields, responseValues])

  useEffect(() => {
    const visibleIds = new Set(visibleFields.map((field) => field.id))

    const currentResponses = form.getValues('responses')
    const nextResponses = { ...currentResponses }
    let responsesChanged = false

    for (const field of fields) {
      if (visibleIds.has(field.id)) {
        continue
      }

      if (hasResponseValue(currentResponses[field.id])) {
        nextResponses[field.id] = null
        responsesChanged = true
      }
    }

    if (responsesChanged) {
      form.setValue('responses', nextResponses, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }

    const currentFiles = form.getValues('files')
    const filteredFiles = currentFiles.filter((file) =>
      visibleIds.has(file.fieldId)
    )
    if (filteredFiles.length !== currentFiles.length) {
      form.setValue('files', filteredFiles, {
        shouldDirty: true,
        shouldValidate: true,
      })
    }
  }, [fields, form, visibleFields])

  const setResponseValue = (
    fieldId: string,
    value: ApplicationResponseValue,
    options?: {
      shouldValidate?: boolean
      shouldTouch?: boolean
    }
  ) => {
    const currentResponses = form.getValues('responses')

    // Clear error for this specific field before setting new value
    form.clearErrors(`responses.${fieldId}`)

    form.setValue(
      'responses',
      {
        ...currentResponses,
        [fieldId]: value,
      },
      {
        shouldDirty: true,
        shouldTouch: options?.shouldTouch ?? true,
        shouldValidate: false, // Don't validate here, we'll trigger it explicitly
      }
    )

    // Trigger full form validation to run superRefine and update error states
    if (options?.shouldValidate !== false) {
      void form.trigger()
    }
  }

  const setFileValue = (
    nextFile: ApplicationFormFileInput,
    options?: { shouldValidate?: boolean }
  ) => {
    const currentFiles = form.getValues('files')
    const nextFiles = upsertFileByFieldId(currentFiles, nextFile)

    form.setValue('files', nextFiles, {
      shouldDirty: true,
      shouldValidate: options?.shouldValidate ?? true,
    })
  }

  const removeFileValue = (fieldId: string) => {
    const currentFiles = form.getValues('files')
    const filteredFiles = currentFiles.filter(
      (file) => file.fieldId !== fieldId
    )

    form.setValue('files', filteredFiles, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-5">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-muted/30 to-muted/10',
            'ring-1 ring-muted/40'
          )}
        >
          <FileQuestion className="h-5 w-5 text-foreground/70" />
        </div>
        <div>
          <h4
            className="text-base font-semibold text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Perguntas da ONG
          </h4>
          <p className="text-sm text-muted-foreground/70">
            {visibleFields.length}{' '}
            {visibleFields.length === 1 ? 'pergunta' : 'perguntas'} para
            responder
          </p>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {visibleFields.map((field, index) => {
          const responseValue = responseValues[field.id]
          const fieldError = getResponseErrorMessage(errors, field.id)
          const shouldShowError = Boolean(fieldError) && showValidation
          const FieldIcon = getFieldIcon(field.type)

          return (
            <div
              key={field.id}
              className={cn(
                'relative overflow-hidden rounded-2xl',
                'bg-gradient-to-br from-white to-background',
                'border border-muted/40',
                'shadow-sm transition-all duration-200',
                'hover:border-muted/60 hover:shadow-md',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Required indicator bar */}
              {field.required && (
                <div
                  className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-primary to-accent"
                  aria-hidden="true"
                />
              )}

              <div className="p-4 pl-5">
                {/* Question header */}
                <div className="mb-3 flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      'bg-muted/30 text-muted-foreground'
                    )}
                  >
                    <FieldIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground/70">
                        Pergunta {index + 1}
                      </span>
                      {field.required && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Obrigatória
                        </span>
                      )}
                    </div>
                    <label className="mt-1 block text-sm font-medium text-foreground">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-primary">*</span>
                      )}
                    </label>
                    {field.helpText && (
                      <p className="mt-0.5 text-xs text-muted-foreground/65">
                        {field.helpText}
                      </p>
                    )}
                  </div>
                </div>

                {/* Field input */}
                <div className="mt-3">
                  {field.type === 'text' && (
                    <Input
                      value={
                        typeof responseValue === 'string' ? responseValue : ''
                      }
                      onChange={(event) =>
                        setResponseValue(field.id, event.target.value)
                      }
                      placeholder="Digite sua resposta"
                      className={cn(
                        baseInputClassName,
                        shouldShowError && 'border-red-300'
                      )}
                      disabled={disabled}
                    />
                  )}

                  {field.type === 'textarea' && (
                    <Textarea
                      value={
                        typeof responseValue === 'string' ? responseValue : ''
                      }
                      onChange={(event) =>
                        setResponseValue(field.id, event.target.value)
                      }
                      placeholder="Digite sua resposta"
                      className={cn(
                        'min-h-24 resize-y rounded-xl',
                        'border border-muted',
                        'bg-white/90 backdrop-blur-sm',
                        'text-foreground placeholder:text-muted-foreground/45',
                        'transition-all duration-200',
                        'focus-visible:border-primary focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/20',
                        shouldShowError && 'border-red-300'
                      )}
                      disabled={disabled}
                    />
                  )}

                  {field.type === 'date' && (
                    <Input
                      type="date"
                      value={
                        typeof responseValue === 'string' ? responseValue : ''
                      }
                      onChange={(event) =>
                        setResponseValue(field.id, event.target.value)
                      }
                      className={cn(
                        baseInputClassName,
                        shouldShowError && 'border-red-300'
                      )}
                      disabled={disabled}
                    />
                  )}

                  {field.type === 'boolean' && (
                    <Select
                      value={
                        typeof responseValue === 'boolean'
                          ? responseValue
                            ? 'yes'
                            : 'no'
                          : emptySelectValue
                      }
                      onValueChange={(nextValue) => {
                        if (nextValue === emptySelectValue) {
                          setResponseValue(field.id, null)
                          return
                        }
                        setResponseValue(field.id, nextValue === 'yes')
                      }}
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className={cn(
                          baseInputClassName,
                          shouldShowError && 'border-red-300'
                        )}
                      >
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-muted/40">
                        <SelectItem value={emptySelectValue}>
                          Selecione
                        </SelectItem>
                        <SelectItem value="yes">Sim</SelectItem>
                        <SelectItem value="no">Não</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {field.type === 'select' &&
                    (() => {
                      const options = getValidOptions(field.options)
                      if (options.length === 0) {
                        return (
                          <p className="text-sm text-muted-foreground/65">
                            Esta pergunta ainda não possui opções disponíveis.
                          </p>
                        )
                      }

                      return (
                        <Select
                          value={
                            typeof responseValue === 'string' &&
                            responseValue.length > 0
                              ? responseValue
                              : emptySelectValue
                          }
                          onValueChange={(nextValue) => {
                            setResponseValue(
                              field.id,
                              nextValue === emptySelectValue ? null : nextValue
                            )
                          }}
                          disabled={disabled}
                        >
                          <SelectTrigger
                            className={cn(
                              baseInputClassName,
                              shouldShowError && 'border-red-300'
                            )}
                          >
                            <SelectValue placeholder="Selecione uma opção" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-muted/40">
                            <SelectItem value={emptySelectValue}>
                              Selecione
                            </SelectItem>
                            {options.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    })()}

                  {field.type === 'media' && (
                    <ApplicationMediaUpload
                      fieldId={field.id}
                      label={field.label}
                      kind={field.mediaConfig?.kind ?? 'image'}
                      value={
                        typeof responseValue === 'string' ? responseValue : null
                      }
                      disabled={disabled}
                      onUploaded={({ fieldId, url, fileType }) => {
                        setResponseValue(fieldId, url, {
                          shouldValidate: false,
                          shouldTouch: true,
                        })
                        setFileValue(
                          {
                            fieldId,
                            url,
                            fileType,
                          },
                          {
                            shouldValidate: false,
                          }
                        )
                        form.clearErrors(`responses.${fieldId}`)
                        void form.trigger(`responses.${fieldId}`)
                      }}
                      onClear={(fieldId) => {
                        setResponseValue(fieldId, null)
                        removeFileValue(fieldId)
                      }}
                    />
                  )}

                  {shouldShowError && fieldError && (
                    <p className="animate-fade-in mt-2 text-sm font-medium text-red-600">
                      {fieldError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
