import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { createSyncPhotoRouter } from "./syncPhoto.js";

const tempDirs: string[] = [];
const testSecret = "test-sync-secret";
const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

function createTempDir(): string {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "student-photo-upload-"));
  tempDirs.push(tempDir);
  return tempDir;
}

function createPhotoForm(options?: {
  maDK?: string;
  maKhoaHoc?: string;
  mimeType?: string;
  photo?: Uint8Array | null;
}) {
  const form = new FormData();

  if (options?.maKhoaHoc !== undefined) {
    form.set("MaKhoaHoc", options.maKhoaHoc);
  } else {
    form.set("MaKhoaHoc", "K45");
  }

  if (options?.maDK !== undefined) {
    form.set("MaDK", options.maDK);
  } else {
    form.set("MaDK", "DK001");
  }

  if (options?.photo !== null) {
    form.set(
      "photo",
      new Blob([options?.photo ?? jpegBytes], {
        type: options?.mimeType ?? "image/jpeg",
      }),
      "student.jpg"
    );
  }

  return form;
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

async function startUploadServer(options?: {
  maxPhotoSize?: string;
  syncSecret?: string;
  uploadsDir?: string;
}) {
  const uploadsDir = options?.uploadsDir ?? createTempDir();
  const app = express();

  app.use(
    "/api/sync",
    createSyncPhotoRouter({
      MAX_PHOTO_SIZE: options?.maxPhotoSize,
      SYNC_SECRET: options?.syncSecret ?? testSecret,
      UPLOADS_DIR: uploadsDir,
    })
  );

  const server = await listen(app);

  return {
    ...server,
    uploadsDir,
  };
}

async function uploadPhoto(
  url: string,
  form: FormData,
  secret: string | null = testSecret
) {
  const headers: Record<string, string> = {};

  if (secret !== null) {
    headers["X-SYNC-SECRET"] = secret;
  }

  return fetch(`${url}/api/sync/student-photo`, {
    body: form,
    headers,
    method: "POST",
  });
}

describe("POST /api/sync/student-photo", () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      const tempDir = tempDirs.pop();

      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }
  });

  it("uploads a valid JPG and returns a public photoUrl", async () => {
    const server = await startUploadServer();

    try {
      const response = await uploadPhoto(server.url, createPhotoForm());
      const body = await response.json();
      const storedFile = path.join(server.uploadsDir, "K45", "DK001.jpg");

      expect(response.status).toBe(200);
      expect(body).toEqual({
        success: true,
        photoUrl: "/uploads/students/K45/DK001.jpg",
      });
      expect(readFileSync(storedFile)).toEqual(Buffer.from(jpegBytes));
      expect(JSON.stringify(body)).not.toContain(server.uploadsDir);
    } finally {
      await server.close();
    }
  });

  it("rejects missing or wrong sync secret", async () => {
    const server = await startUploadServer();

    try {
      const missingSecret = await uploadPhoto(server.url, createPhotoForm(), null);
      const wrongSecret = await uploadPhoto(server.url, createPhotoForm(), "wrong");

      expect(missingSecret.status).toBe(401);
      expect(wrongSecret.status).toBe(401);
      await expect(missingSecret.json()).resolves.toMatchObject({
        success: false,
      });
      await expect(wrongSecret.json()).resolves.toMatchObject({
        success: false,
      });
    } finally {
      await server.close();
    }
  });

  it("rejects missing photo and missing required fields", async () => {
    const server = await startUploadServer();

    try {
      const missingFile = await uploadPhoto(
        server.url,
        createPhotoForm({ photo: null })
      );
      const missingMaKhoaHoc = await uploadPhoto(
        server.url,
        createPhotoForm({ maKhoaHoc: "" })
      );
      const missingMaDK = await uploadPhoto(
        server.url,
        createPhotoForm({ maDK: "" })
      );

      expect(missingFile.status).toBe(400);
      expect(missingMaKhoaHoc.status).toBe(400);
      expect(missingMaDK.status).toBe(400);
    } finally {
      await server.close();
    }
  });

  it("rejects non-JPEG files", async () => {
    const server = await startUploadServer();

    try {
      const response = await uploadPhoto(
        server.url,
        createPhotoForm({
          mimeType: "text/plain",
          photo: new TextEncoder().encode("not an image"),
        })
      );

      expect(response.status).toBe(415);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        error: {
          code: "unsupported_media_type",
        },
      });
    } finally {
      await server.close();
    }
  });

  it("rejects files over MAX_PHOTO_SIZE", async () => {
    const server = await startUploadServer({
      maxPhotoSize: "3",
    });

    try {
      const response = await uploadPhoto(server.url, createPhotoForm());

      expect(response.status).toBe(413);
      await expect(response.json()).resolves.toMatchObject({
        success: false,
        error: {
          code: "payload_too_large",
        },
      });
    } finally {
      await server.close();
    }
  });

  it("rejects path traversal and never writes outside uploadsDir", async () => {
    const uploadsParent = createTempDir();
    const uploadsDir = path.join(uploadsParent, "uploads");
    const outsideFile = path.join(uploadsParent, "escape", "DK001.jpg");
    const server = await startUploadServer({
      uploadsDir,
    });

    try {
      const response = await uploadPhoto(
        server.url,
        createPhotoForm({
          maKhoaHoc: "../escape",
        })
      );
      const bodyText = await response.text();

      expect(response.status).toBe(400);
      expect(existsSync(outsideFile)).toBe(false);
      expect(bodyText).not.toContain(uploadsDir);
      expect(bodyText).not.toContain(uploadsParent);
    } finally {
      await server.close();
    }
  });
});
