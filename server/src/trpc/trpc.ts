import { initTRPC, TRPCError } from "@trpc/server";
import { isValidSyncSecret } from "../services/syncAuth.js";
import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create();

const syncAuthMiddleware = t.middleware(({ ctx, next }) => {
  if (!isValidSyncSecret(ctx.syncSecret)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  return next();
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const syncProcedure = t.procedure.use(syncAuthMiddleware);
