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
    <div className="space-y-1.5">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="border-border/50 bg-muted/15 flex items-center justify-between rounded-lg border px-3 py-2">
            <FormLabel className="cursor-pointer text-sm font-medium">
              {label}
            </FormLabel>
            <FormControl>
              <Switch
                className="h-5 w-9 [&>span]:h-4 [&>span]:w-4 data-[state=checked]:[&>span]:translate-x-4"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
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
                  className="h-8 text-sm"
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
