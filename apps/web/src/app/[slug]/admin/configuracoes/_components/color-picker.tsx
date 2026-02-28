'use client'

import { Pipette } from 'lucide-react'
import { useId, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    // Only update parent if it's a valid hex color
    if (/^#[0-9a-fA-F]{6}$/.test(newValue)) {
      onChange(newValue)
    }
  }

  const handleColorPickerChange = (newValue: string) => {
    setInputValue(newValue)
    onChange(newValue)
  }

  // Sync input value when external value changes
  if (value !== inputValue && /^#[0-9a-fA-F]{6}$/.test(value)) {
    setInputValue(value)
  }

  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-muted-foreground text-xs font-medium"
      >
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'border-border/60 flex h-10 w-full items-center gap-2 rounded-lg border bg-white px-3 transition-all duration-200',
              'hover:border-primary/50 hover:bg-muted/20',
              'focus:border-primary focus:ring-primary/20 focus:ring-2 focus:outline-none'
            )}
          >
            <div
              className="h-5 w-5 shrink-0 rounded-md border shadow-inner"
              style={{ backgroundColor: value }}
            />
            <span className="text-foreground flex-1 text-left font-mono text-xs">
              {value.toUpperCase()}
            </span>
            <Pipette className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-3">
            {/* Native color picker */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">
                Selecionar cor
              </Label>
              <input
                type="color"
                value={value}
                onChange={(e) => handleColorPickerChange(e.target.value)}
                className="h-20 w-full cursor-pointer rounded-lg border"
              />
            </div>

            {/* Hex input */}
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-hex`} className="text-muted-foreground text-xs">
                Código Hex
              </Label>
              <Input
                id={`${id}-hex`}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="#000000"
                className="h-9 font-mono text-xs"
                maxLength={7}
              />
            </div>

            {/* Preview */}
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs">
                Pré-visualização
              </Label>
              <div
                className="h-6 w-full rounded-lg border shadow-inner"
                style={{ backgroundColor: value }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
