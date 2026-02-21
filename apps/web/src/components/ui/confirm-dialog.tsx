'use client'

import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { type LucideIcon } from 'lucide-react'
import * as React from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ConfirmDialogVariant = 'destructive' | 'success' | 'warning' | 'info'
type ConfirmDialogMode = 'alert' | 'dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 'alert' = AlertDialog (não fecha ao clicar fora). 'dialog' = Dialog (fecha ao clicar fora). */
  mode?: ConfirmDialogMode
  variant: ConfirmDialogVariant
  icon: LucideIcon
  title: string
  /** Subtítulo opcional exibido abaixo do título na faixa colorida */
  subtitle?: string
  description?: React.ReactNode
  /** Nota contextual exibida abaixo da descrição em card muted */
  note?: React.ReactNode
  /** Conteúdo adicional (ex: formulário) inserido entre a descrição e o footer */
  children?: React.ReactNode
  cancelLabel?: string
  actionLabel: string
  actionLoadingLabel?: string
  isLoading?: boolean
  isActionDisabled?: boolean
  onAction: () => void
}

const variantStyles: Record<
  ConfirmDialogVariant,
  { zone: string; dot: string; icon: string }
> = {
  destructive: {
    zone: 'border-destructive/20 bg-destructive/10',
    dot: 'bg-destructive/15',
    icon: 'text-destructive',
  },
  success: {
    zone: 'border-success/20 bg-success/10',
    dot: 'bg-success/15',
    icon: 'text-success',
  },
  warning: {
    zone: 'border-warning/20 bg-warning/10',
    dot: 'bg-warning/15',
    icon: 'text-warning',
  },
  info: {
    zone: 'border-info/20 bg-info/10',
    dot: 'bg-info/15',
    icon: 'text-info',
  },
}

const actionButtonVariant: Record<ConfirmDialogVariant, string> = {
  destructive:
    'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  success: 'bg-success text-success-foreground hover:bg-success/90',
  warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
  info: 'bg-info text-info-foreground hover:bg-info/90',
}

// ─── Shared inner layout (variant-agnostic) ──────────────────────────────────

interface InnerProps {
  variant: ConfirmDialogVariant
  icon: LucideIcon
  title: string
  subtitle?: string
  description?: React.ReactNode
  note?: React.ReactNode
  children?: React.ReactNode
  cancelLabel: string
  actionLabel: string
  actionLoadingLabel: string
  isLoading: boolean
  isActionDisabled: boolean
  onAction: () => void
  TitleComponent: React.ElementType
  DescriptionComponent: React.ElementType
  CancelComponent: React.ElementType
}

function ConfirmDialogInner({
  variant,
  icon: Icon,
  title,
  subtitle,
  description,
  note,
  children,
  cancelLabel,
  actionLabel,
  actionLoadingLabel,
  isLoading,
  isActionDisabled,
  onAction,
  TitleComponent,
  DescriptionComponent,
  CancelComponent,
}: InnerProps) {
  const styles = variantStyles[variant]

  return (
    <>
      {/* Faixa colorida */}
      <div
        className={cn(
          'flex items-center gap-3 border-b px-5 py-4',
          styles.zone
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            styles.dot
          )}
        >
          <Icon className={cn('h-5 w-5', styles.icon)} />
        </div>
        <div className="space-y-0.5">
          <TitleComponent className="text-base font-semibold leading-none">
            {title}
          </TitleComponent>
          {subtitle && (
            <DescriptionComponent className="text-muted-foreground text-xs">
              {subtitle}
            </DescriptionComponent>
          )}
        </div>
      </div>

      {/* Corpo */}
      {(description ?? note ?? children) && (
        <div className="space-y-3 px-5 pt-4 pb-5">
          {description && !subtitle && (
            <DescriptionComponent className="text-foreground/80 text-sm leading-relaxed">
              {description}
            </DescriptionComponent>
          )}
          {description && subtitle && (
            <p className="text-foreground/80 text-sm leading-relaxed">
              {description}
            </p>
          )}
          {note && (
            <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
              <p className="text-muted-foreground text-xs leading-relaxed">
                {note}
              </p>
            </div>
          )}
          {children}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-col-reverse gap-2 border-t border-border/40 bg-card px-5 py-3 sm:flex-row sm:justify-end">
        <CancelComponent
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-9 rounded-lg sm:mt-0'
          )}
        >
          {cancelLabel}
        </CancelComponent>
        <button
          onClick={onAction}
          disabled={isLoading || isActionDisabled}
          className={cn(
            buttonVariants(),
            'h-9 rounded-lg',
            actionButtonVariant[variant],
            (isLoading || isActionDisabled) && 'pointer-events-none opacity-50'
          )}
        >
          {isLoading ? actionLoadingLabel : actionLabel}
        </button>
      </div>
    </>
  )
}

// ─── Alert mode (AlertDialog — não fecha ao clicar fora) ─────────────────────

function AlertMode({
  open,
  onOpenChange,
  ...innerProps
}: Omit<ConfirmDialogProps, 'mode'> & { open: boolean }) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
        <AlertDialogPrimitive.Content className="bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border shadow-lg duration-200">
          <ConfirmDialogInner
            {...innerProps}
            TitleComponent={AlertDialogPrimitive.Title}
            DescriptionComponent={AlertDialogPrimitive.Description}
            CancelComponent={AlertDialogPrimitive.Cancel}
          />
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

// ─── Dialog mode (Dialog — fecha ao clicar fora) ─────────────────────────────

function DialogMode({
  open,
  onOpenChange,
  ...innerProps
}: Omit<ConfirmDialogProps, 'mode'> & { open: boolean }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80" />
        <DialogPrimitive.Content className="bg-card data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-xl border shadow-lg duration-200">
          <ConfirmDialogInner
            {...innerProps}
            TitleComponent={DialogPrimitive.Title}
            DescriptionComponent={DialogPrimitive.Description}
            CancelComponent={DialogPrimitive.Close}
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

export function ConfirmDialog({
  mode = 'alert',
  ...props
}: ConfirmDialogProps) {
  if (mode === 'dialog') {
    return <DialogMode {...props} />
  }
  return <AlertMode {...props} />
}
