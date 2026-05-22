import type { PushBatchInput, PushBatchResult, SyncPushRecord } from "./apiClient.js";
import {
  readSqlServerStudentBatch,
  type SqlServerConnectionLike,
  type SqlServerReaderOptions,
  type SqlServerStudentRecord,
} from "./sqlReader.js";
import {
  getCheckpoint,
  saveCheckpoint,
  type SyncCheckpoint,
} from "./syncState.js";

export type SyncFlowApiClient = {
  pushBatch(input: PushBatchInput): Promise<PushBatchResult>;
};

export type SyncFlowDependencies = {
  getCheckpoint?: () => Promise<SyncCheckpoint | null>;
  saveCheckpoint?: (checkpoint: SyncCheckpoint) => Promise<boolean>;
  readBatch?: (
    connection: SqlServerConnectionLike,
    options: SqlServerReaderOptions
  ) => Promise<SqlServerStudentRecord[]>;
  now?: () => Date;
};

export type RunSyncBatchOptions = {
  sqlConnection: SqlServerConnectionLike;
  apiClient: SyncFlowApiClient;
  batchSize: number;
  maxRetries: number;
  dependencies?: SyncFlowDependencies;
};

export type SyncFlowResult =
  | {
      success: true;
      status: "empty";
      processed: 0;
      attempts: 0;
      checkpointSaved: false;
    }
  | {
      success: true;
      status: "synced";
      processed: number;
      attempts: number;
      checkpointSaved: true;
      checkpoint: SyncCheckpoint;
    };

export type SyncFlowEnv = {
  MAX_RETRIES?: string;
};

export class SyncFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncFlowError";
  }
}

export function resolveMaxRetries(
  env: SyncFlowEnv = process.env,
  fallback = 3
): number {
  const parsed = Number(env.MAX_RETRIES);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

export async function runSyncBatchOnce({
  sqlConnection,
  apiClient,
  batchSize,
  maxRetries,
  dependencies = {},
}: RunSyncBatchOptions): Promise<SyncFlowResult> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new SyncFlowError("BATCH_SIZE khong hop le");
  }

  if (!Number.isInteger(maxRetries) || maxRetries < 0) {
    throw new SyncFlowError("MAX_RETRIES khong hop le");
  }

  const getCheckpointFn = dependencies.getCheckpoint ?? getCheckpoint;
  const saveCheckpointFn = dependencies.saveCheckpoint ?? saveCheckpoint;
  const readBatchFn = dependencies.readBatch ?? readSqlServerStudentBatch;
  const nowFn = dependencies.now ?? (() => new Date());

  const checkpoint = await getCheckpointFn();
  const batch = await readBatchFn(sqlConnection, {
    batchSize,
    checkpoint: checkpoint
      ? {
          lastSourceUpdatedAt: checkpoint.lastSourceUpdatedAt,
          lastMaDK: checkpoint.lastMaDK,
        }
      : null,
  });

  if (batch.length === 0) {
    return {
      success: true,
      status: "empty",
      processed: 0,
      attempts: 0,
      checkpointSaved: false,
    };
  }

  const pushInput: PushBatchInput = {
    records: batch.map(toSyncPushRecord),
  };
  const { result, attempts } = await pushBatchWithRetry(
    apiClient,
    pushInput,
    maxRetries
  );
  const nextCheckpoint = buildNextCheckpoint(
    checkpoint,
    batch,
    result.processed,
    nowFn()
  );
  const saved = await saveCheckpointFn(nextCheckpoint);

  if (!saved) {
    throw new SyncFlowError("Khong the luu checkpoint sau khi dong bo");
  }

  return {
    success: true,
    status: "synced",
    processed: result.processed,
    attempts,
    checkpointSaved: true,
    checkpoint: nextCheckpoint,
  };
}

export function toSyncPushRecord(record: SqlServerStudentRecord): SyncPushRecord {
  return {
    MaDK: record.MaDK,
    HoVaTen: record.HoVaTen,
    SoCMT: record.SoCMT,
    NgaySinh: record.NgaySinh,
    GioiTinh: record.GioiTinh,
    DiaChi: record.DiaChi,
    TenKhoaHoc: record.TenKhoaHoc,
    Hang: record.Hang,
    MaKhoaHoc: record.MaKhoaHoc,
    HangDaoTao: record.HangDaoTao,
    photoUrl: null,
    sourceUpdatedAt: record.sourceUpdatedAt,
  };
}

export function buildNextCheckpoint(
  previousCheckpoint: SyncCheckpoint | null,
  batch: SqlServerStudentRecord[],
  processed: number,
  now: Date
): SyncCheckpoint {
  const lastRecord = batch.at(-1);

  if (!lastRecord?.sourceUpdatedAt) {
    throw new SyncFlowError("Record cuoi batch thieu SourceUpdatedAt");
  }

  return {
    lastSuccessfulBatch: (previousCheckpoint?.lastSuccessfulBatch ?? 0) + 1,
    lastMaDK: lastRecord.MaDK,
    lastSourceUpdatedAt: lastRecord.sourceUpdatedAt,
    totalProcessed: (previousCheckpoint?.totalProcessed ?? 0) + processed,
    lastRunAt: now.toISOString(),
  };
}

async function pushBatchWithRetry(
  apiClient: SyncFlowApiClient,
  input: PushBatchInput,
  maxRetries: number
): Promise<{ result: PushBatchResult; attempts: number }> {
  const maxAttempts = maxRetries + 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await apiClient.pushBatch(input);

      if (result.success) {
        return {
          result,
          attempts: attempt,
        };
      }
    } catch {
      // Retry with a safe generic error if all attempts fail.
    }
  }

  throw new SyncFlowError("Dong bo batch that bai sau khi retry");
}
