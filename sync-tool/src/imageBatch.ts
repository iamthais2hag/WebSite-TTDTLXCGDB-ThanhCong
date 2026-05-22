import { mkdir, readFile, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  UploadStudentPhotoInput,
  UploadStudentPhotoResult,
} from "./apiClient.js";
import {
  convertAndOptimizeStudentPhoto,
  type StudentPhotoOptimizationResult,
} from "./imageOptimization.js";
import {
  resolveImagePath,
  type ResolveImagePathResult,
} from "./imagePath.js";

export type ImageBatchEnv = {
  IMAGE_CONCURRENCY?: string;
};

export type ImageBatchRecord = {
  MaDK?: string | null;
  MaKhoaHoc?: string | null;
  DuongDanAnh?: string | null;
};

export type ImageBatchApiClient = {
  uploadStudentPhoto(
    input: UploadStudentPhotoInput
  ): Promise<UploadStudentPhotoResult>;
};

export type ImageBatchLogger = {
  warn(message: string, metadata?: Record<string, unknown>): void;
};

export type ImageBatchDependencies = {
  resolveImagePath?: (
    record: ImageBatchRecord,
    config: {
      imageBasePath?: string | null;
    }
  ) => Promise<ResolveImagePathResult>;
  optimizePhoto?: (
    inputPath: string,
    outputPath: string
  ) => Promise<StudentPhotoOptimizationResult>;
  readPhotoFile?: (filePath: string) => Promise<Uint8Array>;
  ensureOutputDir?: (dirPath: string) => Promise<void>;
  cleanupOutputFile?: (filePath: string) => Promise<void>;
  buildOutputPath?: (record: RequiredImageRecord, tempDir: string) => string;
};

export type ProcessStudentPhotoBatchOptions = {
  apiClient: ImageBatchApiClient;
  imageBasePath?: string | null;
  imageConcurrency?: number | string | null;
  env?: ImageBatchEnv;
  tempDir?: string;
  logger?: ImageBatchLogger;
  dependencies?: ImageBatchDependencies;
};

export type ImageBatchRecordResult = {
  MaDK: string | null;
  MaKhoaHoc: string | null;
  photoUrl: string | null;
  imageError: string | null;
};

export type RequiredImageRecord = {
  MaDK: string;
  MaKhoaHoc: string;
  DuongDanAnh?: string | null;
};

const defaultImageConcurrency = 5;
const missingImageError = "Khong tim thay anh hoc vien";
const invalidRecordError = "Thong tin anh hoc vien khong hop le";
const convertImageError = "Khong the xu ly anh hoc vien";
const uploadImageError = "Khong the upload anh hoc vien";

export async function processStudentPhotoBatch(
  records: ImageBatchRecord[],
  options: ProcessStudentPhotoBatchOptions
): Promise<ImageBatchRecordResult[]> {
  const concurrency = resolveImageConcurrency(
    options.imageConcurrency ?? options.env?.IMAGE_CONCURRENCY
  );

  return mapWithConcurrency(records, concurrency, (record) =>
    processStudentPhotoRecord(record, options)
  );
}

export function resolveImageConcurrency(
  value: number | string | null | undefined,
  fallback = defaultImageConcurrency
): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

