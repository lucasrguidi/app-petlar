import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPPORT_WHATSAPP: z.string().optional(),
  },
  runtimeEnv: {
    NEXT_PUBLIC_SUPPORT_WHATSAPP: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP,
  },
  emptyStringAsUndefined: true,
})
