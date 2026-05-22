import { getTableConfig } from "drizzle-orm/mysql-core";
import { describe, expect, it } from "vitest";
import { studentLookupCache, syncLog } from "./schema.js";

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

describe("syncLog schema", () => {
  const config = getTableConfig(syncLog);

  it("defines the optional sync log table", () => {
    expect(config.name).toBe("sync_log");
  });

  it("stores batch status and checkpoint metadata", () => {
    const columnNames = config.columns.map((column) => column.name);

    expect(columnNames).toEqual([
      "id",
      "batchNumber",
      "recordsProcessed",
      "recordsSuccess",
      "recordsFailed",
      "imageErrors",
      "startedAt",
      "completedAt",
      "status",
      "errorMessage",
      "checkpointMaDK",
      "checkpointSourceUpdatedAt",
    ]);
  });

  it("uses the expected sync status enum values", () => {
    const statusColumn = config.columns.find(
      (column) => column.name === "status"
    );

    expect(statusColumn?.enumValues).toEqual([
      "running",
      "success",
      "failed",
      "partial",
    ]);
  });
});
