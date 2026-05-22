import { describe, expect, it } from "vitest";
import { createContext } from "./context.js";

describe("createContext", () => {
  it("keeps request, response, and sync secret header in context", () => {
    const req = {
      headers: {
        "x-sync-secret": "test-secret",
      },
    };
    const res = {};

    expect(
      createContext({
        req: req as never,
        res: res as never,
      })
    ).toEqual({
      req,
      res,
      syncSecret: "test-secret",
    });
  });
});
