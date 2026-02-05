import { protectedProcedure, publicProcedure, router } from "../index";
import { uploadRouter } from "./upload";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  upload: uploadRouter,
});
export type AppRouter = typeof appRouter;
