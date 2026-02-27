'use server'

import { revalidatePath } from 'next/cache'

/**
 * Revalidates all pages for the given org slug to apply theme changes.
 */
export async function revalidateTheme(slug: string) {
  // Revalidate the entire org path to ensure theme CSS is refreshed
  revalidatePath(`/${slug}`, 'layout')
}
