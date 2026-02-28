import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function ProfileLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Personal Info Card Skeleton */}
      <Card className="border-border/60 shadow-warm-sm rounded-xl">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* Email field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          {/* Save button */}
          <div className="flex justify-end border-t pt-4">
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Security Card Skeleton */}
      <Card className="border-border/60 shadow-warm-sm rounded-xl">
        <CardHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password fields */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}

          {/* Change password button */}
          <div className="flex justify-end border-t pt-4">
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
