'use client'

import { Heart, Menu, PawPrint, X } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'

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
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const sectionHref = (sectionId: string) => `/${slug}#${sectionId}` as Route

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'border-b border-[#783201]/10 bg-white/90 shadow-md shadow-[#783201]/5 backdrop-blur-xl'
            : 'bg-transparent'
        )}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href={`/${slug}` as Route}
            className="group flex items-center gap-3"
          >
            <div
              className={cn(
                'relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl transition-all duration-300',
                'bg-gradient-to-br from-[#E35915] via-[#F07B3D] to-[#E35915]',
                'shadow-lg shadow-[#E35915]/25',
                'group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#E35915]/35'
              )}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent" />
              {orgLogo ? (
                <img
                  src={orgLogo}
                  alt={`Logo ${orgName}`}
                  className="relative z-10 h-full w-full object-cover"
                />
              ) : (
                <PawPrint className="relative z-10 h-6 w-6 text-white" />
              )}
            </div>

            <div className="hidden min-w-0 sm:block">
              <p
                className="truncate text-lg font-bold text-[#783201]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {orgName}
              </p>
              <p className="text-xs font-medium text-[#8B5A2B]/70">
                Adoção responsável
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center md:flex">
            <div className="flex items-center gap-1 rounded-full border border-[#783201]/10 bg-white/70 p-1.5 shadow-sm backdrop-blur-sm">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={sectionHref(item.id)}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    'text-[#783201]/70 hover:text-[#783201]',
                    'hover:bg-[#AEC7E2]/50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            <Button
              asChild
              variant="ghost"
              className="rounded-xl text-[#783201]/80 hover:bg-[#AEC7E2]/50 hover:text-[#783201]"
            >
              <Link href={`/${slug}/login` as Route}>Sou da ONG</Link>
            </Button>
            <Button
              asChild
              className={cn(
                'rounded-xl px-5',
                'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
                'shadow-lg shadow-[#E35915]/25',
                'transition-all duration-200',
                'hover:shadow-xl hover:shadow-[#E35915]/35',
                'hover:scale-[1.02] active:scale-[0.98]'
              )}
            >
              <Link href={sectionHref('gatos-disponiveis')}>
                <Heart className="mr-1.5 h-4 w-4" />
                Quero adotar
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="relative z-[60] h-11 w-11 rounded-xl text-[#783201] hover:bg-[#AEC7E2]/50 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <div className="relative h-5 w-5">
              <Menu
                className={cn(
                  'absolute inset-0 h-5 w-5 transition-all duration-300',
                  menuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
                )}
              />
              <X
                className={cn(
                  'absolute inset-0 h-5 w-5 transition-all duration-300',
                  menuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
                )}
              />
            </div>
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-[#783201]/20 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full w-[85%] max-w-sm transform transition-transform duration-300 ease-out md:hidden',
          'bg-gradient-to-b from-white to-[#F0F7FF] shadow-2xl',
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex h-full flex-col pt-20">
          {/* Nav Items */}
          <nav className="flex-1 space-y-1 px-6 py-4">
            {navItems.map((item, index) => (
              <Link
                key={item.id}
                href={sectionHref(item.id)}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium transition-all',
                  'text-[#783201] hover:bg-[#AEC7E2]/30',
                  'transform transition-all duration-300',
                  menuOpen
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-4 opacity-0'
                )}
                style={{
                  transitionDelay: menuOpen ? `${index * 50 + 100}ms` : '0ms',
                }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#AEC7E2]/50">
                  <PawPrint className="h-4 w-4 text-[#E35915]" />
                </div>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile CTAs */}
          <div
            className={cn(
              'space-y-3 border-t border-[#AEC7E2]/50 p-6',
              'transform transition-all duration-300',
              menuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
            style={{ transitionDelay: menuOpen ? '250ms' : '0ms' }}
          >
            <Button
              asChild
              variant="outline"
              className="w-full rounded-xl border-[#783201]/20 py-6 text-[#783201]"
            >
              <Link
                href={`/${slug}/login` as Route}
                onClick={() => setMenuOpen(false)}
              >
                Sou da ONG
              </Link>
            </Button>
            <Button
              asChild
              className={cn(
                'w-full rounded-xl py-6',
                'bg-gradient-to-r from-[#E35915] to-[#F07B3D]',
                'shadow-lg shadow-[#E35915]/25'
              )}
            >
              <Link
                href={sectionHref('gatos-disponiveis')}
                onClick={() => setMenuOpen(false)}
              >
                <Heart className="mr-2 h-4 w-4" />
                Quero adotar
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
