import { Suspense } from 'react'

import { DashboardLoading } from './_components/dashboard-loading'
import { DashboardPageContent } from './_components/dashboard-page-content'

export default function AdminPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardPageContent />
    </Suspense>
  )
}
