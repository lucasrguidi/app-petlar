'use client'

import { useQuery } from '@tanstack/react-query'
import { Cat, Home, Loader2, LogOut, ShieldAlert } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { signOut } from '@/lib/auth-client'
import { trpc } from '@/utils/trpc'

export default function AdminPage() {
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Buscar org pelo slug para validar acesso
  const { data: org, isLoading: isOrgLoading } = useQuery(
    trpc.orgs.getBySlug.queryOptions({ slug: params.slug })
  )

  // Verificar se o usuário pertence à org correta
  const hasOrgAccess = org && user?.orgId === org.id

  // Redirecionar se não tiver acesso
  useEffect(() => {
    if (!isAuthLoading && !isOrgLoading) {
      if (!isAuthenticated) {
        router.push(`/${params.slug}/login`)
      } else if (org && user?.orgId && user.orgId !== org.id) {
        toast.error('Você não tem acesso a esta organização')
        router.push(`/${params.slug}/login`)
      }
    }
  }, [isAuthLoading, isOrgLoading, isAuthenticated, org, user, router, params.slug])

  async function handleSignOut() {
    setIsSigningOut(true)
    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
      router.push(`/${params.slug}/login`)
    } catch {
      toast.error('Erro ao fazer logout')
    } finally {
      setIsSigningOut(false)
    }
  }

  const isLoading = isAuthLoading || isOrgLoading

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="mx-auto h-16 w-16 rounded-full" />
            <Skeleton className="mx-auto mt-4 h-6 w-32" />
            <Skeleton className="mx-auto mt-2 h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated || !hasOrgAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="mt-4 text-xl font-bold">
              Acesso Negado
            </CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta organização.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="from-primary/20 to-accent/30 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
            <Cat className="text-primary h-8 w-8" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2">
            <Home className="text-primary h-5 w-5" />
            <CardTitle className="text-xl font-bold">Painel Admin</CardTitle>
          </div>

          <CardDescription className="mt-2">
            Bem-vindo(a), <span className="font-medium">{user?.name}</span>!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-muted-foreground text-sm">
              <span className="font-medium">E-mail:</span> {user?.email}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              <span className="font-medium">Função:</span>{' '}
              {user?.role === 'admin' ? 'Administrador' : 'Voluntário'}
            </p>
          </div>

          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="outline"
            className="w-full"
          >
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saindo...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
