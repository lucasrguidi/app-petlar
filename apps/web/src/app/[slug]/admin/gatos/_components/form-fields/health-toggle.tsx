'use client'

import { type Control, useWatch } from 'react-hook-form'

import { type CatFormData } from '../cat-form-schema'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'


interface HealthToggleProps {
  control: Control<CatFormData>
  name: 'castrated' | 'vaccinated' | 'dewormed'
  label: string
  notesName?: 'vaccinationNotes' | 'dewormingNotes'
  notesPlaceholder?: string
}

export function HealthToggle({
  control,
  name,
  label,
  notesName,
  notesPlaceholder,
}: HealthToggleProps) {
  const watchValue = useWatch({ control, name })

  return (
    <div className="space-y-2">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex items-center gap-3">
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormLabel className="cursor-pointer text-sm font-normal">
              {label}
            </FormLabel>
          </FormItem>
        )}
      />

      {notesName && watchValue && (
        <FormField
          control={control}
          name={notesName}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder={notesPlaceholder}
                  className="h-9 text-sm"
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value || null)}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </div>
  )
}
