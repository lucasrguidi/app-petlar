'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function UsersLoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Filter bar skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      {/* Counter skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm flex shrink-0 items-center justify-between rounded-xl border px-3 py-2">
        <Skeleton className="h-5 w-40 rounded" />
      </div>

      {/* Table skeleton */}
      <Card className="border-border/60 bg-card/95 shadow-warm-sm min-h-0 flex-1 overflow-hidden rounded-xl border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-muted/50">
                  <Skeleton className="h-3 w-16 rounded" />
                </TableHead>
                <TableHead className="bg-muted/50 hidden sm:table-cell">
                  <Skeleton className="h-3 w-12 rounded" />
                </TableHead>
                <TableHead className="bg-muted/50 hidden md:table-cell">
                  <Skeleton className="h-3 w-20 rounded" />
                </TableHead>
                <TableHead className="bg-muted/50 w-12 px-1" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex min-w-0 items-center gap-3">
                      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-28 rounded" />
                        <Skeleton className="h-3 w-40 max-w-full rounded" />
                        <div className="flex items-center gap-1.5 sm:hidden">
                          <Skeleton className="h-4 w-20 rounded-full" />
                          <Skeleton className="h-3 w-10 rounded" />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-4 w-16 rounded" />
                  </TableCell>
                  <TableCell className="w-12 px-1">
                    <div className="flex justify-end">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-3 py-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
