import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import {
  configureStudentUploads,
  defaultStudentUploadsDir,
  resolveStudentUploadsDir,
  studentUploadsRoute,
} from "./studentUploads.js";

const tempDirs: string[] = [];

function createTempDir(name: string): string {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), name));
  tempDirs.push(tempDir);
  return tempDir;
}

function listen(app: express.Express) {
  const server = createServer(app);

  return new Promise<{ close: () => Promise<void>; url: string }>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        throw new Error("Expected an ephemeral TCP port");
      }

      resolve({
        close: () =>
          new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => {
              if (error) {
                closeReject(error);
                return;
              }

              closeResolve();
            });
          }),
        url: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

describe("student uploads static config", () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      const tempDir = tempDirs.pop();

      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  it("falls back to public/uploads/students when UPLOADS_DIR is missing", () => {
    expect(resolveStudentUploadsDir({})).toBe(defaultStudentUploadsDir);
    expect(
      defaultStudentUploadsDir.endsWith(path.join("public", "uploads", "students"))
    ).toBe(true);
  });

  it("uses UPLOADS_DIR when configured", () => {
    const uploadsDir = path.join(createTempDir("student-uploads-"), "runtime");

    expect(resolveStudentUploadsDir({ UPLOADS_DIR: uploadsDir })).toBe(
      path.resolve(uploadsDir)
    );
  });

  it("creates the uploads directory when it does not exist", () => {
    const uploadsDir = path.join(createTempDir("student-uploads-"), "missing");
    const app = express();

    expect(() =>
      configureStudentUploads(app, {
        UPLOADS_DIR: uploadsDir,
      })
    ).not.toThrow();
    expect(existsSync(uploadsDir)).toBe(true);
  });

  it("serves student photos without exposing the physical uploads path", async () => {
    const uploadsDir = createTempDir("student-uploads-");
    const app = express();
    configureStudentUploads(app, {
      UPLOADS_DIR: uploadsDir,
    });
    writeFileSync(path.join(uploadsDir, "student.jpg"), "fake image");
    const server = await listen(app);

    try {
      const photoResponse = await fetch(`${server.url}${studentUploadsRoute}/student.jpg`);
      const missingResponse = await fetch(
        `${server.url}${studentUploadsRoute}/missing.jpg`
      );
      const missingBody = await missingResponse.text();

      expect(photoResponse.status).toBe(200);
      await expect(photoResponse.text()).resolves.toBe("fake image");
      expect(missingResponse.status).toBe(404);
      expect(missingBody).not.toContain(uploadsDir);
    } finally {
      await server.close();
    }
  });
});
