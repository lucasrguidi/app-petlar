'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface UsersPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function UsersPagination({
  page,
  totalPages,
  onPageChange,
}: UsersPaginationProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 rounded-lg"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </Button>

      <span className="text-muted-foreground text-sm">
        {page} de {totalPages || 1}
      </span>

      <Button
        variant="ghost"
        size="sm"
        className="gap-1 rounded-lg"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <span className="hidden sm:inline">Próximo</span>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
