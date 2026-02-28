'use client'

import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/lib/auth-client'

export function SecurityCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isFormValid =
    currentPassword.length >= 6 &&
    newPassword.length >= 6 &&
    confirmPassword.length >= 6 &&
    newPassword === confirmPassword

  const handleSubmit = async () => {
    if (!isFormValid) {
      if (newPassword !== confirmPassword) {
        toast.error('As senhas não coincidem.')
        return
      }
      if (newPassword.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres.')
        return
      }
      return
    }

    setIsSubmitting(true)

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: false,
      })

      if (result.error) {
        toast.error(
          result.error.message || 'Erro ao alterar senha. Verifique a senha atual.'
        )
      } else {
        toast.success('Senha alterada com sucesso!')
        // Clear form
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      toast.error('Erro ao alterar senha. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-display flex items-center gap-2">
          <ShieldCheck className="text-primary h-5 w-5" />
          Segurança
        </CardTitle>
        <CardDescription>Altere sua senha de acesso</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current password */}
        <div className="space-y-2">
          <Label htmlFor="current-password">Senha atual</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              id="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              className="h-11 rounded-lg pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* New password */}
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
              className="h-11 rounded-lg pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-muted-foreground text-xs">
            Mínimo de 6 caracteres
          </p>
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <div className="relative">
            <Lock className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              className="h-11 rounded-lg pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-destructive text-xs">As senhas não coincidem</p>
          )}
        </div>

        {/* Submit button */}
        <div className="flex justify-end border-t pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Alterar Senha
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
