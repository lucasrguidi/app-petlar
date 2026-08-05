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

interface SexToggleProps {
  control: Control<CatFormData>
}

export function SexToggle({ control }: SexToggleProps) {
  return (
    <FormField
      control={control}
      name="sex"
      render={({ field }) => (
        <FormItem className="space-y-1.5">
          <FormLabel className="text-sm">Sexo</FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={(value) => value && field.onChange(value)}
              className="bg-muted/35 grid grid-cols-3 gap-1 rounded-lg p-1"
            >
              <ToggleGroupItem
                value="male"
                className="data-[state=on]:border-primary/30 data-[state=on]:bg-primary/10 data-[state=on]:text-primary h-8 rounded-md border border-transparent px-3 text-xs"
              >
                Macho
              </ToggleGroupItem>
              <ToggleGroupItem
                value="female"
                className="data-[state=on]:border-primary/30 data-[state=on]:bg-primary/10 data-[state=on]:text-primary h-8 rounded-md border border-transparent px-3 text-xs"
              >
                Fêmea
              </ToggleGroupItem>
              <ToggleGroupItem
                value="unknown"
                className="data-[state=on]:border-primary/30 data-[state=on]:bg-primary/10 data-[state=on]:text-primary h-8 rounded-md border border-transparent px-3 text-xs"
              >
                Desconhecido
              </ToggleGroupItem>
            </ToggleGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
