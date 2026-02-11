import { Heart, PawPrint } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

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
    <footer className="border-t border-border/60 bg-card/50">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_1fr_auto] lg:items-start lg:px-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PawPrint className="text-primary h-5 w-5" />
            <p className="text-display text-base font-semibold">{orgName}</p>
          </div>
          <p className="text-muted-foreground max-w-md text-sm">
            Conectamos pessoas e gatinhos com um processo de adoção simples,
            responsável e acolhedor.
          </p>
        </div>

        <nav className="space-y-2">
          <p className="text-foreground text-sm font-semibold">Navegação</p>
          {links.map((link) => (
            <Link
              key={link.id}
              href={`/${slug}#${link.id}` as Route}
              className="text-muted-foreground hover:text-foreground block text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="space-y-3">
          <p className="text-foreground text-sm font-semibold">
            Área administrativa
          </p>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/${slug}/login` as Route}>Acessar painel da ONG</Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-border/50 bg-card/35">
        <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            {new Date().getFullYear()} {orgName}. Todos os direitos reservados.
          </p>
          <p className="inline-flex items-center gap-1">
            Feito com <Heart className="text-primary h-3.5 w-3.5" /> para
            facilitar adoções responsáveis
          </p>
        </div>
      </div>
    </footer>
  )
}
