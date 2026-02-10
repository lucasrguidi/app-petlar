'use server'

import { auth } from '@app-petlar/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export type ActionResponse<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export async function signOut(slug: string): Promise<ActionResponse> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    })
  } catch {
    return {
      success: false,
      error: 'Erro ao fazer logout. Tente novamente.',
    }
  }

  redirect(`/${slug}/login`)
}
