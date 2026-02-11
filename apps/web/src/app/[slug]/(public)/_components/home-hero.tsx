import { ArrowDown, Heart, PawPrint } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface HomeHeroProps {
  slug: string
}

const trustItems = [
  { icon: '🏠', text: 'Processo guiado e transparente' },
  { icon: '💬', text: 'Contato direto com a ONG' },
  { icon: '🛡️', text: 'Adoção segura e responsável' },
] as const

export function HomeHero({ slug }: HomeHeroProps) {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden px-4 pt-8 pb-16 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16 lg:pb-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-4 py-2',
                'bg-white/60 backdrop-blur-sm',
                'border border-white/50',
                'shadow-lg shadow-[#783201]/5'
              )}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E35915] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E35915]" />
              </span>
              <span className="text-sm font-semibold text-[#783201]">
                Adoção com carinho e responsabilidade
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1
                className="text-4xl leading-[1.1] font-bold tracking-tight text-[#783201] sm:text-5xl lg:text-6xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Encontre seu novo{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-[#E35915] to-[#F07B3D] bg-clip-text text-transparent">
                    melhor amigo
                  </span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 200 12"
                    fill="none"
                  >
                    <path
                      d="M2 8C40 3 80 2 100 4C120 6 160 8 198 5"
                      stroke="url(#underline-gradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="underline-gradient"
                        x1="0"
                        y1="0"
                        x2="200"
                        y2="0"
                      >
                        <stop stopColor="#E35915" stopOpacity="0.4" />
                        <stop offset="0.5" stopColor="#F07B3D" stopOpacity="0.6" />
                        <stop offset="1" stopColor="#E35915" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-[#783201]/80 sm:text-xl">
                Conheça os gatinhos disponíveis, veja o perfil completo de cada
                um e envie sua candidatura de forma simples.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className={cn(
                  'group relative h-14 rounded-2xl px-8 text-base',
                  'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
                  'shadow-xl shadow-[#E35915]/30',
                  'transition-all duration-300',
                  'hover:shadow-2xl hover:shadow-[#E35915]/40',
                  'hover:scale-[1.02] active:scale-[0.98]'
                )}
              >
                <Link href={`/${slug}#gatos-disponiveis` as Route}>
                  <PawPrint className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                  Ver gatinhos disponíveis
                  <ArrowDown className="ml-2 h-4 w-4 animate-bounce" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className={cn(
                  'h-14 rounded-2xl px-8 text-base',
                  'border-2 border-white/50 bg-white/40 text-[#783201]',
                  'backdrop-blur-sm',
                  'hover:border-white/70 hover:bg-white/60',
                  'transition-all duration-200'
                )}
              >
                <Link href={`/${slug}#como-funciona` as Route}>
                  Como funciona
                </Link>
              </Button>
            </div>

            {/* Trust badges - mobile */}
            <div className="flex flex-wrap gap-2 lg:hidden">
              {trustItems.map((item) => (
                <div
                  key={item.text}
                  className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-sm shadow-sm backdrop-blur-sm"
                >
                  <span>{item.icon}</span>
                  <span className="text-[#783201]/80">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visual Card */}
          <div className="relative lg:pl-8">
            {/* Decorative circle behind card */}
            <div className="absolute -top-8 -right-8 h-72 w-72 rounded-full bg-white/30 blur-2xl" />

            <div
              className={cn(
                'relative rounded-3xl p-1',
                'bg-gradient-to-br from-white/80 via-white/60 to-[#E35915]/20'
              )}
            >
              <div className="rounded-[22px] bg-white/90 p-6 shadow-xl shadow-[#783201]/10 backdrop-blur-sm sm:p-8">
                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#22C55E] shadow-lg shadow-[#16A34A]/25">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p
                      className="font-semibold text-[#783201]"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Processo seguro
                    </p>
                    <p className="text-sm text-[#8B5A2B]/70">
                      Adoção responsável
                    </p>
                  </div>
                </div>

                {/* Trust items - desktop */}
                <div className="hidden space-y-3 lg:block">
                  {trustItems.map((item, index) => (
                    <div
                      key={item.text}
                      className={cn(
                        'flex items-center gap-4 rounded-2xl p-4',
                        'bg-gradient-to-r from-[#AEC7E2]/30 to-white',
                        'border border-[#AEC7E2]/30',
                        'transform transition-all duration-300 hover:scale-[1.02] hover:shadow-md'
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <p className="font-medium text-[#783201]">{item.text}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
