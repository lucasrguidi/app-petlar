'use client'

import { ChevronDown, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'

import { signOut } from '@/actions/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOrgHref } from '@/hooks/use-org-href'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'

type UserRole = 'admin' | 'volunteer'

interface AdminHeaderProps {
  user: {
    name: string
    email: string
    image: string | null
    role: UserRole
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getRoleBadge(role: UserRole) {
  const styles = {
    admin: 'bg-primary/10 text-primary border-primary/20',
    volunteer: 'bg-info/10 text-info border-info/20',
  }
  const labels = {
    admin: 'Admin',
    volunteer: 'Voluntário',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
        styles[role]
      )}
    >
      {labels[role]}
    </span>
  )
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const slug = useOrgSlug()
  const profileHref = useOrgHref('/admin/perfil')
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(() => {
      signOut(slug)
    })
  }

  return (
    <header className="border-border/50 bg-card/95 z-30 shrink-0 border-b backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left side - Spacer for mobile */}
        <div className="w-14 md:hidden" />

        {/* Center/Left - Breadcrumb area (can be customized per page) */}
        <div className="hidden flex-1 md:block">
          {/* Future: Add breadcrumbs here */}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="hover:bg-muted h-auto gap-2 rounded-xl px-2 py-1.5"
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="border-primary/20 h-8 w-8 border-2">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="from-primary/20 to-accent/20 text-primary bg-gradient-to-br text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator */}
                  <div className="border-card bg-success absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2" />
                </div>

                {/* User info - hidden on small screens */}
                <div className="hidden text-left sm:block">
                  <p className="text-foreground text-sm leading-none font-medium">
                    {user.name}
                  </p>
                  <div className="mt-1">{getRoleBadge(user.role)}</div>
                </div>

                <ChevronDown className="text-muted-foreground hidden h-4 w-4 sm:block" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="shadow-warm-lg w-64 rounded-xl p-2"
            >
              {/* User info header */}
              <div className="bg-muted/50 mb-2 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <Avatar className="border-primary/20 h-10 w-10 border-2">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="from-primary/20 to-accent/20 text-primary bg-gradient-to-br text-sm font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-foreground truncate text-sm font-semibold">
                      {user.name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="mt-2">{getRoleBadge(user.role)}</div>
              </div>

              <DropdownMenuItem asChild className="cursor-pointer rounded-lg">
                <Link href={profileHref}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu perfil</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />

              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isPending}
                className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isPending ? 'Saindo...' : 'Sair da conta'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
