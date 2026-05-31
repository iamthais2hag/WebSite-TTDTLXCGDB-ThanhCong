import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SyncToolConfigError, normalizeApiUrlForSync } from "./config.js";

export type EnvCheckStatus = "OK" | "MISSING" | "INVALID";

export type EnvCheckItem = {
  key: string;
  required: boolean;
  status: EnvCheckStatus;
  message: string;
};

export type EnvCheckReport = {
  ok: boolean;
  items: EnvCheckItem[];
};

export type EnvCheckOptions = {
  checkImageBasePathExists?: boolean;
};

const MIN_SYNC_SECRET_LENGTH = 16;

export function checkEnvironmentReadiness(
  env: NodeJS.ProcessEnv = process.env,
  options: EnvCheckOptions = {}
): EnvCheckReport {
  const items: EnvCheckItem[] = [
    checkDatabaseUrl(env.DATABASE_URL),
    checkSyncSecret(env.SYNC_SECRET),
    checkApiUrl(env.API_URL, env.NODE_ENV),
    checkSqlServerConfig(env),
    checkImageBasePath(env.IMAGE_BASE_PATH, options),
    checkUploadsDir(env.UPLOADS_DIR),
  ];

  return {
    items,
    ok: items.every((item) => !item.required || item.status === "OK"),
  };
}

export function formatEnvCheckReport(report: EnvCheckReport): string {
  const lines = [
    "Environment readiness check",
    "No raw env values, secrets, passwords, or connection strings are printed.",
    "",
    ...report.items.map(
      (item) =>
        `${item.status}: ${item.key} - ${item.message}${
          item.required ? "" : " (optional)"
        }`
    ),
    "",
    report.ok
      ? "Result: OK - required environment checks passed."
      : "Result: NOT READY - fix MISSING or INVALID required items before running database/sync.",
  ];

  return lines.join("\n");
}

function checkDatabaseUrl(value: string | undefined): EnvCheckItem {
  if (!value?.trim()) {
    return missing("DATABASE_URL", "required for server database access");
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "mysql:") {
      return invalid("DATABASE_URL", "must use mysql:// format");
    }

    if (!parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
      return invalid("DATABASE_URL", "must include host and database name");
    }
  } catch {
    return invalid("DATABASE_URL", "must be a valid URL");
  }

  return ok("DATABASE_URL", "present and format looks valid");
}

function checkSyncSecret(value: string | undefined): EnvCheckItem {
  if (!value) {
    return missing("SYNC_SECRET", "required for protected sync APIs");
  }

  if (value.length < MIN_SYNC_SECRET_LENGTH) {
    return invalid(
      "SYNC_SECRET",
      `must be at least ${MIN_SYNC_SECRET_LENGTH} characters`
    );
  }

  return ok("SYNC_SECRET", "present and length is acceptable");
}

function checkApiUrl(value: string | undefined, nodeEnv: string | undefined): EnvCheckItem {
  if (!value?.trim()) {
    return missing("API_URL", "required for sync-tool API calls");
  }

  try {
    normalizeApiUrlForSync(value, { NODE_ENV: nodeEnv });
  } catch (error) {
    const message =
      error instanceof SyncToolConfigError
        ? error.message
        : "API_URL format is invalid";

    return invalid("API_URL", message);
  }

  return ok("API_URL", "present and transport rule is valid");
}

function checkSqlServerConfig(env: NodeJS.ProcessEnv): EnvCheckItem {
  const connectionString = env.SQLSERVER_CONNECTION_STRING?.trim();

  if (connectionString) {
    return ok(
      "SQL_SERVER_CONFIG",
      "connection string is present; value is not printed"
    );
  }

  const requiredKeys = [
    "SQLSERVER_HOST",
    "SQLSERVER_PORT",
    "SQLSERVER_USER",
    "SQLSERVER_PASSWORD",
    "SQLSERVER_DATABASE",
  ] as const;
  const missingKeys = requiredKeys.filter((key) => !env[key]?.trim());

  if (missingKeys.length > 0) {
    return missing(
      "SQL_SERVER_CONFIG",
      `missing keys: ${missingKeys.join(", ")}`
    );
  }

  const port = Number(env.SQLSERVER_PORT);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return invalid("SQL_SERVER_CONFIG", "SQLSERVER_PORT must be 1-65535");
  }

  return ok("SQL_SERVER_CONFIG", "separate SQL Server keys are present");
}

function checkImageBasePath(
  value: string | undefined,
  options: EnvCheckOptions
): EnvCheckItem {
  if (!value?.trim()) {
    return missing("IMAGE_BASE_PATH", "required to resolve source photos");
  }

  if (options.checkImageBasePathExists && !existsSync(value)) {
    return invalid("IMAGE_BASE_PATH", "path does not exist");
  }

  return ok("IMAGE_BASE_PATH", "present");
}

function checkUploadsDir(value: string | undefined): EnvCheckItem {
  if (!value?.trim()) {
    return {
      key: "UPLOADS_DIR",
      message: "not set; server fallback may be used for local development",
      required: false,
      status: "MISSING",
    };
  }

  return {
    key: "UPLOADS_DIR",
    message: "present",
    required: false,
    status: "OK",
  };
}

function ok(key: string, message: string): EnvCheckItem {
  return {
    key,
    message,
    required: true,
    status: "OK",
  };
}

function missing(key: string, message: string): EnvCheckItem {
  return {
    key,
    message,
    required: true,
    status: "MISSING",
  };
}

function invalid(key: string, message: string): EnvCheckItem {
  return {
    key,
    message,
    required: true,
    status: "INVALID",
  };
}

function isDirectRun(): boolean {
  const currentFile = fileURLToPath(import.meta.url);
  const entryFile = process.argv[1] ? resolve(process.argv[1]) : "";

  return currentFile === entryFile;
}

if (isDirectRun()) {
  const report = checkEnvironmentReadiness(process.env, {
    checkImageBasePathExists: process.env.CHECK_IMAGE_BASE_PATH_EXISTS === "true",
  });

  console.log(formatEnvCheckReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
