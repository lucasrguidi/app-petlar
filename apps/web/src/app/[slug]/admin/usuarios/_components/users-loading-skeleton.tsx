'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

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
          <div className="border-border/40 flex gap-4 border-b px-4 py-3">
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
            <Skeleton className="h-4 w-1/6 rounded" />
            <Skeleton className="h-4 w-1/6 rounded" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="border-border/20 flex items-center gap-4 border-b px-4 py-3 last:border-0"
            >
              <div className="flex flex-1 items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-40 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
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
