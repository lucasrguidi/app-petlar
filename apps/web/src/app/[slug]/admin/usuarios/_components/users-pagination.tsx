'use client'

import { BasePagination } from '@/components/base-pagination'

interface UsersPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function UsersPagination(props: UsersPaginationProps) {
  return <BasePagination {...props} />
}
