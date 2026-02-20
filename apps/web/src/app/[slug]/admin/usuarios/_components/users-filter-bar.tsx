'use client'

import { Loader2, Search, UserPlus } from 'lucide-react'
import { useDeferredValue, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface UsersFilterBarProps {
  search: string
  onSearchChange: (search: string) => void
  onInviteClick: () => void
  isPending?: boolean
  includeInactive: boolean
  onIncludeInactiveChange: (includeInactive: boolean) => void
}

export function UsersFilterBar({
  search,
  onSearchChange,
  onInviteClick,
  isPending,
  includeInactive,
  onIncludeInactiveChange,
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
      <CardContent className="p-2.5 sm:p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:flex-1">
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
              className="border-border/40 bg-card h-10 rounded-xl pl-10 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label
              htmlFor="includeInactive"
              className="border-border/60 bg-muted/20 hover:bg-muted/30 flex h-10 cursor-pointer items-center gap-2 rounded-xl border px-3 transition-colors"
            >
              <Checkbox
                id="includeInactive"
                checked={includeInactive}
                onCheckedChange={(checked) =>
                  onIncludeInactiveChange(checked === true)
                }
              />
              <span className="text-muted-foreground text-sm">
                Mostrar desativados
              </span>
            </label>

            <Button
              onClick={onInviteClick}
              className="shadow-primary-glow hover:shadow-primary-glow-hover h-10 w-full gap-2 rounded-xl px-3 sm:w-auto sm:px-4"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Convidar usuário</span>
              <span className="sm:hidden">Convidar usuário</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
