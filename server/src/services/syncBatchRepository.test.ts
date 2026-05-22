import { describe, expect, it, vi } from "vitest";
import type { DatabaseClient } from "../db/client.js";
import {
  upsertSyncBatch,
  type SyncBatchUpsertResult,
  toStudentLookupCacheInsert,
} from "./syncBatchRepository.js";
import type { NormalizedSyncStudentRecord } from "./syncBatchValidation.js";

type UpsertValue = ReturnType<typeof toStudentLookupCacheInsert>;
type UpdateSet = Omit<UpsertValue, "maDK">;

const baseRecord: NormalizedSyncStudentRecord = {
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
  LoaiDaoTao: "oto",
};

function createFakeDb(options: { failOnUpsert?: boolean } = {}) {
  const committed = new Map<string, UpsertValue>();
  const attempts: Array<{ value: UpsertValue; set: UpdateSet }> = [];
  let working: Map<string, UpsertValue> | undefined;

  const tx = {
    insert: vi.fn(() => ({
      values: vi.fn((value: UpsertValue) => ({
        onDuplicateKeyUpdate: vi.fn(
          async ({ set }: { set: UpdateSet }) => {
            attempts.push({ value, set });

            if (options.failOnUpsert) {
              throw new Error("upsert failed");
            }

            if (!working) {
              throw new Error("missing transaction");
            }

            working.set(value.maDK, {
              ...working.get(value.maDK),
              ...value,
              ...set,
              maDK: value.maDK,
            });
          }
        ),
      })),
    })),
  };

  const db = {
    transaction: vi.fn(
      async (
        callback: (transaction: typeof tx) => Promise<SyncBatchUpsertResult>
      ) => {
        working = new Map(committed);
        const result = await callback(tx);

        committed.clear();
        for (const [maDK, value] of working) {
          committed.set(maDK, value);
        }
        working = undefined;

        return result;
      }
    ),
  };

  return {
    attempts,
    committed,
    db: db as unknown as DatabaseClient,
    transaction: db.transaction,
    tx,
  };
}

describe("sync batch repository", () => {
  it("maps normalized sync records to student lookup cache values", () => {
    const value = toStudentLookupCacheInsert(baseRecord);

    expect(value).toEqual({
      maDK: "DK001",
      hoVaTen: "Nguyen Van A",
      soCMT: "012345678901",
      ngaySinh: "19900101",
      gioiTinh: "Nam",
      diaChi: "Dak Lak",
      tenKhoaHoc: "K45",
      hang: "B2",
      loaiDaoTao: "oto",
      maKhoaHoc: "K45",
      hangDaoTao: "B2",
      photoUrl: "/uploads/students/K45/DK001.jpg",
      sourceUpdatedAt: new Date("2026-05-21T10:30:00.000Z"),
      syncedAt: expect.any(Date),
    });
  });

  it("runs valid batch upserts in one transaction", async () => {
    const fake = createFakeDb();
    const result = await upsertSyncBatch(
      [
        baseRecord,
        {
          ...baseRecord,
          MaDK: "DK002",
          HoVaTen: "Nguyen Van B",
        },
      ],
      fake.db
    );

    expect(fake.transaction).toHaveBeenCalledTimes(1);
    expect(fake.tx.insert).toHaveBeenCalledTimes(2);
    expect(fake.committed.size).toBe(2);
    expect(result).toEqual({
      processed: 2,
      upserted: 2,
    });
  });

  it("upserts by MaDK without creating duplicates in the same batch", async () => {
    const fake = createFakeDb();
    const result = await upsertSyncBatch(
      [
        baseRecord,
        {
          ...baseRecord,
          HoVaTen: "Nguyen Van A Updated",
        },
      ],
      fake.db
    );

    expect(fake.tx.insert).toHaveBeenCalledTimes(1);
    expect(fake.committed.size).toBe(1);
    expect(fake.committed.get("DK001")?.hoVaTen).toBe("Nguyen Van A Updated");
    expect(result).toEqual({
      processed: 2,
      upserted: 1,
    });
  });

  it("rolls back the batch when an upsert fails", async () => {
    const fake = createFakeDb({ failOnUpsert: true });

    await expect(upsertSyncBatch([baseRecord], fake.db)).rejects.toThrow(
      "upsert failed"
    );

    expect(fake.transaction).toHaveBeenCalledTimes(1);
    expect(fake.committed.size).toBe(0);
  });
});
