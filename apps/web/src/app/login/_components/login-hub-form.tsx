'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildOrgLoginPathFromRootCallback } from '@/lib/auth-routing'
import { trpcClient } from '@/utils/trpc'

const LAST_ORG_SLUG_STORAGE_KEY = 'petlar:last-org-slug'

interface LoginHubFormProps {
  callbackUrl?: string | null
}

function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
}

export function LoginHubForm({ callbackUrl }: LoginHubFormProps) {
  const [slug, setSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    try {
      const savedSlug = window.localStorage.getItem(LAST_ORG_SLUG_STORAGE_KEY)
      if (savedSlug) {
        setSlug((currentValue) => currentValue || savedSlug)
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedSlug = normalizeSlug(slug)
    if (!normalizedSlug) {
      setError('Informe o slug da ONG para continuar.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const org = await trpcClient.orgs.getBySlug.query({ slug: normalizedSlug })

      if (!org) {
        setError('ONG não encontrada. Revise o slug informado.')
        return
      }

      try {
        window.localStorage.setItem(LAST_ORG_SLUG_STORAGE_KEY, normalizedSlug)
      } catch {
        // Ignore storage errors
      }

      const loginPath = buildOrgLoginPathFromRootCallback({
        slug: normalizedSlug,
        callbackUrl,
      })
      window.location.assign(loginPath)
    } catch {
      setError('Não foi possível validar a ONG agora. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="org-slug" className="text-sm font-medium">
          Slug da ONG
        </label>
        <Input
          id="org-slug"
          placeholder="ex.: petlar"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value.toLowerCase())
            if (error) {
              setError(null)
            }
          }}
          disabled={isSubmitting}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-12 rounded-xl"
        />
        <p className="text-muted-foreground text-xs">
          Use o identificador da sua ONG na URL.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validando...
          </>
        ) : (
          <>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
