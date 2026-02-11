import { Home, PawPrint, ShieldCheck } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface HomeHeroProps {
  slug: string
}

const trustHighlights = [
  'Processo guiado e simples',
  'Acompanhamento direto com a ONG',
  'Adoção responsável e segura',
] as const

export function HomeHero({ slug }: HomeHeroProps) {
  return (
    <section id="inicio" className="relative overflow-hidden px-4 pt-10 pb-14 sm:px-6 lg:px-8 lg:pt-14 lg:pb-16">
      <div className="bg-primary/10 pointer-events-none absolute top-[-80px] left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl" />
      <div className="bg-accent/15 pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full blur-3xl" />

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <Badge className="rounded-full bg-primary/15 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15">
            Adoção com carinho e responsabilidade
          </Badge>

          <h1 className="text-display text-4xl leading-tight font-bold text-balance sm:text-5xl">
            Encontre seu novo <span className="text-primary">melhor amigo</span>{' '}
            em poucos passos
          </h1>

          <p className="text-muted-foreground max-w-2xl text-base leading-relaxed sm:text-lg">
            Conheça os gatinhos da ONG, veja o perfil de cada um e envie sua
            candidatura de forma rápida, com linguagem simples.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-xl shadow-primary-glow hover:shadow-primary-glow-hover"
            >
              <Link href={`/${slug}#gatos-disponiveis` as Route}>
                <PawPrint className="h-4 w-4" />
                Ver gatinhos disponíveis
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href={`/${slug}#como-funciona` as Route}>
                <Home className="h-4 w-4" />
                Como funciona
              </Link>
            </Button>
          </div>
        </div>

        <Card className="bg-card/90 shadow-warm-xl rounded-2xl border-border/60 backdrop-blur-sm">
          <CardContent className="space-y-4 p-6 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <ShieldCheck className="h-3.5 w-3.5" />
              Processo seguro
            </div>

            <div className="space-y-3">
              {trustHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/35 px-3 py-2.5"
                >
                  <div className="bg-primary h-2 w-2 rounded-full" />
                  <p className="text-sm font-medium">{item}</p>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed">
              Nosso foco é conectar lares preparados com gatinhos que precisam
              de uma nova chance.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
