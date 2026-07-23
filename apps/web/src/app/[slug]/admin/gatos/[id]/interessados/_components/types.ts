export type ApplicationStatus =
  | 'pending'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'permanently_rejected'
export type DynamicFilterOperator = 'contains' | 'equals' | 'before' | 'after'
export type FilterableFieldType = 'text' | 'select' | 'boolean' | 'date'

export interface DynamicFilterInput {
  fieldId: string
  operator: DynamicFilterOperator
  value: string | boolean
}

export interface ApplicantsFilters {
  status?: ApplicationStatus
  search?: string
  page: number
  dynamicFilters: DynamicFilterInput[]
}

export interface FilterableField {
  id: string
  label: string
  type: FilterableFieldType
  options: string[] | null
}

export interface ApplicantRow {
  id: string
  applicantName: string
  applicantWhatsapp: string
  status: ApplicationStatus
  createdAt: string | Date
}

export interface ApplicantsListData {
  cat: {
    id: string
    name: string
    status: 'available' | 'in_progress' | 'adopted'
    photoUrl: string | null
  }
  filterableFields: FilterableField[]
  applications: ApplicantRow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
