'use client'

import { createContext, useContext } from 'react'

const CustomDomainContext = createContext(false)

export function CustomDomainProvider({
  isCustomDomain,
  children,
}: {
  isCustomDomain: boolean
  children: React.ReactNode
}) {
  return (
    <CustomDomainContext value={isCustomDomain}>
      {children}
    </CustomDomainContext>
  )
}

export function useIsCustomDomain(): boolean {
  return useContext(CustomDomainContext)
}
