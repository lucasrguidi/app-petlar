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
        <FormItem className="space-y-2">
          <FormLabel className="text-sm">{label}</FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={(value) => value && field.onChange(value)}
              className="justify-start"
            >
              <ToggleGroupItem
                value="negative"
                className="h-8 px-3 text-xs data-[state=on]:bg-success/10 data-[state=on]:text-success data-[state=on]:border-success/30"
              >
                Negativo
              </ToggleGroupItem>
              <ToggleGroupItem
                value="positive"
                className="h-8 px-3 text-xs data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive data-[state=on]:border-destructive/30"
              >
                Positivo
              </ToggleGroupItem>
              <ToggleGroupItem
                value="not_tested"
                className="h-8 px-3 text-xs data-[state=on]:bg-muted data-[state=on]:text-muted-foreground"
              >
                Nao testado
              </ToggleGroupItem>
            </ToggleGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
