import type { LoaiDaoTao, SyncStudentRecord } from "shared";

export type NormalizedSyncStudentRecord = SyncStudentRecord & {
  LoaiDaoTao: LoaiDaoTao;
};

export function mapLoaiDaoTao(hangDaoTao: string | null): LoaiDaoTao {
  const normalizedHang = hangDaoTao?.trim().toUpperCase();

  return normalizedHang?.startsWith("A") ? "moto" : "oto";
}

export function normalizeSyncBatchRecords(
  records: SyncStudentRecord[]
): NormalizedSyncStudentRecord[] {
  return records.map((record) => ({
    ...record,
    LoaiDaoTao: mapLoaiDaoTao(record.HangDaoTao),
  }));
}
