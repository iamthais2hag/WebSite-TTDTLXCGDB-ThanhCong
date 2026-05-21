import { describe, expect, it } from "vitest";
import { sharedPackageReady } from "./index.js";

describe("shared package", () => {
  it("is wired into the workspace", () => {
    expect(sharedPackageReady).toBe(true);
  });
});
