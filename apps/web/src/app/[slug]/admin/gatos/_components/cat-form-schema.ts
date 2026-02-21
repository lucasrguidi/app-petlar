import { z } from 'zod'

export const catFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  ageYears: z.number().int().min(0).max(30).nullable(),
  ageMonths: z.number().int().min(0).max(11).nullable(),
  sex: z.enum(['male', 'female']),
  fiv: z.enum(['positive', 'negative', 'not_tested']),
  felv: z.enum(['positive', 'negative', 'not_tested']),
  castrated: z.boolean(),
  vaccinated: z.boolean(),
  vaccinationNotes: z.string().nullable(),
  dewormed: z.boolean(),
  dewormingNotes: z.string().nullable(),
  description: z.string().nullable(),
  formId: z.string().min(1, 'Formulário é obrigatório'),
  donorName: z.string().nullable(),
  donorWhatsapp: z.string().nullable(),
})

export type CatFormData = z.infer<typeof catFormSchema>

export const defaultCatFormValues: CatFormData = {
  name: '',
  ageYears: null,
  ageMonths: null,
  sex: 'male',
  fiv: 'not_tested',
  felv: 'not_tested',
  castrated: false,
  vaccinated: false,
  vaccinationNotes: null,
  dewormed: false,
  dewormingNotes: null,
  description: null,
  formId: '',
  donorName: null,
  donorWhatsapp: null,
}
