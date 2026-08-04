import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SettingsLoadingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Domain Card Skeleton */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-44" />
            </div>
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 space-y-2 rounded-lg border p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-80" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </CardContent>
        </Card>

        {/* Location Card Skeleton */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-28" />
            </div>
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-40 rounded-lg" />
            </div>
          </CardContent>
        </Card>

        {/* Theme Card Skeleton */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="border-border/60 flex flex-col items-center gap-2.5 rounded-xl border-2 p-3"
                  >
                    <div className="flex items-center gap-0.5">
                      <Skeleton className="h-7 w-7 rounded-l-lg" />
                      <Skeleton className="h-7 w-7" />
                      <Skeleton className="h-7 w-7 rounded-r-lg" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>

            {/* Color pickers */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-36" />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Skeleton className="h-10 w-28 rounded-lg" />
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Preview */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="space-y-1 pb-3">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>

              {/* Content */}
              <div className="space-y-3 p-3">
                <div className="flex items-center gap-1.5 rounded-md border px-2 py-1.5">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 w-16" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="overflow-hidden rounded-lg border">
                      <Skeleton className="h-14 w-full rounded-none" />
                      <div className="space-y-1 p-1.5">
                        <Skeleton className="h-3 w-10" />
                        <Skeleton className="h-2 w-8" />
                        <div className="flex items-center justify-between pt-1">
                          <Skeleton className="h-4 w-12 rounded-full" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
