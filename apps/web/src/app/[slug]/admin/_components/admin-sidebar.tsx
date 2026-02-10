'use client'

import {
  Cat,
  ChevronRight,
  FileText,
  Heart,
  LayoutDashboard,
  Menu,
  PawPrint,
  Users,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'

type UserRole = 'admin' | 'volunteer'

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
  description: string
}

interface AdminSidebarProps {
  orgName: string
  orgLogo: string | null
  userRole: UserRole
}

export function AdminSidebar({
  orgName,
  orgLogo,
  userRole,
}: AdminSidebarProps) {
  const pathname = usePathname()
  const slug = useOrgSlug()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: `/${slug}/admin`,
      icon: LayoutDashboard,
      description: 'Visão geral',
    },
    {
      title: 'Gatos',
      href: `/${slug}/admin/gatos`,
      icon: Cat,
      description: 'Gerenciar felinos',
    },
    {
      title: 'Adotados',
      href: `/${slug}/admin/adotados`,
      icon: Heart,
      description: 'Histórico de adoções',
    },
    {
      title: 'Formulários',
      href: `/${slug}/admin/formularios`,
      icon: FileText,
      adminOnly: true,
      description: 'Configurar formulários',
    },
    {
      title: 'Equipe',
      href: `/${slug}/admin/usuarios`,
      icon: Users,
      adminOnly: true,
      description: 'Gerenciar usuários',
    },
  ]

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || userRole === 'admin'
  )

  const isActiveRoute = (href: string) => {
    if (href === `/${slug}/admin`) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo Header */}
      <div className="p-4">
        <Link
          href={`/${slug}/admin`}
          className="group hover:bg-primary/5 flex items-center gap-3 rounded-xl p-2 transition-colors"
        >
          {/* Logo */}
          <div className="relative">
            <div className="from-primary to-accent shadow-warm-md flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br">
              {orgLogo ? (
                <img
                  src={orgLogo}
                  alt={orgName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <PawPrint className="h-6 w-6 text-white" strokeWidth={2} />
              )}
            </div>
            {/* Online indicator */}
            <div className="border-sidebar bg-success absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2" />
          </div>

          {/* Org name */}
          <div className="flex-1 overflow-hidden">
            <p className="text-display text-sidebar-foreground truncate text-sm font-semibold">
              {orgName}
            </p>
            <p className="text-muted-foreground text-xs">Painel Admin</p>
          </div>
        </Link>
      </div>

      {/* Divider */}
      <div className="via-border mx-4 h-px bg-gradient-to-r from-transparent to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className="text-muted-foreground/70 mb-2 px-3 text-[10px] font-semibold tracking-wider uppercase">
          Menu
        </p>
        {filteredNavItems.map((item) => {
          const isActive = isActiveRoute(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'from-primary to-primary/90 text-primary-foreground shadow-primary-glow bg-gradient-to-r'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="bg-primary-foreground/30 absolute top-1/2 -left-3 h-8 w-1 -translate-y-1/2 rounded-r-full" />
              )}

              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary-foreground/20'
                    : 'bg-muted/50 group-hover:bg-primary/10 group-hover:text-primary'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1">
                <span>{item.title}</span>
              </div>

              {/* Arrow on hover */}
              <ChevronRight
                className={cn(
                  'h-4 w-4 opacity-0 transition-all duration-200',
                  isActive
                    ? 'opacity-50'
                    : 'group-hover:translate-x-0.5 group-hover:opacity-50'
                )}
              />
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-sidebar-border border-t p-4">
        <div className="from-primary/5 to-accent/5 rounded-xl bg-gradient-to-br p-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Cat className="text-primary h-4 w-4" />
            </div>
            <div>
              <p className="text-foreground text-xs font-medium">PetLar</p>
              <p className="text-muted-foreground text-[10px]">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="icon"
        className="border-border/50 bg-card/80 shadow-warm-md fixed top-4 left-4 z-50 h-10 w-10 rounded-xl backdrop-blur-sm md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="bg-foreground/20 fixed inset-0 z-40 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'border-sidebar-border bg-sidebar shadow-warm-xl fixed inset-y-0 left-0 z-50 w-72 border-r transition-transform duration-300 ease-out md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 rounded-lg"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </Button>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar - fixed height with internal scroll */}
      <aside className="border-sidebar-border bg-sidebar hidden h-screen w-64 shrink-0 border-r md:block">
        <SidebarContent />
      </aside>
    </>
  )
}
