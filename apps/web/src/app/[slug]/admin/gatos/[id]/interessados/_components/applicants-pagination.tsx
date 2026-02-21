'use client'

import { BasePagination } from '@/components/base-pagination'

interface ApplicantsPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ApplicantsPagination(props: ApplicantsPaginationProps) {
  return <BasePagination {...props} />
}
