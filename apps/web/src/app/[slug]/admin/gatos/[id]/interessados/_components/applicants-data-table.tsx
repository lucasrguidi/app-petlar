'use client'

import {
  CalendarClock,
  Check,
  Eye,
  Loader2,
  MessageCircle,
  UserRound,
  Video,
  X,
} from 'lucide-react'
import { useMemo } from 'react'

import { formatDateTime, getStatusLabel, toWhatsappLink } from './helpers'

import type { ApplicantRow, ApplicationStatus } from './types'
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

interface ApplicantsDataTableProps {
  applicants: ApplicantRow[]
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
  }

  return config[status]
}

function getColumns(
  onOpenDetails: (applicationId: string) => void,
  onUpdateStatus?: (applicationId: string, status: ApplicationStatus) => void,
  isUpdatingStatus?: boolean,
  updatingApplicationId?: string | null
): ColumnDef<ApplicantRow>[] {
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
        const applicant = row.original

        return (
          <div className="space-y-0.5">
            <p className="text-foreground truncate text-sm font-semibold leading-tight">
              {applicant.applicantName}
            </p>
            <a
              href={toWhatsappLink(applicant.applicantWhatsapp)}
              target="_blank"
              rel="noreferrer"
              className="text-primary inline-flex items-center gap-1.5 text-xs hover:underline sm:hidden"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>
          </div>
        )
      },
      meta: { className: 'min-w-[160px]' },
    },
    {
      id: 'whatsapp',
      accessorKey: 'applicantWhatsapp',
      header: () => (
        <span className="text-muted-foreground hidden items-center gap-1.5 text-xs font-medium sm:inline-flex">
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
            className="hidden sm:inline-flex"
          >
            <Button variant="outline" size="sm" className="rounded-xl">
              <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
              Abrir chat
            </Button>
          </a>
        )
      },
      meta: { className: 'hidden sm:table-cell w-40' },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium sm:inline">
          Status
        </span>
      ),
      cell: ({ row }) => {
        const applicant = row.original
        const config = getStatusConfig(applicant.status)
        const isThisUpdating =
          isUpdatingStatus && updatingApplicationId === applicant.id

        if (!onUpdateStatus) {
          return (
            <Badge
              variant={config.variant}
              className="hidden gap-1.5 whitespace-nowrap px-2 py-0.5 text-[11px] font-medium sm:inline-flex"
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)}
              />
              {config.label}
            </Badge>
          )
        }

        return (
          <div className="hidden sm:block">
            <Select
              value={applicant.status}
              onValueChange={(status: ApplicationStatus) =>
                onUpdateStatus(applicant.id, status)
              }
              disabled={isThisUpdating}
            >
              <SelectTrigger className="h-8 w-[130px] rounded-lg border-border/60 text-xs">
                {isThisUpdating ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Salvando...</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn('h-1.5 w-1.5 rounded-full', config.dotClass)}
                    />
                    <SelectValue />
                  </span>
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                    Pendente
                  </span>
                </SelectItem>
                <SelectItem value="reviewing">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-info" />
                    Em análise
                  </span>
                </SelectItem>
                <SelectItem value="approved">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    Aprovado
                  </span>
                </SelectItem>
                <SelectItem value="rejected">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Recusado
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      },
      meta: { className: 'hidden sm:table-cell w-36' },
    },
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: () => (
        <span className="text-muted-foreground hidden items-center gap-1.5 text-xs font-medium md:inline-flex">
          <CalendarClock className="h-3.5 w-3.5 opacity-70" />
          Confirmada em
        </span>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground hidden text-xs md:inline">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
      meta: { className: 'hidden md:table-cell w-40' },
    },
    {
      id: 'mediaCount',
      accessorKey: 'mediaCount',
      header: () => (
        <span className="text-muted-foreground hidden text-xs font-medium md:inline">
          Mídia
        </span>
      ),
      cell: ({ row }) => {
        const count = row.original.mediaCount

        return (
          <Badge
            variant={count > 0 ? 'info' : 'secondary'}
            className="hidden gap-1.5 rounded-full px-2 py-0.5 text-[11px] md:inline-flex"
          >
            {count > 0 ? (
              <Check className="h-3 w-3" />
            ) : (
              <X className="h-3 w-3" />
            )}
            <Video className="h-3 w-3" />
            {count}
          </Badge>
        )
      },
      meta: { className: 'hidden md:table-cell w-20' },
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
            className="rounded-xl"
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Detalhes
          </Button>
        </div>
      ),
      meta: {
        className: 'w-28',
        headerClassName: 'w-28',
      },
    },
  ]
}

export function ApplicantsDataTable({
  applicants,
  onOpenDetails,
  onUpdateStatus,
  isUpdatingStatus,
  updatingApplicationId,
}: ApplicantsDataTableProps) {
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
      data={applicants}
      className="border-border/50 bg-card shadow-warm-sm overflow-hidden rounded-xl border"
      getRowCanExpand={() => false}
    />
  )
}
