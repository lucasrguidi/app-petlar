'use client'

import { createContext, useContext } from 'react'

import { useSession } from '@/lib/auth-client'

type User = {
  id: string
  name: string
  email: string
  image?: string | null
  orgId?: string | null
  role?: string | null
}

type Session = {
  id: string
  userId: string
  expiresAt: Date
}

type AuthContextValue = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession()

  const value: AuthContextValue = {
    user: data?.user ?? null,
    session: data?.session ?? null,
    isLoading: isPending,
    isAuthenticated: !!data?.user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
