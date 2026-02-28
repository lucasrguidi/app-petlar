import { User } from 'lucide-react'
import { Suspense } from 'react'

import { ProfileLoadingSkeleton } from './_components/profile-loading-skeleton'
import { ProfilePageContent } from './_components/profile-page-content'

export default function ProfilePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pb-8">
      <div className="flex shrink-0 flex-col gap-4 pb-6">
        <div className="space-y-1">
          <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
            <User className="text-primary h-6 w-6" />
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas informacoes pessoais e configuracoes de seguranca
          </p>
        </div>
      </div>

      <Suspense fallback={<ProfileLoadingSkeleton />}>
        <ProfilePageContent />
      </Suspense>
    </div>
  )
}
