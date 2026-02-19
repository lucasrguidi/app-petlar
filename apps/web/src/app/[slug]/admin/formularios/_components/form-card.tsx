'use client'

import { CalendarClock, FileText } from 'lucide-react'

import { FormActionsMenu } from './form-actions-menu'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Form {
  id: string
  name: string
  active: boolean
  fieldsCount: number
  linkedCatsCount: number
  updatedAt: Date | string | number
}

interface FormCardProps {
  form: Form
}

function formatUpdatedAt(date: Date | string | number): string {
  const normalizedDate = date instanceof Date ? date : new Date(date)

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(normalizedDate)
}

export function FormCard({ form }: FormCardProps) {
  const hasLinkedCats = form.linkedCatsCount > 0

  return (
    <div className="group border-border/60 bg-card/95 shadow-warm-sm hover:border-border relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md">
      {/* Left accent bar on hover */}
      <div className="group-hover:bg-primary/50 absolute top-0 left-0 h-full w-1 bg-transparent transition-colors" />

      <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Info section */}
        <div className="flex items-start gap-3">
          {/* Icon container */}
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <FileText className="text-primary h-5 w-5" />
          </div>

          <div className="min-w-0 space-y-1.5">
            {/* Name + status indicator */}
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{form.name}</h3>
              <span
                className={cn(
                  'h-2 w-2 shrink-0 rounded-full',
                  form.active ? 'bg-success' : 'bg-muted-foreground/40'
                )}
                title={form.active ? 'Ativo' : 'Inativo'}
              />
            </div>

            {/* Metadata */}
            <p className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
              <CalendarClock className="h-3.5 w-3.5" />
              Editado em {formatUpdatedAt(form.updatedAt)}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="rounded-md text-[10px]">
                {form.fieldsCount} pergunta{form.fieldsCount !== 1 && 's'}
              </Badge>
              <Badge
                variant={hasLinkedCats ? 'info' : 'secondary'}
                className="rounded-md text-[10px]"
              >
                {form.linkedCatsCount} gato{form.linkedCatsCount !== 1 && 's'}
              </Badge>
              {!form.active && (
                <Badge variant="warning" className="rounded-md text-[10px]">
                  Inativo
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end">
          <FormActionsMenu form={form} />
        </div>
      </div>

      {/* Warning for linked cats */}
      {hasLinkedCats && (
        <div className="border-border/40 bg-muted/20 border-t px-4 py-2">
          <p className="text-muted-foreground text-xs">
            Este formulário está em uso e não pode ser excluído.
          </p>
        </div>
      )}
    </div>
  )
}
