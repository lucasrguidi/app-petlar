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
        <FormItem className="space-y-2">
          <FormLabel className="text-sm">Sexo</FormLabel>
          <FormControl>
            <ToggleGroup
              type="single"
              value={field.value}
              onValueChange={(value) => value && field.onChange(value)}
              className="justify-start"
            >
              <ToggleGroupItem value="male" className="h-9 px-4">
                Macho
              </ToggleGroupItem>
              <ToggleGroupItem value="female" className="h-9 px-4">
                Femea
              </ToggleGroupItem>
            </ToggleGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
