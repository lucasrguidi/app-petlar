import { db } from '@app-petlar/db'
import * as schema from '@app-petlar/db/schema/auth'
import { env } from '@app-petlar/env/server'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: schema,
  }),
  trustedOrigins: [env.CORS_ORIGIN],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      orgId: {
        type: 'string',
        required: false,
        input: true,
        fieldName: 'orgId',
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'volunteer',
        fieldName: 'role',
      },
      active: {
        type: 'boolean',
        required: false,
        defaultValue: true,
        input: false,
        fieldName: 'active',
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const foundUser = await db.query.user.findFirst({
            columns: { active: true },
            where: (users, { eq }) => eq(users.id, session.userId),
          })

          if (!foundUser || !foundUser.active) {
            return false
          }
        },
      },
    },
  },
  plugins: [nextCookies()],
})

export type Auth = typeof auth
