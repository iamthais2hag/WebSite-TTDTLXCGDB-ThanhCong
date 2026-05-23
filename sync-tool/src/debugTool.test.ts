import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildStudentDebugQuery,
  formatDebugOutput,
  formatGioiTinhDisplay,
  formatNgaySinhDisplay,
  parseDebugArgs,
  readDebugRecordsByCccd,
  runDebugCommand,
  type DebugToolRecord,
} from "./debugTool.js";
import type {
  SqlServerConnectionLike,
  SqlServerQueryResult,
  SqlServerRequestLike,
  SqlServerStudentRow,
} from "./sqlReader.js";

type DebugSqlRow = SqlServerStudentRow & {
  photoUrl?: string | null;
};

function createFakeSqlConnection(rows: DebugSqlRow[] = []) {
  const inputs: Record<string, unknown> = {};
  const queryMock = vi.fn();
  const request: SqlServerRequestLike = {
    input(name, value) {
      inputs[name] = value;
      return request;
    },
    async query<Row>(sql: string): Promise<SqlServerQueryResult<Row>> {
      queryMock(sql);

      return {
        recordset: rows as unknown as Row[],
      };
    },
  };

  return {
    connection: {
      request: vi.fn(() => request),
    } satisfies SqlServerConnectionLike,
    inputs,
    queryMock,
  };
}

const firstRow: DebugSqlRow = {
  MaDK: "DK001",
  HoVaTen: "Nguyen Van A",
  SoCMT: "012345678901",
  NgaySinh: "1990-01-01",
  GioiTinh: "2",
  MaKhoaHoc: "K45",
  HangDaoTao: "A1",
  DuongDanAnh: "D:\\Images\\K45\\DK001.jp2",
  TenKhoaHoc: "Khoa 45",
  Hang: "Hang A1",
  DiaChi: "Dak Lak",
  SourceUpdatedAt: "2026-05-21T10:30:00.000Z",
  photoUrl: "/uploads/students/K45/DK001.jpg",
};

const secondRow: DebugSqlRow = {
  ...firstRow,
  MaDK: "DK002",
  NgaySinh: "19851224",
  GioiTinh: "nam",
  HangDaoTao: "B2",
  DuongDanAnh: null,
  Hang: "Hang B2",
  photoUrl: null,
};

describe("debug tool args and formatting", () => {
  it("parses --cccd safely", () => {
    expect(parseDebugArgs(["--cccd", "012345678901"])).toEqual({
      ok: true,
      cccd: "012345678901",
    });
    expect(parseDebugArgs(["--cccd=123456789"])).toEqual({
      ok: true,
      cccd: "123456789",
    });
    expect(parseDebugArgs([])).toEqual({
      ok: false,
      error: "Missing required --cccd",
    });
    expect(parseDebugArgs(["--cccd", "abc"])).toEqual({
      ok: false,
      error: "CCCD must contain 9-12 digits",
    });
  });

  it("formats NgaySinh and GioiTinh display values", () => {
    expect(formatNgaySinhDisplay("19900101")).toBe("01/01/1990");
    expect(formatNgaySinhDisplay("bad")).toBe("");
    expect(formatGioiTinhDisplay("2")).toBe("N\u1EEF");
    expect(formatGioiTinhDisplay("nam")).toBe("Nam");
  });

  it("reports no data clearly", () => {
    expect(
      formatDebugOutput({
        cccdMasked: "********8901",
        records: [],
      })
    ).toBe("Debug CCCD: ********8901\nKhong co du lieu.");
  });
});

