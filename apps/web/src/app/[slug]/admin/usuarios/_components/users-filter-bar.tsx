'use client'

import { Loader2, Search, UserPlus } from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface UsersFilterBarProps {
  search: string
  onSearchChange: (search: string) => void
  onInviteClick: () => void
  isPending?: boolean
}

export function UsersFilterBar({
  search,
  onSearchChange,
  onInviteClick,
  isPending,
}: UsersFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(search)
  const deferredSearch = useDeferredValue(localSearch)

  useEffect(() => {
    if (deferredSearch !== search) {
      onSearchChange(deferredSearch)
    }
  }, [deferredSearch, search, onSearchChange])

  useEffect(() => {
    setLocalSearch(search)
  }, [search])

  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl border">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            {isPending ? (
              <Loader2 className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 animate-spin" />
            ) : (
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            )}
            <Input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="border-border/40 bg-card h-10 rounded-lg pl-10 text-sm"
            />
          </div>

          <Button
            onClick={onInviteClick}
            className="shadow-primary-glow hover:shadow-primary-glow-hover gap-2 rounded-xl"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Convidar usuário</span>
            <span className="sm:hidden">Convidar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
