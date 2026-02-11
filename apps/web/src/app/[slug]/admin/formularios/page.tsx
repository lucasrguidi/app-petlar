'use client'

import { FileText, Plus } from 'lucide-react'
import { type Route } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { FormsLoadingSkeleton } from './_components/forms-loading-skeleton'
import { FormsPageContent } from './_components/forms-page-content'

import { Button } from '@/components/ui/button'
import { useOrgSlug } from '@/hooks/use-org-slug'

export default function FormulariosPage() {
  const slug = useOrgSlug()

  return (
    <div className="mx-auto flex h-full w-full max-w-6xl flex-col">
      <div className="flex shrink-0 flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-display flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileText className="text-primary h-6 w-6" />
            Formulários
          </h1>
          <p className="text-muted-foreground">
            Crie modelos simples para as candidaturas de adoção
          </p>
        </div>

        <Button
          asChild
          className="shadow-primary-glow hover:shadow-primary-glow-hover hidden gap-2 rounded-xl sm:flex"
        >
          <Link href={`/${slug}/admin/formularios/novo` as Route}>
            <Plus className="h-4 w-4" />
            Criar novo formulário
          </Link>
        </Button>
      </div>

      <Suspense fallback={<FormsLoadingSkeleton />}>
        <FormsPageContent />
      </Suspense>

      <Link
        href={`/${slug}/admin/formularios/novo` as Route}
        className="bg-primary text-primary-foreground shadow-primary-glow fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-xl transition-transform hover:scale-105 active:scale-95 sm:hidden"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
