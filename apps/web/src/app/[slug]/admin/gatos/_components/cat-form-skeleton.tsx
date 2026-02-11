import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function CatFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-20" />

      <Card className="rounded-xl">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-14" />
            <Skeleton className="h-4 w-10" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
            <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
            <Skeleton className="h-24 w-24 shrink-0 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
            <Skeleton className="h-9 w-48" />
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardHeader className="pb-4">
            <Skeleton className="h-6 w-16" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-8 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="pb-4">
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-start sm:justify-end">
        <Skeleton className="h-10 w-full sm:w-40" />
      </div>
    </div>
  )
}
