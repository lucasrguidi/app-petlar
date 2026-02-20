import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { createTRPCClient, httpBatchLink } from '@trpc/client'
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query'
import { toast } from 'sonner'

import type { AppRouter } from '@app-petlar/api/routers/index'

import { authClient } from '@/lib/auth-client'

type TrpcErrorLike = Error & {
  data?: {
    code?: string
    httpStatus?: number
  }
}

let isHandlingUnauthorized = false

function isUnauthorizedError(error: Error): boolean {
  const trpcError = error as TrpcErrorLike
  return (
    trpcError.data?.code === 'UNAUTHORIZED' || trpcError.data?.httpStatus === 401
  )
}

function getAdminLoginPath(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)\/admin(?:\/|$)/)
  if (!match) return null
  return `/${match[1]}/login`
}

async function handleUnauthorizedInAdminRoute() {
  if (typeof window === 'undefined' || isHandlingUnauthorized) return

  const loginPath = getAdminLoginPath(window.location.pathname)
  if (!loginPath) return

  isHandlingUnauthorized = true
  toast.error('Sua sessão expirou ou sua conta foi desativada.')

  try {
    await authClient.signOut()
  } catch {
    // best-effort logout
  }

  window.location.assign(loginPath)
}

function onReactQueryError(error: Error, query?: { invalidate: () => void }) {
  if (isUnauthorizedError(error)) {
    void handleUnauthorizedInAdminRoute()
    return
  }

  toast.error(error.message, {
    action: query
      ? {
          label: 'retry',
          onClick: query.invalidate,
        }
      : undefined,
  })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is fresh for 5 minutes - won't refetch on mount/focus
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      onReactQueryError(error, query)
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      onReactQueryError(error)
    },
  }),
})

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
    }),
  ],
})

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
})
