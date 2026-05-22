import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import * as schema from "./schema.js";

const missingDatabaseUrlMessage =
  "DATABASE_URL is required before accessing the database";

export function getDatabaseUrl(
  env: { DATABASE_URL?: string } = process.env
): string {
  const databaseUrl = env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error(missingDatabaseUrlMessage);
  }

  return databaseUrl;
}

export function createDatabasePool(databaseUrl = getDatabaseUrl()): Pool {
  return createPool(databaseUrl);
}

export function createDatabaseClient(pool = createDatabasePool()) {
  return drizzle(pool, { schema, mode: "default" });
}

export type DatabasePool = Pool;
export type DatabaseClient = ReturnType<typeof createDatabaseClient>;
