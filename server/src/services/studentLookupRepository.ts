import { and, eq } from "drizzle-orm";
import type { LoaiDaoTao } from "shared";
import { createDatabaseClient, type DatabaseClient } from "../db/client.js";
import { studentLookupCache } from "../db/schema.js";
import type { StudentLookupRecordForPublic } from "./studentLookupService.js";

export type SearchStudentLookupRecordsInput = {
  soCMT: string;
  loaiDaoTao: LoaiDaoTao;
};

export async function searchStudentLookupRecords(
  input: SearchStudentLookupRecordsInput,
  db: DatabaseClient = createDatabaseClient()
): Promise<StudentLookupRecordForPublic[]> {
  return db
    .select({
      hoVaTen: studentLookupCache.hoVaTen,
      soCMT: studentLookupCache.soCMT,
      ngaySinh: studentLookupCache.ngaySinh,
      gioiTinh: studentLookupCache.gioiTinh,
      diaChi: studentLookupCache.diaChi,
      tenKhoaHoc: studentLookupCache.tenKhoaHoc,
      hang: studentLookupCache.hang,
      photoUrl: studentLookupCache.photoUrl,
    })
    .from(studentLookupCache)
    .where(
      and(
        eq(studentLookupCache.soCMT, input.soCMT),
        eq(studentLookupCache.loaiDaoTao, input.loaiDaoTao)
      )
    );
}
