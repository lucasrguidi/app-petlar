'use client'


import { PersonalInfoCard } from './personal-info-card'
import { ProfileLoadingSkeleton } from './profile-loading-skeleton'
import { SecurityCard } from './security-card'

import { useAuth } from '@/components/auth-provider'

export function ProfilePageContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <ProfileLoadingSkeleton />
  }

  if (!user) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Nao foi possivel carregar os dados do usuario.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PersonalInfoCard user={user} />
      <SecurityCard />
    </div>
  )
}
