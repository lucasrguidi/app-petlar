/**
 * Pure retention-window helpers.
 *
 * Deliberately free of database and R2 imports so client components can share
 * the same rule the server enforces — the return dialog must not disagree with
 * what `returnToAvailable` actually does.
 */

/**
 * Days after an adoption before the losing applications for that cat/group are
 * purged.
 */
export const ADOPTION_RETENTION_DAYS = 60

const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** `adoptions.adoption_date` is a YYYY-MM-DD string, not a timestamp. */
function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function retentionCutoffDate(now = new Date()): string {
  return toDateString(
    new Date(now.getTime() - ADOPTION_RETENTION_DAYS * ONE_DAY_MS)
  )
}

/**
 * Whether an adoption is old enough that its losing applications have already
 * been (or are due to be) purged — which makes returning the cat a destructive
 * action that clears the remaining candidate.
 */
export function isPastRetentionWindow(
  adoptionDate: string,
  now = new Date()
): boolean {
  return adoptionDate <= retentionCutoffDate(now)
}