describe("debug SQL reader", () => {
  it("builds a local debug query filtered by CCCD without public routes", () => {
    const sql = buildStudentDebugQuery();

    expect(sql).toContain("WHERE SoCMT = @cccd");
    expect(sql).toContain("INNER JOIN dbo.NguoiLX_HoSo h ON n.MaDK = h.MaDK");
    expect(sql).not.toContain("student-photo-batch");
    expect(sql).not.toContain("router");
  });

  it("reads multiple records for a CCCD and includes image debug fields", async () => {
    const fake = createFakeSqlConnection([firstRow, secondRow]);
    const imageBasePath = path.join("D:\\ImageBase", "root");
    const firstFallbackPath = path.resolve(imageBasePath, "K45", "DK001.jp2");
    const secondFallbackPath = path.resolve(imageBasePath, "K45", "DK002.jp2");
    const pathExists = vi.fn(async (filePath: string) =>
      filePath === firstRow.DuongDanAnh || filePath === secondFallbackPath
    );

    const records = await readDebugRecordsByCccd(
      fake.connection,
      "012345678901",
      {
        imageBasePath,
        pathExists,
      }
    );

    expect(fake.inputs).toEqual({
      cccd: "012345678901",
    });
    expect(records).toMatchObject([
      {
        MaDK: "DK001",
        MaKhoaHoc: "K45",
        HangDaoTao: "A1",
        TenKhoaHoc: "Khoa 45",
        Hang: "Hang A1",
        LoaiDaoTao: "moto",
        NgaySinhRaw: "1990-01-01",
        NgaySinhDisplay: "01/01/1990",
        GioiTinhRaw: "2",
        GioiTinhDisplay: "N\u1EEF",
        DiaChi: "Dak Lak",
        DuongDanAnh: "D:\\Images\\K45\\DK001.jp2",
        fallbackImagePath: firstFallbackPath,
        imageExists: true,
        photoUrl: "/uploads/students/K45/DK001.jpg",
      },
      {
        MaDK: "DK002",
        MaKhoaHoc: "K45",
        HangDaoTao: "B2",
        Hang: "Hang B2",
        LoaiDaoTao: "oto",
        NgaySinhRaw: "19851224",
        NgaySinhDisplay: "24/12/1985",
        GioiTinhRaw: "nam",
        GioiTinhDisplay: "Nam",
        fallbackImagePath: secondFallbackPath,
        imageExists: true,
        photoUrl: null,
      },
    ]);
  });

  it("reports image exists false with mock pathExists", async () => {
    const fake = createFakeSqlConnection([firstRow]);

    const records = await readDebugRecordsByCccd(
      fake.connection,
      "012345678901",
      {
        imageBasePath: path.join("D:\\ImageBase", "root"),
        pathExists: vi.fn(async () => false),
      }
    );

    expect(records[0]?.imageExists).toBe(false);
  });
});

describe("debug command output", () => {
  it("prints all MaDK records and safe operational fields", async () => {
    const fake = createFakeSqlConnection([firstRow, secondRow]);
    const imageBasePath = path.join("D:\\ImageBase", "root");
    const result = await runDebugCommand({
      cccd: "012345678901",
      connection: fake.connection,
      imageBasePath,
      pathExists: vi.fn(async () => false),
    });

    expect(result.output).toContain("Debug CCCD: ********8901");
    expect(result.output).toContain("Records found: 2");
    expect(result.output).toContain("MaDK: DK001");
    expect(result.output).toContain("MaDK: DK002");
    expect(result.output).toContain("NgaySinh display: 01/01/1990");
    expect(result.output).toContain("GioiTinh display: N\u1EEF");
    expect(result.output).toContain("fallback image path:");
    expect(result.output).toContain("file anh ton tai: false");
    expect(result.output).toContain("photoUrl: /uploads/students/K45/DK001.jpg");
  });

  it("does not log secret, password, or connection string", async () => {
    const record: DebugToolRecord = {
      MaDK: "DK001",
      MaKhoaHoc: "K45",
      HangDaoTao: "B2",
      TenKhoaHoc: "Khoa 45",
      Hang: "Hang B2",
      LoaiDaoTao: "oto",
      NgaySinhRaw: "19900101",
      NgaySinhDisplay: "01/01/1990",
      GioiTinhRaw: "nam",
      GioiTinhDisplay: "Nam",
      DiaChi: "Dak Lak",
      DuongDanAnh: null,
      fallbackImagePath: path.join("D:\\ImageBase", "K45", "DK001.jp2"),
      imageExists: false,
      photoUrl: null,
    };
    const output = formatDebugOutput({
      cccdMasked: "********8901",
      records: [record],
    });

    expect(output).not.toContain("SYNC_SECRET");
    expect(output).not.toContain("password");
    expect(output).not.toContain("Server=");
    expect(output).not.toContain("ConnectionString");
  });
});
