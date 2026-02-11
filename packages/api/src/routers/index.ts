import { protectedProcedure, publicProcedure, router } from '../index'

import { catsRouter } from './cats'
import { formsRouter } from './forms'
import { orgsRouter } from './orgs'
import { uploadRouter } from './upload'

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return 'OK'
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: 'This is private',
      user: ctx.session.user,
    }
  }),
  upload: uploadRouter,
  cats: catsRouter,
  forms: formsRouter,
  orgs: orgsRouter,
})
export type AppRouter = typeof appRouter
