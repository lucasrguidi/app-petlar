'use server'

import { auth } from '@app-petlar/auth'
import { db } from '@app-petlar/db'
import { cats } from '@app-petlar/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type CatStatus = 'available' | 'in_progress' | 'adopted'

type ActionResponse = {
  success: boolean
  error?: string
}

const validTransitions: Record<CatStatus, CatStatus[]> = {
  available: ['in_progress'],
  in_progress: ['available', 'adopted'],
  adopted: [], // Cannot change from adopted
}

export async function updateCatStatus(
  catId: string,
  newStatus: CatStatus
): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    })

    if (!session?.user?.orgId) {
      return { success: false, error: 'Não autorizado' }
    }

    const orgId = session.user.orgId

    // Find current cat
    const [cat] = await db
      .select({ id: cats.id, status: cats.status })
      .from(cats)
      .where(and(eq(cats.id, catId), eq(cats.orgId, orgId)))

    if (!cat) {
      return { success: false, error: 'Gato não encontrado' }
    }

    // Validate transition
    const currentStatus = cat.status as CatStatus
    const allowed = validTransitions[currentStatus]

    if (!allowed.includes(newStatus)) {
      return { success: false, error: 'Transição de status inválida' }
    }

    // Update status
    await db.update(cats).set({ status: newStatus }).where(eq(cats.id, catId))

    revalidatePath('/[slug]/admin/gatos', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error updating cat status:', error)
    return { success: false, error: 'Erro ao atualizar status' }
  }
}
