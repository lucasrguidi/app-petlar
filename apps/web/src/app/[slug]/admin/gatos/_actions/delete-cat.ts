'use server'

import { auth } from '@app-petlar/auth'
import { db } from '@app-petlar/db'
import { cats } from '@app-petlar/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type ActionResponse = {
  success: boolean
  error?: string
}

export async function deleteCat(catId: string): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    })

    if (!session?.user?.orgId) {
      return { success: false, error: 'Não autorizado' }
    }

    const orgId = session.user.orgId

    // Verify cat exists and belongs to org
    const [existingCat] = await db
      .select({ id: cats.id })
      .from(cats)
      .where(and(eq(cats.id, catId), eq(cats.orgId, orgId)))

    if (!existingCat) {
      return { success: false, error: 'Gato não encontrado' }
    }

    // Delete cat (photos are deleted by cascade)
    await db.delete(cats).where(eq(cats.id, catId))

    revalidatePath('/[slug]/admin/gatos', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error deleting cat:', error)
    return { success: false, error: 'Erro ao excluir gato' }
  }
}
