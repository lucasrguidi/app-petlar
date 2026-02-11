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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="border-border/60 bg-card/95 shadow-warm-sm flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-muted/50 w-8 px-1">
                <Skeleton className="h-3 w-3" />
              </TableHead>
              <TableHead className="bg-muted/50">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden w-16 sm:table-cell">
                <Skeleton className="h-3 w-10" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden w-16 md:table-cell">
                <Skeleton className="h-3 w-8" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden w-12 lg:table-cell">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden sm:table-cell">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="bg-muted/50 sticky right-0 w-10 px-1">
                <span />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 15 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="w-8 px-1">
                  <Skeleton className="h-6 w-6 rounded" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 shrink-0 rounded" />
                    <div className="min-w-0 space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-20 sm:hidden" />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden w-16 sm:table-cell">
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell className="hidden w-16 md:table-cell">
                  <Skeleton className="h-4 w-10" />
                </TableCell>
                <TableCell className="hidden w-12 text-center lg:table-cell">
                  <Skeleton className="mx-auto h-4 w-4" />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Skeleton className="h-4 w-16 rounded-full" />
                </TableCell>
                <TableCell className="sticky right-0 w-10 px-1">
                  <Skeleton className="h-6 w-6 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-2 py-2">
        <div className="flex items-center justify-between gap-4 sm:hidden">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
        <div className="hidden justify-center gap-1 sm:flex">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
