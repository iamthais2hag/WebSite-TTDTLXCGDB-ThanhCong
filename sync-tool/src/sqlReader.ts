export type LoaiDaoTao = "moto" | "oto";

export type SqlServerCheckpoint = {
  lastSourceUpdatedAt: string;
  lastMaDK: string;
};

export type SqlServerReaderOptions = {
  batchSize: number;
  checkpoint?: SqlServerCheckpoint | null;
};

export type SqlServerStudentRow = {
  MaDK: string | null;
  HoVaTen: string | null;
  SoCMT: string | null;
  NgaySinh: unknown;
  GioiTinh: unknown;
  MaKhoaHoc: string | null;
  HangDaoTao: string | null;
  DuongDanAnh: string | null;
  TenKhoaHoc: string | null;
  Hang: string | null;
  DiaChi: string | null;
  SourceUpdatedAt: unknown;
};

export type SqlServerStudentRecord = {
  MaDK: string;
  HoVaTen: string;
  SoCMT: string;
  NgaySinh: string | null;
  GioiTinh: string | null;
  DiaChi: string | null;
  TenKhoaHoc: string | null;
  Hang: string | null;
  MaKhoaHoc: string | null;
  HangDaoTao: string | null;
  DuongDanAnh: string | null;
  LoaiDaoTao: LoaiDaoTao;
  sourceUpdatedAt: string | null;
};

export type SqlServerQueryResult<Row> = {
  recordset: Row[];
};

export type SqlServerRequestLike = {
  input(name: string, value: unknown): SqlServerRequestLike;
  query<Row>(sql: string): Promise<SqlServerQueryResult<Row>>;
};

export type SqlServerConnectionLike = {
  request(): SqlServerRequestLike;
};

const defaultSourceUpdatedAtExpression = "COALESCE(n.NgaySua, n.NgayTao)";

function normalizeText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeNgaySinh(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const digits = String(value).replace(/\D/g, "");
  if (!/^\d{8}$/.test(digits)) {
    return null;
  }

  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return digits;
}

export function normalizeGender(value: unknown): string | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const lowerValue = normalized.toLowerCase();

  if (lowerValue === "1" || lowerValue === "nam" || lowerValue === "male") {
    return "Nam";
  }

  if (
    lowerValue === "2" ||
    lowerValue === "nu" ||
    lowerValue === "n\u1EEF" ||
    lowerValue === "female"
  ) {
    return "N\u1EEF";
  }

  return normalized;
}

export function mapLoaiDaoTao(hangDaoTao: string | null): LoaiDaoTao {
  return hangDaoTao?.trim().toUpperCase().startsWith("A") ? "moto" : "oto";
}

export function buildSourceUpdatedAtExpression(
  expression = defaultSourceUpdatedAtExpression
): string {
  return expression;
}

export function buildStudentBatchQuery(
  options: { includeCheckpoint?: boolean; sourceUpdatedAtExpression?: string } = {}
): string {
  const sourceUpdatedAtExpression = buildSourceUpdatedAtExpression(
    options.sourceUpdatedAtExpression
  );
  const checkpointWhere = options.includeCheckpoint
    ? `WHERE
  SourceUpdatedAt > @lastSourceUpdatedAt
  OR (SourceUpdatedAt = @lastSourceUpdatedAt AND MaDK > @lastMaDK)`
    : "";

  return `
WITH StudentData AS (
  SELECT
    n.MaDK AS MaDK,
    n.HoVaTen AS HoVaTen,
    n.SoCMT AS SoCMT,
    n.NgaySinh AS NgaySinh,
    n.GioiTinh AS GioiTinh,
    h.MaKhoaHoc AS MaKhoaHoc,
    h.HangDaoTao AS HangDaoTao,
    h.DuongDanAnh AS DuongDanAnh,
    kh.TenKH AS TenKhoaHoc,
    hang.TenHang AS Hang,
    COALESCE(
      NULLIF(LTRIM(RTRIM(dvhc.TenDayDu)), ''),
      NULLIF(LTRIM(RTRIM(n.NoiCT)), ''),
      NULLIF(LTRIM(RTRIM(n.NoiTT)), '')
    ) AS DiaChi,
    ${sourceUpdatedAtExpression} AS SourceUpdatedAt
  FROM dbo.NguoiLX n
  INNER JOIN dbo.NguoiLX_HoSo h ON n.MaDK = h.MaDK
  LEFT JOIN dbo.KhoaHoc kh ON h.MaKhoaHoc = kh.MaKH
  LEFT JOIN dbo.DM_HangGPLX hang ON h.HangDaoTao = hang.MaHang
  LEFT JOIN dbo.DM_DVHC dvhc
    ON dvhc.MaDV = NULLIF(
      CONCAT(
        LTRIM(RTRIM(ISNULL(n.NoiCT_MaDVQL, ''))),
        LTRIM(RTRIM(ISNULL(n.NoiCT_MaDVHC, '')))
      ),
      ''
    )
)
SELECT TOP (@batchSize)
  MaDK,
  HoVaTen,
  SoCMT,
  NgaySinh,
  GioiTinh,
  MaKhoaHoc,
  HangDaoTao,
  DuongDanAnh,
  TenKhoaHoc,
  Hang,
  DiaChi,
  SourceUpdatedAt
FROM StudentData
${checkpointWhere}
ORDER BY SourceUpdatedAt ASC, MaDK ASC;
`.trim();
}

export function mapSqlServerStudentRow(
  row: SqlServerStudentRow
): SqlServerStudentRecord {
  const maDK = normalizeText(row.MaDK);
  const hoVaTen = normalizeText(row.HoVaTen);
  const soCMT = normalizeText(row.SoCMT);
  const hangDaoTao = normalizeText(row.HangDaoTao);

  if (!maDK || !hoVaTen || !soCMT) {
    throw new Error("SQL Server student row is missing required sync fields");
  }

  return {
    MaDK: maDK,
    HoVaTen: hoVaTen,
    SoCMT: soCMT,
    NgaySinh: normalizeNgaySinh(row.NgaySinh),
    GioiTinh: normalizeGender(row.GioiTinh),
    DiaChi: normalizeText(row.DiaChi),
    TenKhoaHoc: normalizeText(row.TenKhoaHoc),
    Hang: normalizeText(row.Hang),
    MaKhoaHoc: normalizeText(row.MaKhoaHoc),
    HangDaoTao: hangDaoTao,
    DuongDanAnh: normalizeText(row.DuongDanAnh),
    LoaiDaoTao: mapLoaiDaoTao(hangDaoTao),
    sourceUpdatedAt: normalizeSourceUpdatedAt(row.SourceUpdatedAt),
  };
}

export function normalizeSourceUpdatedAt(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? normalized : parsed.toISOString();
}

export async function readSqlServerStudentBatch(
  connection: SqlServerConnectionLike,
  options: SqlServerReaderOptions
): Promise<SqlServerStudentRecord[]> {
  const request = connection
    .request()
    .input("batchSize", options.batchSize);
  const includeCheckpoint = Boolean(options.checkpoint);

  if (options.checkpoint) {
    request
      .input("lastSourceUpdatedAt", options.checkpoint.lastSourceUpdatedAt)
      .input("lastMaDK", options.checkpoint.lastMaDK);
  }

  const result = await request.query<SqlServerStudentRow>(
    buildStudentBatchQuery({ includeCheckpoint })
  );

  return result.recordset.map(mapSqlServerStudentRow);
}
