import { describe, expect, it, vi } from "vitest";
import type { PushBatchInput, PushBatchResult } from "./apiClient.js";
import type {
  SqlServerConnectionLike,
  SqlServerReaderOptions,
  SqlServerStudentRecord,
} from "./sqlReader.js";
import {
  buildNextCheckpoint,
  resolveMaxRetries,
  runSyncBatchOnce,
  toSyncPushRecord,
} from "./syncFlow.js";
import type { SyncCheckpoint } from "./syncState.js";

const previousCheckpoint: SyncCheckpoint = {
  lastSuccessfulBatch: 4,
  lastMaDK: "DK004",
  lastSourceUpdatedAt: "2026-05-21T10:00:00.000Z",
  totalProcessed: 400,
  lastRunAt: "2026-05-21T10:10:00.000Z",
};

const firstRecord: SqlServerStudentRecord = {
  MaDK: "DK005",
  HoVaTen: "Nguyen Van A",
  SoCMT: "012345678901",
  NgaySinh: "19900101",
  GioiTinh: "Nam",
  DiaChi: "Dak Lak",
  TenKhoaHoc: "K45",
  Hang: "B2",
  MaKhoaHoc: "K45",
  HangDaoTao: "B2",
  DuongDanAnh: "D:\\Images\\K45\\DK005.jp2",
  LoaiDaoTao: "oto",
  sourceUpdatedAt: "2026-05-21T10:30:00.000Z",
};

const secondRecord: SqlServerStudentRecord = {
  ...firstRecord,
  MaDK: "DK006",
  HoVaTen: "Nguyen Van B",
  sourceUpdatedAt: "2026-05-21T10:45:00.000Z",
};

const fakeConnection = {} as SqlServerConnectionLike;

function createFlowMocks(options: {
  checkpoint?: SyncCheckpoint | null;
  batch?: SqlServerStudentRecord[];
  pushResults?: Array<PushBatchResult | Error>;
}) {
  const getCheckpointMock = vi.fn(async () => options.checkpoint ?? null);
  const saveCheckpointMock = vi.fn(async (_checkpoint: SyncCheckpoint) => true);
  const readBatchMock = vi.fn(
    async (
      _connection: SqlServerConnectionLike,
      _options: SqlServerReaderOptions
    ) => options.batch ?? []
  );
  const pushResults = [...(options.pushResults ?? [])];
  const pushBatchMock = vi.fn(async (_input: PushBatchInput) => {
    const nextResult =
      pushResults.shift() ??
      ({
        success: true,
        processed: options.batch?.length ?? 0,
      } satisfies PushBatchResult);

    if (nextResult instanceof Error) {
      throw nextResult;
    }

    return nextResult;
  });

  return {
    apiClient: {
      pushBatch: pushBatchMock,
    },
    getCheckpointMock,
    pushBatchMock,
    readBatchMock,
    saveCheckpointMock,
  };
}

