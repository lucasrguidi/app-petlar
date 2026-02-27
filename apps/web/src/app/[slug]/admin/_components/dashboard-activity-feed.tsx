'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Cat, FileText, PartyPopper } from 'lucide-react'
import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type ActivityType = 'adoption' | 'application' | 'new_cat'

interface Activity {
  type: ActivityType
  message: string
  catName: string
  catPhotoUrl: string | null
  timestamp: Date | string
}

interface DashboardActivityFeedProps {
  activities: Activity[]
}

const activityConfig: Record<
  ActivityType,
  { icon: typeof PartyPopper; bgColor: string; iconColor: string }
> = {
  adoption: {
    icon: PartyPopper,
    bgColor: 'bg-success/15',
    iconColor: 'text-success',
  },
  application: {
    icon: FileText,
    bgColor: 'bg-info/15',
    iconColor: 'text-info',
  },
  new_cat: {
    icon: Cat,
    bgColor: 'bg-primary/15',
    iconColor: 'text-primary',
  },
}

export function DashboardActivityFeed({
  activities,
}: DashboardActivityFeedProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-muted/50 mb-2 flex h-10 w-10 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground h-5 w-5" />
            </div>
            <p className="text-muted-foreground text-sm">
              Nenhuma atividade recente
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity, index) => {
              const config = activityConfig[activity.type]
              const Icon = config.icon
              const timestamp =
                typeof activity.timestamp === 'string'
                  ? new Date(activity.timestamp)
                  : activity.timestamp

              return (
                <div
                  key={`${activity.type}-${timestamp.getTime()}-${index}`}
                  className="hover:bg-muted/30 flex items-center gap-3 rounded-lg p-2.5 transition-colors"
                >
                  {/* Icon or Photo */}
                  <div className="relative shrink-0">
                    {activity.catPhotoUrl ? (
                      <div className="relative h-9 w-9 overflow-hidden rounded-full">
                        <Image
                          src={activity.catPhotoUrl}
                          alt={activity.catName}
                          fill
                          className="object-cover"
                        />
                        {/* Activity type indicator */}
                        <div
                          className={`absolute -right-0.5 -bottom-0.5 flex h-4 w-4 items-center justify-center rounded-full ${config.bgColor} ring-card ring-2`}
                        >
                          <Icon className={`h-2.5 w-2.5 ${config.iconColor}`} />
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${config.bgColor}`}
                      >
                        <Icon className={`h-4 w-4 ${config.iconColor}`} />
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <p className="text-foreground min-w-0 flex-1 truncate text-sm">
                    {activity.message}
                  </p>

                  {/* Timestamp */}
                  <p className="text-muted-foreground shrink-0 text-xs">
                    {formatDistanceToNow(timestamp, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
