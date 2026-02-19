import { Skeleton } from '@/components/ui/skeleton'

function FormsCardsSkeleton() {
  return (
    <>
      {/* Results count skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border px-3 py-2">
        <Skeleton className="h-5 w-44" />
      </div>

      {/* Form cards skeleton */}
      <div className="min-h-0 flex-1 space-y-3 overflow-auto">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border p-4"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-2 w-2 rounded-full" />
                </div>
                <Skeleton className="h-4 w-36" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              </div>

              {/* Actions */}
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export function FormsListSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <FormsCardsSkeleton />
    </div>
  )
}

export function FormsLoadingSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Filter bar skeleton */}
      <div className="border-border/60 bg-card/95 shadow-warm-sm shrink-0 rounded-xl border p-2.5 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Skeleton className="h-10 w-full rounded-xl sm:w-[180px]" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>

      <FormsCardsSkeleton />
    </div>
  )
}
