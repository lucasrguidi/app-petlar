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
    <div className="space-y-2">
      <Label htmlFor={id} className="text-muted-foreground text-xs font-medium">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'flex h-10 w-full items-center gap-2 rounded-lg border px-3 transition-colors',
              'hover:border-primary/50 focus:border-primary focus:ring-primary/20 focus:ring-2 focus:outline-none'
            )}
          >
            <div
              className="h-5 w-5 shrink-0 rounded border"
              style={{ backgroundColor: value }}
            />
            <span className="text-foreground flex-1 text-left font-mono text-sm">
              {value.toUpperCase()}
            </span>
            <Pipette className="text-muted-foreground h-4 w-4 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="start">
          <div className="space-y-4">
            {/* Native color picker */}
            <div className="space-y-2">
              <Label className="text-xs">Escolher cor</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleColorPickerChange(e.target.value)}
                  className="h-10 w-full cursor-pointer rounded-lg border"
                />
              </div>
            </div>

            {/* Hex input */}
            <div className="space-y-2">
              <Label htmlFor={`${id}-hex`} className="text-xs">
                Codigo Hex
              </Label>
              <Input
                id={`${id}-hex`}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="#000000"
                className="font-mono"
                maxLength={7}
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="text-xs">Preview</Label>
              <div
                className="h-8 w-full rounded-lg border"
                style={{ backgroundColor: value }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
