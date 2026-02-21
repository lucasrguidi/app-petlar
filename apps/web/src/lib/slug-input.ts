const VALID_SLUG_REGEX = /^[a-z0-9-]+$/

function getFirstPathSegment(pathname: string): string | null {
  const [firstSegment] = pathname.split('/').filter(Boolean)
  return firstSegment ?? null
}

export function normalizeSlugInput(value: string): string {
  return value.trim().toLowerCase()
}

export function extractSlugFromInput(value: string): string | null {
  const normalizedValue = normalizeSlugInput(value)
  if (!normalizedValue) {
    return null
  }

  const maybeUrl =
    normalizedValue.startsWith('www.') && !normalizedValue.includes('://')
      ? `https://${normalizedValue}`
      : normalizedValue

  if (maybeUrl.includes('://')) {
    try {
      const parsed = new URL(maybeUrl)
      return getFirstPathSegment(parsed.pathname)
    } catch {
      return null
    }
  }

  if (normalizedValue.startsWith('/')) {
    return getFirstPathSegment(normalizedValue)
  }

  if (normalizedValue.includes('/')) {
    return getFirstPathSegment(`/${normalizedValue}`)
  }

  return normalizedValue
}

export function isValidSlugFormat(slug: string): boolean {
  return VALID_SLUG_REGEX.test(slug)
}
