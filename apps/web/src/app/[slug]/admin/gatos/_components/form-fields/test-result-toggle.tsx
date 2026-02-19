'use client'

import { type Control } from 'react-hook-form'

import { type CatFormData } from '../cat-form-schema'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

interface TestResultToggleProps {
  control: Control<CatFormData>
  name: 'fiv' | 'felv'
  label: string
}

export function TestResultToggle({
  control,
  name,
  label,
}: TestResultToggleProps) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-xs font-semibold tracking-wide uppercase">
            {label}
          </FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={(value) => value && field.onChange(value)}
              className="bg-muted/35 grid grid-cols-3 gap-1 rounded-lg p-1"
            >
              <ToggleGroupItem
                value="negative"
                className="data-[state=on]:border-success/30 data-[state=on]:bg-success/10 data-[state=on]:text-success h-8 rounded-md border border-transparent px-1 text-[11px] font-medium"
              >
                Negativo
              </ToggleGroupItem>
              <ToggleGroupItem
                value="positive"
                className="data-[state=on]:border-destructive/30 data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive h-8 rounded-md border border-transparent px-1 text-[11px] font-medium"
              >
                Positivo
              </ToggleGroupItem>
              <ToggleGroupItem
                value="not_tested"
                className="data-[state=on]:border-border data-[state=on]:bg-card data-[state=on]:text-foreground h-8 rounded-md border border-transparent px-1 text-[11px] font-medium"
              >
                Não testado
              </ToggleGroupItem>
            </ToggleGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
