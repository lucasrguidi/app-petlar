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
}

interface UsersPageContentProps {
  searchParams: {
    search?: string
    page?: string
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
    }),
    [searchParams.search, searchParams.page]
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
    updateFilters({ search: undefined })
  }, [updateFilters])

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="shrink-0">
        <UsersFilterBar
          search={filters.search || ''}
          onSearchChange={handleSearchChange}
          onInviteClick={() => setInviteModalOpen(true)}
          isPending={isPending}
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
