'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Shield, User } from 'lucide-react'

import { UserActionsMenu } from './user-actions-menu'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface UserData {
  id: string
  name: string
  email: string
  image: string | null
  role: 'admin' | 'volunteer'
  active: boolean
  lastLoginAt: Date | string | null
  createdAt: Date | string
}

interface UsersDataTableProps {
  users: UserData[]
  currentUserId: string
  adminCount: number
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function formatLastLogin(date: Date | string | null): string {
  if (!date) return 'Nunca'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 5) return 'Agora'

  return formatDistanceToNow(dateObj, { addSuffix: false, locale: ptBR })
}

export function UsersDataTable({
  users,
  currentUserId,
  adminCount,
}: UsersDataTableProps) {
  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm overflow-hidden rounded-xl border">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">Usuário</TableHead>
              <TableHead>Papel</TableHead>
              <TableHead>Último acesso</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId
              const isLastAdmin = user.role === 'admin' && adminCount === 1

              return (
                <TableRow key={user.id} className="group">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="border-border h-10 w-10 border">
                        {user.image && <AvatarImage src={user.image} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-foreground font-medium">
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
                              className="text-[10px] font-medium"
                            >
                              Desativado
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === 'admin' ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      {user.role === 'admin' ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {user.role === 'admin' ? 'Admin' : 'Voluntário'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground text-sm">
                      {formatLastLogin(user.lastLoginAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {!isCurrentUser && (
                      <UserActionsMenu
                        user={user}
                        isCurrentUser={isCurrentUser}
                        isLastAdmin={isLastAdmin}
                      />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
