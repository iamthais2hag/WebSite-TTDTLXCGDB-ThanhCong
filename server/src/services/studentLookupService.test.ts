import { describe, expect, it } from "vitest";
import {
  buildPublicStudentResponse,
  formatGender,
  formatNgaySinh,
  maskSoCMT,
} from "./studentLookupService.js";

describe("maskSoCMT", () => {
  it("shows only the last 4 digits", () => {
    expect(maskSoCMT("012345678901")).toBe("********8901");
    expect(maskSoCMT("123456789")).toBe("*****6789");
  });

  it("does not reveal short values", () => {
    expect(maskSoCMT("123")).toBe("****");
    expect(maskSoCMT("")).toBe("****");
  });
});

describe("formatNgaySinh", () => {
  it("formats yyyyMMdd without Date parsing", () => {
    expect(formatNgaySinh("19901231")).toBe("31/12/1990");
    expect(formatNgaySinh("20260522")).toBe("22/05/2026");
  });

  it("returns an empty string for missing or invalid raw dates", () => {
    expect(formatNgaySinh(null)).toBe("");
    expect(formatNgaySinh("1990-12-31")).toBe("");
    expect(formatNgaySinh("1990123a")).toBe("");
  });
});

describe("formatGender", () => {
  it("normalizes male values to Nam", () => {
    expect(formatGender("Nam")).toBe("Nam");
    expect(formatGender(" nam ")).toBe("Nam");
    expect(formatGender("1")).toBe("Nam");
    expect(formatGender("male")).toBe("Nam");
  });

  it("normalizes female values to Nữ", () => {
    expect(formatGender("Nữ")).toBe("Nữ");
    expect(formatGender("nu")).toBe("Nữ");
    expect(formatGender("2")).toBe("Nữ");
    expect(formatGender("female")).toBe("Nữ");
  });

  it("returns an empty string for missing values", () => {
    expect(formatGender(null)).toBe("");
    expect(formatGender("")).toBe("");
  });
});

describe("buildPublicStudentResponse", () => {
  it("builds a public response without exposing internal or sensitive fields", () => {
    const record = {
      id: 1,
      maDK: "DK001",
      hoVaTen: "Nguyen Van A",
      soCMT: "012345678901",
      ngaySinh: "19900101",
      gioiTinh: "nam",
      diaChi: "Dak Lak",
      tenKhoaHoc: "K45",
      hang: "B2",
      loaiDaoTao: "oto",
      maKhoaHoc: "K45",
      hangDaoTao: "B2",
      photoUrl: "/uploads/students/K45/DK001.jpg",
      sourceUpdatedAt: new Date("2026-05-21T10:30:00.000Z"),
      syncedAt: new Date("2026-05-21T11:00:00.000Z"),
      DuongDanAnh: "D:\\photos\\DK001.jp2",
      IMAGE_BASE_PATH: "D:\\photos",
    };

    const response = buildPublicStudentResponse(record);

    expect(response).toEqual({
      hoVaTen: "Nguyen Van A",
      soCMTMasked: "********8901",
      ngaySinh: "01/01/1990",
      gioiTinh: "Nam",
      diaChi: "Dak Lak",
      tenKhoaHoc: "K45",
      hang: "B2",
      photoUrl: "/uploads/students/K45/DK001.jpg",
    });

    expect(Object.keys(response).sort()).toEqual(
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

    for (const forbiddenField of [
      "soCMT",
      "maDK",
      "maKhoaHoc",
      "hangDaoTao",
      "loaiDaoTao",
      "sourceUpdatedAt",
      "syncedAt",
      "DuongDanAnh",
      "IMAGE_BASE_PATH",
    ]) {
      expect(Object.prototype.hasOwnProperty.call(response, forbiddenField)).toBe(
        false
      );
    }
  });
});
