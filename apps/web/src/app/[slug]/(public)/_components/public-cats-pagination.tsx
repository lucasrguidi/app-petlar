'use client'

import { BasePagination } from '@/components/base-pagination'

interface PublicCatsPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PublicCatsPagination(props: PublicCatsPaginationProps) {
  return <BasePagination {...props} variant="public" />
}
