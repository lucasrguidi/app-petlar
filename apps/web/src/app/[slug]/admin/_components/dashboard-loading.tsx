'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="space-y-6 pb-4">
        {/* Header */}
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card
              key={i}
              className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart + Top Cats Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Chart */}
          <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-7 w-32 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </CardContent>
          </Card>

          {/* Top Cats */}
          <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-4 w-5" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-4 w-20 flex-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg p-2.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-48 flex-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
