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
        Não foi possível carregar os dados do usuário.
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
