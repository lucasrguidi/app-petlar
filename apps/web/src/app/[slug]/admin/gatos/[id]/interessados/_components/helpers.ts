import type {
  ApplicantsFilters,
  ApplicationStatus,
  DynamicFilterInput,
  DynamicFilterOperator,
  FilterableField,
} from './types'

const VALID_STATUSES: ApplicationStatus[] = [
  'pending',
  'reviewing',
  'approved',
  'rejected',
  'permanently_rejected',
]

const VALID_OPERATORS: DynamicFilterOperator[] = [
  'contains',
  'equals',
  'before',
  'after',
]

function isValidOperator(value: unknown): value is DynamicFilterOperator {
  return (
    typeof value === 'string' && (VALID_OPERATORS as string[]).includes(value)
  )
}

function isValidStatus(value: unknown): value is ApplicationStatus {
  return (
    typeof value === 'string' && (VALID_STATUSES as string[]).includes(value)
  )
}

function isFilterValueValid(value: unknown): value is string | boolean {
  return typeof value === 'string' || typeof value === 'boolean'
}

export function parseDynamicFilters(
  raw: string | undefined
): DynamicFilterInput[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is DynamicFilterInput => {
        if (!item || typeof item !== 'object') return false

        const fieldId = (item as { fieldId?: unknown }).fieldId
        const operator = (item as { operator?: unknown }).operator
        const value = (item as { value?: unknown }).value

        return (
          typeof fieldId === 'string' &&
          fieldId.length > 0 &&
          isValidOperator(operator) &&
          isFilterValueValid(value)
        )
      })
      .slice(0, 30)
  } catch {
    return []
  }
}

export function serializeDynamicFilters(filters: DynamicFilterInput[]): string {
  return JSON.stringify(filters)
}

export function parseApplicantsFilters(searchParams: {
  status?: string
  search?: string
  page?: string
  dynamicFilters?: string
}): ApplicantsFilters {
  const pageRaw = Number.parseInt(searchParams.page ?? '1', 10)

  return {
    status: isValidStatus(searchParams.status)
      ? searchParams.status
      : undefined,
    search: searchParams.search?.trim() || undefined,
    page: Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1,
    dynamicFilters: parseDynamicFilters(searchParams.dynamicFilters),
  }
}

export function getOperatorLabel(operator: DynamicFilterOperator): string {
  if (operator === 'contains') return 'Contém'
  if (operator === 'equals') return 'É igual a'
  if (operator === 'before') return 'Até'
  return 'A partir de'
}

export function getStatusLabel(status: ApplicationStatus): string {
  if (status === 'pending') return 'Pendente'
  if (status === 'reviewing') return 'Em análise'
  if (status === 'approved') return 'Aprovado'
  if (status === 'rejected') return 'Recusado'
  return 'Rejeição permanente'
}

export function getDynamicFilterSummary(
  filter: DynamicFilterInput,
  fields: FilterableField[]
): string {
  const field = fields.find((item) => item.id === filter.fieldId)
  const fieldLabel = field?.label ?? 'Campo'

  const valueLabel =
    typeof filter.value === 'boolean'
      ? filter.value
        ? 'Sim'
        : 'Não'
      : filter.value

  return `${fieldLabel}: ${getOperatorLabel(filter.operator)} ${valueLabel}`
}

export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(date)
}

export function formatRelativeTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  if (diffMs < 0) return 'agora'

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `há ${minutes}min`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`

  const days = Math.floor(hours / 24)
  if (days === 1) return 'há 1 dia'
  if (days < 30) return `há ${days} dias`

  const months = Math.floor(days / 30)
  if (months === 1) return 'há 1 mês'
  if (months < 12) return `há ${months} meses`

  const years = Math.floor(months / 12)
  if (years === 1) return 'há 1 ano'
  return `há ${years} anos`
}

export function toWhatsappLink(value: string): string {
  const digits = value.replace(/\D/g, '')
  return `https://wa.me/${digits}`
}
