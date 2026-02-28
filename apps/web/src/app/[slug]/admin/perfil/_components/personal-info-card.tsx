'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Save, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AvatarUpload } from './avatar-upload'

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
import { trpc } from '@/utils/trpc'

interface PersonalInfoCardProps {
  user: {
    name: string
    email: string
    contactEmail?: string | null
    image?: string | null
  }
}

export function PersonalInfoCard({ user }: PersonalInfoCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [name, setName] = useState(user.name)
  const [image, setImage] = useState<string | null>(user.image ?? null)
  const [hasChanges, setHasChanges] = useState(false)

  const displayEmail = user.contactEmail ?? user.email

  // Track changes
  useEffect(() => {
    const nameChanged = name !== user.name
    const imageChanged = image !== (user.image ?? null)
    setHasChanges(nameChanged || imageChanged)
  }, [name, image, user.name, user.image])

  const updateProfileMutation = useMutation(
    trpc.users.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.success('Perfil atualizado com sucesso!')
        queryClient.invalidateQueries({ queryKey: [['users']] })
        setHasChanges(false)
        // Refresh server components (header) to show updated data
        router.refresh()
      },
      onError: (error) => {
        toast.error(error.message)
      },
    })
  )

  const handleSave = () => {
    if (name.trim().length < 2) {
      toast.error('Nome deve ter pelo menos 2 caracteres.')
      return
    }

    updateProfileMutation.mutate({
      name: name.trim(),
      image,
    })
  }

  const handleImageChange = (url: string | null) => {
    setImage(url)
  }

  return (
    <Card className="border-border/60 bg-card/95 shadow-warm-sm rounded-xl">
      <CardHeader>
        <CardTitle className="text-display flex items-center gap-2">
          <User className="text-primary h-5 w-5" />
          Informações Pessoais
        </CardTitle>
        <CardDescription>
          Atualize seu nome e foto de perfil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <AvatarUpload
          currentImage={image}
          name={name}
          onImageChange={handleImageChange}
        />

        {/* Name field */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="h-11 rounded-lg"
          />
        </div>

        {/* Email field (readonly) */}
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            value={displayEmail}
            disabled
            className="bg-muted/50 h-11 rounded-lg"
          />
          <p className="text-muted-foreground text-xs">
            O e-mail não pode ser alterado
          </p>
        </div>

        {/* Save button */}
        <div className="flex justify-end border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
