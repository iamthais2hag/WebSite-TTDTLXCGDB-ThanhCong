import { describe, expect, it } from "vitest";
import {
  mapLoaiDaoTao,
  normalizeSyncBatchRecords,
} from "./syncBatchValidation.js";

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

describe("sync batch validation helpers", () => {
  it("maps HangDaoTao starting with A to moto", () => {
    expect(mapLoaiDaoTao("A1")).toBe("moto");
    expect(mapLoaiDaoTao(" a2 ")).toBe("moto");
  });

  it("maps HangDaoTao not starting with A to oto", () => {
    expect(mapLoaiDaoTao("B2")).toBe("oto");
    expect(mapLoaiDaoTao(null)).toBe("oto");
  });

  it("normalizes records with computed LoaiDaoTao", () => {
    expect(
      normalizeSyncBatchRecords([
        {
          ...validRecord,
          HangDaoTao: "A1",
        },
        validRecord,
      ]).map((record) => ({
        MaDK: record.MaDK,
        LoaiDaoTao: record.LoaiDaoTao,
      }))
    ).toEqual([
      {
        MaDK: "DK001",
        LoaiDaoTao: "moto",
      },
      {
        MaDK: "DK001",
        LoaiDaoTao: "oto",
      },
    ]);
  });
});
