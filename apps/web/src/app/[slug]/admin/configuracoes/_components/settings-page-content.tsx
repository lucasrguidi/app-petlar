'use client'

import { env } from '@app-petlar/env/web'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Globe,
  Loader2,
  MapPin,
  MessageCircle,
  Palette,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  PRESET_THEMES,
  THEME_DEFAULTS,
  type PresetThemeKey,
} from '../../../_lib/generate-theme-css'
import { revalidateTheme } from '../_actions/revalidate-theme'

import { ColorPicker } from './color-picker'
import { SettingsLoadingSkeleton } from './settings-loading-skeleton'
import { ThemePreview } from './theme-preview'

import { BRAZILIAN_STATES } from '@app-petlar/db/constants/brazilian-states'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { cn } from '@/lib/utils'
import { trpc } from '@/utils/trpc'

interface ThemeColors {
  primaryColor: string | null
  primaryForegroundColor: string | null
  secondaryColor: string | null
  secondaryForegroundColor: string | null
  backgroundColor: string | null
  foregroundColor: string | null
  accentColor: string | null
  mutedColor: string | null
  mutedForegroundColor: string | null
}

function getEffectiveColors(colors: ThemeColors) {
  return {
    primary: colors.primaryColor ?? THEME_DEFAULTS.primary,
    primaryForeground:
      colors.primaryForegroundColor ?? THEME_DEFAULTS.primaryForeground,
    secondary: colors.secondaryColor ?? THEME_DEFAULTS.secondary,
    secondaryForeground:
      colors.secondaryForegroundColor ?? THEME_DEFAULTS.secondaryForeground,
    background: colors.backgroundColor ?? THEME_DEFAULTS.background,
    foreground: colors.foregroundColor ?? THEME_DEFAULTS.foreground,
    accent: colors.accentColor ?? THEME_DEFAULTS.accent,
    muted: colors.mutedColor ?? THEME_DEFAULTS.muted,
    mutedForeground:
      colors.mutedForegroundColor ?? THEME_DEFAULTS.mutedForeground,
  }
}

function colorsMatchPreset(
  colors: ReturnType<typeof getEffectiveColors>,
  preset: (typeof PRESET_THEMES)[PresetThemeKey]
): boolean {
  return (
    colors.primary.toLowerCase() === preset.primary.toLowerCase() &&
    colors.background.toLowerCase() === preset.background.toLowerCase() &&
    colors.foreground.toLowerCase() === preset.foreground.toLowerCase() &&
    colors.secondary.toLowerCase() === preset.secondary.toLowerCase() &&
    colors.accent.toLowerCase() === preset.accent.toLowerCase()
  )
}

