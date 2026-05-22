import { describe, expect, it } from "vitest";
import { appRouter } from "./index.js";

describe("appRouter", () => {
  it("exposes a minimal tRPC status procedure", async () => {
    const caller = appRouter.createCaller({
      req: {} as never,
      res: {} as never,
      syncSecret: undefined,
    });

    await expect(caller.status()).resolves.toEqual({
      ok: true,
      service: "server",
    });
  });

  it("mounts lookup and sync routers", () => {
    const caller = appRouter.createCaller({
      req: {} as never,
      res: {} as never,
      syncSecret: undefined,
    });

    expect(caller.lookup).toBeDefined();
    expect(caller.sync).toBeDefined();
  });
});
