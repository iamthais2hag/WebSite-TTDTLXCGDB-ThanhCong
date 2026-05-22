import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  lookupRateLimitMaxRequests,
  lookupRateLimitMessage,
  resetLookupRateLimitForTests,
} from "../../services/lookupRateLimit.js";
import { appRouter } from "./index.js";
import { lookupRouter } from "./lookup.js";

const { searchStudentLookupRecordsMock } = vi.hoisted(() => ({
  searchStudentLookupRecordsMock: vi.fn(),
}));

vi.mock("../../services/studentLookupRepository.js", () => ({
  searchStudentLookupRecords: searchStudentLookupRecordsMock,
}));

function createCaller(ip = "127.0.0.1") {
  return lookupRouter.createCaller({
    req: {
      ip,
      socket: {
        remoteAddress: ip,
      },
    } as never,
    res: {} as never,
    syncSecret: undefined,
  });
}

function createAppCaller(ip = "127.0.0.1") {
  return appRouter.createCaller({
    req: {
      ip,
      socket: {
        remoteAddress: ip,
      },
    } as never,
    res: {} as never,
    syncSecret: undefined,
  });
}

describe("lookup.searchStudent", () => {
  beforeEach(() => {
    resetLookupRateLimitForTests();
    searchStudentLookupRecordsMock.mockReset();
  });

  it("returns public lookup fields only", async () => {
    searchStudentLookupRecordsMock.mockResolvedValue([
      {
        maDK: "DK001",
        hoVaTen: "Nguyen Van A",
        soCMT: "012345678901",
        ngaySinh: "19900101",
        gioiTinh: "nam",
        diaChi: "Dak Lak",
        tenKhoaHoc: "K45",
        hang: "B2",
        maKhoaHoc: "K45",
        hangDaoTao: "B2",
        loaiDaoTao: "oto",
        photoUrl: "/uploads/students/K45/DK001.jpg",
        sourceUpdatedAt: new Date("2026-05-21T10:30:00.000Z"),
        syncedAt: new Date("2026-05-21T11:00:00.000Z"),
      },
    ]);

    const result = await createCaller().searchStudent({
      soCMT: " 012345678901 ",
      loaiDaoTao: "oto",
    });

    expect(searchStudentLookupRecordsMock).toHaveBeenCalledWith({
      soCMT: "012345678901",
      loaiDaoTao: "oto",
    });
    expect(result).toEqual([
      {
        hoVaTen: "Nguyen Van A",
        soCMTMasked: "********8901",
        ngaySinh: "01/01/1990",
        gioiTinh: "Nam",
        diaChi: "Dak Lak",
        tenKhoaHoc: "K45",
        hang: "B2",
        photoUrl: "/uploads/students/K45/DK001.jpg",
      },
    ]);
  });

  it("returns multiple public records for one SoCMT", async () => {
    searchStudentLookupRecordsMock.mockResolvedValue([
      {
        hoVaTen: "Nguyen Van A",
        soCMT: "012345678901",
        ngaySinh: "19900101",
        gioiTinh: "nam",
        diaChi: "Dak Lak",
        tenKhoaHoc: "K45",
        hang: "B2",
        photoUrl: "/uploads/students/K45/DK001.jpg",
      },
      {
        hoVaTen: "Nguyen Van A",
        soCMT: "012345678901",
        ngaySinh: "19900101",
        gioiTinh: "nam",
        diaChi: "Dak Lak",
        tenKhoaHoc: "K46",
        hang: "C",
        photoUrl: "/uploads/students/K46/DK002.jpg",
      },
    ]);

    const result = await createCaller().searchStudent({
      soCMT: "012345678901",
      loaiDaoTao: "oto",
    });

    expect(result).toHaveLength(2);
    expect(result.map((record) => record.tenKhoaHoc)).toEqual(["K45", "K46"]);
  });

  it("returns an empty array when no record matches", async () => {
    searchStudentLookupRecordsMock.mockResolvedValue([]);

    await expect(
      createCaller().searchStudent({
        soCMT: "012345678901",
        loaiDaoTao: "moto",
      })
    ).resolves.toEqual([]);
  });

  it("does not expose raw SoCMT or internal fields in the response", async () => {
    searchStudentLookupRecordsMock.mockResolvedValue([
      {
        maDK: "DK001",
        hoVaTen: "Nguyen Van A",
        soCMT: "012345678901",
        ngaySinh: "19900101",
        gioiTinh: "nam",
        diaChi: null,
        tenKhoaHoc: null,
        hang: null,
        maKhoaHoc: "K45",
        hangDaoTao: "B2",
        loaiDaoTao: "oto",
        photoUrl: null,
        sourceUpdatedAt: new Date("2026-05-21T10:30:00.000Z"),
        syncedAt: new Date("2026-05-21T11:00:00.000Z"),
        DuongDanAnh: "D:\\photos\\DK001.jp2",
        IMAGE_BASE_PATH: "D:\\photos",
      },
    ]);

    const result = await createCaller().searchStudent({
      soCMT: "012345678901",
      loaiDaoTao: "oto",
    });
    const json = JSON.stringify(result);

    expect(json).not.toContain("012345678901");

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
      expect(Object.prototype.hasOwnProperty.call(result[0], forbiddenField)).toBe(
        false
      );
    }
  });

  it("rejects invalid input before calling lookup service", async () => {
    await expect(
      createCaller().searchStudent({
        soCMT: "01234abc",
        loaiDaoTao: "oto",
      })
    ).rejects.toThrow();

    await expect(
      createCaller().searchStudent({
        soCMT: "012345678901",
        loaiDaoTao: "truck" as never,
      })
    ).rejects.toThrow();

    expect(searchStudentLookupRecordsMock).not.toHaveBeenCalled();
  });

  it("allows requests within the IP rate limit", async () => {
    searchStudentLookupRecordsMock.mockResolvedValue([]);
    const caller = createCaller("192.0.2.10");

    for (let index = 0; index < lookupRateLimitMaxRequests; index += 1) {
      await expect(
        caller.searchStudent({
          soCMT: "012345678901",
          loaiDaoTao: "oto",
        })
      ).resolves.toEqual([]);
    }

    expect(searchStudentLookupRecordsMock).toHaveBeenCalledTimes(
      lookupRateLimitMaxRequests
    );
  });

  it("rejects lookup requests over the IP rate limit", async () => {
    searchStudentLookupRecordsMock.mockResolvedValue([]);
    const caller = createCaller("192.0.2.11");

    for (let index = 0; index < lookupRateLimitMaxRequests; index += 1) {
      await caller.searchStudent({
        soCMT: "012345678901",
        loaiDaoTao: "oto",
      });
    }

    await expect(
      caller.searchStudent({
        soCMT: "012345678901",
        loaiDaoTao: "oto",
      })
    ).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
      message: lookupRateLimitMessage,
    });
    expect(searchStudentLookupRecordsMock).toHaveBeenCalledTimes(
      lookupRateLimitMaxRequests
    );
  });

  it("does not break non-lookup tRPC routes when lookup is rate limited", async () => {
    searchStudentLookupRecordsMock.mockResolvedValue([]);
    const caller = createAppCaller("192.0.2.12");

    for (let index = 0; index < lookupRateLimitMaxRequests; index += 1) {
      await caller.lookup.searchStudent({
        soCMT: "012345678901",
        loaiDaoTao: "oto",
      });
    }

    await expect(caller.status()).resolves.toEqual({
      ok: true,
      service: "server",
    });
  });

  it("does not log raw SoCMT when lookup is rate limited", async () => {
    searchStudentLookupRecordsMock.mockResolvedValue([]);
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const caller = createCaller("192.0.2.13");

    try {
      for (let index = 0; index < lookupRateLimitMaxRequests; index += 1) {
        await caller.searchStudent({
          soCMT: "012345678901",
          loaiDaoTao: "oto",
        });
      }

      await expect(
        caller.searchStudent({
          soCMT: "012345678901",
          loaiDaoTao: "oto",
        })
      ).rejects.toMatchObject({
        code: "TOO_MANY_REQUESTS",
      });

      const loggedText = [
        ...consoleLog.mock.calls,
        ...consoleWarn.mock.calls,
        ...consoleError.mock.calls,
      ]
        .flat()
        .join(" ");

      expect(loggedText).not.toContain("012345678901");
    } finally {
      consoleLog.mockRestore();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
    }
  });
});
