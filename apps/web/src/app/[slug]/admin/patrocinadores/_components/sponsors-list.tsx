'use client'

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Star } from 'lucide-react'

import { SponsorCard } from './sponsor-card'

import { Card } from '@/components/ui/card'

interface Sponsor {
  id: string
  name: string
  logoUrl: string
  websiteUrl: string
  featured: boolean
  order: number
}

interface SponsorsListProps {
  sponsors: Sponsor[]
  onReorder: (activeId: string, overId: string) => void
  onEdit: (sponsor: Sponsor) => void
  onDelete: (sponsor: Sponsor) => void
}

function SponsorGroup({
  label,
  icon,
  sponsors,
  onReorder,
  onEdit,
  onDelete,
}: {
  label: string
  icon?: React.ReactNode
  sponsors: Sponsor[]
  onReorder: (activeId: string, overId: string) => void
  onEdit: (sponsor: Sponsor) => void
  onDelete: (sponsor: Sponsor) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string)
    }
  }

  return (
    <div>
      <div className="text-muted-foreground/70 mb-2 flex items-center gap-1.5 px-1 text-[11px] font-semibold tracking-wider uppercase">
        {icon}
        {label}
      </div>
      <Card className="border-border/60 bg-card/95 shadow-warm-sm overflow-hidden rounded-xl">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sponsors.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            {sponsors.map((sponsor) => (
              <SponsorCard
                key={sponsor.id}
                id={sponsor.id}
                name={sponsor.name}
                logoUrl={sponsor.logoUrl}
                websiteUrl={sponsor.websiteUrl}
                featured={sponsor.featured}
                onEdit={() => onEdit(sponsor)}
                onDelete={() => onDelete(sponsor)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Card>
    </div>
  )
}

export function SponsorsList({
  sponsors,
  onReorder,
  onEdit,
  onDelete,
}: SponsorsListProps) {
  const featured = sponsors.filter((s) => s.featured)
  const regular = sponsors.filter((s) => !s.featured)

  return (
    <div className="space-y-6">
      {featured.length > 0 && (
        <SponsorGroup
          label="Destaques"
          icon={<Star className="h-3 w-3" />}
          sponsors={featured}
          onReorder={onReorder}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      {regular.length > 0 && (
        <SponsorGroup
          label="Patrocinadores"
          sponsors={regular}
          onReorder={onReorder}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
