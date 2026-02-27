'use client'

import { useEffect } from 'react'

interface ThemeInjectorProps {
  css: string
}

/**
 * Client component that injects theme CSS variables into the document.
 * This ensures the CSS is applied after hydration.
 */
export function ThemeInjector({ css }: ThemeInjectorProps) {
  useEffect(() => {
    // Create or update the theme style element
    let styleElement = document.getElementById('org-theme-css')

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'org-theme-css'
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = css

    return () => {
      // Cleanup on unmount
      styleElement?.remove()
    }
  }, [css])

  return null
}
