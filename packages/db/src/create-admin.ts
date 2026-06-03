/**
 * One-off script to create an admin user in a given org.
 *
 * Usage (from repo root):
 *   ADMIN_EMAIL='you@example.com' \
 *   ADMIN_PASSWORD='strong-password' \
 *   ADMIN_NAME='Your Name' \
 *   ORG_SLUG='queroadotar' \
 *   DATABASE_URL='libsql://...' \
 *   DATABASE_AUTH_TOKEN='...' \
 *   pnpm --filter @app-petlar/db tsx src/create-admin.ts
 */
import { createClient } from '@libsql/client'
import { hashPassword } from 'better-auth/crypto'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { nanoid } from 'nanoid'

import {
  buildOrgScopedAuthEmail,
  normalizeUserEmail,
} from './auth-identity'
import * as schema from './schema'
import { account, orgs, user } from './schema'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(`Missing required env var: ${name}`)
    process.exit(1)
  }
  return value
}

async function main() {
  const email = required('ADMIN_EMAIL')
  const password = required('ADMIN_PASSWORD')
  const name = process.env.ADMIN_NAME ?? 'Admin'
  const orgSlug = required('ORG_SLUG')
  const databaseUrl = required('DATABASE_URL')
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters')
    process.exit(1)
  }

  const client = createClient({ url: databaseUrl, authToken })
  const db = drizzle({ client, schema })

  const [org] = await db.select().from(orgs).where(eq(orgs.slug, orgSlug))
  if (!org) {
    console.error(`Org with slug "${orgSlug}" not found`)
    process.exit(1)
  }

  const authEmail = buildOrgScopedAuthEmail({
    orgId: org.id,
    email,
  })
  const normalized = normalizeUserEmail(email)

  const existing = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, authEmail))

  if (existing.length > 0) {
    console.error(
      `User with email "${email}" already exists in org "${orgSlug}"`
    )
    process.exit(1)
  }

  const userId = nanoid()
  const accountId = nanoid()
  const passwordHash = await hashPassword(password)

  await db.insert(user).values({
    id: userId,
    name,
    email: authEmail,
    contactEmail: email,
    contactEmailNormalized: normalized,
    emailVerified: true,
    orgId: org.id,
    role: 'admin',
    active: true,
  })

  await db.insert(account).values({
    id: accountId,
    accountId: userId,
    providerId: 'credential',
    userId,
    password: passwordHash,
  })

  console.warn(
    `Admin user created: ${name} <${email}> in org "${org.name}" (${orgSlug})`
  )
  console.warn(`User ID: ${userId}`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
