import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type SyncCheckpoint = {
  lastSuccessfulBatch: number;
  lastMaDK: string;
  lastSourceUpdatedAt: string;
  totalProcessed: number;
  lastRunAt: string;
};

const syncToolRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

export const defaultCheckpointPath = path.join(syncToolRoot, "last-sync.json");

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidIsoDateString(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

export function isValidCheckpoint(value: unknown): value is SyncCheckpoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const checkpoint = value as Partial<SyncCheckpoint>;

  return (
    isNonNegativeInteger(checkpoint.lastSuccessfulBatch) &&
    isNonEmptyString(checkpoint.lastMaDK) &&
    isValidIsoDateString(checkpoint.lastSourceUpdatedAt) &&
    isNonNegativeInteger(checkpoint.totalProcessed) &&
    isValidIsoDateString(checkpoint.lastRunAt)
  );
}

export async function getCheckpoint(
  checkpointPath = defaultCheckpointPath
): Promise<SyncCheckpoint | null> {
  try {
    const raw = await readFile(checkpointPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    return isValidCheckpoint(parsed) ? parsed : null;
  } catch (error) {
    if (isFileReadError(error)) {
      return null;
    }

    return null;
  }
}

export async function saveCheckpoint(
  checkpoint: SyncCheckpoint,
  checkpointPath = defaultCheckpointPath
): Promise<boolean> {
  if (!isValidCheckpoint(checkpoint)) {
    return false;
  }

  const checkpointDir = path.dirname(checkpointPath);
  const tempPath = `${checkpointPath}.tmp-${process.pid}-${Date.now()}`;

  try {
    await mkdir(checkpointDir, { recursive: true });
    await writeFile(tempPath, `${JSON.stringify(checkpoint, null, 2)}\n`, "utf8");
    await rename(tempPath, checkpointPath);

    return true;
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    throw error;
  }
}

function isFileReadError(error: unknown): boolean {
  return (
    error instanceof SyntaxError ||
    (error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT")
  );
}
