import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Custom Domain Card Skeleton */}
      <Card className="border-border/60 shadow-warm-sm rounded-xl">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
              <Skeleton className="h-10 w-24 rounded-lg" />
            </div>
            <div className="flex items-start gap-1.5">
              <Skeleton className="mt-0.5 h-4 w-4 shrink-0 rounded" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Picker Card Skeleton */}
      <Card className="border-border/60 shadow-warm-sm rounded-xl">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset themes label */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            {/* Preset theme buttons - responsive grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-transparent p-3"
                >
                  <div className="flex gap-1">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>

          {/* Color pickers - 8 pickers in 2 rows */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-36" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
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

      {/* Preview Card Skeleton */}
      <Card className="border-border/60 shadow-warm-sm rounded-xl">
        <CardHeader className="space-y-1.5">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          {/* Preview content - matches ThemePreview component structure */}
          <div className="overflow-hidden rounded-xl border">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* Content */}
            <div className="space-y-4 p-4">
              {/* Search bar */}
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>

              {/* Cat cards - 2 column grid */}
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border">
                    {/* Cat image placeholder */}
                    <Skeleton className="h-20 w-full rounded-none" />
                    <div className="space-y-2 p-2">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12" />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
