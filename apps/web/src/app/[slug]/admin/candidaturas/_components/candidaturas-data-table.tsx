'use client'

import {
  CalendarClock,
  Cat,
  Eye,
  Loader2,
  MessageCircle,
  PawPrint,
  UserRound,
} from 'lucide-react'
import { useMemo } from 'react'

import {
  formatDateTime,
  getStatusLabel,
  toWhatsappLink,
} from '../../gatos/[id]/interessados/_components/helpers'

import type { ApplicationStatus } from '../../gatos/[id]/interessados/_components/types'
import type { ColumnDef } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export interface CandidaturaRow {
  id: string
  applicantName: string
  applicantWhatsapp: string
  status: ApplicationStatus
  isPermanentRejectionActive: boolean
  createdAt: string | Date
  catName: string | null
  catPhotoUrl: string | null
  groupCatNames: string[] | null
}

interface CandidaturasDataTableProps {
  rows: CandidaturaRow[]
  onOpenDetails: (applicationId: string) => void
  onUpdateStatus?: (applicationId: string, status: ApplicationStatus) => void
  isUpdatingStatus?: boolean
  updatingApplicationId?: string | null
}

function getStatusConfig(status: ApplicationStatus) {
  const config = {
    pending: {
      label: getStatusLabel(status),
      variant: 'warning' as const,
      dotClass: 'bg-warning',
    },
    reviewing: {
      label: getStatusLabel(status),
      variant: 'info' as const,
      dotClass: 'bg-info',
    },
    approved: {
      label: getStatusLabel(status),
      variant: 'success' as const,
      dotClass: 'bg-success',
    },
    rejected: {
      label: getStatusLabel(status),
      variant: 'destructive' as const,
      dotClass: 'bg-destructive',
    },
    permanently_rejected: {
      label: getStatusLabel(status),
      variant: 'destructive' as const,
      dotClass: 'bg-destructive',
    },
  }

  return config[status]
}

