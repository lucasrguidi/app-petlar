'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, User } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            Alterar papel de {user.name}
          </DialogTitle>
          <DialogDescription>
            Escolha o novo papel para este membro da equipe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role">Papel</Label>
            <Select
              value={selectedRole}
              onValueChange={(value: 'admin' | 'volunteer') =>
                setSelectedRole(value)
              }
            >
              <SelectTrigger id="role" className="w-full">
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

          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            {selectedRole === 'admin' ? (
              <p className="text-muted-foreground">
                <strong className="text-foreground">Administradores</strong>{' '}
                podem gerenciar formulários, convidar membros e ter acesso
                completo ao painel.
              </p>
            ) : (
              <p className="text-muted-foreground">
                <strong className="text-foreground">Voluntários</strong> podem
                gerenciar gatos e candidaturas, mas não têm acesso às
                configurações da organização.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              updateRoleMutation.isPending || selectedRole === user.role
            }
          >
            {updateRoleMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
