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
          <FormLabel className="text-xs font-semibold uppercase tracking-wide">
            {label}
          </FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={(value) => value && field.onChange(value)}
              className="grid grid-cols-3 gap-1 rounded-lg bg-muted/35 p-1"
            >
              <ToggleGroupItem
                value="negative"
                className="h-8 rounded-md border border-transparent px-1 text-[11px] font-medium data-[state=on]:border-success/30 data-[state=on]:bg-success/10 data-[state=on]:text-success"
              >
                Negativo
              </ToggleGroupItem>
              <ToggleGroupItem
                value="positive"
                className="h-8 rounded-md border border-transparent px-1 text-[11px] font-medium data-[state=on]:border-destructive/30 data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive"
              >
                Positivo
              </ToggleGroupItem>
              <ToggleGroupItem
                value="not_tested"
                className="h-8 rounded-md border border-transparent px-1 text-[11px] font-medium data-[state=on]:border-border data-[state=on]:bg-card data-[state=on]:text-foreground"
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
