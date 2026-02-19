import { protectedProcedure, publicProcedure, router } from '../index'

import { adoptionsRouter } from './adoptions'
import { applicationsRouter } from './applications'
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
  adoptions: adoptionsRouter,
  applications: applicationsRouter,
  upload: uploadRouter,
  cats: catsRouter,
  forms: formsRouter,
  orgs: orgsRouter,
})
export type AppRouter = typeof appRouter
