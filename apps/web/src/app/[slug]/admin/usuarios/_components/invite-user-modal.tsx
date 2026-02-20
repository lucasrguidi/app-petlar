'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Mail, Send, Shield, User } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { trpc } from '@/utils/trpc'

const inviteSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'volunteer']),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface InviteUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const queryClient = useQueryClient()

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'volunteer',
    },
  })

  const inviteMutation = useMutation(
    trpc.users.invite.mutationOptions({
      onSuccess: () => {
        toast.success('Convite enviado com sucesso!')
        queryClient.invalidateQueries({ queryKey: [['users', 'listInvites']] })
        form.reset()
        onOpenChange(false)
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  function onSubmit(data: InviteFormValues) {
    inviteMutation.mutate(data)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Mail className="text-primary h-5 w-5" />
            Convidar para a equipe
          </SheetTitle>
          <SheetDescription>
            O convidado receberá um e-mail com link para criar sua conta.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-5"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        className="pl-10"
                        disabled={inviteMutation.isPending}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Papel</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={inviteMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="volunteer">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Voluntário
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {field.value === 'admin'
                      ? 'Administradores podem gerenciar formulários e equipe.'
                      : 'Voluntários podem gerenciar gatos e candidaturas.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="shadow-primary-glow w-full gap-2"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar convite
                </>
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
