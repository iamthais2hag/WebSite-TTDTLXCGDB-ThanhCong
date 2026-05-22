import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  getCheckpoint,
  isValidCheckpoint,
  saveCheckpoint,
  type SyncCheckpoint,
} from "./syncState.js";

const tempDirs: string[] = [];

const validCheckpoint: SyncCheckpoint = {
  lastSuccessfulBatch: 3,
  lastMaDK: "DK003",
  lastSourceUpdatedAt: "2026-05-21T10:30:00.000Z",
  totalProcessed: 300,
  lastRunAt: "2026-05-21T10:35:00.000Z",
};

async function createTempCheckpointPath() {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "sync-state-"));
  tempDirs.push(tempDir);

  return path.join(tempDir, "last-sync.json");
}

async function pathExists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

describe("sync checkpoint state", () => {
  afterEach(async () => {
    while (tempDirs.length > 0) {
      const tempDir = tempDirs.pop();

      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true });
      }
    }
  });

  it("returns null safely when checkpoint file does not exist", async () => {
    const checkpointPath = await createTempCheckpointPath();

    await expect(getCheckpoint(checkpointPath)).resolves.toBeNull();
  });

  it("reads a valid checkpoint file", async () => {
    const checkpointPath = await createTempCheckpointPath();
    await writeFile(
      checkpointPath,
      JSON.stringify(validCheckpoint, null, 2),
      "utf8"
    );

    await expect(getCheckpoint(checkpointPath)).resolves.toEqual(validCheckpoint);
  });

  it("returns null safely for broken JSON", async () => {
    const checkpointPath = await createTempCheckpointPath();
    await writeFile(checkpointPath, "{not-json", "utf8");

    await expect(getCheckpoint(checkpointPath)).resolves.toBeNull();
  });

  it("returns null safely when important fields are missing", async () => {
    const checkpointPath = await createTempCheckpointPath();
    const incompleteCheckpoint = {
      lastSuccessfulBatch: 3,
      lastMaDK: "DK003",
      totalProcessed: 300,
    };

    await writeFile(
      checkpointPath,
      JSON.stringify(incompleteCheckpoint, null, 2),
      "utf8"
    );

    await expect(getCheckpoint(checkpointPath)).resolves.toBeNull();
  });

  it("writes valid checkpoint data atomically", async () => {
    const checkpointPath = await createTempCheckpointPath();

    await expect(saveCheckpoint(validCheckpoint, checkpointPath)).resolves.toBe(
      true
    );

    await expect(getCheckpoint(checkpointPath)).resolves.toEqual(validCheckpoint);

    const raw = await readFile(checkpointPath, "utf8");
    expect(JSON.parse(raw)).toEqual(validCheckpoint);
  });

  it("does not write a checkpoint when input is invalid", async () => {
    const checkpointPath = await createTempCheckpointPath();
    const invalidCheckpoint = {
      ...validCheckpoint,
      lastMaDK: "",
    } as SyncCheckpoint;

    await expect(saveCheckpoint(invalidCheckpoint, checkpointPath)).resolves.toBe(
      false
    );
    await expect(pathExists(checkpointPath)).resolves.toBe(false);
  });

  it("validates checkpoint shape before save", () => {
    expect(isValidCheckpoint(validCheckpoint)).toBe(true);
    expect(
      isValidCheckpoint({
        ...validCheckpoint,
        lastRunAt: "not-a-date",
      })
    ).toBe(false);
    expect(
      isValidCheckpoint({
        ...validCheckpoint,
        totalProcessed: -1,
      })
    ).toBe(false);
  });
});
