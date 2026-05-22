import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required for Drizzle Kit commands. Use a local or staging database URL; never run migration commands against production without approval."
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
