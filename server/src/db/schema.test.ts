import { getTableConfig } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import { studentLookupCache } from "./schema.js";

describe("studentLookupCache schema", () => {
  const config = getTableConfig(studentLookupCache);

  it("defines the student lookup cache table", () => {
    expect(config.name).toBe("student_lookup_cache");
  });

  it("stores source fields without derived public display fields", () => {
    const columnNames = config.columns.map((column) => column.name);

    expect(columnNames).toEqual([
      "id",
      "MaDK",
      "HoVaTen",
      "SoCMT",
      "NgaySinh",
      "GioiTinh",
      "DiaChi",
      "TenKhoaHoc",
      "Hang",
      "LoaiDaoTao",
      "MaKhoaHoc",
      "HangDaoTao",
      "photoUrl",
      "sourceUpdatedAt",
      "syncedAt",
    ]);
    expect(columnNames).not.toContain("SoCMTMasked");
    expect(columnNames).not.toContain("NgaySinhDisplay");
  });

  it("has indexes for lookup, upsert, and checkpoint access", () => {
    const indexNames = config.indexes.map((item) => item.config.name);

    expect(indexNames).toEqual([
      "student_lookup_cache_MaDK_unique",
      "student_lookup_cache_SoCMT_idx",
      "student_lookup_cache_LoaiDaoTao_idx",
      "student_lookup_cache_sourceUpdatedAt_idx",
      "student_lookup_cache_checkpoint_idx",
    ]);
  });
});
