import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export function createContext({ req, res }: CreateExpressContextOptions) {
  const syncSecret = req.headers["x-sync-secret"];

  return {
    req,
    res,
    syncSecret,
  };
}

export type Context = ReturnType<typeof createContext>;