export function SettingsPageContent() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const slug = useOrgSlug()

  const { data: orgSettings, isLoading } = useQuery(
    trpc.orgs.getSettings.queryOptions()
  )

  const [localColors, setLocalColors] = useState<ThemeColors>({
    primaryColor: null,
    primaryForegroundColor: null,
    secondaryColor: null,
    secondaryForegroundColor: null,
    backgroundColor: null,
    foregroundColor: null,
    accentColor: null,
    mutedColor: null,
    mutedForegroundColor: null,
  })

  const [hasChanges, setHasChanges] = useState(false)

  const [localCity, setLocalCity] = useState<string | null>(null)
  const [localState, setLocalState] = useState<string | null>(null)
  const [hasLocationChanges, setHasLocationChanges] = useState(false)

  // Initialize local state from org settings
  useEffect(() => {
    if (orgSettings) {
      setLocalCity(orgSettings.city ?? null)
      setLocalState(orgSettings.state ?? null)
      setLocalColors({
        primaryColor: orgSettings.primaryColor,
        primaryForegroundColor: orgSettings.primaryForegroundColor,
        secondaryColor: orgSettings.secondaryColor,
        secondaryForegroundColor: orgSettings.secondaryForegroundColor,
        backgroundColor: orgSettings.backgroundColor,
        foregroundColor: orgSettings.foregroundColor,
        accentColor: orgSettings.accentColor,
        mutedColor: orgSettings.mutedColor,
        mutedForegroundColor: orgSettings.mutedForegroundColor,
      })
    }
  }, [orgSettings])

  const updateThemeMutation = useMutation(
    trpc.orgs.updateTheme.mutationOptions({
      onSuccess: async () => {
        toast.success('Tema atualizado com sucesso!')
        queryClient.invalidateQueries({ queryKey: [['orgs', 'getSettings']] })
        setHasChanges(false)
        // Revalidate the org layout to regenerate theme CSS
        await revalidateTheme(slug)
        // Refresh the page to apply the new theme
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const updateLocationMutation = useMutation(
    trpc.orgs.updateLocation.mutationOptions({
      onSuccess: async () => {
        toast.success('Localização atualizada com sucesso!')
        queryClient.invalidateQueries({ queryKey: [['orgs', 'getSettings']] })
        setHasLocationChanges(false)
        await revalidateTheme(slug)
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const handleSaveLocation = () => {
    updateLocationMutation.mutate({
      city: localCity,
      state: localState,
    })
  }

  const handleResetLocation = () => {
    if (orgSettings) {
      setLocalCity(orgSettings.city ?? null)
      setLocalState(orgSettings.state ?? null)
      setHasLocationChanges(false)
    }
  }

  const handlePresetSelect = (presetKey: PresetThemeKey) => {
    const preset = PRESET_THEMES[presetKey]
    setLocalColors({
      primaryColor: preset.primary,
      primaryForegroundColor: preset.primaryForeground,
      secondaryColor: preset.secondary,
      secondaryForegroundColor: preset.secondaryForeground,
      backgroundColor: preset.background,
      foregroundColor: preset.foreground,
      accentColor: preset.accent,
      mutedColor: preset.muted,
      mutedForegroundColor: preset.mutedForeground,
    })
    setHasChanges(true)
  }

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setLocalColors((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSaveTheme = () => {
    updateThemeMutation.mutate(localColors)
  }

  const handleResetTheme = () => {
    if (orgSettings) {
      setLocalColors({
        primaryColor: orgSettings.primaryColor,
        primaryForegroundColor: orgSettings.primaryForegroundColor,
        secondaryColor: orgSettings.secondaryColor,
        secondaryForegroundColor: orgSettings.secondaryForegroundColor,
        backgroundColor: orgSettings.backgroundColor,
        foregroundColor: orgSettings.foregroundColor,
        accentColor: orgSettings.accentColor,
        mutedColor: orgSettings.mutedColor,
        mutedForegroundColor: orgSettings.mutedForegroundColor,
      })
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return <SettingsLoadingSkeleton />
  }

  if (!orgSettings) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        Não foi possível carregar as configurações.
      </div>
    )
  }

  const effectiveColors = getEffectiveColors(localColors)
  const currentPreset = (Object.keys(PRESET_THEMES) as PresetThemeKey[]).find(
    (key) => colorsMatchPreset(effectiveColors, PRESET_THEMES[key])
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Left Column - Settings */}
      <div className="space-y-6">
        {/* Domain Card */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-display flex items-center gap-2">
              <Globe className="text-primary h-5 w-5" />
              Domínio Personalizado
            </CardTitle>
            <CardDescription>
              O endereço que os visitantes usam para acessar seu site de adoção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 rounded-lg border p-4">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Domínio Atual
              </Label>
              <p className="mt-1.5 text-lg font-semibold">
                {orgSettings.customDomain ? (
                  <span className="text-foreground">
                    {orgSettings.customDomain}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic">
                    Nenhum domínio configurado
                  </span>
                )}
              </p>
            </div>

            <p className="text-muted-foreground text-sm">
              Para configurar ou alterar seu domínio personalizado, entre em
              contato com nossa equipe de suporte.
            </p>

            {env.NEXT_PUBLIC_SUPPORT_WHATSAPP && (
              <Button variant="outline" className="gap-2" asChild>
                <a
                  href={`https://wa.me/${env.NEXT_PUBLIC_SUPPORT_WHATSAPP}?text=Olá! Gostaria de configurar/alterar o domínio da minha organização.`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-display flex items-center gap-2">
              <MapPin className="text-primary h-5 w-5" />
              Localização
            </CardTitle>
            <CardDescription>
              Cidade e estado da sua ONG, exibidos no site público e usados para
              SEO local
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium">
                  Cidade
                </Label>
                <Input
                  id="city"
                  placeholder="Ex: Criciúma"
                  value={localCity ?? ''}
                  onChange={(e) => {
                    setLocalCity(e.target.value || null)
                    setHasLocationChanges(true)
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  Estado
                </Label>
                <Select
                  value={localState ?? ''}
                  onValueChange={(value) => {
                    setLocalState(value || null)
                    setHasLocationChanges(true)
                  }}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label} ({state.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={handleResetLocation}
                disabled={!hasLocationChanges}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Desfazer
              </Button>
              <Button
                onClick={handleSaveLocation}
                disabled={
                  !hasLocationChanges || updateLocationMutation.isPending
                }
                className="gap-2"
              >
                {updateLocationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Localização
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme Card */}
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-display flex items-center gap-2">
              <Palette className="text-primary h-5 w-5" />
              Tema de Cores
            </CardTitle>
            <CardDescription>
              Escolha um tema pré-definido ou personalize as cores do seu site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preset Themes */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary h-4 w-4" />
                <Label className="text-sm font-medium">
                  Temas Pré-definidos
                </Label>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {(Object.keys(PRESET_THEMES) as PresetThemeKey[]).map((key) => {
                  const preset = PRESET_THEMES[key]
                  const isSelected = currentPreset === key
                  return (
                    <button
                      key={key}
                      onClick={() => handlePresetSelect(key)}
                      className={cn(
                        'group relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-3 transition-all duration-200',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30'
                      )}
                    >
                      {isSelected && (
                        <div className="bg-primary text-primary-foreground absolute -top-1.5 -right-1.5 rounded-full p-0.5 shadow-sm">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                      <div className="flex items-center gap-0.5">
                        <div
                          className="h-7 w-7 rounded-l-lg border shadow-inner"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div
                          className="h-7 w-7 border-y shadow-inner"
                          style={{ backgroundColor: preset.background }}
                        />
                        <div
                          className="h-7 w-7 rounded-r-lg border shadow-inner"
                          style={{ backgroundColor: preset.foreground }}
                        />
                      </div>
                      <span className="text-foreground text-xs font-medium">
                        {preset.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Colors */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Cores Personalizadas</Label>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <ColorPicker
                  label="Primária"
                  value={effectiveColors.primary}
                  onChange={(v) => handleColorChange('primaryColor', v)}
                />
                <ColorPicker
                  label="Fundo"
                  value={effectiveColors.background}
                  onChange={(v) => handleColorChange('backgroundColor', v)}
                />
                <ColorPicker
                  label="Texto"
                  value={effectiveColors.foreground}
                  onChange={(v) => handleColorChange('foregroundColor', v)}
                />
                <ColorPicker
                  label="Destaque"
                  value={effectiveColors.accent}
                  onChange={(v) => handleColorChange('accentColor', v)}
                />
                <ColorPicker
                  label="Secundária"
                  value={effectiveColors.secondary}
                  onChange={(v) => handleColorChange('secondaryColor', v)}
                />
                <ColorPicker
                  label="Texto Secundário"
                  value={effectiveColors.secondaryForeground}
                  onChange={(v) =>
                    handleColorChange('secondaryForegroundColor', v)
                  }
                />
                <ColorPicker
                  label="Suave"
                  value={effectiveColors.muted}
                  onChange={(v) => handleColorChange('mutedColor', v)}
                />
                <ColorPicker
                  label="Texto Suave"
                  value={effectiveColors.mutedForeground}
                  onChange={(v) => handleColorChange('mutedForegroundColor', v)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={handleResetTheme}
                disabled={!hasChanges}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Desfazer
              </Button>
              <Button
                onClick={handleSaveTheme}
                disabled={!hasChanges || updateThemeMutation.isPending}
                className="gap-2"
              >
                {updateThemeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar Tema
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Preview */}
      <div className="lg:sticky lg:top-6 lg:h-fit">
        <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-display text-base">
              Pré-visualização
            </CardTitle>
            <CardDescription className="text-xs">
              Veja como ficará a aparência do seu site
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemePreview colors={effectiveColors} orgName={orgSettings.name} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
