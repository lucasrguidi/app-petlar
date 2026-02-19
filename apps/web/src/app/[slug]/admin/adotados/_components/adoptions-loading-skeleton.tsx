import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function AdoptionsLoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Filter bar skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border p-2.5 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-full rounded-xl sm:w-[130px]" />
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-10 w-full rounded-xl sm:w-[130px]" />
          </div>
        </div>
      </div>

      {/* Stats summary skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-muted/50 w-10 px-1.5">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="bg-muted/50">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="bg-muted/50">
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden sm:table-cell">
                <Skeleton className="h-3 w-10" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden md:table-cell">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="bg-muted/50 w-12 px-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-10 px-1.5">
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-14 sm:hidden" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-8 w-14 rounded-lg" />
                </TableCell>
                <TableCell className="w-12 px-1">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-4 py-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
