import { access } from "node:fs/promises";
import path from "node:path";

export type ImagePathSource = "DuongDanAnh" | "fallback";

export type ImagePathRecord = {
  MaDK?: string | null;
  MaKhoaHoc?: string | null;
  DuongDanAnh?: string | null;
};

export type ImagePathLogger = {
  warn(message: string, metadata?: Record<string, unknown>): void;
};

export type ResolveImagePathConfig = {
  imageBasePath?: string | null;
  pathExists?: (filePath: string) => Promise<boolean>;
  logger?: ImagePathLogger;
};

export type ResolveImagePathResult =
  | {
      found: true;
      source: ImagePathSource;
      imagePath: string;
      warning?: never;
    }
  | {
      found: false;
      source: ImagePathSource;
      imagePath?: never;
      warning: string;
    };

const missingImageWarning = "Khong tim thay anh hoc vien";

export async function resolveImagePath(
  record: ImagePathRecord,
  config: ResolveImagePathConfig = {}
): Promise<ResolveImagePathResult> {
  const pathExists = config.pathExists ?? defaultPathExists;
  const directImagePath = normalizeOptionalPath(record.DuongDanAnh);

  if (directImagePath && (await pathExists(directImagePath))) {
    return {
      found: true,
      source: "DuongDanAnh",
      imagePath: directImagePath,
    };
  }

  const fallbackImagePath = buildFallbackImagePath(record, config.imageBasePath);

  if (fallbackImagePath && (await pathExists(fallbackImagePath))) {
    return {
      found: true,
      source: "fallback",
      imagePath: fallbackImagePath,
    };
  }

  const result: ResolveImagePathResult = {
    found: false,
    source: "fallback",
    warning: missingImageWarning,
  };

  config.logger?.warn(missingImageWarning, {
    MaDK: normalizeOptionalPath(record.MaDK),
    MaKhoaHoc: normalizeOptionalPath(record.MaKhoaHoc),
    hasDuongDanAnh: Boolean(directImagePath),
    hasImageBasePath: Boolean(normalizeOptionalPath(config.imageBasePath)),
  });

  return result;
}

export function buildFallbackImagePath(
  record: ImagePathRecord,
  imageBasePath: string | null | undefined
): string | null {
  const basePath = normalizeOptionalPath(imageBasePath);
  const maKhoaHoc = normalizeOptionalPath(record.MaKhoaHoc);
  const maDK = normalizeOptionalPath(record.MaDK);

  if (!basePath || !maKhoaHoc || !maDK) {
    return null;
  }

  if (!isSafePathSegment(maKhoaHoc) || !isSafePathSegment(maDK)) {
    return null;
  }

  const resolvedBasePath = path.resolve(basePath);
  const resolvedImagePath = path.resolve(
    resolvedBasePath,
    maKhoaHoc,
    `${maDK}.jp2`
  );

  if (!isInsideBasePath(resolvedImagePath, resolvedBasePath)) {
    return null;
  }

  return resolvedImagePath;
}

function normalizeOptionalPath(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function isSafePathSegment(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function isInsideBasePath(filePath: string, basePath: string): boolean {
  const relativePath = path.relative(basePath, filePath);

  return (
    relativePath.length > 0 &&
    !relativePath.startsWith("..") &&
    !path.isAbsolute(relativePath)
  );
}

async function defaultPathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
