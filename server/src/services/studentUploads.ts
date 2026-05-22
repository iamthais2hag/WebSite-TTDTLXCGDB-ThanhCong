import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Express } from "express";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export const studentUploadsRoute = "/uploads/students";

export const defaultStudentUploadsDir = path.resolve(
  currentDir,
  "../../..",
  "public/uploads/students"
);

type StudentUploadsEnv = {
  UPLOADS_DIR?: string;
};

export function resolveStudentUploadsDir(
  env: StudentUploadsEnv = process.env
): string {
  const configuredUploadsDir = env.UPLOADS_DIR?.trim();

  if (configuredUploadsDir) {
    return path.resolve(configuredUploadsDir);
  }

  return defaultStudentUploadsDir;
}

export function ensureStudentUploadsDir(uploadsDir: string): void {
  mkdirSync(uploadsDir, { recursive: true });
}

export function configureStudentUploads(
  app: Express,
  env: StudentUploadsEnv = process.env
): void {
  const uploadsDir = resolveStudentUploadsDir(env);

  ensureStudentUploadsDir(uploadsDir);
  app.use(
    studentUploadsRoute,
    express.static(uploadsDir, {
      dotfiles: "ignore",
      index: false,
    })
  );
}
