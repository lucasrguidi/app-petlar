import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function CandidaturasLoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center gap-2 rounded-xl border p-2.5 sm:p-3">
        <Skeleton className="h-10 w-full rounded-xl sm:w-[190px]" />
        <Skeleton className="hidden h-10 flex-1 rounded-xl sm:block" />
      </div>

      <div className="border-border/60 bg-card/95 shadow-warm-sm flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-muted/50">
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden w-40 sm:table-cell">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden w-36 md:table-cell">
                <Skeleton className="h-3 w-14" />
              </TableHead>
              <TableHead className="bg-muted/50 w-[176px] sm:w-44">
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead className="bg-muted/50 hidden w-40 lg:table-cell">
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="bg-muted/50 w-20 sm:w-28">
                <Skeleton className="ml-auto h-3 w-12" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 15 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24 sm:hidden" />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Skeleton className="h-8 w-28 rounded-xl" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-[172px] rounded-lg" />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="ml-auto h-8 w-14 rounded-lg sm:w-24" />
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
