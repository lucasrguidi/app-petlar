'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'

interface PublicCatsPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PublicCatsPagination({
  page,
  totalPages,
  onPageChange,
}: PublicCatsPaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = []

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (page > 3) {
        pages.push('ellipsis-start')
      }

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis-end')
      }

      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-2xl px-4 py-3',
        'bg-white/70 backdrop-blur-sm',
        'border border-white/50',
        'shadow-sm'
      )}
    >
      {/* Previous button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(
          'flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-all',
          page === 1
            ? 'cursor-not-allowed text-[#8B5A2B]/30'
            : 'text-[#783201] hover:bg-[#AEC7E2]/40 hover:text-[#E35915]'
        )}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Page numbers - desktop */}
      <div className="hidden items-center gap-1 sm:flex">
        {getPageNumbers().map((pageNum) =>
          typeof pageNum === 'string' ? (
            <span
              key={pageNum}
              className="flex h-10 w-10 items-center justify-center text-[#8B5A2B]/40"
            >
              ...
            </span>
          ) : (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-all',
                pageNum === page
                  ? 'bg-gradient-to-r from-[#E35915] to-[#F07B3D] text-white shadow-lg shadow-[#E35915]/25'
                  : 'text-[#783201] hover:bg-[#AEC7E2]/40 hover:text-[#E35915]'
              )}
              aria-label={`Página ${pageNum}`}
              aria-current={pageNum === page ? 'page' : undefined}
            >
              {pageNum}
            </button>
          )
        )}
      </div>

      {/* Page indicator - mobile */}
      <div className="flex items-center gap-2 sm:hidden">
        <span className="text-sm font-medium text-[#783201]">
          {page} de {totalPages}
        </span>
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(
          'flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-all',
          page === totalPages
            ? 'cursor-not-allowed text-[#8B5A2B]/30'
            : 'text-[#783201] hover:bg-[#AEC7E2]/40 hover:text-[#E35915]'
        )}
        aria-label="Próxima página"
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
