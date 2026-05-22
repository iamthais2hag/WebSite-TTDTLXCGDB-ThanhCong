import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncRouter } from "./sync.js";

const { normalizeSyncBatchRecordsMock, upsertSyncBatchMock } = vi.hoisted(
  () => ({
    normalizeSyncBatchRecordsMock: vi.fn((records) =>
      records.map((record: { HangDaoTao: string | null; MaDK: string }) => ({
        ...record,
        LoaiDaoTao: record.HangDaoTao?.trim().toUpperCase().startsWith("A")
          ? "moto"
          : "oto",
      }))
    ),
    upsertSyncBatchMock: vi.fn(async (records) => ({
      processed: records.length,
      upserted: new Set(
        records.map((record: { MaDK: string }) => record.MaDK)
      ).size,
    })),
  })
);

vi.mock("../../services/syncBatchValidation.js", () => ({
  normalizeSyncBatchRecords: normalizeSyncBatchRecordsMock,
}));

vi.mock("../../services/syncBatchRepository.js", () => ({
  upsertSyncBatch: upsertSyncBatchMock,
}));

const previousSyncSecret = process.env.SYNC_SECRET;
const testSecret = "test-sync-secret";

const validRecord = {
  MaDK: "DK001",
  HoVaTen: "Nguyen Van A",
  SoCMT: "012345678901",
  NgaySinh: "19900101",
  GioiTinh: "Nam",
  DiaChi: "Dak Lak",
  TenKhoaHoc: "K45",
  Hang: "B2",
  MaKhoaHoc: "K45",
  HangDaoTao: "B2",
  photoUrl: "/uploads/students/K45/DK001.jpg",
  sourceUpdatedAt: "2026-05-21T10:30:00.000Z",
};

function restoreSyncSecret() {
  if (previousSyncSecret === undefined) {
    delete process.env.SYNC_SECRET;
    return;
  }

  process.env.SYNC_SECRET = previousSyncSecret;
}

function createCaller(syncSecret?: string | string[]) {
  return syncRouter.createCaller({
    req: {} as never,
    res: {} as never,
    syncSecret,
  });
}

