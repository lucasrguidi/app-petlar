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
      className="overflow-hidden rounded-xl border shadow-inner"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-3 py-2"
        style={{
          backgroundColor: colors.secondary,
          borderColor: colors.muted,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ backgroundColor: colors.primary }}
          >
            <PawPrint
              className="h-3 w-3"
              style={{ color: colors.primaryForeground }}
            />
          </div>
          <span
            className="text-xs font-semibold"
            style={{ color: colors.foreground }}
          >
            {orgName}
          </span>
        </div>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.muted }}
        >
          <User
            className="h-3 w-3"
            style={{ color: colors.mutedForeground }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Search bar */}
        <div
          className="mb-3 flex items-center gap-1.5 rounded-md px-2 py-1.5"
          style={{
            backgroundColor: colors.secondary,
            border: `1px solid ${colors.muted}`,
          }}
        >
          <Search
            className="h-3 w-3"
            style={{ color: colors.mutedForeground }}
          />
          <span
            className="text-[10px]"
            style={{ color: colors.mutedForeground }}
          >
            Buscar gatos...
          </span>
        </div>

        {/* Cat cards */}
        <div className="grid grid-cols-2 gap-2">
          {['Luna', 'Simba'].map((name, idx) => (
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
                className="flex h-14 items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                <Cat
                  className="h-6 w-6"
                  style={{ color: colors.mutedForeground }}
                />
              </div>
              <div className="p-1.5">
                <h3
                  className="text-[11px] font-semibold"
                  style={{ color: colors.foreground }}
                >
                  {name}
                </h3>
                <p
                  className="text-[9px]"
                  style={{ color: colors.mutedForeground }}
                >
                  {idx === 0 ? '2 anos' : '1 ano'}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[8px] font-medium"
                    style={{
                      backgroundColor: `${colors.primary}20`,
                      color: colors.primary,
                    }}
                  >
                    Disponível
                  </span>
                  <button
                    className="rounded-full p-1"
                    style={{
                      backgroundColor: colors.accent,
                      color: colors.primaryForeground,
                    }}
                  >
                    <Heart className="h-2 w-2" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button
          className="mt-3 w-full rounded-lg py-2 text-[11px] font-semibold transition-transform hover:scale-[1.02]"
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
