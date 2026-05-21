import { describe, expect, it } from "vitest";
import { syncToolPackageReady } from "./index.js";

describe("sync-tool package", () => {
  it("is wired into the workspace", () => {
    expect(syncToolPackageReady).toBe(true);
  });
});
