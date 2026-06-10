import express from "express";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  configureFrontendStatic,
  frontendRoutes,
  resolveClientDistDir,
} from "./frontendStatic.js";

const tempDirs: string[] = [];

function createTempDir(prefix: string) {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function listen(app: express.Express) {
  return new Promise<{
    close: () => Promise<void>;
    url: string;
  }>((resolve) => {
    const server = app.listen(0, () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        throw new Error("Unable to bind test server");
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

describe("frontend SPA static fallback", () => {
  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, {
        force: true,
        recursive: true,
      });
    }
  });

  it("resolves CLIENT_DIST_DIR when provided", () => {
    const distDir = path.join(createTempDir("client-dist-"), "dist");

    expect(resolveClientDistDir({ CLIENT_DIST_DIR: distDir })).toBe(
      path.resolve(distDir)
    );
  });

  it("does not register fallback when index.html is missing", () => {
    const app = express();
    const distDir = createTempDir("client-dist-missing-");

    expect(configureFrontendStatic(app, { CLIENT_DIST_DIR: distDir })).toBe(
      false
    );
  });

  it("serves SPA index for public frontend routes only", async () => {
    const app = express();
    const distDir = createTempDir("client-dist-");
    const assetsDir = path.join(distDir, "assets");

    mkdirSync(assetsDir, { recursive: true });
    writeFileSync(path.join(distDir, "index.html"), "<main>SPA app</main>");
    writeFileSync(path.join(assetsDir, "app.js"), "console.log('ok');");

    expect(configureFrontendStatic(app, { CLIENT_DIST_DIR: distDir })).toBe(
      true
    );

    const server = await listen(app);

    try {
      for (const route of frontendRoutes) {
        const response = await fetch(`${server.url}${route}`);

        expect(response.status).toBe(200);
        expect(await response.text()).toContain("SPA app");
      }

      const assetResponse = await fetch(`${server.url}/assets/app.js`);
      expect(assetResponse.status).toBe(200);
      expect(await assetResponse.text()).toContain("console.log");

      const apiResponse = await fetch(`${server.url}/api/trpc`);
      expect(apiResponse.status).toBe(404);
      expect(await apiResponse.text()).not.toContain("SPA app");

      const uploadsResponse = await fetch(`${server.url}/uploads/students/a.jpg`);
      expect(uploadsResponse.status).toBe(404);
      expect(await uploadsResponse.text()).not.toContain("SPA app");
    } finally {
      await server.close();
    }
  });
});
