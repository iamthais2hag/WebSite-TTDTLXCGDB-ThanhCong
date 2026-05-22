import { describe, expect, it } from "vitest";
import { getDatabaseUrl } from "./client.js";

describe("database client config", () => {
  it("does not require DATABASE_URL when the module is imported", async () => {
    await expect(import("./client.js")).resolves.toBeTruthy();
  });

  it("reads DATABASE_URL from the provided environment", () => {
    expect(
      getDatabaseUrl({
        DATABASE_URL: "mysql://user:password@localhost:3306/thanhcong",
      })
    ).toBe("mysql://user:password@localhost:3306/thanhcong");
  });

  it("throws a clear error when database access is requested without DATABASE_URL", () => {
    expect(() => getDatabaseUrl({})).toThrow(
      "DATABASE_URL is required before accessing the database"
    );
  });
});
