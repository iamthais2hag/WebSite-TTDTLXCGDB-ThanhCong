import { copyFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import {
  createImageProcessingAdapter,
  type ImageProcessingAdapter,
} from "./imageAdapter.js";

export type StudentPhotoOptimizationStatus =
  | "target"
  | "accepted"
  | "oversized";

export type StudentPhotoOptimizationLogger = {
  warn(message: string, metadata?: Record<string, unknown>): void;
};

export type StudentPhotoOptimizationOptions = {
  adapter?: ImageProcessingAdapter;
  qualities?: readonly number[];
  targetMinKB?: number;
  targetMaxKB?: number;
  acceptedMaxKB?: number;
  getFileSizeKB?: (filePath: string) => Promise<number>;
  promoteCandidate?: (candidatePath: string, outputPath: string) => Promise<void>;
  cleanupCandidate?: (candidatePath: string) => Promise<void>;
  candidatePathForQuality?: (outputPath: string, quality: number) => string;
  logger?: StudentPhotoOptimizationLogger;
};

export type StudentPhotoOptimizationResult = {
  outputPath: string;
  quality: number;
  sizeKB: number;
  status: StudentPhotoOptimizationStatus;
  warning?: string;
};

type CandidateResult = {
  candidatePath: string;
  quality: number;
  sizeKB: number;
};

const defaultQualities = [88, 85, 82, 78] as const;
const defaultTargetMinKB = 25;
const defaultTargetMaxKB = 30;
const defaultAcceptedMaxKB = 40;
const oversizedWarning =
  "Anh hoc vien van lon hon 40KB sau khi toi uu";

export class ImageOptimizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageOptimizationError";
  }
}

export async function convertAndOptimizeStudentPhoto(
  inputPath: string,
  outputPath: string,
  options: StudentPhotoOptimizationOptions = {}
): Promise<StudentPhotoOptimizationResult> {
  const adapter = options.adapter ?? createImageProcessingAdapter();
  const qualities = normalizeQualities(options.qualities ?? defaultQualities);
  const getFileSizeKBFn = options.getFileSizeKB ?? getFileSizeKB;
  const promoteCandidateFn = options.promoteCandidate ?? copyFile;
  const cleanupCandidateFn = options.cleanupCandidate ?? cleanupFileIfExists;
  const candidatePathForQualityFn =
    options.candidatePathForQuality ?? buildQualityCandidatePath;
  const targetMinKB = options.targetMinKB ?? defaultTargetMinKB;
  const targetMaxKB = options.targetMaxKB ?? defaultTargetMaxKB;
  const acceptedMaxKB = options.acceptedMaxKB ?? defaultAcceptedMaxKB;
  const candidates: CandidateResult[] = [];

  try {
    for (const quality of qualities) {
      const candidatePath = candidatePathForQualityFn(outputPath, quality);

      await adapter.convertJp2ToJpg(inputPath, candidatePath, {
        quality,
      });

      const sizeKB = await getFileSizeKBFn(candidatePath);
      const candidate = {
        candidatePath,
        quality,
        sizeKB,
      };
      candidates.push(candidate);

      if (isTargetSize(sizeKB, targetMinKB, targetMaxKB)) {
        return await promoteSelectedCandidate({
          selected: candidate,
          outputPath,
          status: "target",
          promoteCandidate: promoteCandidateFn,
        });
      }
    }

    const selected =
      candidates.find((candidate) => candidate.sizeKB <= acceptedMaxKB) ??
      candidates[0];

    if (!selected) {
      throw new ImageOptimizationError("Khong co quality hop le de toi uu anh");
    }

    const status: StudentPhotoOptimizationStatus =
      selected.sizeKB <= acceptedMaxKB ? "accepted" : "oversized";
    const warning = status === "oversized" ? oversizedWarning : undefined;

    if (warning) {
      options.logger?.warn(warning, {
        quality: selected.quality,
        sizeKB: Math.round(selected.sizeKB),
      });
    }

    return await promoteSelectedCandidate({
      selected,
      outputPath,
      status,
      warning,
      promoteCandidate: promoteCandidateFn,
    });
  } catch (error) {
    if (error instanceof ImageOptimizationError) {
      throw error;
    }

    throw new ImageOptimizationError("Khong the toi uu anh hoc vien");
  } finally {
    await Promise.all(
      candidates.map((candidate) => cleanupCandidateFn(candidate.candidatePath))
    );
  }
}

export async function getFileSizeKB(filePath: string): Promise<number> {
  const fileStat = await stat(filePath);

  return fileStat.size / 1024;
}

export function buildQualityCandidatePath(
  outputPath: string,
  quality: number
): string {
  const parsedPath = path.parse(outputPath);
  const extension = parsedPath.ext || ".jpg";

  return path.join(
    parsedPath.dir,
    `${parsedPath.name}.q${quality}.tmp${extension}`
  );
}

function normalizeQualities(qualities: readonly number[]): number[] {
  const normalized = qualities.filter(
    (quality) => Number.isInteger(quality) && quality >= 1 && quality <= 100
  );

  if (normalized.length === 0) {
    throw new ImageOptimizationError("Khong co quality hop le de toi uu anh");
  }

  return normalized;
}

function isTargetSize(
  sizeKB: number,
  targetMinKB: number,
  targetMaxKB: number
): boolean {
  return sizeKB >= targetMinKB && sizeKB <= targetMaxKB;
}

async function promoteSelectedCandidate({
  selected,
  outputPath,
  status,
  warning,
  promoteCandidate,
}: {
  selected: CandidateResult;
  outputPath: string;
  status: StudentPhotoOptimizationStatus;
  warning?: string;
  promoteCandidate: (
    candidatePath: string,
    outputPath: string
  ) => Promise<void>;
}): Promise<StudentPhotoOptimizationResult> {
  await promoteCandidate(selected.candidatePath, outputPath);

  return {
    outputPath,
    quality: selected.quality,
    sizeKB: selected.sizeKB,
    status,
    ...(warning ? { warning } : {}),
  };
}

async function cleanupFileIfExists(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // Temp candidate cleanup must not mask the optimization result.
  }
}
