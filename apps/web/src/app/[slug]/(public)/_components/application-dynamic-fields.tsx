'use client'

import { useEffect, useMemo } from 'react'
import { useWatch, type FieldErrors, type UseFormReturn } from 'react-hook-form'

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

interface ApplicationDynamicFieldsProps {
  fields: ApplicationFormField[]
  form: UseFormReturn<ApplicationFormValues>
  disabled?: boolean
}

const inputClassName =
  'h-12 rounded-xl border-[#AEC7E2]/50 bg-white/80 text-[#783201] placeholder:text-[#8B5A2B]/50 focus-visible:border-[#E35915]/30 focus-visible:ring-[#E35915]/20'
const emptySelectValue = '__empty__'

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

function isResponseTouched(
  touchedResponses: Record<string, unknown> | undefined,
  fieldId: string
): boolean {
  const touched = touchedResponses?.[fieldId]
  if (touched === true) return true
  if (typeof touched === 'object' && touched !== null) return true
  return false
}

function upsertFileByFieldId(
  files: ApplicationFormFileInput[],
  nextFile: ApplicationFormFileInput
) {
  const existingIndex = files.findIndex((file) => file.fieldId === nextFile.fieldId)
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
}: ApplicationDynamicFieldsProps) {
  const responses = useWatch({
    control: form.control,
    name: 'responses',
  })

  const responseValues = useMemo(() => responses ?? {}, [responses])

  const visibleFields = useMemo(() => {
    return fields.filter((field) => isFieldVisible(field, responseValues))
  }, [fields, responseValues])

  const touchedResponses = form.formState.touchedFields.responses as
    | Record<string, unknown>
    | undefined

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
    const filteredFiles = currentFiles.filter((file) => visibleIds.has(file.fieldId))
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

    form.setValue(
      'responses',
      {
        ...currentResponses,
        [fieldId]: value,
      },
      {
        shouldDirty: true,
        shouldTouch: options?.shouldTouch ?? true,
        shouldValidate: options?.shouldValidate ?? true,
      }
    )
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
    const filteredFiles = currentFiles.filter((file) => file.fieldId !== fieldId)

    form.setValue('files', filteredFiles, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  if (fields.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-base font-semibold text-[#783201]">
          Perguntas da ONG
        </h4>
        <p className="text-sm text-[#8B5A2B]/70">
          Responda com atenção para ajudar na avaliação da candidatura.
        </p>
      </div>

      {visibleFields.map((field) => {
        const responseValue = responseValues[field.id]
        const fieldError = getResponseErrorMessage(form.formState.errors, field.id)
        const shouldShowError = Boolean(fieldError) &&
          (form.formState.submitCount > 0 || isResponseTouched(touchedResponses, field.id))

        return (
          <div
            key={field.id}
            className="space-y-1.5 rounded-xl border border-[#AEC7E2]/30 bg-white/65 p-3.5"
          >
            <label className="text-sm font-medium text-[#783201]">
              {field.label}
              {field.required && <span className="text-red-600"> *</span>}
            </label>

            {field.helpText && (
              <p className="text-xs text-[#8B5A2B]/70">{field.helpText}</p>
            )}

            {field.type === 'text' && (
              <Input
                value={typeof responseValue === 'string' ? responseValue : ''}
                onChange={(event) =>
                  setResponseValue(field.id, event.target.value)
                }
                placeholder="Digite sua resposta"
                className={inputClassName}
                disabled={disabled}
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                value={typeof responseValue === 'string' ? responseValue : ''}
                onChange={(event) =>
                  setResponseValue(field.id, event.target.value)
                }
                placeholder="Digite sua resposta"
                className="min-h-24 resize-y rounded-xl border-[#AEC7E2]/50 bg-white/80 text-[#783201] placeholder:text-[#8B5A2B]/50 focus-visible:border-[#E35915]/30 focus-visible:ring-[#E35915]/20"
                disabled={disabled}
              />
            )}

            {field.type === 'date' && (
              <Input
                type="date"
                value={typeof responseValue === 'string' ? responseValue : ''}
                onChange={(event) =>
                  setResponseValue(field.id, event.target.value)
                }
                className={inputClassName}
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
                <SelectTrigger className={inputClassName}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={emptySelectValue}>Selecione</SelectItem>
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
                    <p className="text-sm text-[#8B5A2B]/65">
                      Esta pergunta ainda não possui opções disponíveis.
                    </p>
                  )
                }

                return (
                  <Select
                    value={
                      typeof responseValue === 'string' && responseValue.length > 0
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
                    <SelectTrigger className={inputClassName}>
                      <SelectValue placeholder="Selecione uma opção" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value={emptySelectValue}>Selecione</SelectItem>
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
                value={typeof responseValue === 'string' ? responseValue : null}
                disabled={disabled}
                onUploaded={({ fieldId, url, fileType }) => {
                  setResponseValue(fieldId, url, {
                    shouldValidate: false,
                    shouldTouch: true,
                  })
                  setFileValue({
                    fieldId,
                    url,
                    fileType,
                  }, {
                    shouldValidate: false,
                  })
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
              <p className="text-sm font-medium text-red-600">{fieldError}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
