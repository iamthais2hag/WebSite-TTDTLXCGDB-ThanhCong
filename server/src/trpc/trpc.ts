import { timingSafeEqual } from "node:crypto";
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create();

function getSingleHeaderValue(value: Context["syncSecret"]) {
  return typeof value === "string" ? value : undefined;
}

function secretsMatch(expectedSecret: string | undefined, receivedSecret: string | undefined) {
  if (!expectedSecret || !receivedSecret) {
    return false;
  }

  const expected = Buffer.from(expectedSecret, "utf8");
  const received = Buffer.from(receivedSecret, "utf8");

  return expected.length === received.length && timingSafeEqual(expected, received);
}

const syncAuthMiddleware = t.middleware(({ ctx, next }) => {
  const expectedSecret = process.env.SYNC_SECRET;
  const receivedSecret = getSingleHeaderValue(ctx.syncSecret);

  if (!secretsMatch(expectedSecret, receivedSecret)) {
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
