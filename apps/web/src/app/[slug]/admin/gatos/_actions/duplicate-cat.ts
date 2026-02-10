'use server'

import { auth } from '@app-petlar/auth'
import { db } from '@app-petlar/db'
import { cats } from '@app-petlar/db/schema'
import { and, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'

type ActionResponse = {
  success: boolean
  data?: { id: string }
  error?: string
}

export async function duplicateCat(catId: string): Promise<ActionResponse> {
  try {
    const session = await auth.api.getSession({
      headers: new Headers(),
    })

    if (!session?.user?.orgId) {
      return { success: false, error: 'Não autorizado' }
    }

    const orgId = session.user.orgId

    // Find original cat
    const [original] = await db
      .select()
      .from(cats)
      .where(and(eq(cats.id, catId), eq(cats.orgId, orgId)))

    if (!original) {
      return { success: false, error: 'Gato não encontrado' }
    }

    const newCatId = nanoid()

    // Create copy
    await db.insert(cats).values({
      id: newCatId,
      orgId,
      formId: original.formId,
      name: `${original.name} (cópia)`,
      ageYears: original.ageYears,
      ageMonths: original.ageMonths,
      sex: original.sex,
      fiv: original.fiv,
      felv: original.felv,
      castrated: original.castrated,
      vaccinated: original.vaccinated,
      vaccinationNotes: original.vaccinationNotes,
      dewormed: original.dewormed,
      dewormingNotes: original.dewormingNotes,
      description: original.description,
      status: 'available',
      createdBy: session.user.id,
    })

    revalidatePath('/[slug]/admin/gatos', 'page')

    return { success: true, data: { id: newCatId } }
  } catch (error) {
    console.error('Error duplicating cat:', error)
    return { success: false, error: 'Erro ao duplicar gato' }
  }
}
