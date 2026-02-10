import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CatFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <Skeleton className="h-9 w-20" />

      {/* Basic Info Card */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="col-span-2 space-y-2 sm:col-span-1">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Card */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-16" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Description Card */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Photos Card */}
      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-14" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Skeleton className="h-10 w-36" />
    </div>
  )
}
