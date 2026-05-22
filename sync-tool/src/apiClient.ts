export type SyncPushRecord = {
  MaDK: string;
  HoVaTen: string;
  SoCMT: string;
  NgaySinh: string | null;
  GioiTinh: string | null;
  DiaChi: string | null;
  TenKhoaHoc: string | null;
  Hang: string | null;
  MaKhoaHoc: string | null;
  HangDaoTao: string | null;
  photoUrl: string | null;
  sourceUpdatedAt: string | null;
};

export type PushBatchInput = {
  records: SyncPushRecord[];
};

export type PushBatchResult = {
  success: boolean;
  processed: number;
  validated?: number;
  upserted?: number;
};

export type UploadStudentPhotoInput = {
  MaKhoaHoc: string;
  MaDK: string;
  photo: Blob | Uint8Array | ArrayBuffer;
  filename?: string;
};

export type UploadStudentPhotoResult = {
  success: boolean;
  photoUrl: string;
};

export type FetchLike = (
  input: string | URL,
  init?: RequestInit
) => Promise<Response>;

export type SyncApiClientConfig = {
  apiUrl?: string;
  syncSecret?: string;
  fetchFn?: FetchLike;
};

export type SyncApiClientEnv = {
  API_URL?: string;
  SYNC_SECRET?: string;
};

type ResolvedSyncApiClientConfig = {
  apiUrl: string;
  syncSecret: string;
  fetchFn: FetchLike;
};

export class SyncApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "SyncApiClientError";
  }
}

export class SyncApiClient {
  private readonly apiUrl: string;
  private readonly syncSecret: string;
  private readonly fetchFn: FetchLike;

  constructor(config: SyncApiClientConfig, env: SyncApiClientEnv = process.env) {
    const resolved = resolveSyncApiClientConfig(config, env);
    this.apiUrl = resolved.apiUrl;
    this.syncSecret = resolved.syncSecret;
    this.fetchFn = resolved.fetchFn;
  }

  async pushBatch(input: PushBatchInput): Promise<PushBatchResult> {
    const response = await this.fetchFn(buildUrl(this.apiUrl, "/api/trpc/sync.pushBatch"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SYNC-SECRET": this.syncSecret,
      },
      body: JSON.stringify({
        json: input,
      }),
    });

    const payload = await readResponseJson(response);

    if (!response.ok) {
      throw new SyncApiClientError("Khong the dong bo batch", response.status);
    }

    const data = unwrapTrpcData(payload);
    if (!isPushBatchResult(data)) {
      throw new SyncApiClientError("Phan hoi sync.pushBatch khong hop le");
    }

    return data;
  }

  async uploadStudentPhoto(
    input: UploadStudentPhotoInput
  ): Promise<UploadStudentPhotoResult> {
    const formData = new FormData();
    formData.append("MaKhoaHoc", input.MaKhoaHoc);
    formData.append("MaDK", input.MaDK);
    formData.append(
      "photo",
      toJpegBlob(input.photo),
      input.filename ?? `${input.MaKhoaHoc}_${input.MaDK}.jpg`
    );

    const response = await this.fetchFn(buildUrl(this.apiUrl, "/api/sync/student-photo"), {
      method: "POST",
      headers: {
        "X-SYNC-SECRET": this.syncSecret,
      },
      body: formData,
    });

    const payload = await readResponseJson(response);

    if (!response.ok) {
      throw new SyncApiClientError("Khong the upload anh hoc vien", response.status);
    }

    if (!isUploadStudentPhotoResult(payload)) {
      throw new SyncApiClientError("Phan hoi upload anh khong hop le");
    }

    return payload;
  }
}

export function createSyncApiClient(
  config: SyncApiClientConfig = {},
  env: SyncApiClientEnv = process.env
): SyncApiClient {
  return new SyncApiClient(config, env);
}

export function resolveSyncApiClientConfig(
  config: SyncApiClientConfig = {},
  env: SyncApiClientEnv = process.env
): ResolvedSyncApiClientConfig {
  const apiUrl = (config.apiUrl ?? env.API_URL)?.trim();
  const syncSecret = (config.syncSecret ?? env.SYNC_SECRET)?.trim();

  if (!apiUrl) {
    throw new SyncApiClientError("API_URL is required");
  }

  if (!syncSecret) {
    throw new SyncApiClientError("SYNC_SECRET is required");
  }

  return {
    apiUrl: trimTrailingSlash(apiUrl),
    syncSecret,
    fetchFn: config.fetchFn ?? fetch,
  };
}

function buildUrl(apiUrl: string, pathName: string): string {
  return `${trimTrailingSlash(apiUrl)}${pathName}`;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function toJpegBlob(photo: Blob | Uint8Array | ArrayBuffer): Blob {
  if (photo instanceof Blob) {
    return photo;
  }

  return new Blob([photo], {
    type: "image/jpeg",
  });
}

async function readResponseJson(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function unwrapTrpcData(payload: unknown): unknown {
  if (!isRecord(payload)) {
    return payload;
  }

  const result = payload.result;
  if (!isRecord(result)) {
    return payload;
  }

  const data = result.data;
  if (isRecord(data) && "json" in data) {
    return data.json;
  }

  return data;
}

function isPushBatchResult(value: unknown): value is PushBatchResult {
  return (
    isRecord(value) &&
    typeof value.success === "boolean" &&
    typeof value.processed === "number"
  );
}

function isUploadStudentPhotoResult(
  value: unknown
): value is UploadStudentPhotoResult {
  return (
    isRecord(value) &&
    value.success === true &&
    typeof value.photoUrl === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
