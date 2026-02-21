'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, ShieldCheck, User } from 'lucide-react'
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
      <DialogContent className="overflow-hidden rounded-xl p-0 sm:max-w-sm">
        <div className="flex items-center gap-3 border-b border-info/20 bg-info/10 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info/15">
            <ShieldCheck className="h-5 w-5 text-info" />
          </div>
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-base font-semibold">
              Alterar papel
            </DialogTitle>
            <DialogDescription className="text-xs">
              {user.name}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-5 pt-4 pb-5">
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
                  gerenciam formulários, convidam membros e têm acesso completo
                  ao painel.
                </>
              ) : (
                <>
                  <span className="text-foreground font-medium">
                    Voluntários
                  </span>{' '}
                  gerenciam gatos e candidaturas, sem acesso às configurações da
                  organização.
                </>
              )}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border/40 bg-card px-5 py-3 sm:flex-row sm:justify-end sm:space-x-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              updateRoleMutation.isPending || selectedRole === user.role
            }
            className="h-9 rounded-lg"
          >
            {updateRoleMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
