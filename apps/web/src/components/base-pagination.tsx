'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { cn } from '@/lib/utils'

export interface BasePaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  variant?: 'admin' | 'public'
  className?: string
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end'

function getPageNumbers(page: number, totalPages: number): PageItem[] {
  const pages: PageItem[] = []

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
    return pages
  }

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

  return pages
}

function AdminPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: Omit<BasePaginationProps, 'variant'>) {
  return (
    <div className={cn('py-2', className)}>
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

          {getPageNumbers(page, totalPages).map((pageNum) =>
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

function PublicPagination({
  page,
  totalPages,
  onPageChange,
  className,
}: Omit<BasePaginationProps, 'variant'>) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 rounded-2xl px-4 py-3',
        'bg-white/70 backdrop-blur-sm',
        'border border-white/50',
        'shadow-sm',
        className
      )}
    >
      {/* Previous button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(
          'flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-all',
          page === 1
            ? 'text-muted-foreground/30 cursor-not-allowed'
            : 'text-foreground hover:bg-muted/40 hover:text-primary'
        )}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      {/* Page numbers - desktop */}
      <div className="hidden items-center gap-1 sm:flex">
        {getPageNumbers(page, totalPages).map((pageNum) =>
          typeof pageNum === 'string' ? (
            <span
              key={pageNum}
              className="text-muted-foreground/40 flex h-10 w-10 items-center justify-center"
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
                  ? 'from-primary to-accent shadow-primary/25 bg-gradient-to-r text-white shadow-lg'
                  : 'text-foreground hover:bg-muted/40 hover:text-primary'
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
        <span className="text-foreground text-sm font-medium">
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
            ? 'text-muted-foreground/30 cursor-not-allowed'
            : 'text-foreground hover:bg-muted/40 hover:text-primary'
        )}
        aria-label="Próxima página"
      >
        <span className="hidden sm:inline">Próxima</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export function BasePagination({
  page,
  totalPages,
  onPageChange,
  variant = 'admin',
  className,
}: BasePaginationProps) {
  if (totalPages <= 1) return null

  if (variant === 'public') {
    return (
      <PublicPagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        className={className}
      />
    )
  }

  return (
    <AdminPagination
      page={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
      className={className}
    />
  )
}
