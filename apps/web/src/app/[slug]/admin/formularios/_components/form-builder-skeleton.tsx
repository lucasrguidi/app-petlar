import { Skeleton } from '@/components/ui/skeleton'

export function FormBuilderSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 pb-2">
      {/* Form data card */}
      <div className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm">
        <div className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.1fr]">
        {/* Questions card */}
        <div className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm">
          <div className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </div>
          <div className="space-y-2 p-4 pt-0 sm:p-5 sm:pt-0">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <Skeleton className="h-4 w-48" />
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-20 rounded-md" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                    <Skeleton className="h-7 w-7 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Config card */}
        <div className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm">
          <div className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Preview card */}
      <div className="rounded-xl border border-border/60 bg-card/95 shadow-warm-sm">
        <div className="space-y-1 p-4 pb-2 sm:p-5 sm:pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-3 p-4 pt-0 sm:p-5 sm:pt-0">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
    </div>
  )
}
