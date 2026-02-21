'use client'

import { ArrowRight, Loader2 } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { buildOrgLoginPathFromRootCallback } from '@/lib/auth-routing'
import {
  extractSlugFromInput,
  isValidSlugFormat,
  normalizeSlugInput,
} from '@/lib/slug-input'
import { trpcClient } from '@/utils/trpc'

const LAST_ORG_SLUG_STORAGE_KEY = 'petlar:last-org-slug'

interface LoginHubFormProps {
  callbackUrl?: string | null
}

export function LoginHubForm({ callbackUrl }: LoginHubFormProps) {
  const [slugInput, setSlugInput] = useState('')
  const [lastOrgSlug, setLastOrgSlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    try {
      const savedSlug = window.localStorage.getItem(LAST_ORG_SLUG_STORAGE_KEY)
      const normalizedSavedSlug = normalizeSlugInput(savedSlug ?? '')

      if (isValidSlugFormat(normalizedSavedSlug)) {
        setLastOrgSlug(normalizedSavedSlug)
        setSlugInput((currentValue) => currentValue || normalizedSavedSlug)
        return
      }

      window.localStorage.removeItem(LAST_ORG_SLUG_STORAGE_KEY)
    } catch {
      // Ignore storage errors
    }
  }, [])

  function resolveSlugFromInput(rawInput: string): string | null {
    const extractedSlug = extractSlugFromInput(rawInput)
    if (!extractedSlug) {
      setError('Informe o slug da ONG para continuar.')
      return null
    }

    if (!isValidSlugFormat(extractedSlug)) {
      setError('Slug inválido. Use apenas letras minúsculas, números e hífen.')
      return null
    }

    return extractedSlug
  }

  async function continueWithSlug(targetSlug: string) {
    setError(null)
    setIsSubmitting(true)

    try {
      const org = await trpcClient.orgs.getBySlug.query({ slug: targetSlug })

      if (!org) {
        setError('ONG não encontrada. Revise o slug informado.')
        return
      }

      try {
        window.localStorage.setItem(LAST_ORG_SLUG_STORAGE_KEY, targetSlug)
        setLastOrgSlug(targetSlug)
      } catch {
        // Ignore storage errors
      }

      const loginPath = buildOrgLoginPathFromRootCallback({
        slug: targetSlug,
        callbackUrl,
      })
      window.location.assign(loginPath)
    } catch {
      setError('Não foi possível validar a ONG agora. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const resolvedSlug = resolveSlugFromInput(slugInput)
    if (!resolvedSlug) {
      return
    }

    await continueWithSlug(resolvedSlug)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {lastOrgSlug ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium">
            Último acesso neste navegador
          </p>
          <Button
            type="button"
            disabled={isSubmitting}
            className="h-12 w-full rounded-xl"
            onClick={() => {
              void continueWithSlug(lastOrgSlug)
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                Continuar como {lastOrgSlug}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      ) : null}

      {lastOrgSlug ? (
        <div className="relative py-1">
          <div className="border-border/60 absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card text-muted-foreground px-3 text-xs">
              ou acessar outra ONG
            </span>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="org-slug" className="text-sm font-medium">
          Slug ou URL da ONG
        </label>
        <Input
          id="org-slug"
          placeholder="ex.: petlar ou https://petlar.app/petlar"
          value={slugInput}
          onChange={(event) => {
            setSlugInput(normalizeSlugInput(event.target.value))
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
          Você pode digitar apenas o slug ou colar a URL completa da ONG.
        </p>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        variant={lastOrgSlug ? 'outline' : 'default'}
        className="h-12 w-full rounded-xl"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validando...
          </>
        ) : (
          <>
            Continuar com este slug
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  )
}
