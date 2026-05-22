import { describe, expect, it, vi } from "vitest";
import type { UploadStudentPhotoInput } from "./apiClient.js";
import {
  processStudentPhotoBatch,
  resolveImageConcurrency,
  type ImageBatchDependencies,
  type ImageBatchRecord,
} from "./imageBatch.js";

const tempDir = "sync-tool-temp";
const photoBytes = new Uint8Array([1, 2, 3]);
type ResolveImagePathDependency = NonNullable<
  ImageBatchDependencies["resolveImagePath"]
>;
type OptimizePhotoDependency = NonNullable<
  ImageBatchDependencies["optimizePhoto"]
>;

function createRecord(index: number): ImageBatchRecord {
  return {
    MaDK: `DK${String(index).padStart(3, "0")}`,
    MaKhoaHoc: "K45",
    DuongDanAnh: `source-${index}.jp2`,
  };
}

function createDependencies(
  overrides: Partial<ImageBatchDependencies> = {}
): ImageBatchDependencies {
  return {
    resolveImagePath: vi.fn<ResolveImagePathDependency>(async (record) => ({
      found: true,
      source: "DuongDanAnh",
      imagePath: record.DuongDanAnh ?? "source.jp2",
    })),
    optimizePhoto: vi.fn<OptimizePhotoDependency>(
      async (_inputPath, outputPath) => ({
        outputPath,
        quality: 88,
        sizeKB: 28,
        status: "target",
      })
    ),
    readPhotoFile: vi.fn(async () => photoBytes),
    ensureOutputDir: vi.fn(async () => undefined),
    cleanupOutputFile: vi.fn(async () => undefined),
    ...overrides,
  };
}

function createOptimizationResult(outputPath: string) {
  return {
    outputPath,
    quality: 88,
    sizeKB: 28,
    status: "target" as const,
  };
}

function createApiClient() {
  return {
    uploadStudentPhoto: vi.fn(async (input: UploadStudentPhotoInput) => ({
      success: true,
      photoUrl: `/uploads/students/${input.MaKhoaHoc}/${input.MaDK}.jpg`,
    })),
  };
}

describe("image batch concurrency", () => {
  it("uses default concurrency 5 and does not run the whole batch at once", async () => {
    const records = Array.from({ length: 12 }, (_value, index) =>
      createRecord(index + 1)
    );
    const apiClient = createApiClient();
    let active = 0;
    let maxActive = 0;
    const dependencies = createDependencies({
      optimizePhoto: vi.fn<OptimizePhotoDependency>(
        async (_inputPath, outputPath) => {
          active += 1;
          maxActive = Math.max(maxActive, active);
          await wait(5);
          active -= 1;

          return createOptimizationResult(outputPath);
        }
      ),
    });

    const results = await processStudentPhotoBatch(records, {
      apiClient,
      tempDir,
      dependencies,
    });

    expect(maxActive).toBe(5);
    expect(results).toHaveLength(records.length);
    expect(results.every((result) => result.photoUrl)).toBe(true);
  });

  it("uses IMAGE_CONCURRENCY=2 when configured", async () => {
    const records = Array.from({ length: 7 }, (_value, index) =>
      createRecord(index + 1)
    );
    const apiClient = createApiClient();
    let active = 0;
    let maxActive = 0;
    const dependencies = createDependencies({
      optimizePhoto: vi.fn<OptimizePhotoDependency>(
        async (_inputPath, outputPath) => {
          active += 1;
          maxActive = Math.max(maxActive, active);
          await wait(5);
          active -= 1;

          return createOptimizationResult(outputPath);
        }
      ),
    });

    await processStudentPhotoBatch(records, {
      apiClient,
      env: {
        IMAGE_CONCURRENCY: "2",
      },
      tempDir,
      dependencies,
    });

    expect(maxActive).toBe(2);
  });

  it("falls back to safe concurrency 5 for invalid values", () => {
    expect(resolveImageConcurrency(undefined)).toBe(5);
    expect(resolveImageConcurrency("abc")).toBe(5);
    expect(resolveImageConcurrency("0")).toBe(5);
    expect(resolveImageConcurrency(-1)).toBe(5);
    expect(resolveImageConcurrency("2")).toBe(2);
    expect(resolveImageConcurrency(3)).toBe(3);
  });
});