describe("sync flow", () => {
  it("does not push or save checkpoint when SQL reader returns an empty batch", async () => {
    const mocks = createFlowMocks({
      checkpoint: previousCheckpoint,
      batch: [],
    });

    await expect(
      runSyncBatchOnce({
        sqlConnection: fakeConnection,
        apiClient: mocks.apiClient,
        batchSize: 100,
        maxRetries: 2,
        dependencies: {
          getCheckpoint: mocks.getCheckpointMock,
          readBatch: mocks.readBatchMock,
          saveCheckpoint: mocks.saveCheckpointMock,
        },
      })
    ).resolves.toEqual({
      success: true,
      status: "empty",
      processed: 0,
      attempts: 0,
      checkpointSaved: false,
    });

    expect(mocks.getCheckpointMock).toHaveBeenCalledTimes(1);
    expect(mocks.readBatchMock).toHaveBeenCalledWith(fakeConnection, {
      batchSize: 100,
      checkpoint: {
        lastSourceUpdatedAt: previousCheckpoint.lastSourceUpdatedAt,
        lastMaDK: previousCheckpoint.lastMaDK,
      },
    });
    expect(mocks.pushBatchMock).not.toHaveBeenCalled();
    expect(mocks.saveCheckpointMock).not.toHaveBeenCalled();
  });

  it("pushes a successful batch and saves checkpoint from the last record", async () => {
    const now = new Date("2026-05-21T11:00:00.000Z");
    const mocks = createFlowMocks({
      checkpoint: previousCheckpoint,
      batch: [firstRecord, secondRecord],
      pushResults: [
        {
          success: true,
          processed: 2,
          validated: 2,
          upserted: 2,
        },
      ],
    });

    await expect(
      runSyncBatchOnce({
        sqlConnection: fakeConnection,
        apiClient: mocks.apiClient,
        batchSize: 100,
        maxRetries: 2,
        dependencies: {
          getCheckpoint: mocks.getCheckpointMock,
          readBatch: mocks.readBatchMock,
          saveCheckpoint: mocks.saveCheckpointMock,
          now: () => now,
        },
      })
    ).resolves.toEqual({
      success: true,
      status: "synced",
      processed: 2,
      attempts: 1,
      checkpointSaved: true,
      checkpoint: {
        lastSuccessfulBatch: 5,
        lastMaDK: "DK006",
        lastSourceUpdatedAt: "2026-05-21T10:45:00.000Z",
        totalProcessed: 402,
        lastRunAt: "2026-05-21T11:00:00.000Z",
      },
    });

    expect(mocks.pushBatchMock).toHaveBeenCalledWith({
      records: [
        {
          ...toSyncPushRecord(firstRecord),
          photoUrl: null,
        },
        {
          ...toSyncPushRecord(secondRecord),
          photoUrl: null,
        },
      ],
    });
    expect(mocks.saveCheckpointMock).toHaveBeenCalledWith({
      lastSuccessfulBatch: 5,
      lastMaDK: "DK006",
      lastSourceUpdatedAt: "2026-05-21T10:45:00.000Z",
      totalProcessed: 402,
      lastRunAt: "2026-05-21T11:00:00.000Z",
    });
  });

  it("does not save checkpoint when pushBatch returns success false", async () => {
    const mocks = createFlowMocks({
      checkpoint: previousCheckpoint,
      batch: [firstRecord],
      pushResults: [
        {
          success: false,
          processed: 0,
        },
      ],
    });

    await expect(
      runSyncBatchOnce({
        sqlConnection: fakeConnection,
        apiClient: mocks.apiClient,
        batchSize: 100,
        maxRetries: 0,
        dependencies: {
          getCheckpoint: mocks.getCheckpointMock,
          readBatch: mocks.readBatchMock,
          saveCheckpoint: mocks.saveCheckpointMock,
        },
      })
    ).rejects.toMatchObject({
      message: "Dong bo batch that bai sau khi retry",
    });

    expect(mocks.pushBatchMock).toHaveBeenCalledTimes(1);
    expect(mocks.saveCheckpointMock).not.toHaveBeenCalled();
  });

  it("retries API errors according to MAX_RETRIES and saves after success", async () => {
    const mocks = createFlowMocks({
      checkpoint: null,
      batch: [firstRecord],
      pushResults: [
        new Error("network failed"),
        new Error("temporary failed"),
        {
          success: true,
          processed: 1,
        },
      ],
    });

    await expect(
      runSyncBatchOnce({
        sqlConnection: fakeConnection,
        apiClient: mocks.apiClient,
        batchSize: 100,
        maxRetries: 2,
        dependencies: {
          getCheckpoint: mocks.getCheckpointMock,
          readBatch: mocks.readBatchMock,
          saveCheckpoint: mocks.saveCheckpointMock,
          now: () => new Date("2026-05-21T11:00:00.000Z"),
        },
      })
    ).resolves.toMatchObject({
      status: "synced",
      attempts: 3,
      checkpointSaved: true,
    });

    expect(mocks.pushBatchMock).toHaveBeenCalledTimes(3);
    expect(mocks.saveCheckpointMock).toHaveBeenCalledTimes(1);
  });

  it("throws a safe error and does not save checkpoint after retries are exhausted", async () => {
    const testSecret = "test-sync-secret";
    const rawSoCMT = firstRecord.SoCMT;
    const mocks = createFlowMocks({
      checkpoint: previousCheckpoint,
      batch: [firstRecord],
      pushResults: [
        new Error(`network failed ${testSecret} ${rawSoCMT}`),
        new Error(`network failed ${testSecret} ${rawSoCMT}`),
        new Error(`network failed ${testSecret} ${rawSoCMT}`),
      ],
    });

    try {
      await runSyncBatchOnce({
        sqlConnection: fakeConnection,
        apiClient: mocks.apiClient,
        batchSize: 100,
        maxRetries: 2,
        dependencies: {
          getCheckpoint: mocks.getCheckpointMock,
          readBatch: mocks.readBatchMock,
          saveCheckpoint: mocks.saveCheckpointMock,
        },
      });

      throw new Error("Expected sync flow to fail");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      expect(message).toBe("Dong bo batch that bai sau khi retry");
      expect(message).not.toContain(testSecret);
      expect(message).not.toContain(rawSoCMT);
    }

    expect(mocks.pushBatchMock).toHaveBeenCalledTimes(3);
    expect(mocks.saveCheckpointMock).not.toHaveBeenCalled();
  });

  it("does not log secret or raw SoCMT when sync fails", async () => {
    const testSecret = "test-sync-secret";
    const rawSoCMT = firstRecord.SoCMT;
    const mocks = createFlowMocks({
      checkpoint: previousCheckpoint,
      batch: [firstRecord],
      pushResults: [new Error(`failed ${testSecret} ${rawSoCMT}`)],
    });
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      await expect(
        runSyncBatchOnce({
          sqlConnection: fakeConnection,
          apiClient: mocks.apiClient,
          batchSize: 100,
          maxRetries: 0,
          dependencies: {
            getCheckpoint: mocks.getCheckpointMock,
            readBatch: mocks.readBatchMock,
            saveCheckpoint: mocks.saveCheckpointMock,
          },
        })
      ).rejects.toThrow("Dong bo batch that bai sau khi retry");

      const loggedText = [
        ...consoleLog.mock.calls,
        ...consoleWarn.mock.calls,
        ...consoleError.mock.calls,
      ]
        .flat()
        .join(" ");

      expect(loggedText).not.toContain(testSecret);
      expect(loggedText).not.toContain(rawSoCMT);
    } finally {
      consoleLog.mockRestore();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
    }
  });

  it("builds checkpoint only from a successful batch with SourceUpdatedAt", () => {
    expect(
      buildNextCheckpoint(null, [firstRecord], 1, new Date("2026-05-21T11:00:00Z"))
    ).toEqual({
      lastSuccessfulBatch: 1,
      lastMaDK: "DK005",
      lastSourceUpdatedAt: "2026-05-21T10:30:00.000Z",
      totalProcessed: 1,
      lastRunAt: "2026-05-21T11:00:00.000Z",
    });

    expect(() =>
      buildNextCheckpoint(
        null,
        [
          {
            ...firstRecord,
            sourceUpdatedAt: null,
          },
        ],
        1,
        new Date("2026-05-21T11:00:00Z")
      )
    ).toThrow("Record cuoi batch thieu SourceUpdatedAt");
  });

  it("resolves MAX_RETRIES from env safely", () => {
    expect(resolveMaxRetries({ MAX_RETRIES: "5" })).toBe(5);
    expect(resolveMaxRetries({ MAX_RETRIES: "-1" })).toBe(3);
    expect(resolveMaxRetries({ MAX_RETRIES: "abc" }, 2)).toBe(2);
  });
});
