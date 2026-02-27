/**
 * Default theme colors for emails.
 * These are used when an org hasn't customized their colors.
 */
const DEFAULTS = {
  primary: '#e35915',
  primaryForeground: '#ffffff',
  background: '#aec7e2',
  foreground: '#783201',
  accent: '#f07b3d',
  muted: '#c5d8ee',
  mutedForeground: '#8b5a2b',
} as const

interface OrgColors {
  primaryColor: string | null
  primaryForegroundColor: string | null
  backgroundColor: string | null
  foregroundColor: string | null
  accentColor: string | null
  mutedColor: string | null
  mutedForegroundColor: string | null
}

/**
 * Returns email styles for an org with fallback to defaults.
 */
export function getEmailStyles(org: OrgColors | null) {
  return {
    primary: org?.primaryColor ?? DEFAULTS.primary,
    primaryForeground: org?.primaryForegroundColor ?? DEFAULTS.primaryForeground,
    background: org?.backgroundColor ?? DEFAULTS.background,
    foreground: org?.foregroundColor ?? DEFAULTS.foreground,
    accent: org?.accentColor ?? DEFAULTS.accent,
    muted: org?.mutedColor ?? DEFAULTS.muted,
    mutedForeground: org?.mutedForegroundColor ?? DEFAULTS.mutedForeground,
  }
}

/**
 * Lightens a hex color by a percentage (0-1).
 */
export function lightenHex(hex: string, amount: number): string {
  hex = hex.replace(/^#/, '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  const newR = Math.round(r + (255 - r) * amount)
  const newG = Math.round(g + (255 - g) * amount)
  const newB = Math.round(b + (255 - b) * amount)

  return '#' + [newR, newG, newB]
    .map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
    .join('')
}
