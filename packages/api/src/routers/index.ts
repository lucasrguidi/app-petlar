import { protectedProcedure, publicProcedure, router } from '../index'

import { adoptionsRouter } from './adoptions'
import { applicationsRouter } from './applications'
import { catsRouter } from './cats'
import { dashboardRouter } from './dashboard'
import { formsRouter } from './forms'
import { orgsRouter } from './orgs'
import { uploadRouter } from './upload'
import { usersRouter } from './users'

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
  dashboard: dashboardRouter,
  upload: uploadRouter,
  cats: catsRouter,
  forms: formsRouter,
  orgs: orgsRouter,
  users: usersRouter,
})
export type AppRouter = typeof appRouter
