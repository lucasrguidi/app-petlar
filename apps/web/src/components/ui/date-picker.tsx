'use client'

import { format, isAfter, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon, ChevronDown, X } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  fromDate?: Date
  toDate?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Selecionar',
  disabled = false,
  className,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      onChange?.(date)
      setOpen(false)
    },
    [onChange]
  )

  const handleClear = React.useCallback(() => {
    onChange?.(undefined)
    setOpen(false)
  }, [onChange])

  const formattedDate = value
    ? format(value, 'dd/MM/yyyy', { locale: ptBR })
    : undefined
  const today = startOfDay(new Date())
  const isTodayOutOfRange =
    (fromDate ? isBefore(today, startOfDay(fromDate)) : false) ||
    (toDate ? isAfter(today, startOfDay(toDate)) : false)

  const handleSelectToday = React.useCallback(() => {
    if (isTodayOutOfRange) return
    handleSelect(today)
  }, [handleSelect, isTodayOutOfRange, today])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between gap-2 rounded-xl px-3 text-left text-sm font-normal',
            'border-border/60 bg-card/95 shadow-warm-sm',
            'transition-all duration-200',
            'hover:border-primary/35 hover:bg-card',
            'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2',
            'data-[state=open]:border-primary/45 data-[state=open]:bg-primary/[0.06] data-[state=open]:shadow-warm-md',
            !value && 'text-muted-foreground',
            value && 'text-foreground',
            className
          )}
          aria-label={
            formattedDate
              ? `Data selecionada: ${formattedDate}`
              : placeholder
          }
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <CalendarIcon className="text-primary/70 h-4 w-4 shrink-0" />
            <span className="truncate">{formattedDate ?? placeholder}</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
              open && 'rotate-180 text-foreground'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-border/60 bg-card shadow-warm-lg w-auto max-sm:w-[calc(100vw-2.5rem)] overflow-hidden rounded-xl p-0"
        align="start"
        sideOffset={6}
      >
        <div className="border-border/60 bg-muted/20 border-b px-3 py-2">
          <p className="text-foreground text-xs font-medium">
            {formattedDate ? `Selecionada: ${formattedDate}` : 'Selecione uma data'}
          </p>
        </div>
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          locale={ptBR}
          fromDate={fromDate}
          toDate={toDate}
          defaultMonth={value ?? fromDate ?? toDate}
          initialFocus
          className="bg-card p-3"
        />
        <div className="border-border/60 bg-muted/20 flex items-center gap-2 border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectToday}
            disabled={disabled || isTodayOutOfRange}
            className="h-8 flex-1 justify-center rounded-lg text-xs"
          >
            Hoje
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled || !value}
            className="text-muted-foreground hover:text-destructive h-8 flex-1 justify-center gap-1.5 rounded-lg text-xs"
          >
            <X className="h-3.5 w-3.5" />
            Limpar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
