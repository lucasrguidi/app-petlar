'use client'

import { Cat, Heart, PawPrint, Search, User } from 'lucide-react'

interface ThemePreviewProps {
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    background: string
    foreground: string
    accent: string
    muted: string
    mutedForeground: string
  }
  orgName: string
}

export function ThemePreview({ colors, orgName }: ThemePreviewProps) {
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{
          backgroundColor: colors.secondary,
          borderColor: colors.muted,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: colors.primary }}
          >
            <PawPrint
              className="h-4 w-4"
              style={{ color: colors.primaryForeground }}
            />
          </div>
          <span className="font-semibold" style={{ color: colors.foreground }}>
            {orgName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.muted }}
          >
            <User
              className="h-4 w-4"
              style={{ color: colors.mutedForeground }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Search bar */}
        <div
          className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{
            backgroundColor: colors.secondary,
            border: `1px solid ${colors.muted}`,
          }}
        >
          <Search
            className="h-4 w-4"
            style={{ color: colors.mutedForeground }}
          />
          <span className="text-sm" style={{ color: colors.mutedForeground }}>
            Buscar gatos...
          </span>
        </div>

        {/* Cat cards */}
        <div className="grid grid-cols-2 gap-3">
          {['Luna', 'Simba'].map((name) => (
            <div
              key={name}
              className="overflow-hidden rounded-lg"
              style={{
                backgroundColor: '#ffffff',
                border: `1px solid ${colors.muted}`,
              }}
            >
              {/* Cat image placeholder */}
              <div
                className="flex h-20 items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                <Cat
                  className="h-8 w-8"
                  style={{ color: colors.mutedForeground }}
                />
              </div>
              <div className="p-2">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: colors.foreground }}
                >
                  {name}
                </h3>
                <p
                  className="text-xs"
                  style={{ color: colors.mutedForeground }}
                >
                  2 anos
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      color: colors.primary,
                    }}
                  >
                    Disponivel
                  </span>
                  <button
                    className="rounded-full p-1.5"
                    style={{
                      backgroundColor: colors.accent,
                      color: colors.primaryForeground,
                    }}
                  >
                    <Heart className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          className="mt-4 w-full rounded-lg py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02]"
          style={{
            backgroundColor: colors.primary,
            color: colors.primaryForeground,
          }}
        >
          Quero Adotar
        </button>
      </div>
    </div>
  )
}
