'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Shield, User, UserRound } from 'lucide-react'
import { useMemo } from 'react'

import { UserActionsMenu } from './user-actions-menu'

import type { ColumnDef } from '@tanstack/react-table'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  name: string
  email: string
  image: string | null
  role: 'admin' | 'volunteer'
  active: boolean
  lastSeenAt: Date | string | null
  createdAt: Date | string
}

interface UsersDataTableProps {
  users: UserData[]
  currentUserId: string
  adminCount: number
}

function ColumnHeader({
  icon: Icon,
  label,
  className,
}: {
  icon?: React.ElementType
  label: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium',
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 opacity-70" />}
      {label}
    </span>
  )
}

function RoleBadge({
  role,
  className,
}: {
  role: UserData['role']
  className?: string
}) {
  const isAdmin = role === 'admin'

  return (
    <Badge
      variant={isAdmin ? 'default' : 'secondary'}
      className={cn('gap-1 px-2 py-0.5 text-[11px] font-medium', className)}
    >
      {isAdmin ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
      {isAdmin ? 'Admin' : 'Voluntário'}
    </Badge>
  )
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatLastSeen(date: Date | string | null): string {
  if (!date) return 'Nunca'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 5) return 'Agora'

  return formatDistanceToNow(dateObj, { addSuffix: false, locale: ptBR })
}

function getColumns(
  currentUserId: string,
  adminCount: number
): ColumnDef<UserData>[] {
  return [
    {
      id: 'user',
      accessorKey: 'name',
      header: () => <ColumnHeader icon={UserRound} label="Usuário" />,
      cell: ({ row }) => {
        const user = row.original
        const isCurrentUser = user.id === currentUserId
        const roleLabel = user.role === 'admin' ? 'Admin' : 'Voluntário'
        const lastSeen = formatLastSeen(user.lastSeenAt)

        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="border-border h-10 w-10 shrink-0 border">
              {user.image && <AvatarImage src={user.image} />}
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <p className="text-foreground truncate text-sm leading-tight font-semibold">
                  {user.name}
                </p>
                {isCurrentUser && (
                  <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] font-medium">
                    você
                  </span>
                )}
                {!user.active && (
                  <Badge
                    variant="destructive"
                    className="px-1.5 py-0.5 text-[10px] font-medium"
                  >
                    Desativado
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground truncate text-sm">
                {user.email}
              </p>

              <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs sm:hidden">
                <span className="inline-flex items-center gap-1">
                  {user.role === 'admin' ? (
                    <Shield className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {roleLabel}
                </span>
                <span className="text-border">•</span>
                <span className="truncate">Acesso {lastSeen}</span>
              </div>
            </div>
          </div>
        )
      },
      meta: { className: 'min-w-0' },
    },
    {
      id: 'role',
      accessorKey: 'role',
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
          Papel
        </span>
      ),
      cell: ({ row }) => (
        <RoleBadge role={row.original.role} className="hidden sm:inline-flex" />
      ),
      meta: { className: 'hidden sm:table-cell w-32' },
    },
    {
      id: 'lastSeen',
      accessorFn: (row) =>
        row.lastSeenAt ? new Date(row.lastSeenAt).getTime() : 0,
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium md:inline">
          Último acesso
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground hidden text-sm md:inline">
          {formatLastSeen(row.original.lastSeenAt)}
        </span>
      ),
      meta: { className: 'hidden md:table-cell w-32' },
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => {
        const user = row.original
        const isCurrentUser = user.id === currentUserId
        const isLastAdmin = user.role === 'admin' && adminCount === 1

        if (isCurrentUser) {
          return <span className="sr-only">Sem ações disponíveis</span>
        }

        return (
          <div className="flex justify-end">
            <UserActionsMenu
              user={user}
              isCurrentUser={isCurrentUser}
              isLastAdmin={isLastAdmin}
            />
          </div>
        )
      },
      meta: {
        className: 'w-12 px-1',
        headerClassName: 'w-12',
      },
    },
  ]
}

export function UsersDataTable({
  users,
  currentUserId,
  adminCount,
}: UsersDataTableProps) {
  const columns = useMemo(
    () => getColumns(currentUserId, adminCount),
    [currentUserId, adminCount]
  )

  return (
    <DataTable
      columns={columns}
      data={users}
      className="border-border/50 bg-card shadow-warm-sm overflow-hidden rounded-xl border"
    />
  )
}
