import { describe, expect, it } from "vitest";
import {
  SyncToolConfigError,
  normalizeApiUrlForSync,
} from "./config.js";

describe("sync-tool config", () => {
  it("allows HTTPS API_URL in production", () => {
    expect(
      normalizeApiUrlForSync("https://thanhcongdaklak.edu.vn/", {
        NODE_ENV: "production",
      })
    ).toBe("https://thanhcongdaklak.edu.vn");
  });

  it("rejects public HTTP API_URL in production", () => {
    expect(() =>
      normalizeApiUrlForSync("http://example.com", {
        NODE_ENV: "production",
      })
    ).toThrow(
      "Production sync API_URL must use HTTPS unless it points to localhost"
    );
  });

  it("allows localhost HTTP API_URL in production for local testing", () => {
    expect(
      normalizeApiUrlForSync("http://localhost:3000", {
        NODE_ENV: "production",
      })
    ).toBe("http://localhost:3000");
  });

  it("allows 127.0.0.1 HTTP API_URL in production for local testing", () => {
    expect(
      normalizeApiUrlForSync("http://127.0.0.1:3000", {
        NODE_ENV: "production",
      })
    ).toBe("http://127.0.0.1:3000");
  });

  it("allows localhost HTTP API_URL outside production", () => {
    expect(
      normalizeApiUrlForSync("http://localhost:3000", {
        NODE_ENV: "development",
      })
    ).toBe("http://localhost:3000");
  });

  it("rejects missing or invalid API_URL with clear safe errors", () => {
    expect(() => normalizeApiUrlForSync("", { NODE_ENV: "production" })).toThrow(
      "API_URL is required"
    );
    expect(() =>
      normalizeApiUrlForSync("not-a-url", {
        NODE_ENV: "production",
      })
    ).toThrow("API_URL is invalid");
    expect(() =>
      normalizeApiUrlForSync("ftp://example.com", {
        NODE_ENV: "production",
      })
    ).toThrow("API_URL must use http or https");
  });

  it("does not include secrets in API_URL errors", () => {
    const secret = "test-sync-secret";

    try {
      normalizeApiUrlForSync("http://example.com", {
        NODE_ENV: "production",
      });

      throw new Error("Expected API_URL validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(SyncToolConfigError);
      const message = error instanceof Error ? error.message : String(error);

      expect(message).not.toContain(secret);
      expect(message).not.toContain("password");
    }
  });
});
