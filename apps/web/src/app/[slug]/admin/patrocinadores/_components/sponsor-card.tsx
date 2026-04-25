'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ExternalLink,
  GripVertical,
  Pencil,
  Star,
  Trash2,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SponsorCardProps {
  id: string
  name: string
  logoUrl: string
  websiteUrl: string
  featured: boolean
  onEdit: () => void
  onDelete: () => void
}

export function SponsorCard({
  id,
  name,
  logoUrl,
  websiteUrl,
  featured,
  onEdit,
  onDelete,
}: SponsorCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const truncatedUrl = websiteUrl
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '')

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 border-b p-4 last:border-b-0',
        isDragging && 'bg-muted/50 z-10 rounded-xl shadow-lg'
      )}
    >
      {/* Drag handle */}
      <button
        className="text-muted-foreground/50 hover:text-muted-foreground shrink-0 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Logo thumbnail */}
      <div className="border-border/60 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
        <img
          src={logoUrl}
          alt={name}
          className="h-full w-full object-contain p-1"
        />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{name}</p>
          {featured && (
            <Badge
              variant="secondary"
              className="bg-warning/10 text-warning border-warning/20 shrink-0 gap-1 border"
            >
              <Star className="h-3 w-3" />
              Destaque
            </Badge>
          )}
        </div>
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary inline-flex items-center gap-1 text-xs transition-colors"
        >
          {truncatedUrl}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive h-9 w-9 rounded-xl"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