async function processStudentPhotoRecord(
  record: ImageBatchRecord,
  options: ProcessStudentPhotoBatchOptions
): Promise<ImageBatchRecordResult> {
  const baseResult = createBaseResult(record);
  const requiredRecord = normalizeRequiredRecord(record);

  if (!requiredRecord) {
    logImageWarning(options.logger, invalidRecordError, baseResult.MaDK);

    return {
      ...baseResult,
      imageError: invalidRecordError,
    };
  }

  const dependencies = options.dependencies ?? {};
  const resolveImagePathFn = dependencies.resolveImagePath ?? resolveImagePath;
  const optimizePhotoFn =
    dependencies.optimizePhoto ?? convertAndOptimizeStudentPhoto;
  const readPhotoFileFn = dependencies.readPhotoFile ?? readFile;
  const ensureOutputDirFn = dependencies.ensureOutputDir ?? ensureOutputDir;
  const cleanupOutputFileFn =
    dependencies.cleanupOutputFile ?? cleanupFileIfExists;
  const buildOutputPathFn =
    dependencies.buildOutputPath ?? buildStudentPhotoOutputPath;
  const tempDir = options.tempDir ?? defaultTempDir();

  try {
    const resolvedImage = await resolveImagePathFn(requiredRecord, {
      imageBasePath: options.imageBasePath,
    });

    if (!resolvedImage.found) {
      logImageWarning(options.logger, missingImageError, requiredRecord.MaDK);

      return {
        ...baseResult,
        MaDK: requiredRecord.MaDK,
        MaKhoaHoc: requiredRecord.MaKhoaHoc,
        imageError: missingImageError,
      };
    }

    const outputPath = buildOutputPathFn(requiredRecord, tempDir);
    await ensureOutputDirFn(path.dirname(outputPath));

    try {
      await optimizePhotoFn(resolvedImage.imagePath, outputPath);
      const photo = await readPhotoFileFn(outputPath);

      try {
        const uploadResult = await options.apiClient.uploadStudentPhoto({
          MaKhoaHoc: requiredRecord.MaKhoaHoc,
          MaDK: requiredRecord.MaDK,
          photo,
          filename: `${requiredRecord.MaKhoaHoc}_${requiredRecord.MaDK}.jpg`,
        });

        return {
          MaDK: requiredRecord.MaDK,
          MaKhoaHoc: requiredRecord.MaKhoaHoc,
          photoUrl: uploadResult.photoUrl,
          imageError: null,
        };
      } catch {
        logImageWarning(options.logger, uploadImageError, requiredRecord.MaDK);

        return {
          MaDK: requiredRecord.MaDK,
          MaKhoaHoc: requiredRecord.MaKhoaHoc,
          photoUrl: null,
          imageError: uploadImageError,
        };
      }
    } catch {
      logImageWarning(options.logger, convertImageError, requiredRecord.MaDK);

      return {
        MaDK: requiredRecord.MaDK,
        MaKhoaHoc: requiredRecord.MaKhoaHoc,
        photoUrl: null,
        imageError: convertImageError,
      };
    } finally {
      try {
        await cleanupOutputFileFn(outputPath);
      } catch {
        // Temporary JPG cleanup must not fail the data batch.
      }
    }
  } catch {
    logImageWarning(options.logger, convertImageError, requiredRecord.MaDK);

    return {
      MaDK: requiredRecord.MaDK,
      MaKhoaHoc: requiredRecord.MaKhoaHoc,
      photoUrl: null,
      imageError: convertImageError,
    };
  }
}

export function buildStudentPhotoOutputPath(
  record: RequiredImageRecord,
  tempDir: string
): string {
  return path.join(tempDir, record.MaKhoaHoc, `${record.MaDK}.jpg`);
}

function normalizeRequiredRecord(
  record: ImageBatchRecord
): RequiredImageRecord | null {
  const maDK = normalizeSafeSegment(record.MaDK);
  const maKhoaHoc = normalizeSafeSegment(record.MaKhoaHoc);

  if (!maDK || !maKhoaHoc) {
    return null;
  }

  return {
    MaDK: maDK,
    MaKhoaHoc: maKhoaHoc,
    DuongDanAnh: record.DuongDanAnh,
  };
}

function normalizeSafeSegment(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  if (!normalized || !/^[A-Za-z0-9_-]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function createBaseResult(record: ImageBatchRecord): ImageBatchRecordResult {
  return {
    MaDK: normalizeSafeSegment(record.MaDK),
    MaKhoaHoc: normalizeSafeSegment(record.MaKhoaHoc),
    photoUrl: null,
    imageError: null,
  };
}

function logImageWarning(
  logger: ImageBatchLogger | undefined,
  message: string,
  maDK: string | null
): void {
  logger?.warn(message, {
    MaDK: maDK,
  });
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex] as T);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return results;
}

async function ensureOutputDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, {
    recursive: true,
  });
}

async function cleanupFileIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // Temporary JPG cleanup must not fail the data batch.
  }
}

function defaultTempDir(): string {
  return path.join(os.tmpdir(), "thanhcong-sync-tool-photos");
}
