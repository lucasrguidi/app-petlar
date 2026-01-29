import { Cat, Heart, Home, Sparkles } from 'lucide-react'
import { Suspense } from 'react'

import { SignInForm } from './_components/sign-in-form'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function CatIllustration() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Círculo de fundo com gradiente */}
      <div className="from-primary/20 to-accent/30 absolute h-28 w-28 animate-pulse rounded-full bg-gradient-to-br" />

      {/* Ícone principal */}
      <div className="shadow-primary/20 relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
        <Cat className="text-primary h-10 w-10" strokeWidth={1.5} />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Card principal */}
        <Card className="shadow-foreground/10 overflow-hidden rounded-2xl border-0 shadow-2xl">
          <CardHeader className="pt-8 pb-2 text-center">
            <div className="mb-6">
              <CatIllustration />
            </div>

            <div className="mb-2 flex items-center justify-center gap-2">
              <Home className="text-primary h-5 w-5" />
              <CardTitle
                className="text-2xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                PetLar
              </CardTitle>
            </div>

            <CardDescription className="text-foreground/70 text-base">
              Bem-vindo de volta! Entre para continuar
              <br />
              ajudando nossos amigos peludos.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pt-4 pb-8">
            <Suspense
              fallback={
                <div className="bg-muted h-48 animate-pulse rounded-lg" />
              }
            >
              <SignInForm />
            </Suspense>

            <div className="mt-6 text-center">
              <p className="text-muted-foreground text-sm">
                Não tem uma conta?{' '}
                <a
                  href="/signup"
                  className="text-primary font-medium underline-offset-4 transition-colors hover:underline"
                >
                  Cadastre-se
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <p className="text-foreground/50 mt-6 text-center text-xs">
          Feito com{' '}
          <Heart className="text-primary inline h-3 w-3" fill="currentColor" />{' '}
          para os gatinhos
        </p>
      </div>
    </div>
  )
}
