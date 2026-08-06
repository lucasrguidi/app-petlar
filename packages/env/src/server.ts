import 'dotenv/config'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    DATABASE_AUTH_TOKEN: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    // Cloudflare R2
    R2_ACCOUNT_ID: z.string().min(1),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET_NAME: z.string().min(1),
    R2_PUBLIC_URL: z.string().url(),
    // Email (Resend)
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().email().optional(),
    // Cron (Vercel). Optional so the app still boots without it — the cron
    // route fails closed (404) when it is unset.
    CRON_SECRET: z.string().min(32).optional(),
    // Set to 'true' to let the retention cron actually delete orphaned R2
    // objects. Defaults to a dry run that only logs what it would remove.
    RETENTION_DELETE_ORPHANS: z
      .string()
      .optional()
      .transform((v) => v === 'true'),
    // Preview/Development
    SKIP_EMAIL_CONFIRMATION: z
      .string()
      .optional()
      .transform((v) => v === 'true'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
})
