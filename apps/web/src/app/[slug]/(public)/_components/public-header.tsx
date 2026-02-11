'use client'

import { Heart, Menu, PawPrint } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useOrgSlug } from '@/hooks/use-org-slug'

interface PublicHeaderProps {
  orgName: string
  orgLogo: string | null
}

const navItems = [
  { id: 'inicio', label: 'Início' },
  { id: 'como-funciona', label: 'Como funciona' },
  { id: 'gatos-disponiveis', label: 'Gatos disponíveis' },
] as const

export function PublicHeader({ orgName, orgLogo }: PublicHeaderProps) {
  const slug = useOrgSlug()
  const [menuOpen, setMenuOpen] = useState(false)

  const sectionHref = (sectionId: string) => `/${slug}#${sectionId}` as Route

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href={`/${slug}` as Route} className="group flex items-center gap-3">
          <div className="from-primary to-accent shadow-warm-md flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br transition-transform duration-200 group-hover:scale-105">
            {orgLogo ? (
              <img
                src={orgLogo}
                alt={`Logo ${orgName}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <PawPrint className="h-5 w-5 text-white" />
            )}
          </div>

          <div className="hidden min-w-0 sm:block">
            <p className="text-display truncate text-base font-semibold">
              {orgName}
            </p>
            <p className="text-muted-foreground text-xs">Adoção responsável</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 rounded-full border border-border/60 bg-card/85 p-1 shadow-warm-sm md:flex">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={sectionHref(item.id)}
              className="text-muted-foreground hover:bg-muted/70 hover:text-foreground rounded-full px-4 py-2 text-sm font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`/${slug}/login` as Route}>Sou da ONG</Link>
          </Button>
          <Button
            asChild
            className="rounded-xl shadow-primary-glow hover:shadow-primary-glow-hover"
          >
            <Link href={sectionHref('gatos-disponiveis')}>
              <Heart className="h-4 w-4" />
              Quero adotar
            </Link>
          </Button>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menu principal"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[88%] border-border/60 bg-card/95 p-0 sm:max-w-sm"
          >
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border/60 p-5 text-left">
                <SheetTitle className="text-display text-xl">Menu</SheetTitle>
                <SheetDescription>
                  Navegue pelo site e encontre seu próximo amigo.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-2 p-5">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    href={sectionHref(item.id)}
                    onClick={() => setMenuOpen(false)}
                    className="hover:bg-muted/70 block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-auto space-y-3 border-t border-border/60 p-5">
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link
                    href={`/${slug}/login` as Route}
                    onClick={() => setMenuOpen(false)}
                  >
                    Sou da ONG
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full rounded-xl shadow-primary-glow hover:shadow-primary-glow-hover"
                >
                  <Link
                    href={sectionHref('gatos-disponiveis')}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Heart className="h-4 w-4" />
                    Quero adotar
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