describe("sync.pushBatch", () => {
  beforeEach(() => {
    normalizeSyncBatchRecordsMock.mockClear();
    upsertSyncBatchMock.mockClear();
    upsertSyncBatchMock.mockImplementation(async (records) => ({
      processed: records.length,
      upserted: new Set(
        records.map((record: { MaDK: string }) => record.MaDK)
      ).size,
    }));
    process.env.SYNC_SECRET = testSecret;
  });

  afterEach(() => {
    restoreSyncSecret();
  });

  it("rejects missing X-SYNC-SECRET", async () => {
    await expect(
      createCaller().pushBatch({
        records: [validRecord],
      })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(normalizeSyncBatchRecordsMock).not.toHaveBeenCalled();
    expect(upsertSyncBatchMock).not.toHaveBeenCalled();
  });

  it("rejects wrong X-SYNC-SECRET", async () => {
    await expect(
      createCaller("wrong-secret").pushBatch({
        records: [validRecord],
      })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    expect(normalizeSyncBatchRecordsMock).not.toHaveBeenCalled();
    expect(upsertSyncBatchMock).not.toHaveBeenCalled();
  });

  it("does not expose sync secret in auth error messages", async () => {
    const wrongSecret = "wrong-test-sync-secret";

    try {
      await createCaller(wrongSecret).pushBatch({
        records: [validRecord],
      });

      throw new Error("Expected sync.pushBatch to reject");
    } catch (error) {
      expect(error).toMatchObject({
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
      expect(error instanceof Error ? error.message : String(error)).not.toContain(
        testSecret
      );
      expect(error instanceof Error ? error.message : String(error)).not.toContain(
        wrongSecret
      );
    }
  });

  it("does not log X-SYNC-SECRET when auth fails", async () => {
    const wrongSecret = "wrong-test-sync-secret";
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      await expect(
        createCaller(wrongSecret).pushBatch({
          records: [validRecord],
        })
      ).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });

      const loggedText = [
        ...consoleLog.mock.calls,
        ...consoleWarn.mock.calls,
        ...consoleError.mock.calls,
      ]
        .flat()
        .join(" ");

      expect(loggedText).not.toContain(testSecret);
      expect(loggedText).not.toContain(wrongSecret);
      expect(normalizeSyncBatchRecordsMock).not.toHaveBeenCalled();
      expect(upsertSyncBatchMock).not.toHaveBeenCalled();
    } finally {
      consoleLog.mockRestore();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
    }
  });

  it("upserts and returns success for a valid protected batch", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: [validRecord],
      })
    ).resolves.toEqual({
      success: true,
      processed: 1,
      validated: 1,
      upserted: 1,
    });
    expect(normalizeSyncBatchRecordsMock).toHaveBeenCalledTimes(1);
    expect(upsertSyncBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        MaDK: "DK001",
        LoaiDaoTao: "oto",
      }),
    ]);
  });

  it("rejects an empty records array", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: [],
      })
    ).rejects.toThrow();
    expect(upsertSyncBatchMock).not.toHaveBeenCalled();
  });

  it("rejects records over the 200 item limit", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: Array.from({ length: 201 }, (_, index) => ({
          ...validRecord,
          MaDK: `DK${String(index + 1).padStart(3, "0")}`,
        })),
      })
    ).rejects.toThrow();
    expect(upsertSyncBatchMock).not.toHaveBeenCalled();
  });

  it("rejects records missing MaDK", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: [
          {
            ...validRecord,
            MaDK: "",
          },
        ],
      })
    ).rejects.toThrow();
    expect(upsertSyncBatchMock).not.toHaveBeenCalled();
  });

  it("rejects records missing SoCMT", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: [
          {
            ...validRecord,
            SoCMT: "",
          },
        ],
      })
    ).rejects.toThrow();
    expect(upsertSyncBatchMock).not.toHaveBeenCalled();
  });

  it("rejects records with invalid NgaySinh", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: [
          {
            ...validRecord,
            NgaySinh: "01/01/1990",
          },
        ],
      })
    ).rejects.toThrow();
    expect(upsertSyncBatchMock).not.toHaveBeenCalled();
  });

  it("normalizes HangDaoTao starting with A to moto before upsert", async () => {
    await createCaller(testSecret).pushBatch({
      records: [
        {
          ...validRecord,
          HangDaoTao: "A1",
        },
      ],
    });

    expect(upsertSyncBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        LoaiDaoTao: "moto",
      }),
    ]);
  });

  it("normalizes HangDaoTao not starting with A to oto before upsert", async () => {
    await createCaller(testSecret).pushBatch({
      records: [
        {
          ...validRecord,
          HangDaoTao: "B2",
        },
      ],
    });

    expect(upsertSyncBatchMock).toHaveBeenCalledWith([
      expect.objectContaining({
        LoaiDaoTao: "oto",
      }),
    ]);
  });

  it("does not continue to transaction when validation fails", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: [
          {
            ...validRecord,
            MaDK: "",
          },
        ],
      })
    ).rejects.toThrow();

    expect(normalizeSyncBatchRecordsMock).not.toHaveBeenCalled();
    expect(upsertSyncBatchMock).not.toHaveBeenCalled();
  });

  it("does not return success when the transaction fails", async () => {
    upsertSyncBatchMock.mockRejectedValueOnce(new Error("transaction failed"));

    await expect(
      createCaller(testSecret).pushBatch({
        records: [validRecord],
      })
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "Khong the dong bo batch. Vui long thu lai.",
    });
  });

  it("does not log secret or raw SoCMT when transaction fails", async () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    upsertSyncBatchMock.mockRejectedValueOnce(new Error("transaction failed"));

    try {
      await expect(
        createCaller(testSecret).pushBatch({
          records: [validRecord],
        })
      ).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      });

      const loggedText = [
        ...consoleLog.mock.calls,
        ...consoleWarn.mock.calls,
        ...consoleError.mock.calls,
      ]
        .flat()
        .join(" ");

      expect(loggedText).not.toContain(testSecret);
      expect(loggedText).not.toContain("012345678901");
    } finally {
      consoleLog.mockRestore();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
    }
  });
});
