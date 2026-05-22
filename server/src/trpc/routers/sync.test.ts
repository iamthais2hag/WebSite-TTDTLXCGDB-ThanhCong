import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncRouter } from "./sync.js";

const { normalizeSyncBatchRecordsMock } = vi.hoisted(() => ({
  normalizeSyncBatchRecordsMock: vi.fn((records) =>
    records.map((record: { HangDaoTao: string | null; MaDK: string }) => ({
      ...record,
      LoaiDaoTao: record.HangDaoTao?.trim().toUpperCase().startsWith("A")
        ? "moto"
        : "oto",
    }))
  ),
}));

vi.mock("../../services/syncBatchValidation.js", () => ({
  normalizeSyncBatchRecords: normalizeSyncBatchRecordsMock,
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
  });

  it("rejects wrong X-SYNC-SECRET", async () => {
    await expect(
      createCaller("wrong-secret").pushBatch({
        records: [validRecord],
      })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("returns validation success for a valid protected batch", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: [validRecord],
      })
    ).resolves.toEqual({
      success: true,
      processed: 1,
      validated: 1,
      records: [
        {
          MaDK: "DK001",
          LoaiDaoTao: "oto",
        },
      ],
    });
    expect(normalizeSyncBatchRecordsMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an empty records array", async () => {
    await expect(
      createCaller(testSecret).pushBatch({
        records: [],
      })
    ).rejects.toThrow();
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
  });

  it("normalizes HangDaoTao starting with A to moto", async () => {
    const result = await createCaller(testSecret).pushBatch({
      records: [
        {
          ...validRecord,
          HangDaoTao: "A1",
        },
      ],
    });

    expect(result.records[0]?.LoaiDaoTao).toBe("moto");
  });

  it("normalizes HangDaoTao not starting with A to oto", async () => {
    const result = await createCaller(testSecret).pushBatch({
      records: [
        {
          ...validRecord,
          HangDaoTao: "B2",
        },
      ],
    });

    expect(result.records[0]?.LoaiDaoTao).toBe("oto");
  });

  it("does not continue to downstream processing when validation fails", async () => {
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
  });
});
