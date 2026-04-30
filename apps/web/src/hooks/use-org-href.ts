'use client'

import { type Route } from 'next'

import { useOrgSlug } from './use-org-slug'

import { useIsCustomDomain } from '@/components/custom-domain-provider'
import { buildOrgHref } from '@/lib/org-href'


export function useOrgHref(path: string): Route {
  const slug = useOrgSlug()
  const isCustomDomain = useIsCustomDomain()
  return buildOrgHref(path, slug, isCustomDomain) as Route
}
