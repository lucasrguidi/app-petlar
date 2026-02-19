import { z } from 'zod'

export type ApplicationFieldType =
  | 'text'
  | 'textarea'
  | 'boolean'
  | 'select'
  | 'media'
  | 'date'

export interface ApplicationFieldCondition {
  fieldId: string
  operator: 'equals'
  value: string | boolean
}

export interface ApplicationFormField {
  id: string
  type: ApplicationFieldType
  label: string
  required: boolean
  helpText: string | null
  options: string[] | null
  condition: ApplicationFieldCondition | null
  mediaConfig: { kind: 'image' | 'video' } | null
}

export type ApplicationResponseValue = string | boolean | null

export interface ApplicationFormFileInput {
  fieldId: string
  url: string
  fileType: 'image' | 'video'
}

export interface ApplicationFormValues {
  applicantName: string
  applicantEmail: string
  applicantWhatsapp: string
  responses: Record<string, ApplicationResponseValue>
  files: ApplicationFormFileInput[]
  lgpdConsent: boolean
  whatsappConsent: boolean
}

const SHARE_DATA_CONSENT_ERROR =
  'Você precisa autorizar o compartilhamento de dados para enviar a candidatura.'
const WHATSAPP_CONSENT_ERROR =
  'Você precisa autorizar o contato via WhatsApp para enviar a candidatura.'

const phoneDigitsRegex = /\D/g

export const defaultApplicationFormValues: ApplicationFormValues = {
  applicantName: '',
  applicantEmail: '',
  applicantWhatsapp: '',
  responses: {},
  files: [],
  lgpdConsent: false,
  whatsappConsent: false,
}

export function hasResponseValue(
  value: ApplicationResponseValue | undefined
): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value !== null && value !== undefined
}

export function isFieldVisible(
  field: ApplicationFormField,
  values: Record<string, ApplicationResponseValue>
): boolean {
  if (!field.condition) return true

  const parentValue = values[field.condition.fieldId]
  if (parentValue === undefined || parentValue === null || parentValue === '') {
    return false
  }

  return parentValue === field.condition.value
}

export function getValidOptions(
  options: string[] | null | undefined
): string[] {
  if (!options || options.length === 0) return []

  const unique = new Set<string>()
  for (const option of options) {
    const normalized = option.trim()
    if (normalized) {
      unique.add(normalized)
    }
  }

  return Array.from(unique)
}

export function createInitialResponses(
  fields: ApplicationFormField[]
): Record<string, ApplicationResponseValue> {
  return fields.reduce<Record<string, ApplicationResponseValue>>(
    (acc, field) => {
      acc[field.id] = null
      return acc
    },
    {}
  )
}

export function createApplicationFormSchema(fields: ApplicationFormField[]) {
  return z
    .object({
      applicantName: z
        .string()
        .trim()
        .min(1, 'Nome completo é obrigatório')
        .max(200, 'Nome muito longo'),
      applicantEmail: z.string().trim().email('E-mail inválido'),
      applicantWhatsapp: z
        .string()
        .trim()
        .min(1, 'WhatsApp é obrigatório')
        .refine((value) => {
          const digits = value.replace(phoneDigitsRegex, '')
          return digits.length >= 10 && digits.length <= 11
        }, 'WhatsApp inválido'),
      responses: z.record(
        z.string(),
        z.union([z.string(), z.boolean(), z.null()])
      ),
      files: z.array(
        z.object({
          fieldId: z.string().min(1),
          url: z.string().url(),
          fileType: z.enum(['image', 'video']),
        })
      ),
      lgpdConsent: z
        .boolean()
        .refine((value) => value, SHARE_DATA_CONSENT_ERROR),
      whatsappConsent: z
        .boolean()
        .refine((value) => value, WHATSAPP_CONSENT_ERROR),
    })
    .superRefine((values, ctx) => {
      const visibleFields = fields.filter((field) =>
        isFieldVisible(field, values.responses)
      )

      for (const field of visibleFields) {
        const response = values.responses[field.id]
        const hasValue = hasResponseValue(response)

        if (field.required && !hasValue) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['responses', field.id],
            message: `${field.label} é obrigatório`,
          })
          continue
        }

        if (!hasValue) {
          continue
        }

        if (field.type === 'boolean' && typeof response !== 'boolean') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['responses', field.id],
            message: 'Selecione Sim ou Não',
          })
          continue
        }

        if (field.type !== 'boolean' && typeof response !== 'string') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['responses', field.id],
            message: 'Resposta inválida',
          })
          continue
        }

        if (field.type === 'date' && typeof response === 'string') {
          const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(response)
          if (!isIsoDate) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['responses', field.id],
              message: 'Data inválida',
            })
          }
        }

        if (field.type === 'select' && typeof response === 'string') {
          const validOptions = getValidOptions(field.options)
          if (validOptions.length > 0 && !validOptions.includes(response)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['responses', field.id],
              message: 'Opção inválida',
            })
          }
        }

        if (field.type === 'media' && typeof response === 'string') {
          const uploadedFile = values.files.find(
            (file) => file.fieldId === field.id && file.url === response
          )

          if (!uploadedFile) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['responses', field.id],
              message: 'Finalize o upload antes de enviar a candidatura',
            })
            continue
          }

          const expectedFileType = field.mediaConfig?.kind
          if (expectedFileType && uploadedFile.fileType !== expectedFileType) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['responses', field.id],
              message: 'Tipo de arquivo incompatível com este campo',
            })
          }
        }
      }
    })
}

export function sanitizeApplicationFormPayload(
  values: ApplicationFormValues,
  fields: ApplicationFormField[]
) {
  const visibleFieldIds = new Set(
    fields
      .filter((field) => isFieldVisible(field, values.responses))
      .map((field) => field.id)
  )

  const responses: Record<string, ApplicationResponseValue> = {}

  for (const field of fields) {
    if (!visibleFieldIds.has(field.id)) {
      continue
    }

    const rawValue = values.responses[field.id]

    if (typeof rawValue === 'string') {
      const normalized = rawValue.trim()
      responses[field.id] = normalized.length > 0 ? normalized : null
      continue
    }

    responses[field.id] = rawValue ?? null
  }

  const files = values.files.filter((file) => {
    if (!visibleFieldIds.has(file.fieldId)) {
      return false
    }

    const responseValue = responses[file.fieldId]
    return typeof responseValue === 'string' && responseValue.length > 0
  })

  return {
    applicantName: values.applicantName.trim(),
    applicantEmail: values.applicantEmail.trim(),
    applicantWhatsapp: values.applicantWhatsapp.trim(),
    responses,
    files,
    lgpdConsent: values.lgpdConsent,
    whatsappConsent: values.whatsappConsent,
  }
}
