import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function CatsLoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Results count skeleton */}
      <Skeleton className="mb-2 h-5 w-32 shrink-0" />

      {/* Table skeleton - flex-1 with internal scroll */}
      <div className="bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Expand */}
              <TableHead className="bg-muted/50 w-8 px-1">
                <Skeleton className="h-3 w-3" />
              </TableHead>
              {/* Cat */}
              <TableHead className="bg-muted/50">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              {/* Age */}
              <TableHead className="bg-muted/50 hidden w-16 sm:table-cell">
                <Skeleton className="h-3 w-10" />
              </TableHead>
              {/* Sex */}
              <TableHead className="bg-muted/50 hidden w-16 md:table-cell">
                <Skeleton className="h-3 w-8" />
              </TableHead>
              {/* Interested */}
              <TableHead className="bg-muted/50 hidden w-12 lg:table-cell">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              {/* Status */}
              <TableHead className="bg-muted/50 hidden sm:table-cell">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              {/* Actions */}
              <TableHead className="bg-muted/50 sticky right-0 w-10 px-1">
                <span />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 15 }).map((_, i) => (
              <TableRow key={i}>
                {/* Expand button */}
                <TableCell className="w-8 px-1">
                  <Skeleton className="h-6 w-6 rounded" />
                </TableCell>
                {/* Cat (photo + name) */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 shrink-0 rounded" />
                    <div className="min-w-0 space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-20 sm:hidden" />
                    </div>
                  </div>
                </TableCell>
                {/* Age */}
                <TableCell className="hidden w-16 sm:table-cell">
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                {/* Sex */}
                <TableCell className="hidden w-16 md:table-cell">
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                {/* Interested */}
                <TableCell className="hidden w-12 text-center lg:table-cell">
                  <Skeleton className="mx-auto h-4 w-4" />
                </TableCell>
                {/* Status */}
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-4 w-16 rounded-full" />
                </TableCell>
                {/* Actions */}
                <TableCell className="sticky right-0 w-10 px-1">
                  <Skeleton className="h-6 w-6 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton - matches actual pagination layout */}
      <div className="shrink-0 py-4">
        {/* Mobile */}
        <div className="flex items-center justify-between gap-4 sm:hidden">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        {/* Desktop */}
        <div className="hidden justify-center gap-1 sm:flex">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
