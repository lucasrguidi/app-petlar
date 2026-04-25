import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function SponsorsLoadingSkeleton() {
  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
      <CardContent className="divide-border/40 divide-y p-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-9 w-9 rounded-xl" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