describe("image batch record handling", () => {
  it("returns photoUrl when resolve, optimize, and upload succeed", async () => {
    const apiClient = createApiClient();
    const dependencies = createDependencies();

    await expect(
      processStudentPhotoBatch([createRecord(1)], {
        apiClient,
        imageConcurrency: 1,
        tempDir,
        dependencies,
      })
    ).resolves.toEqual([
      {
        MaDK: "DK001",
        MaKhoaHoc: "K45",
        photoUrl: "/uploads/students/K45/DK001.jpg",
        imageError: null,
      },
    ]);
    expect(apiClient.uploadStudentPhoto).toHaveBeenCalledWith({
      MaKhoaHoc: "K45",
      MaDK: "DK001",
      photo: photoBytes,
      filename: "K45_DK001.jpg",
    });
  });

  it("returns imageError without failing the batch when image is missing", async () => {
    const apiClient = createApiClient();
    const dependencies = createDependencies({
      resolveImagePath: vi.fn<ResolveImagePathDependency>(async () => ({
        found: false,
        source: "fallback",
        warning: "Khong tim thay anh hoc vien",
      })),
    });
    const logger = {
      warn: vi.fn(),
    };

    await expect(
      processStudentPhotoBatch([createRecord(1)], {
        apiClient,
        imageConcurrency: 1,
        tempDir,
        logger,
        dependencies,
      })
    ).resolves.toEqual([
      {
        MaDK: "DK001",
        MaKhoaHoc: "K45",
        photoUrl: null,
        imageError: "Khong tim thay anh hoc vien",
      },
    ]);
    expect(dependencies.optimizePhoto).not.toHaveBeenCalled();
    expect(apiClient.uploadStudentPhoto).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith("Khong tim thay anh hoc vien", {
      MaDK: "DK001",
    });
  });

  it("returns imageError without failing the batch when convert fails", async () => {
    const apiClient = createApiClient();
    const dependencies = createDependencies({
      optimizePhoto: vi.fn<OptimizePhotoDependency>(async () => {
        throw new Error("local conversion failed with path detail");
      }),
    });
    const logger = {
      warn: vi.fn(),
    };

    const results = await processStudentPhotoBatch([createRecord(1)], {
      apiClient,
      imageConcurrency: 1,
      tempDir,
      logger,
      dependencies,
    });

    expect(results).toEqual([
      {
        MaDK: "DK001",
        MaKhoaHoc: "K45",
        photoUrl: null,
        imageError: "Khong the xu ly anh hoc vien",
      },
    ]);
    expect(apiClient.uploadStudentPhoto).not.toHaveBeenCalled();
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("path detail");
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("password");
  });

  it("returns imageError without failing the batch when upload fails", async () => {
    const apiClient = {
      uploadStudentPhoto: vi.fn(async () => {
        throw new Error("network error with secret detail");
      }),
    };
    const dependencies = createDependencies();
    const logger = {
      warn: vi.fn(),
    };

    const results = await processStudentPhotoBatch([createRecord(1)], {
      apiClient,
      imageConcurrency: 1,
      tempDir,
      logger,
      dependencies,
    });

    expect(results).toEqual([
      {
        MaDK: "DK001",
        MaKhoaHoc: "K45",
        photoUrl: null,
        imageError: "Khong the upload anh hoc vien",
      },
    ]);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("secret");
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("password");
  });

  it("keeps processing other records when one image fails", async () => {
    const apiClient = createApiClient();
    const dependencies = createDependencies({
      optimizePhoto: vi.fn<OptimizePhotoDependency>(
        async (inputPath, outputPath) => {
          if (inputPath === "source-2.jp2") {
            throw new Error("conversion failed");
          }

          return createOptimizationResult(outputPath);
        }
      ),
    });

    const results = await processStudentPhotoBatch(
      [createRecord(1), createRecord(2), createRecord(3)],
      {
        apiClient,
        imageConcurrency: 2,
        tempDir,
        dependencies,
      }
    );

    expect(results).toEqual([
      {
        MaDK: "DK001",
        MaKhoaHoc: "K45",
        photoUrl: "/uploads/students/K45/DK001.jpg",
        imageError: null,
      },
      {
        MaDK: "DK002",
        MaKhoaHoc: "K45",
        photoUrl: null,
        imageError: "Khong the xu ly anh hoc vien",
      },
      {
        MaDK: "DK003",
        MaKhoaHoc: "K45",
        photoUrl: "/uploads/students/K45/DK003.jpg",
        imageError: null,
      },
    ]);
  });
});

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