function getColumns(
  onOpenDetails: (applicationId: string) => void,
  onUpdateStatus?: (applicationId: string, status: ApplicationStatus) => void,
  isUpdatingStatus?: boolean,
  updatingApplicationId?: string | null
): ColumnDef<CandidaturaRow>[] {
  return [
    {
      id: 'applicant',
      accessorKey: 'applicantName',
      header: () => (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
          <UserRound className="h-3.5 w-3.5 opacity-70" />
          Candidato
        </span>
      ),
      cell: ({ row }) => {
        const r = row.original
        const displayCatName = r.catName ?? 'Desconhecido'

        return (
          <div className="space-y-0.5">
            <p className="text-foreground truncate text-sm leading-tight font-semibold">
              {r.applicantName}
            </p>
            <p className="text-muted-foreground truncate text-xs sm:hidden">
              <PawPrint className="mr-1 inline h-3 w-3" />
              {displayCatName}
            </p>
            <a
              href={toWhatsappLink(r.applicantWhatsapp)}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1.5 text-xs font-medium hover:underline sm:hidden"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        )
      },
      meta: { className: 'min-w-[140px]' },
    },
    {
      id: 'cat',
      header: () => (
        <span className="text-muted-foreground hidden items-center gap-1.5 text-xs font-medium sm:inline-flex">
          <Cat className="h-3.5 w-3.5 opacity-70" />
          Gato
        </span>
      ),
      cell: ({ row }) => {
        const r = row.original
        const displayName = r.catName ?? 'Desconhecido'

        return (
          <div className="hidden items-center gap-2 sm:flex">
            {r.catPhotoUrl ? (
              <img
                src={r.catPhotoUrl}
                alt={displayName}
                className="border-border/40 h-8 w-8 shrink-0 rounded-lg border object-cover"
              />
            ) : (
              <div className="bg-muted text-muted-foreground border-border/40 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                <PawPrint className="h-3.5 w-3.5" />
              </div>
            )}
            <span className="text-foreground truncate text-sm">
              {displayName}
            </span>
          </div>
        )
      },
      meta: { className: 'hidden sm:table-cell w-40' },
    },
    {
      id: 'whatsapp',
      accessorKey: 'applicantWhatsapp',
      header: () => (
        <span className="text-muted-foreground hidden items-center gap-1.5 text-xs font-medium md:inline-flex">
          <MessageCircle className="h-3.5 w-3.5 opacity-70" />
          WhatsApp
        </span>
      ),
      cell: ({ row }) => {
        const whatsapp = row.original.applicantWhatsapp

        return (
          <a
            href={toWhatsappLink(whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex"
          >
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-emerald-200/80 bg-emerald-50/70 px-2.5 text-xs text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-800"
            >
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </a>
        )
      },
      meta: { className: 'hidden md:table-cell w-36' },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <span className="text-muted-foreground text-xs font-medium">
          Status
        </span>
      ),
      cell: ({ row }) => {
        const r = row.original
        const config = getStatusConfig(r.status)
        const isThisUpdating =
          isUpdatingStatus && updatingApplicationId === r.id

        if (!onUpdateStatus || r.isPermanentRejectionActive) {
          return (
            <Badge
              variant={config.variant}
              className="gap-1.5 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)}
              />
              {config.label}
            </Badge>
          )
        }

        if (isThisUpdating) {
          return (
            <div className="border-border/60 bg-card flex h-8 w-[172px] items-center gap-1.5 rounded-lg border px-3 text-xs">
              <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
              <span>Salvando...</span>
            </div>
          )
        }

        return (
          <div>
            <Select
              value={r.status}
              onValueChange={(status: ApplicationStatus) =>
                onUpdateStatus(r.id, status)
              }
            >
              <SelectTrigger className="border-border/60 h-8 w-[172px] rounded-lg text-xs whitespace-nowrap">
                <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      config.dotClass
                    )}
                  />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-warning h-1.5 w-1.5 rounded-full" />
                    Pendente
                  </span>
                </SelectItem>
                <SelectItem value="reviewing">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-info h-1.5 w-1.5 rounded-full" />
                    Em análise
                  </span>
                </SelectItem>
                <SelectItem value="approved">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-success h-1.5 w-1.5 rounded-full" />
                    Aprovado
                  </span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="flex items-center gap-1.5">
                    <span className="bg-destructive h-1.5 w-1.5 rounded-full" />
                    Recusado
                  </span>
                </SelectItem>
                <SelectItem value="permanently_rejected" disabled>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="bg-destructive h-1.5 w-1.5 rounded-full" />
                    Rejeição permanente
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      },
      meta: { className: 'w-[176px] sm:w-44' },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: () => (
        <span className="text-muted-foreground hidden items-center gap-1.5 text-xs font-medium lg:inline-flex">
          <CalendarClock className="h-3.5 w-3.5 opacity-70" />
          Candidatura em
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground hidden text-xs lg:inline">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
      meta: { className: 'hidden lg:table-cell w-40' },
    },
    {
      id: 'actions',
      header: () => null,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenDetails(row.original.id)}
            className="h-8 rounded-lg px-2 text-xs sm:px-3"
          >
            <Eye className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="ml-1 sm:hidden">Ver</span>
            <span className="hidden sm:inline">Detalhes</span>
          </Button>
        </div>
      ),
      meta: {
        className: 'w-20 sm:w-28',
        headerClassName: 'w-20 sm:w-28',
      },
    },
  ]
}

export function CandidaturasDataTable({
  rows,
  onOpenDetails,
  onUpdateStatus,
  isUpdatingStatus,
  updatingApplicationId,
}: CandidaturasDataTableProps) {
  const columns = useMemo(
    () =>
      getColumns(
        onOpenDetails,
        onUpdateStatus,
        isUpdatingStatus,
        updatingApplicationId
      ),
    [onOpenDetails, onUpdateStatus, isUpdatingStatus, updatingApplicationId]
  )

  return (
    <DataTable
      columns={columns}
      data={rows}
      className="border-border/50 bg-card shadow-warm-sm overflow-hidden rounded-xl border"
      getRowCanExpand={() => false}
    />
  )
}
