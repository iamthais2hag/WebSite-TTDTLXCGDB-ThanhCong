import { publicProcedure, router } from "../trpc.js";

export const appRouter = router({
  status: publicProcedure.query(() => ({
    ok: true,
    service: "server",
  })),
});

export type AppRouter = typeof appRouter;
