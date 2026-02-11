'use client'

import { Check, FilterX, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'

import type { CatsFilters } from './cats-page-content'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface CatsFilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: CatsFilters
  onApply: (filters: Partial<CatsFilters>) => void
  onClear: () => void
}

export function CatsFilterDrawer({
  open,
  onOpenChange,
  filters,
  onApply,
  onClear,
}: CatsFilterDrawerProps) {
  // Local state for the drawer
  const [sex, setSex] = useState<string | undefined>(filters.sex)
  const [fiv, setFiv] = useState<string | undefined>(filters.fiv)
  const [felv, setFelv] = useState<string | undefined>(filters.felv)
  const [castrated, setCastrated] = useState<boolean>(
    filters.castrated === 'true'
  )

  // Sync local state when drawer opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSex(filters.sex)
      setFiv(filters.fiv)
      setFelv(filters.felv)
      setCastrated(filters.castrated === 'true')
    }
    onOpenChange(newOpen)
  }

  const handleApply = () => {
    onApply({
      sex: sex || undefined,
      fiv: fiv || undefined,
      felv: felv || undefined,
      castrated: castrated ? 'true' : undefined,
    })
  }

  const handleClear = () => {
    setSex(undefined)
    setFiv(undefined)
    setFelv(undefined)
    setCastrated(false)
    onClear()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="border-border/60 w-full sm:max-w-md"
      >
        <SheetHeader>
          <SheetTitle className="text-display flex items-center gap-2">
            <SlidersHorizontal className="text-primary h-4 w-4" />
            Filtros avançados
          </SheetTitle>
          <SheetDescription>
            Refine a busca por características específicas
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Sex Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sexo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sex === 'male' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSex(sex === 'male' ? undefined : 'male')}
                className="flex-1 rounded-xl"
              >
                Macho
              </Button>
              <Button
                type="button"
                variant={sex === 'female' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSex(sex === 'female' ? undefined : 'female')}
                className="flex-1 rounded-xl"
              >
                Fêmea
              </Button>
            </div>
          </div>

          {/* FIV Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">FIV</Label>
            <Select
              value={fiv || 'all'}
              onValueChange={(value: string) =>
                setFiv(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer</SelectItem>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
                <SelectItem value="not_tested">Não testado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* FeLV Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">FeLV</Label>
            <Select
              value={felv || 'all'}
              onValueChange={(value: string) =>
                setFelv(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Qualquer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer</SelectItem>
                <SelectItem value="positive">Positivo</SelectItem>
                <SelectItem value="negative">Negativo</SelectItem>
                <SelectItem value="not_tested">Não testado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Castrated Filter */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="castrated"
              checked={castrated}
              onCheckedChange={(checked) => setCastrated(checked === true)}
            />
            <Label
              htmlFor="castrated"
              className="cursor-pointer text-sm font-medium"
            >
              Apenas castrados
            </Label>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            className="flex-1 gap-2 rounded-xl"
          >
            <FilterX className="h-4 w-4" />
            Limpar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="shadow-primary-glow flex-1 gap-2 rounded-xl"
          >
            <Check className="h-4 w-4" />
            Aplicar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
