'use client'

import { useQuery } from '@tanstack/react-query'
import { Loader2, Users } from 'lucide-react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/utils/trpc'

export interface Applicant {
  id: string
  applicantName: string
  applicantWhatsapp: string
  applicantEmail: string
  status: 'pending' | 'reviewing' | 'approved' | 'rejected'
}

interface AdopterSelectProps {
  catId: string
  value: string | null
  onChange: (applicant: Applicant | null) => void
  disabled?: boolean
}

const DIRECT_ADOPTION_VALUE = '__direct__'

export function AdopterSelect({
  catId,
  value,
  onChange,
  disabled,
}: AdopterSelectProps) {
  const { data, isLoading } = useQuery({
    ...trpc.adoptions.getApprovedApplicants.queryOptions({ catId }),
    staleTime: 30000,
  })

  const applicants = data?.applicants ?? []
  const hasApplicants = applicants.length > 0

  const handleChange = (selectedValue: string) => {
    if (selectedValue === DIRECT_ADOPTION_VALUE) {
      onChange(null)
    } else {
      const applicant = applicants.find((a) => a.id === selectedValue)
      if (applicant) {
        onChange(applicant)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">Candidato</Label>
        <div className="border-border/60 bg-muted/20 flex h-10 items-center gap-2 rounded-xl border px-3">
          <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          <span className="text-muted-foreground text-sm">
            Carregando candidatos...
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        Candidato
        {!hasApplicants && (
          <span className="text-muted-foreground ml-1.5 text-xs font-normal">
            (nenhum candidato aprovado)
          </span>
        )}
      </Label>
      <Select
        value={value ?? DIRECT_ADOPTION_VALUE}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger className="h-10 rounded-xl">
          <SelectValue placeholder="Selecione o candidato" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DIRECT_ADOPTION_VALUE}>
            <div className="flex items-center gap-2">
              <Users className="text-muted-foreground h-4 w-4" />
              <span>Adoção direta (sem candidato)</span>
            </div>
          </SelectItem>
          {applicants.map((applicant) => (
            <SelectItem key={applicant.id} value={applicant.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium">{applicant.applicantName}</span>
                <span className="text-muted-foreground text-xs">
                  {applicant.status === 'approved'
                    ? '(Aprovado)'
                    : '(Em análise)'}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
