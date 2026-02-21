'use client'

import { BasePagination } from '@/components/base-pagination'

interface AdoptionsPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdoptionsPagination(props: AdoptionsPaginationProps) {
  return <BasePagination {...props} />
}
