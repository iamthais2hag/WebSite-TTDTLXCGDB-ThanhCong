import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildFallbackImagePath,
  resolveImagePath,
  type ImagePathRecord,
} from "./imagePath.js";

const tempRoots: string[] = [];

const baseRecord: ImagePathRecord = {
  MaDK: "DK001",
  MaKhoaHoc: "K45",
  DuongDanAnh: null,
};

afterEach(async () => {
  await Promise.all(
    tempRoots.map((tempRoot) =>
      rm(tempRoot, {
        recursive: true,
        force: true,
      })
    )
  );
  tempRoots.length = 0;
});

describe("image path resolver", () => {
  it("uses DuongDanAnh when the source file exists", async () => {
    const tempRoot = await createTempRoot();
    const directImagePath = path.join(tempRoot, "direct.jp2");
    const fallbackBasePath = path.join(tempRoot, "fallback");
    const fallbackImagePath = path.join(fallbackBasePath, "K45", "DK001.jp2");
    await createFile(directImagePath);
    await createFile(fallbackImagePath);

    await expect(
      resolveImagePath({
        ...baseRecord,
        DuongDanAnh: directImagePath,
      }, {
        imageBasePath: fallbackBasePath,
      })
    ).resolves.toEqual({
      found: true,
      source: "DuongDanAnh",
      imagePath: directImagePath,
    });
  });

  it("uses fallback when DuongDanAnh is missing or not found", async () => {
    const tempRoot = await createTempRoot();
    const fallbackBasePath = path.join(tempRoot, "images");
    const fallbackImagePath = path.join(fallbackBasePath, "K45", "DK001.jp2");
    await createFile(fallbackImagePath);

    await expect(
      resolveImagePath({
        ...baseRecord,
        DuongDanAnh: path.join(tempRoot, "missing.jp2"),
      }, {
        imageBasePath: fallbackBasePath,
      })
    ).resolves.toEqual({
      found: true,
      source: "fallback",
      imagePath: fallbackImagePath,
    });
  });

  it("returns a controlled missing result when no image exists", async () => {
    const tempRoot = await createTempRoot();
    const logger = {
      warn: vi.fn(),
    };

    const result = await resolveImagePath({
      ...baseRecord,
      DuongDanAnh: path.join(tempRoot, "missing.jp2"),
    }, {
      imageBasePath: path.join(tempRoot, "images"),
      logger,
    });

    expect(result).toEqual({
      found: false,
      source: "fallback",
      warning: "Khong tim thay anh hoc vien",
    });
    expect(JSON.stringify(result)).not.toContain(tempRoot);
    expect(logger.warn).toHaveBeenCalledWith("Khong tim thay anh hoc vien", {
      MaDK: "DK001",
      MaKhoaHoc: "K45",
      hasDuongDanAnh: true,
      hasImageBasePath: true,
    });
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(tempRoot);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("password");
  });

  it("builds fallback path as IMAGE_BASE_PATH/MaKhoaHoc/MaDK.jp2", async () => {
    const tempRoot = await createTempRoot();
    const imageBasePath = path.join(tempRoot, "image-base");

    expect(buildFallbackImagePath(baseRecord, imageBasePath)).toBe(
      path.resolve(imageBasePath, "K45", "DK001.jp2")
    );
  });

  it("handles missing MaKhoaHoc or MaDK safely", async () => {
    const tempRoot = await createTempRoot();
    const imageBasePath = path.join(tempRoot, "images");

    await expect(
      resolveImagePath({
        ...baseRecord,
        MaKhoaHoc: null,
      }, {
        imageBasePath,
      })
    ).resolves.toEqual({
      found: false,
      source: "fallback",
      warning: "Khong tim thay anh hoc vien",
    });

    await expect(
      resolveImagePath({
        ...baseRecord,
        MaDK: null,
      }, {
        imageBasePath,
      })
    ).resolves.toEqual({
      found: false,
      source: "fallback",
      warning: "Khong tim thay anh hoc vien",
    });
  });

  it("does not build fallback paths outside IMAGE_BASE_PATH", () => {
    expect(
      buildFallbackImagePath(
        {
          MaDK: "..",
          MaKhoaHoc: "K45",
        },
        path.join(os.tmpdir(), "image-base")
      )
    ).toBeNull();

    expect(
      buildFallbackImagePath(
        {
          MaDK: "DK001",
          MaKhoaHoc: "../outside",
        },
        path.join(os.tmpdir(), "image-base")
      )
    ).toBeNull();
  });
});

async function createTempRoot(): Promise<string> {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "sync-image-path-"));
  tempRoots.push(tempRoot);

  return tempRoot;
}

async function createFile(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), {
    recursive: true,
  });
  await writeFile(filePath, "test image placeholder");
}
