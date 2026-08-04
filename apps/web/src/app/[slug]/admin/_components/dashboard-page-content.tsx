'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { DashboardActivityFeed } from './dashboard-activity-feed'
import { DashboardChart, type Period } from './dashboard-chart'
import { DashboardHeader } from './dashboard-header'
import { DashboardLoading } from './dashboard-loading'
import { DashboardStatsGrid } from './dashboard-stats-grid'
import { DashboardTopCats } from './dashboard-top-cats'

import { trpc } from '@/utils/trpc'

export function DashboardPageContent() {
  const [period, setPeriod] = useState<Period>('week')

  const { data, isLoading } = useQuery({
    ...trpc.dashboard.getMetrics.queryOptions({ period }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading && !data) {
    return <DashboardLoading />
  }

  if (!data) {
    return <DashboardLoading />
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="space-y-6 pb-4">
        {/* Header */}
        <DashboardHeader />

        {/* Stats Grid */}
        <DashboardStatsGrid
          availableCatsCount={data.availableCatsCount}
          pendingApplicationsCount={data.pendingApplicationsCount}
          totalApplicationsCount={data.totalApplicationsCount}
          totalAdoptions={data.totalAdoptions}
        />

        {/* Chart + Top Cats Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DashboardChart
              data={data.timeline}
              period={period}
              onPeriodChange={setPeriod}
            />
          </div>
          <DashboardTopCats cats={data.topCats} />
        </div>

        {/* Activity Feed */}
        <DashboardActivityFeed activities={data.recentActivity} />
      </div>
    </div>
  )
}
