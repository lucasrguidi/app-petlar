import { Heart, PawPrint } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PublicFooterProps {
  orgName: string
  slug: string
}

const links = [
  { id: 'inicio', label: 'Início' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'gatos-disponiveis', label: 'Gatos disponíveis' },
] as const

export function PublicFooter({ orgName, slug }: PublicFooterProps) {
  return (
    <footer className="relative overflow-hidden">
      {/* Main footer content */}
      <div className="relative bg-white/50 pt-16 pb-8 backdrop-blur-sm">
        {/* Decorative top wave */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E35915]/20 to-transparent" />

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Top section */}
          <div className="mb-12 grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl',
                    'bg-gradient-to-br from-[#E35915] to-[#F07B3D]',
                    'shadow-lg shadow-[#E35915]/25'
                  )}
                >
                  <PawPrint className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p
                    className="text-lg font-bold text-[#783201]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {orgName}
                  </p>
                  <p className="text-xs font-medium text-[#8B5A2B]/60">
                    Adoção responsável
                  </p>
                </div>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-[#783201]/80">
                Conectamos pessoas e gatinhos com um processo de adoção simples,
                transparente e cheio de carinho. Cada adoção é uma nova história
                de amor.
              </p>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <p
                className="text-sm font-bold text-[#783201]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Navegação
              </p>
              <nav className="space-y-2.5">
                {links.map((link) => (
                  <Link
                    key={link.id}
                    href={`/${slug}#${link.id}` as Route}
                    className={cn(
                      'flex items-center gap-2 text-sm text-[#783201]/70',
                      'transition-colors hover:text-[#E35915]'
                    )}
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-[#AEC7E2]" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Admin access */}
            <div className="space-y-4">
              <p
                className="text-sm font-bold text-[#783201]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Área administrativa
              </p>
              <p className="text-sm text-[#783201]/70">
                É membro da ONG? Acesse o painel para gerenciar os gatinhos.
              </p>
              <Button
                asChild
                variant="outline"
                className={cn(
                  'rounded-xl border-[#AEC7E2] text-[#783201]',
                  'hover:border-[#E35915]/30 hover:bg-[#E35915]/5 hover:text-[#E35915]'
                )}
              >
                <Link href={`/${slug}/login` as Route}>
                  Acessar painel
                </Link>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#AEC7E2]/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/50 px-4">
                <PawPrint className="h-5 w-5 text-[#E35915]/40" />
              </span>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-[#783201]/60">
              {new Date().getFullYear()} {orgName}. Todos os direitos
              reservados.
            </p>
            <p className="inline-flex items-center gap-1.5 text-xs text-[#783201]/60">
              Feito com{' '}
              <Heart className="h-3.5 w-3.5 fill-[#E35915] text-[#E35915]" />{' '}
              para facilitar adoções responsáveis
            </p>
          </div>
        </div>
      </div>

      {/* Floating paw prints decoration */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 overflow-hidden opacity-[0.04]">
        <svg
          className="absolute -bottom-2 left-[10%] h-20 w-20 rotate-[-20deg] text-[#783201]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 6c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
        </svg>
        <svg
          className="absolute -bottom-4 right-[15%] h-24 w-24 rotate-[15deg] text-[#783201]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 6c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
        </svg>
      </div>
    </footer>
  )
}
