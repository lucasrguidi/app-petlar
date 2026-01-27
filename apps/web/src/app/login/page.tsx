import { Suspense } from 'react'
import Link from 'next/link'
import { Cat, Heart, Home, Sparkles } from 'lucide-react'

import { SignInForm } from '@/components/sign-in-form'
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
      <div className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-accent/30 animate-pulse-soft" />

      {/* Ícone principal */}
      <div className="relative z-10 w-20 h-20 rounded-full bg-white shadow-lg shadow-primary/20 flex items-center justify-center animate-float">
        <Cat className="w-10 h-10 text-primary" strokeWidth={1.5} />
      </div>

      {/* Elementos decorativos */}
      <Heart
        className="absolute -top-1 -right-1 w-5 h-5 text-primary/60 animate-pulse-soft animation-delay-200"
        fill="currentColor"
      />
      <Sparkles className="absolute -bottom-1 -left-2 w-4 h-4 text-accent/70 animate-pulse-soft animation-delay-400" />
    </div>
  )
}

function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Formas decorativas flutuantes */}
      <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
      <div className="absolute bottom-32 right-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-1/3 right-1/4 w-24 h-24 rounded-full bg-accent/10 blur-2xl" />

      {/* Pequenas patinhas decorativas */}
      <div className="absolute top-16 right-16 opacity-20">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
          <ellipse cx="12" cy="17" rx="4" ry="5" />
          <circle cx="7" cy="10" r="2.5" />
          <circle cx="17" cy="10" r="2.5" />
          <circle cx="5" cy="14" r="2" />
          <circle cx="19" cy="14" r="2" />
        </svg>
      </div>
      <div className="absolute bottom-24 left-16 opacity-15 rotate-12">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-foreground">
          <ellipse cx="12" cy="17" rx="4" ry="5" />
          <circle cx="7" cy="10" r="2.5" />
          <circle cx="17" cy="10" r="2.5" />
          <circle cx="5" cy="14" r="2" />
          <circle cx="19" cy="14" r="2" />
        </svg>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <FloatingElements />

      <div className="w-full max-w-md relative z-10">
        {/* Card principal */}
        <Card className="border-0 shadow-2xl shadow-foreground/10 rounded-2xl overflow-hidden opacity-0 animate-fade-in-up">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mb-6">
              <CatIllustration />
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Home className="w-5 h-5 text-primary" />
              <CardTitle className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                PetLar
              </CardTitle>
            </div>

            <CardDescription className="text-base text-foreground/70">
              Bem-vindo de volta! Entre para continuar
              <br />
              ajudando nossos amigos peludos.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-4">
            <Suspense fallback={<div className="h-48 animate-pulse bg-muted rounded-lg" />}>
              <SignInForm />
            </Suspense>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <a
                  href="/signup"
                  className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
                >
                  Cadastre-se
                </a>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Rodapé */}
        <p className="text-center text-xs text-foreground/50 mt-6 opacity-0 animate-fade-in-up animation-delay-300">
          Feito com{' '}
          <Heart className="inline w-3 h-3 text-primary" fill="currentColor" />{' '}
          para os gatinhos
        </p>
      </div>
    </div>
  )
}
