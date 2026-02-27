import { type OrgTheme } from './get-org-by-slug'

/**
 * Default theme colors matching the PetLar design system.
 * These are used when an org hasn't customized their colors.
 */
export const THEME_DEFAULTS = {
  primary: '#e35915',
  primaryForeground: '#ffffff',
  secondary: '#d4e3f3',
  secondaryForeground: '#783201',
  background: '#aec7e2',
  foreground: '#783201',
  accent: '#f07b3d',
  muted: '#c5d8ee',
  mutedForeground: '#8b5a2b',
} as const

/**
 * Preset themes available for orgs to choose from.
 */
export const PRESET_THEMES = {
  laranja: {
    name: 'Laranja (PetLar)',
    primary: '#e35915',
    primaryForeground: '#ffffff',
    secondary: '#d4e3f3',
    secondaryForeground: '#783201',
    background: '#aec7e2',
    foreground: '#783201',
    accent: '#f07b3d',
    muted: '#c5d8ee',
    mutedForeground: '#8b5a2b',
  },
  oceano: {
    name: 'Oceano',
    primary: '#0891b2',
    primaryForeground: '#ffffff',
    secondary: '#e0f2fe',
    secondaryForeground: '#164e63',
    background: '#cffafe',
    foreground: '#164e63',
    accent: '#06b6d4',
    muted: '#a5f3fc',
    mutedForeground: '#0e7490',
  },
  verde: {
    name: 'Verde',
    primary: '#16a34a',
    primaryForeground: '#ffffff',
    secondary: '#dcfce7',
    secondaryForeground: '#14532d',
    background: '#d1fae5',
    foreground: '#14532d',
    accent: '#22c55e',
    muted: '#bbf7d0',
    mutedForeground: '#166534',
  },
  roxo: {
    name: 'Roxo',
    primary: '#9333ea',
    primaryForeground: '#ffffff',
    secondary: '#f3e8ff',
    secondaryForeground: '#581c87',
    background: '#ede9fe',
    foreground: '#581c87',
    accent: '#a855f7',
    muted: '#e9d5ff',
    mutedForeground: '#7e22ce',
  },
  rosa: {
    name: 'Rosa',
    primary: '#ec4899',
    primaryForeground: '#ffffff',
    secondary: '#fce7f3',
    secondaryForeground: '#831843',
    background: '#fdf2f8',
    foreground: '#831843',
    accent: '#f472b6',
    muted: '#fbcfe8',
    mutedForeground: '#be185d',
  },
} as const

export type PresetThemeKey = keyof typeof PRESET_THEMES

/**
 * Generates CSS custom properties for an org's theme.
 * Returns a CSS string that can be injected into a <style> tag.
 *
 * Note: Uses --color-* format to match Tailwind v4 theme variables.
 */
export function generateOrgThemeCSS(org: OrgTheme): string {
  const primary = org.primaryColor ?? THEME_DEFAULTS.primary
  const primaryForeground =
    org.primaryForegroundColor ?? THEME_DEFAULTS.primaryForeground
  const secondary = org.secondaryColor ?? THEME_DEFAULTS.secondary
  const secondaryForeground =
    org.secondaryForegroundColor ?? THEME_DEFAULTS.secondaryForeground
  const background = org.backgroundColor ?? THEME_DEFAULTS.background
  const foreground = org.foregroundColor ?? THEME_DEFAULTS.foreground
  const accent = org.accentColor ?? THEME_DEFAULTS.accent
  const muted = org.mutedColor ?? THEME_DEFAULTS.muted
  const mutedForeground =
    org.mutedForegroundColor ?? THEME_DEFAULTS.mutedForeground

  // Derive additional colors
  const border = darkenHex(muted, 0.15) // Slightly darker than muted
  const input = lightenHex(muted, 0.3) // Slightly lighter than muted

  // Set --theme-* variables which are consumed by Tailwind's --color-* references
  return `
    :root {
      --theme-background: ${background};
      --theme-foreground: ${foreground};
      --theme-card: #ffffff;
      --theme-card-foreground: ${foreground};
      --theme-popover: #ffffff;
      --theme-popover-foreground: ${foreground};
      --theme-primary: ${primary};
      --theme-primary-foreground: ${primaryForeground};
      --theme-secondary: ${secondary};
      --theme-secondary-foreground: ${secondaryForeground};
      --theme-muted: ${muted};
      --theme-muted-foreground: ${mutedForeground};
      --theme-accent: ${accent};
      --theme-accent-foreground: ${primaryForeground};
      --theme-border: ${border};
      --theme-input: ${input};
      --theme-ring: ${primary};
      --theme-sidebar: #ffffff;
      --theme-sidebar-foreground: ${foreground};
      --theme-sidebar-primary: ${primary};
      --theme-sidebar-primary-foreground: ${primaryForeground};
      --theme-sidebar-accent: ${lightenHex(secondary, 0.1)};
      --theme-sidebar-accent-foreground: ${foreground};
      --theme-sidebar-border: ${muted};
      --theme-sidebar-ring: ${primary};
    }
  `.trim()
}

/**
 * Darken a hex color by a percentage (0-1).
 */
function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  return rgbToHex(
    Math.round(rgb.r * (1 - amount)),
    Math.round(rgb.g * (1 - amount)),
    Math.round(rgb.b * (1 - amount))
  )
}

/**
 * Lighten a hex color by a percentage (0-1).
 */
function lightenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex)
  return rgbToHex(
    Math.round(rgb.r + (255 - rgb.r) * amount),
    Math.round(rgb.g + (255 - rgb.g) * amount),
    Math.round(rgb.b + (255 - rgb.b) * amount)
  )
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  hex = hex.replace(/^#/, '')
  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
      .join('')
  )
}

/**
 * Returns the email styles for an org (hex colors for inline email styles).
 */
export function getEmailStyles(org: OrgTheme) {
  return {
    primaryColor: org.primaryColor ?? THEME_DEFAULTS.primary,
    primaryForegroundColor:
      org.primaryForegroundColor ?? THEME_DEFAULTS.primaryForeground,
    backgroundColor: org.backgroundColor ?? THEME_DEFAULTS.background,
    foregroundColor: org.foregroundColor ?? THEME_DEFAULTS.foreground,
    accentColor: org.accentColor ?? THEME_DEFAULTS.accent,
    mutedForegroundColor:
      org.mutedForegroundColor ?? THEME_DEFAULTS.mutedForeground,
  }
}
