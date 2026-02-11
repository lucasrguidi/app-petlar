import { Heart, PawPrint } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface HomeCatsPreviewProps {
  slug: string
}

export function HomeCatsPreview({ slug }: HomeCatsPreviewProps) {
  return (
    <section id="gatos-disponiveis" className="px-4 pt-2 pb-16 sm:px-6 lg:px-8 lg:pb-20">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="space-y-2">
          <Badge className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/15">
            Vitrine de adoção
          </Badge>
          <h2 className="text-display text-3xl font-bold tracking-tight sm:text-4xl">
            Gatinhos esperando um novo lar
          </h2>
          <p className="text-muted-foreground max-w-2xl text-base text-balance">
            Nesta seção você encontrará os perfis disponíveis, com fotos e
            informações essenciais para decidir com tranquilidade.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {['Perfil completo', 'Informações de saúde', 'Candidatura guiada'].map(
            (feature) => (
              <Card
                key={feature}
                className="bg-card/95 shadow-warm-md rounded-2xl border-border/60"
              >
                <CardContent className="space-y-3 p-5">
                  <div className="from-muted/40 to-muted/20 border-border/50 flex aspect-square items-center justify-center rounded-xl border bg-gradient-to-br">
                    <PawPrint className="text-primary/55 h-10 w-10" />
                  </div>
                  <p className="text-sm font-semibold">{feature}</p>
                </CardContent>
              </Card>
            )
          )}
        </div>

        <Card className="bg-card/95 shadow-warm-lg rounded-2xl border-border/60">
          <CardHeader className="space-y-2">
            <CardTitle className="text-display text-2xl">
              Pronto para começar?
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              A listagem dinâmica completa entra na próxima etapa, mantendo o
              mesmo visual simples e acolhedor.
            </p>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="rounded-xl shadow-primary-glow hover:shadow-primary-glow-hover"
            >
              <Link href={`/${slug}/login` as Route}>
                <Heart className="h-4 w-4" />
                Sou da ONG e quero gerenciar adoções
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
