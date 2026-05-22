import { describe, expect, it, vi } from "vitest";
import {
  buildStudentBatchQuery,
  mapLoaiDaoTao,
  normalizeGender,
  normalizeNgaySinh,
  readSqlServerStudentBatch,
  type SqlServerQueryResult,
  type SqlServerRequestLike,
  type SqlServerStudentRow,
} from "./sqlReader.js";

function createFakeSqlConnection(rows: SqlServerStudentRow[] = []) {
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
    },
    inputs,
    queryMock,
  };
}

const sqlRow: SqlServerStudentRow = {
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
  SourceUpdatedAt: new Date("2026-05-21T10:30:00.000Z"),
};

describe("SQL Server reader query", () => {
  it("builds the required MaDK join and related lookup joins", () => {
    const sql = buildStudentBatchQuery();

    expect(sql).toContain("INNER JOIN dbo.NguoiLX_HoSo h ON n.MaDK = h.MaDK");
    expect(sql).toContain("LEFT JOIN dbo.KhoaHoc kh ON h.MaKhoaHoc = kh.MaKH");
    expect(sql).toContain(
      "LEFT JOIN dbo.DM_HangGPLX hang ON h.HangDaoTao = hang.MaHang"
    );
    expect(sql).toContain("LEFT JOIN dbo.DM_DVHC dvhc");
    expect(sql).toContain("NoiCT_MaDVQL");
    expect(sql).toContain("NoiCT_MaDVHC");
  });

  it("uses SourceUpdatedAt as a CTE alias instead of a physical column", () => {
    const sql = buildStudentBatchQuery();

    expect(sql).toContain("WITH StudentData AS");
    expect(sql).toContain("COALESCE(n.NgaySua, n.NgayTao) AS SourceUpdatedAt");
    expect(sql).not.toContain("sourceUpdatedAt");
  });

  it("supports checkpoint paging by SourceUpdatedAt and MaDK", () => {
    const sql = buildStudentBatchQuery({ includeCheckpoint: true });

    expect(sql).toContain("SourceUpdatedAt > @lastSourceUpdatedAt");
    expect(sql).toContain(
      "SourceUpdatedAt = @lastSourceUpdatedAt AND MaDK > @lastMaDK"
    );
    expect(sql).toContain("ORDER BY SourceUpdatedAt ASC, MaDK ASC");
  });
});

describe("SQL Server reader normalization", () => {
  it("keeps valid NgaySinh as yyyyMMdd", () => {
    expect(normalizeNgaySinh("19900101")).toBe("19900101");
    expect(normalizeNgaySinh("1990-01-01")).toBe("19900101");
    expect(normalizeNgaySinh("01/01/1990")).toBeNull();
    expect(normalizeNgaySinh("199001")).toBeNull();
  });

  it("normalizes gender to Nam or Nu display values", () => {
    expect(normalizeGender("1")).toBe("Nam");
    expect(normalizeGender("nam")).toBe("Nam");
    expect(normalizeGender("2")).toBe("N\u1EEF");
    expect(normalizeGender("nu")).toBe("N\u1EEF");
    expect(normalizeGender(null)).toBeNull();
  });

  it("maps only the A prefix rule for LoaiDaoTao", () => {
    expect(mapLoaiDaoTao("A1")).toBe("moto");
    expect(mapLoaiDaoTao("AM")).toBe("moto");
    expect(mapLoaiDaoTao("B2")).toBe("oto");
    expect(mapLoaiDaoTao("C")).toBe("oto");
    expect(mapLoaiDaoTao(null)).toBe("oto");
  });
});

describe("readSqlServerStudentBatch", () => {
  it("reads and maps records without connecting to a real SQL Server", async () => {
    const fake = createFakeSqlConnection([sqlRow]);

    await expect(
      readSqlServerStudentBatch(fake.connection, {
        batchSize: 100,
        checkpoint: {
          lastSourceUpdatedAt: "2026-05-20T00:00:00.000Z",
          lastMaDK: "DK000",
        },
      })
    ).resolves.toEqual([
      {
        MaDK: "DK001",
        HoVaTen: "Nguyen Van A",
        SoCMT: "012345678901",
        NgaySinh: "19900101",
        GioiTinh: "N\u1EEF",
        DiaChi: "Dak Lak",
        TenKhoaHoc: "Khoa 45",
        Hang: "Hang A1",
        MaKhoaHoc: "K45",
        HangDaoTao: "A1",
        DuongDanAnh: "D:\\Images\\K45\\DK001.jp2",
        LoaiDaoTao: "moto",
        sourceUpdatedAt: "2026-05-21T10:30:00.000Z",
      },
    ]);

    expect(fake.connection.request).toHaveBeenCalledTimes(1);
    expect(fake.inputs).toEqual({
      batchSize: 100,
      lastSourceUpdatedAt: "2026-05-20T00:00:00.000Z",
      lastMaDK: "DK000",
    });
    expect(fake.queryMock).toHaveBeenCalledTimes(1);
  });

  it("does not log password or connection string while reading", async () => {
    const fake = createFakeSqlConnection([sqlRow]);
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const consoleWarn = vi
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      await readSqlServerStudentBatch(fake.connection, {
        batchSize: 100,
      });

      const loggedText = [
        ...consoleLog.mock.calls,
        ...consoleWarn.mock.calls,
        ...consoleError.mock.calls,
      ]
        .flat()
        .join(" ");

      expect(loggedText).not.toContain("password");
      expect(loggedText).not.toContain("Server=");
      expect(loggedText).not.toContain("ConnectionString");
    } finally {
      consoleLog.mockRestore();
      consoleWarn.mockRestore();
      consoleError.mockRestore();
    }
  });
});
