import { Heart, PawPrint } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { buildOrgHref } from '@/lib/org-href'
import { cn } from '@/lib/utils'

interface PublicFooterProps {
  orgName: string
  slug: string
  isCustomDomain: boolean
}

const links = [
  { id: 'inicio', label: 'Início' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'termo-de-adocao', label: 'Termo de adoção' },
  { id: 'gatos-disponiveis', label: 'Gatos disponíveis' },
] as const

export function PublicFooter({
  orgName,
  slug,
  isCustomDomain,
}: PublicFooterProps) {
  const orgHref = (path: string) =>
    buildOrgHref(path, slug, isCustomDomain) as Route
  return (
    <footer className="relative overflow-hidden">
      {/* Main footer content */}
      <div className="relative bg-white/50 pt-16 pb-8 backdrop-blur-sm">
        {/* Decorative top wave */}
        <div className="via-primary/20 absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent to-transparent" />

        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Top section */}
          <div className="mb-12 grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr]">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl',
                    'from-primary to-accent bg-gradient-to-br',
                    'shadow-primary/25 shadow-lg'
                  )}
                >
                  <PawPrint className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p
                    className="text-foreground text-lg font-bold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {orgName}
                  </p>
                  <p className="text-muted-foreground/60 text-xs font-medium">
                    Adoção responsável
                  </p>
                </div>
              </div>
              <p className="text-foreground/80 max-w-sm text-sm leading-relaxed">
                Conectamos pessoas e gatinhos com um processo de adoção simples,
                transparente e cheio de carinho. Cada adoção é uma nova história
                de amor.
              </p>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <p
                className="text-foreground text-sm font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Navegação
              </p>
              <nav className="space-y-2.5">
                {links.map((link) => (
                  <Link
                    key={link.id}
                    href={orgHref(`#${link.id}`)}
                    className={cn(
                      'text-foreground/70 flex items-center gap-2 text-sm',
                      'hover:text-primary transition-colors'
                    )}
                  >
                    <div className="bg-background h-1.5 w-1.5 rounded-full" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Admin access */}
            <div className="space-y-4">
              <p
                className="text-foreground text-sm font-bold"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Área administrativa
              </p>
              <p className="text-foreground/70 text-sm">
                É membro da ONG? Acesse o painel para gerenciar os gatinhos.
              </p>
              <Button
                asChild
                variant="outline"
                className={cn(
                  'border-background text-foreground rounded-xl',
                  'hover:border-primary/30 hover:bg-primary/5 hover:text-primary'
                )}
              >
                <Link href={orgHref('/login')}>Acessar painel</Link>
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="border-background/50 w-full border-t" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white/50 px-4">
                <PawPrint className="text-primary/40 h-5 w-5" />
              </span>
            </div>
          </div>

          {/* Bottom section */}
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-foreground/60 text-xs">
              {new Date().getFullYear()} {orgName}. Todos os direitos
              reservados.
            </p>
            <p className="text-foreground/60 inline-flex items-center gap-1.5 text-xs">
              Feito com{' '}
              <Heart className="fill-primary text-primary h-3.5 w-3.5" /> para
              facilitar adoções responsáveis
            </p>
          </div>
        </div>
      </div>

      {/* Floating paw prints decoration */}
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 overflow-hidden opacity-[0.04]">
        <svg
          className="text-foreground absolute -bottom-2 left-[10%] h-20 w-20 rotate-[-20deg]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 6c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
        </svg>
        <svg
          className="text-foreground absolute right-[15%] -bottom-4 h-24 w-24 rotate-[15deg]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 4c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-8 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm4 6c-2.2 0-4 1.8-4 4h8c0-2.2-1.8-4-4-4z" />
        </svg>
      </div>
    </footer>
  )
}
