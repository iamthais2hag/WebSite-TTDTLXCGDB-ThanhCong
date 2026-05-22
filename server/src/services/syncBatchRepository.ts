import type { InferInsertModel } from "drizzle-orm";
import { createDatabaseClient, type DatabaseClient } from "../db/client.js";
import { studentLookupCache } from "../db/schema.js";
import type { NormalizedSyncStudentRecord } from "./syncBatchValidation.js";

type StudentLookupCacheInsert = InferInsertModel<typeof studentLookupCache>;

export type SyncBatchUpsertResult = {
  processed: number;
  upserted: number;
};

export function parseNullableDatetime(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

export function dedupeSyncRecordsByMaDK(
  records: NormalizedSyncStudentRecord[]
): NormalizedSyncStudentRecord[] {
  return Array.from(
    records
      .reduce(
        (byMaDK, record) => byMaDK.set(record.MaDK, record),
        new Map<string, NormalizedSyncStudentRecord>()
      )
      .values()
  );
}

export function toStudentLookupCacheInsert(
  record: NormalizedSyncStudentRecord
): StudentLookupCacheInsert {
  return {
    maDK: record.MaDK,
    hoVaTen: record.HoVaTen,
    soCMT: record.SoCMT,
    ngaySinh: record.NgaySinh,
    gioiTinh: record.GioiTinh,
    diaChi: record.DiaChi,
    tenKhoaHoc: record.TenKhoaHoc,
    hang: record.Hang,
    loaiDaoTao: record.LoaiDaoTao,
    maKhoaHoc: record.MaKhoaHoc,
    hangDaoTao: record.HangDaoTao,
    photoUrl: record.photoUrl,
    sourceUpdatedAt: parseNullableDatetime(record.sourceUpdatedAt),
    syncedAt: new Date(),
  };
}

function toStudentLookupCacheUpdate(value: StudentLookupCacheInsert) {
  return {
    hoVaTen: value.hoVaTen,
    soCMT: value.soCMT,
    ngaySinh: value.ngaySinh,
    gioiTinh: value.gioiTinh,
    diaChi: value.diaChi,
    tenKhoaHoc: value.tenKhoaHoc,
    hang: value.hang,
    loaiDaoTao: value.loaiDaoTao,
    maKhoaHoc: value.maKhoaHoc,
    hangDaoTao: value.hangDaoTao,
    photoUrl: value.photoUrl,
    sourceUpdatedAt: value.sourceUpdatedAt,
    syncedAt: value.syncedAt,
  };
}

export async function upsertSyncBatch(
  records: NormalizedSyncStudentRecord[],
  db: DatabaseClient = createDatabaseClient()
): Promise<SyncBatchUpsertResult> {
  const recordsToUpsert = dedupeSyncRecordsByMaDK(records);

  return db.transaction(async (tx) => {
    for (const record of recordsToUpsert) {
      const value = toStudentLookupCacheInsert(record);

      await tx
        .insert(studentLookupCache)
        .values(value)
        .onDuplicateKeyUpdate({
          set: toStudentLookupCacheUpdate(value),
        });
    }

    return {
      processed: records.length,
      upserted: recordsToUpsert.length,
    };
  });
}
