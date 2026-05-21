import { describe, expect, it } from "vitest";
import { appRouter } from "./index.js";

describe("appRouter", () => {
  it("exposes a minimal tRPC status procedure", async () => {
    const caller = appRouter.createCaller({
      req: {} as never,
      res: {} as never,
    });

    await expect(caller.status()).resolves.toEqual({
      ok: true,
      service: "server",
    });
  });
});
