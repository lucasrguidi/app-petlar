'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'

import { InviteUserModal } from './invite-user-modal'
import { PendingInvitesSection } from './pending-invites-section'
import { UsersFilterBar } from './users-filter-bar'
import { UsersList } from './users-list'

export interface UsersFilters {
  search?: string
  page: number
  includeInactive: boolean
}

interface UsersPageContentProps {
  searchParams: {
    search?: string
    page?: string
    includeInactive?: string
  }
}

export function UsersPageContent({ searchParams }: UsersPageContentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)

  const filters: UsersFilters = useMemo(
    () => ({
      search: searchParams.search || '',
      page: parseInt(searchParams.page || '1', 10) || 1,
      includeInactive: searchParams.includeInactive === 'true',
    }),
    [searchParams.search, searchParams.page, searchParams.includeInactive]
  )

  const updateFilters = useCallback(
    (newFilters: Partial<UsersFilters>, resetPage = true) => {
      startTransition(() => {
        const params = new URLSearchParams()
        const merged = {
          ...filters,
          ...newFilters,
          page: resetPage ? 1 : (newFilters.page ?? filters.page),
        }

        if (merged.search) {
          params.set('search', merged.search)
        }

        if (merged.page > 1) {
          params.set('page', String(merged.page))
        }

        if (merged.includeInactive) {
          params.set('includeInactive', 'true')
        }

        const queryString = params.toString()
        router.push(queryString ? `?${queryString}` : '?', { scroll: false })
      })
    },
    [filters, router]
  )

  const handleSearchChange = useCallback(
    (search: string) => {
      updateFilters({ search })
    },
    [updateFilters]
  )

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateFilters({ page: newPage }, false)
    },
    [updateFilters]
  )

  const handleClearFilters = useCallback(() => {
    updateFilters({ search: undefined, includeInactive: false })
  }, [updateFilters])

  const handleIncludeInactiveChange = useCallback(
    (includeInactive: boolean) => {
      updateFilters({ includeInactive })
    },
    [updateFilters]
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0">
        <UsersFilterBar
          search={filters.search || ''}
          onSearchChange={handleSearchChange}
          onInviteClick={() => setInviteModalOpen(true)}
          isPending={isPending}
          includeInactive={filters.includeInactive}
          onIncludeInactiveChange={handleIncludeInactiveChange}
        />
      </div>

      <PendingInvitesSection />

      <UsersList
        filters={filters}
        onPageChange={handlePageChange}
        onClearFilters={handleClearFilters}
      />

      <InviteUserModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      />
    </div>
  )
}
