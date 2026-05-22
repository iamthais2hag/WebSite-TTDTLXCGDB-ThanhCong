import { describe, expect, it } from "vitest";
import {
  lookupSearchInputSchema,
  pushBatchInputSchema,
  studentLookupPublicSchema,
  syncBatchMaxRecords,
  syncStudentRecordSchema,
} from "./schemas.js";

const validSyncRecord = {
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

describe("lookupSearchInputSchema", () => {
  it("trims SoCMT and accepts a valid training type", () => {
    expect(
      lookupSearchInputSchema.parse({
        soCMT: " 012345678901 ",
        loaiDaoTao: "oto",
      })
    ).toEqual({
      soCMT: "012345678901",
      loaiDaoTao: "oto",
    });
  });

  it("rejects non-numeric SoCMT, invalid length, and invalid training type", () => {
    expect(() =>
      lookupSearchInputSchema.parse({
        soCMT: "01234abc",
        loaiDaoTao: "oto",
      })
    ).toThrow();

    expect(() =>
      lookupSearchInputSchema.parse({
        soCMT: "12345678",
        loaiDaoTao: "oto",
      })
    ).toThrow();

    expect(() =>
      lookupSearchInputSchema.parse({
        soCMT: "012345678901",
        loaiDaoTao: "truck",
      })
    ).toThrow();
  });
});

describe("studentLookupPublicSchema", () => {
  it("accepts only public lookup fields", () => {
    const parsed = studentLookupPublicSchema.parse({
      hoVaTen: "Nguyen Van A",
      soCMTMasked: "********8901",
      ngaySinh: "01/01/1990",
      gioiTinh: "Nam",
      diaChi: "Dak Lak",
      tenKhoaHoc: "K45",
      hang: "B2",
      photoUrl: "/uploads/students/K45/DK001.jpg",
    });

    expect(Object.keys(parsed).sort()).toEqual(
      [
        "diaChi",
        "gioiTinh",
        "hang",
        "hoVaTen",
        "ngaySinh",
        "photoUrl",
        "soCMTMasked",
        "tenKhoaHoc",
      ].sort()
    );
  });

  it("rejects forbidden internal or sensitive public output fields", () => {
    const forbiddenFields = [
      "SoCMT",
      "MaDK",
      "MaKhoaHoc",
      "HangDaoTao",
      "LoaiDaoTao",
      "sourceUpdatedAt",
      "syncedAt",
      "DuongDanAnh",
      "IMAGE_BASE_PATH",
    ];

    for (const field of forbiddenFields) {
      expect(
        Object.prototype.hasOwnProperty.call(studentLookupPublicSchema.shape, field)
      ).toBe(false);
    }

    expect(() =>
      studentLookupPublicSchema.parse({
        hoVaTen: "Nguyen Van A",
        soCMTMasked: "********8901",
        ngaySinh: "01/01/1990",
        gioiTinh: "Nam",
        diaChi: null,
        tenKhoaHoc: null,
        hang: null,
        photoUrl: null,
        SoCMT: "012345678901",
      })
    ).toThrow();
  });
});

describe("syncStudentRecordSchema", () => {
  it("accepts valid sync records with nullable fields", () => {
    expect(
      syncStudentRecordSchema.parse({
        ...validSyncRecord,
        NgaySinh: null,
        GioiTinh: null,
        DiaChi: null,
        TenKhoaHoc: null,
        Hang: null,
        MaKhoaHoc: null,
        HangDaoTao: null,
        photoUrl: null,
        sourceUpdatedAt: null,
      })
    ).toEqual({
      ...validSyncRecord,
      NgaySinh: null,
      GioiTinh: null,
      DiaChi: null,
      TenKhoaHoc: null,
      Hang: null,
      MaKhoaHoc: null,
      HangDaoTao: null,
      photoUrl: null,
      sourceUpdatedAt: null,
    });
  });

  it("rejects invalid raw birth date and invalid datetime strings", () => {
    expect(() =>
      syncStudentRecordSchema.parse({
        ...validSyncRecord,
        NgaySinh: "01/01/1990",
      })
    ).toThrow();

    expect(() =>
      syncStudentRecordSchema.parse({
        ...validSyncRecord,
        sourceUpdatedAt: "2026-05-21 10:30:00",
      })
    ).toThrow();
  });
});

describe("pushBatchInputSchema", () => {
  it("accepts batches from 1 to 200 records", () => {
    expect(
      pushBatchInputSchema.parse({
        records: [validSyncRecord],
      }).records
    ).toHaveLength(1);

    expect(
      pushBatchInputSchema.parse({
        records: Array.from({ length: syncBatchMaxRecords }, (_, index) => ({
          ...validSyncRecord,
          MaDK: `DK${String(index + 1).padStart(3, "0")}`,
        })),
      }).records
    ).toHaveLength(syncBatchMaxRecords);
  });

  it("rejects empty batches and batches over 200 records", () => {
    expect(() =>
      pushBatchInputSchema.parse({
        records: [],
      })
    ).toThrow();

    expect(() =>
      pushBatchInputSchema.parse({
        records: Array.from({ length: syncBatchMaxRecords + 1 }, (_, index) => ({
          ...validSyncRecord,
          MaDK: `DK${String(index + 1).padStart(3, "0")}`,
        })),
      })
    ).toThrow();
  });
});
