'use client'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface AdoptionsPaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function AdoptionsPagination({
  page,
  totalPages,
  onPageChange,
}: AdoptionsPaginationProps) {
  if (totalPages <= 1) return null

  // Generate page numbers
  const getPageNumbers = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = []

    if (totalPages <= 5) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      if (page > 3) {
        pages.push('ellipsis-start')
      }

      // Show pages around current
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (page < totalPages - 2) {
        pages.push('ellipsis-end')
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="py-2">
      {/* Mobile: simplified */}
      <div className="flex items-center justify-between gap-4 sm:hidden">
        <PaginationPrevious
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
        />
        <span className="text-muted-foreground text-sm">
          {page} de {totalPages}
        </span>
        <PaginationNext
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
        />
      </div>

      {/* Desktop: full pagination */}
      <Pagination className="hidden sm:flex">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            />
          </PaginationItem>

          {getPageNumbers().map((pageNum) =>
            typeof pageNum === 'string' ? (
              <PaginationItem key={pageNum}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  isActive={pageNum === page}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
