'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, ShieldCheck, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { trpc } from '@/utils/trpc'

interface ChangeRoleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: {
    id: string
    name: string
    role: 'admin' | 'volunteer'
  }
}

export function ChangeRoleDialog({
  open,
  onOpenChange,
  user,
}: ChangeRoleDialogProps) {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<'admin' | 'volunteer'>(
    user.role
  )

  const updateRoleMutation = useMutation(
    trpc.users.updateRole.mutationOptions({
      onSuccess: () => {
        toast.success('Papel alterado com sucesso')
        queryClient.invalidateQueries({ queryKey: [['users', 'list']] })
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const handleSave = () => {
    if (selectedRole !== user.role) {
      updateRoleMutation.mutate({ userId: user.id, role: selectedRole })
    } else {
      onOpenChange(false)
    }
  }

  return (
    <ConfirmDialog
      mode="dialog"
      open={open}
      onOpenChange={onOpenChange}
      variant="info"
      icon={ShieldCheck}
      title="Alterar papel"
      subtitle={user.name}
      actionLabel="Salvar"
      actionLoadingLabel="Salvando..."
      isLoading={updateRoleMutation.isPending}
      isActionDisabled={selectedRole === user.role}
      onAction={handleSave}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role" className="text-sm font-medium">
            Novo papel
          </Label>
          <Select
            value={selectedRole}
            onValueChange={(value: 'admin' | 'volunteer') =>
              setSelectedRole(value)
            }
          >
            <SelectTrigger id="role" className="h-10 w-full rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Administrador
                </div>
              </SelectItem>
              <SelectItem value="volunteer">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Voluntário
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
          <p className="text-muted-foreground text-xs leading-relaxed">
            {selectedRole === 'admin' ? (
              <>
                <span className="text-foreground font-medium">
                  Administradores
                </span>{' '}
                gerenciam formulários, convidam membros e têm acesso completo ao
                painel.
              </>
            ) : (
              <>
                <span className="text-foreground font-medium">Voluntários</span>{' '}
                gerenciam gatos e candidaturas, sem acesso às configurações da
                organização.
              </>
            )}
          </p>
        </div>
      </div>
    </ConfirmDialog>
  )
}
