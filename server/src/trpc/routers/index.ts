import { publicProcedure, router } from "../trpc.js";
import { lookupRouter } from "./lookup.js";
import { syncRouter } from "./sync.js";

export const appRouter = router({
  lookup: lookupRouter,
  sync: syncRouter,
  status: publicProcedure.query(() => ({
    ok: true,
    service: "server",
  })),
});

export type AppRouter = typeof appRouter;
