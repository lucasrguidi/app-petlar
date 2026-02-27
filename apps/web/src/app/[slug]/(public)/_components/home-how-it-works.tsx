import { FileText, MessageCircleHeart, Search } from 'lucide-react'

import { cn } from '@/lib/utils'

const steps = [
  {
    step: 1,
    title: 'Escolha um gatinho',
    description:
      'Navegue pelos perfis disponíveis e encontre o gatinho que combina com sua rotina e seu lar.',
    icon: Search,
    color: 'from-[#3B82F6] to-[#60A5FA]',
    shadowColor: 'shadow-[#3B82F6]/25',
    bgAccent: 'bg-[#3B82F6]/10',
  },
  {
    step: 2,
    title: 'Preencha a candidatura',
    description:
      'Responda perguntas simples para que a ONG conheça melhor você e seu ambiente.',
    icon: FileText,
    color: 'from-primary to-accent',
    shadowColor: 'shadow-primary/25',
    bgAccent: 'bg-primary/10',
  },
  {
    step: 3,
    title: 'Converse com a ONG',
    description:
      'Após análise da candidatura, a equipe entra em contato para agendar os próximos passos.',
    icon: MessageCircleHeart,
    color: 'from-[#16A34A] to-[#22C55E]',
    shadowColor: 'shadow-[#16A34A]/25',
    bgAccent: 'bg-[#16A34A]/10',
  },
] as const

export function HomeHowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
    >
      {/* Background - lighter overlay */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-white/20" />
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 backdrop-blur-sm">
            <span className="text-sm font-medium text-foreground">
              Simples e transparente
            </span>
          </div>
          <h2
            className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Como funciona a adoção
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-foreground/80">
            Um processo pensado para ser simples para você e seguro para os
            gatinhos.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line - desktop */}
          <div className="absolute top-24 right-0 left-0 hidden h-0.5 lg:block">
            <div className="relative mx-auto h-full max-w-4xl">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
              {/* Animated dots */}
              <div className="absolute top-1/2 left-[16%] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#3B82F6] shadow-lg shadow-[#3B82F6]/50" />
              <div className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-lg shadow-primary/50" />
              <div className="absolute top-1/2 right-[16%] h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#16A34A] shadow-lg shadow-[#16A34A]/50" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className={cn(
                  'group relative',
                  'transform transition-all duration-300 hover:-translate-y-2'
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Card */}
                <div
                  className={cn(
                    'relative overflow-hidden rounded-3xl',
                    'bg-white/80 backdrop-blur-sm',
                    'border border-white/50',
                    'p-8',
                    'shadow-xl shadow-foreground/5 transition-shadow duration-300',
                    'group-hover:shadow-2xl'
                  )}
                >
                  {/* Background accent */}
                  <div
                    className={cn(
                      'absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-50 blur-2xl transition-opacity group-hover:opacity-80',
                      step.bgAccent
                    )}
                  />

                  {/* Step number */}
                  <div className="relative mb-6 flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-14 w-14 items-center justify-center rounded-2xl',
                        'bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110',
                        step.color,
                        step.shadowColor
                      )}
                    >
                      <step.icon className="h-6 w-6 text-white" />
                    </div>
                    <span
                      className={cn(
                        'text-5xl font-bold',
                        'bg-gradient-to-br bg-clip-text text-transparent opacity-20',
                        step.color
                      )}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {step.step}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h3
                      className="mb-3 text-xl font-bold text-foreground"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {step.title}
                    </h3>
                    <p className="leading-relaxed text-foreground/80">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow indicator - mobile */}
                  {index < steps.length - 1 && (
                    <div className="mt-6 flex justify-center lg:hidden">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/30">
                        <svg
                          className="h-4 w-4 text-foreground/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="mb-2 text-sm font-medium text-foreground/60">
            Pronto para começar?
          </p>
          <p
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Veja os gatinhos disponíveis abaixo{' '}
            <span className="inline-block animate-bounce">👇</span>
          </p>
        </div>
      </div>
    </section>
  )
}
