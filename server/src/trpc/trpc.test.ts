import { afterEach, describe, expect, it } from "vitest";
import { router, syncProcedure } from "./trpc.js";

const previousSyncSecret = process.env.SYNC_SECRET;

const testRouter = router({
  protectedPing: syncProcedure.query(() => ({
    ok: true,
  })),
});

function restoreSyncSecret() {
  if (previousSyncSecret === undefined) {
    delete process.env.SYNC_SECRET;
    return;
  }

  process.env.SYNC_SECRET = previousSyncSecret;
}

function createCaller(syncSecret?: string | string[]) {
  return testRouter.createCaller({
    req: {} as never,
    res: {} as never,
    syncSecret,
  });
}

describe("syncProcedure", () => {
  afterEach(() => {
    restoreSyncSecret();
  });

  it("rejects when server sync secret is not configured", async () => {
    delete process.env.SYNC_SECRET;

    await expect(createCaller("test-secret").protectedPing()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });

  it("rejects when sync secret header is missing", async () => {
    process.env.SYNC_SECRET = "test-secret";

    await expect(createCaller().protectedPing()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });

  it("rejects when sync secret header is wrong", async () => {
    process.env.SYNC_SECRET = "test-secret";

    await expect(createCaller("wrong-secret").protectedPing()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  });

  it("allows protected sync procedures when sync secret is valid", async () => {
    process.env.SYNC_SECRET = "test-secret";

    await expect(createCaller("test-secret").protectedPing()).resolves.toEqual({
      ok: true,
    });
  });
});
