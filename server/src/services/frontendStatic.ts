import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const frontendRoutes = [
  "/",
  "/tuyen-sinh",
  "/tra-cuu",
  "/thong-bao",
  "/phap-ly",
] as const;

export const defaultClientDistDir = path.resolve(
  currentDir,
  "../../..",
  "client/dist"
);

type FrontendStaticEnv = {
  CLIENT_DIST_DIR?: string;
};

export function resolveClientDistDir(
  env: FrontendStaticEnv = process.env
): string {
  const configuredClientDistDir = env.CLIENT_DIST_DIR?.trim();

  if (configuredClientDistDir) {
    return path.resolve(configuredClientDistDir);
  }

  return defaultClientDistDir;
}

export function configureFrontendStatic(
  app: Express,
  env: FrontendStaticEnv = process.env
): boolean {
  const clientDistDir = resolveClientDistDir(env);
  const indexHtmlPath = path.join(clientDistDir, "index.html");

  if (!existsSync(indexHtmlPath)) {
    return false;
  }

  app.use(
    express.static(clientDistDir, {
      dotfiles: "ignore",
      index: false,
    })
  );

  app.get([...frontendRoutes], (_req, res) => {
    res.sendFile(indexHtmlPath);
  });

  return true;
}
