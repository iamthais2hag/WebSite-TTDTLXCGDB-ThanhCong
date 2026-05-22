import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Router, type NextFunction, type Request, type Response } from "express";
import multer from "multer";
import { isValidSyncSecret } from "../services/syncAuth.js";
import {
  resolveStudentUploadsDir,
  studentUploadsRoute,
} from "../services/studentUploads.js";

type SyncPhotoEnv = {
  MAX_PHOTO_SIZE?: string;
  SYNC_SECRET?: string;
  UPLOADS_DIR?: string;
};

type UploadErrorCode =
  | "unauthorized"
  | "bad_request"
  | "payload_too_large"
  | "unsupported_media_type";

const defaultMaxPhotoSizeBytes = 200 * 1024;
const safePathSegmentPattern = /^[A-Za-z0-9_-]+$/;

function getMaxPhotoSizeBytes(env: SyncPhotoEnv): number {
  const configuredSize = Number(env.MAX_PHOTO_SIZE);

  if (Number.isInteger(configuredSize) && configuredSize > 0) {
    return configuredSize;
  }

  return defaultMaxPhotoSizeBytes;
}

function sendUploadError(
  res: Response,
  status: number,
  code: UploadErrorCode,
  message: string
) {
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
    },
  });
}

function sanitizePathSegment(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!safePathSegmentPattern.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function resolveSafePhotoPath(
  uploadsDir: string,
  maKhoaHoc: string,
  maDK: string
): string | null {
  const uploadsRoot = path.resolve(uploadsDir);
  const photoPath = path.resolve(uploadsRoot, maKhoaHoc, `${maDK}.jpg`);
  const relativePath = path.relative(uploadsRoot, photoPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return photoPath;
}

function requireSyncSecret(env: SyncPhotoEnv) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!isValidSyncSecret(req.headers["x-sync-secret"], env.SYNC_SECRET)) {
      sendUploadError(res, 401, "unauthorized", "Unauthorized");
      return;
    }

    next();
  };
}

function handleMulterError(error: unknown, _req: Request, res: Response, next: NextFunction) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      sendUploadError(
        res,
        413,
        "payload_too_large",
        "File ảnh vượt quá dung lượng cho phép."
      );
      return;
    }

    sendUploadError(res, 400, "bad_request", "Upload ảnh không hợp lệ.");
    return;
  }

  next(error);
}

export function createSyncPhotoRouter(env: SyncPhotoEnv = process.env) {
  const router = Router();
  const uploadsDir = resolveStudentUploadsDir(env);
  const upload = multer({
    limits: {
      fileSize: getMaxPhotoSizeBytes(env),
      files: 1,
    },
    storage: multer.memoryStorage(),
  });

  router.post(
    "/student-photo",
    requireSyncSecret(env),
    upload.single("photo"),
    handleMulterError,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const maKhoaHoc = sanitizePathSegment(req.body.MaKhoaHoc);
        const maDK = sanitizePathSegment(req.body.MaDK);
        const photo = req.file;

        if (!maKhoaHoc || !maDK) {
          sendUploadError(
            res,
            400,
            "bad_request",
            "Thiếu hoặc sai MaKhoaHoc/MaDK."
          );
          return;
        }

        if (!photo) {
          sendUploadError(res, 400, "bad_request", "Thiếu file ảnh học viên.");
          return;
        }

        if (photo.mimetype !== "image/jpeg") {
          sendUploadError(
            res,
            415,
            "unsupported_media_type",
            "Chỉ chấp nhận ảnh JPG."
          );
          return;
        }

        const photoPath = resolveSafePhotoPath(uploadsDir, maKhoaHoc, maDK);

        if (!photoPath) {
          sendUploadError(res, 400, "bad_request", "Đường dẫn ảnh không hợp lệ.");
          return;
        }

        await mkdir(path.dirname(photoPath), { recursive: true });
        await writeFile(photoPath, photo.buffer);

        res.json({
          success: true,
          photoUrl: `${studentUploadsRoute}/${maKhoaHoc}/${maDK}.jpg`,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

export const syncPhotoRouter = createSyncPhotoRouter();
