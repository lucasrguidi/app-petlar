'use client'

import { BasePagination } from '@/components/base-pagination'

interface CatsPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function CatsPagination(props: CatsPaginationProps) {
  return <BasePagination {...props} />
}
