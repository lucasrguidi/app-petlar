import { FileText, MessageCircleHeart, Search } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const steps = [
  {
    title: 'Escolha um gatinho',
    description:
      'Veja os perfis disponíveis e encontre o que combina com sua rotina.',
    icon: Search,
  },
  {
    title: 'Preencha a candidatura',
    description:
      'Responda perguntas simples para a ONG entender melhor seu contexto.',
    icon: FileText,
  },
  {
    title: 'Converse com a ONG',
    description:
      'Depois da análise, a equipe entra em contato para os próximos passos.',
    icon: MessageCircleHeart,
  },
] as const

export function HomeHowItWorks() {
  return (
    <section id="como-funciona" className="px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="space-y-2 text-center">
          <h2 className="text-display text-3xl font-bold tracking-tight sm:text-4xl">
            Como funciona a adoção
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-base text-balance">
            Um fluxo simples para ajudar você e a ONG a encontrarem o melhor
            match para cada gatinho.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card
              key={step.title}
              className="bg-card/95 shadow-warm-lg rounded-2xl border-border/60"
            >
              <CardHeader className="space-y-3 pb-2">
                <div className="flex items-center justify-between">
                  <div className="bg-primary/15 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide">
                    PASSO {index + 1}
                  </span>
                </div>
                <CardTitle className="text-display text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
