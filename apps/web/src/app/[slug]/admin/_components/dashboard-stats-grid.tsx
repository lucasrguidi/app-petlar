'use client'

import { Cat, FileText, PartyPopper } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

interface DashboardStatsGridProps {
  availableCatsCount: number
  pendingApplicationsCount: number
  totalApplicationsCount: number
  totalAdoptions: number
}

export function DashboardStatsGrid({
  availableCatsCount,
  pendingApplicationsCount,
  totalApplicationsCount,
  totalAdoptions,
}: DashboardStatsGridProps) {
  const stats = [
    {
      title: 'Disponíveis',
      value: availableCatsCount,
      icon: Cat,
      iconBg: 'bg-primary/15 text-primary',
      subtitle: 'para adoção',
    },
    {
      title: 'Pendentes',
      value: pendingApplicationsCount,
      icon: FileText,
      iconBg: 'bg-warning/15 text-warning',
      subtitle: 'candidaturas',
      attention: pendingApplicationsCount > 0,
      extra: `${totalApplicationsCount} no total`,
    },
    {
      title: 'Adoções',
      value: totalAdoptions,
      icon: PartyPopper,
      iconBg: 'bg-success/15 text-success',
      subtitle: 'realizadas',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card
            key={stat.title}
            className={`border-border/60 bg-card/95 shadow-warm-sm rounded-xl border ${
              stat.attention ? 'ring-warning/30 ring-2' : ''
            }`}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  {stat.title}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-foreground text-2xl font-bold tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {stat.subtitle}
                  </span>
                </div>
                {stat.extra && (
                  <p className="text-muted-foreground/70 text-xs">
                    {stat.extra}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
