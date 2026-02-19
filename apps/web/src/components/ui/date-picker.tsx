'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as React from 'react'
import { DayPicker } from 'react-day-picker'

import { Button } from '@/components/ui/button'
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-start gap-2 rounded-xl px-3 text-left font-normal',
            'border-border/60 bg-card shadow-warm-sm',
            'transition-all duration-200',
            'hover:border-primary/40 hover:bg-primary/5 hover:shadow-warm-md',
            'focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-2',
            !value && 'text-muted-foreground',
            value && 'text-foreground',
            className
          )}
        >
          <CalendarDays className="text-primary/70 h-4 w-4 shrink-0" />
          <span className="flex-1 truncate text-sm">
            {value
              ? format(value, 'dd/MM/yyyy', { locale: ptBR })
              : placeholder}
          </span>
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange?.(undefined)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation()
                  onChange?.(undefined)
                }
              }}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md p-0.5 transition-colors"
              aria-label="Limpar data"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="border-border/60 bg-card shadow-warm-lg w-auto overflow-hidden rounded-xl p-0"
        align="start"
        sideOffset={6}
      >
        <DayPicker
          mode="single"
          selected={value}
          onSelect={handleSelect}
          locale={ptBR}
          fromDate={fromDate}
          toDate={toDate}
          defaultMonth={value}
          showOutsideDays
          className="p-3"
          classNames={{
            months: 'flex flex-col',
            month: 'space-y-3',
            month_caption: 'flex justify-center relative items-center h-9',
            caption_label: 'text-sm font-semibold text-foreground',
            nav: 'flex items-center gap-1',
            button_previous: cn(
              'absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-lg',
              'border border-transparent bg-transparent',
              'text-muted-foreground transition-all duration-150',
              'hover:border-border/60 hover:bg-muted/50 hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              'disabled:pointer-events-none disabled:opacity-40'
            ),
            button_next: cn(
              'absolute right-0 inline-flex h-8 w-8 items-center justify-center rounded-lg',
              'border border-transparent bg-transparent',
              'text-muted-foreground transition-all duration-150',
              'hover:border-border/60 hover:bg-muted/50 hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              'disabled:pointer-events-none disabled:opacity-40'
            ),
            weekdays: 'flex',
            weekday: cn(
              'w-9 rounded-md text-center text-[0.75rem] font-medium',
              'text-muted-foreground/80'
            ),
            week: 'flex w-full mt-1',
            day: cn(
              'relative h-9 w-9 p-0 text-center text-sm',
              'focus-within:relative focus-within:z-20',
              '[&:has([aria-selected])]:bg-primary/10',
              '[&:has([aria-selected])]:rounded-lg'
            ),
            day_button: cn(
              'inline-flex h-9 w-9 items-center justify-center rounded-lg',
              'text-sm font-normal text-foreground',
              'transition-all duration-150',
              'hover:bg-primary/10 hover:text-primary',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              'aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:font-medium',
              'aria-selected:hover:bg-primary aria-selected:hover:text-primary-foreground'
            ),
            today: cn(
              'relative font-semibold text-primary',
              'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2',
              'after:h-1 after:w-1 after:rounded-full after:bg-primary'
            ),
            outside:
              'text-muted-foreground/40 aria-selected:text-primary-foreground/70',
            disabled:
              'text-muted-foreground/30 hover:bg-transparent hover:text-muted-foreground/30',
            hidden: 'invisible',
          }}
          components={{
            Chevron: ({ orientation }) => {
              if (orientation === 'left') {
                return <ChevronLeft className="h-4 w-4" />
              }
              return <ChevronRight className="h-4 w-4" />
            },
          }}
        />

        {/* Quick actions footer */}
        <div className="border-border/40 bg-muted/30 flex items-center justify-between border-t px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 hover:text-primary h-7 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
            onClick={() => handleSelect(new Date())}
          >
            <CalendarDays className="h-3 w-3" />
            Hoje
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-7 gap-1.5 rounded-lg px-2.5 text-xs font-medium"
              onClick={() => handleSelect(undefined)}
            >
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
