import { describe, expect, it } from "vitest";
import {
  checkEnvironmentReadiness,
  formatEnvCheckReport,
} from "./envCheck.js";

const validEnv = {
  API_URL: "https://thanhcongdaklak.edu.vn",
  DATABASE_URL: "mysql://localhost:3306/thanhcong",
  IMAGE_BASE_PATH: "C:\\photos",
  NODE_ENV: "production",
  SQLSERVER_DATABASE: "source_db",
  SQLSERVER_HOST: "localhost",
  SQLSERVER_PASSWORD: "test-password-only",
  SQLSERVER_PORT: "1433",
  SQLSERVER_USER: "readonly_user",
  SYNC_SECRET: "test-sync-secret-with-length",
} satisfies NodeJS.ProcessEnv;

describe("env readiness check", () => {
  it("marks missing required variables without printing secret values", () => {
    const report = checkEnvironmentReadiness({});
    const output = formatEnvCheckReport(report);

    expect(report.ok).toBe(false);
    expect(report.items.find((item) => item.key === "DATABASE_URL")?.status).toBe(
      "MISSING"
    );
    expect(report.items.find((item) => item.key === "SYNC_SECRET")?.status).toBe(
      "MISSING"
    );
    expect(output).toContain("MISSING: DATABASE_URL");
    expect(output).not.toContain("test-sync-secret-with-length");
    expect(output).not.toContain("mysql://localhost");
  });

  it("rejects public HTTP API_URL in production", () => {
    const report = checkEnvironmentReadiness({
      ...validEnv,
      API_URL: "http://example.com",
    });

    expect(report.ok).toBe(false);
    expect(report.items.find((item) => item.key === "API_URL")?.status).toBe(
      "INVALID"
    );
  });

  it("allows HTTPS API_URL in production", () => {
    const report = checkEnvironmentReadiness(validEnv);

    expect(report.ok).toBe(true);
    expect(report.items.find((item) => item.key === "API_URL")?.status).toBe("OK");
  });

  it("allows localhost HTTP API_URL in production for local testing", () => {
    const report = checkEnvironmentReadiness({
      ...validEnv,
      API_URL: "http://localhost:3000",
    });

    expect(report.ok).toBe(true);
  });

  it("validates DATABASE_URL format without connecting to a database", () => {
    const report = checkEnvironmentReadiness({
      ...validEnv,
      DATABASE_URL: "not-a-url",
    });

    expect(report.ok).toBe(false);
    expect(report.items.find((item) => item.key === "DATABASE_URL")?.status).toBe(
      "INVALID"
    );
  });

  it("supports SQL Server connection string without printing it", () => {
    const report = checkEnvironmentReadiness({
      ...validEnv,
      SQLSERVER_CONNECTION_STRING:
        "Server=localhost;Database=source_db;User Id=readonly;Pwd=hidden;",
      SQLSERVER_DATABASE: "",
      SQLSERVER_HOST: "",
      SQLSERVER_PASSWORD: "",
      SQLSERVER_PORT: "",
      SQLSERVER_USER: "",
    });
    const output = formatEnvCheckReport(report);

    expect(report.ok).toBe(true);
    expect(output).not.toContain("Server=localhost");
    expect(output).not.toContain("hidden");
  });

  it("does not require UPLOADS_DIR for local fallback", () => {
    const report = checkEnvironmentReadiness({
      ...validEnv,
      UPLOADS_DIR: "",
    });

    expect(report.ok).toBe(true);
    expect(report.items.find((item) => item.key === "UPLOADS_DIR")?.status).toBe(
      "MISSING"
    );
  });
});
