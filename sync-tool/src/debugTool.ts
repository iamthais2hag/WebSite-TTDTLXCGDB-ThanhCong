import {
  buildFallbackImagePath,
  type ImagePathRecord,
} from "./imagePath.js";
import {
  mapLoaiDaoTao,
  mapSqlServerStudentRow,
  normalizeGender,
  type LoaiDaoTao,
  type SqlServerConnectionLike,
  type SqlServerStudentRow,
} from "./sqlReader.js";

export type DebugToolEnv = {
  IMAGE_BASE_PATH?: string;
};

export type DebugToolOptions = {
  cccd: string;
  connection: SqlServerConnectionLike;
  imageBasePath?: string | null;
  pathExists?: (filePath: string) => Promise<boolean>;
};

export type DebugToolRecord = {
  MaDK: string;
  MaKhoaHoc: string | null;
  HangDaoTao: string | null;
  TenKhoaHoc: string | null;
  Hang: string | null;
  LoaiDaoTao: LoaiDaoTao;
  NgaySinhRaw: string;
  NgaySinhDisplay: string;
  GioiTinhRaw: string;
  GioiTinhDisplay: string;
  DiaChi: string | null;
  DuongDanAnh: string | null;
  fallbackImagePath: string | null;
  imageExists: boolean;
  photoUrl: string | null;
};

export type DebugToolResult = {
  cccdMasked: string;
  records: DebugToolRecord[];
  output: string;
};

export type ParsedDebugArgs =
  | {
      ok: true;
      cccd: string;
    }
  | {
      ok: false;
      error: string;
    };

type DebugSqlRow = SqlServerStudentRow & {
  photoUrl?: string | null;
};

export class DebugToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DebugToolError";
  }
}

export function parseDebugArgs(args: string[]): ParsedDebugArgs {
  const cccd = readArgValue(args, "--cccd");

  if (!cccd) {
    return {
      ok: false,
      error: "Missing required --cccd",
    };
  }

  const normalized = cccd.trim();
  if (!/^\d{9,12}$/.test(normalized)) {
    return {
      ok: false,
      error: "CCCD must contain 9-12 digits",
    };
  }

  return {
    ok: true,
    cccd: normalized,
  };
}

export async function runDebugCommand(
  options: DebugToolOptions
): Promise<DebugToolResult> {
  const records = await readDebugRecordsByCccd(options.connection, options.cccd, {
    imageBasePath: options.imageBasePath,
    pathExists: options.pathExists,
  });
  const cccdMasked = maskCccdForDebug(options.cccd);
  const output = formatDebugOutput({
    cccdMasked,
    records,
  });

  return {
    cccdMasked,
    records,
    output,
  };
}

export async function readDebugRecordsByCccd(
  connection: SqlServerConnectionLike,
  cccd: string,
  options: {
    imageBasePath?: string | null;
    pathExists?: (filePath: string) => Promise<boolean>;
  } = {}
): Promise<DebugToolRecord[]> {
  const result = await connection
    .request()
    .input("cccd", cccd)
    .query<DebugSqlRow>(buildStudentDebugQuery());

  return Promise.all(
    result.recordset.map((row) => mapDebugSqlRow(row, options))
  );
}

export function buildStudentDebugQuery(): string {
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
    COALESCE(n.NgaySua, n.NgayTao) AS SourceUpdatedAt,
    CAST(NULL AS NVARCHAR(255)) AS photoUrl
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
SELECT
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
  SourceUpdatedAt,
  photoUrl
FROM StudentData
WHERE SoCMT = @cccd
ORDER BY MaDK ASC;
`.trim();
}

export function formatDebugOutput({
  cccdMasked,
  records,
}: {
  cccdMasked: string;
  records: DebugToolRecord[];
}): string {
  if (records.length === 0) {
    return `Debug CCCD: ${cccdMasked}\nKhong co du lieu.`;
  }

  const lines = [`Debug CCCD: ${cccdMasked}`, `Records found: ${records.length}`];

  for (const record of records) {
    lines.push(
      "",
      `MaDK: ${record.MaDK}`,
      `MaKhoaHoc: ${formatNullable(record.MaKhoaHoc)}`,
      `HangDaoTao: ${formatNullable(record.HangDaoTao)}`,
      `TenKhoaHoc: ${formatNullable(record.TenKhoaHoc)}`,
      `Hang: ${formatNullable(record.Hang)}`,
      `LoaiDaoTao: ${record.LoaiDaoTao}`,
      `NgaySinh raw: ${formatNullable(record.NgaySinhRaw)}`,
      `NgaySinh display: ${formatNullable(record.NgaySinhDisplay)}`,
      `GioiTinh raw: ${formatNullable(record.GioiTinhRaw)}`,
      `GioiTinh display: ${formatNullable(record.GioiTinhDisplay)}`,
      `DiaChi: ${formatNullable(record.DiaChi)}`,
      `DuongDanAnh: ${formatNullable(record.DuongDanAnh)}`,
      `fallback image path: ${formatNullable(record.fallbackImagePath)}`,
      `file anh ton tai: ${record.imageExists}`,
      `photoUrl: ${formatNullable(record.photoUrl)}`
    );
  }

  return lines.join("\n");
}

export function formatNgaySinhDisplay(value: string | null): string {
  if (!value || !/^\d{8}$/.test(value)) {
    return "";
  }

  return `${value.slice(6, 8)}/${value.slice(4, 6)}/${value.slice(0, 4)}`;
}

export function formatGioiTinhDisplay(value: unknown): string {
  return normalizeGender(value) ?? "";
}

export function maskCccdForDebug(cccd: string): string {
  const normalized = cccd.trim();

  if (normalized.length <= 4) {
    return "****";
  }

  return `${"*".repeat(normalized.length - 4)}${normalized.slice(-4)}`;
}

async function mapDebugSqlRow(
  row: DebugSqlRow,
  options: {
    imageBasePath?: string | null;
    pathExists?: (filePath: string) => Promise<boolean>;
  }
): Promise<DebugToolRecord> {
  const syncRecord = mapSqlServerStudentRow(row);
  const imagePathRecord: ImagePathRecord = {
    MaDK: syncRecord.MaDK,
    MaKhoaHoc: syncRecord.MaKhoaHoc,
    DuongDanAnh: syncRecord.DuongDanAnh,
  };
  const fallbackImagePath = buildFallbackImagePath(
    imagePathRecord,
    options.imageBasePath
  );
  const imageExists = await resolveDebugImageExists({
    directImagePath: syncRecord.DuongDanAnh,
    fallbackImagePath,
    pathExists: options.pathExists,
  });

  return {
    MaDK: syncRecord.MaDK,
    MaKhoaHoc: syncRecord.MaKhoaHoc,
    HangDaoTao: syncRecord.HangDaoTao,
    TenKhoaHoc: syncRecord.TenKhoaHoc,
    Hang: syncRecord.Hang,
    LoaiDaoTao: mapLoaiDaoTao(syncRecord.HangDaoTao),
    NgaySinhRaw: formatRawValue(row.NgaySinh),
    NgaySinhDisplay: formatNgaySinhDisplay(syncRecord.NgaySinh),
    GioiTinhRaw: formatRawValue(row.GioiTinh),
    GioiTinhDisplay: formatGioiTinhDisplay(row.GioiTinh),
    DiaChi: syncRecord.DiaChi,
    DuongDanAnh: syncRecord.DuongDanAnh,
    fallbackImagePath,
    imageExists,
    photoUrl: normalizeOptionalText(row.photoUrl),
  };
}

async function resolveDebugImageExists({
  directImagePath,
  fallbackImagePath,
  pathExists,
}: {
  directImagePath: string | null;
  fallbackImagePath: string | null;
  pathExists?: (filePath: string) => Promise<boolean>;
}): Promise<boolean> {
  if (!pathExists) {
    return false;
  }

  if (directImagePath && (await pathExists(directImagePath))) {
    return true;
  }

  return Boolean(fallbackImagePath && (await pathExists(fallbackImagePath)));
}

function formatRawValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }

  return String(value).trim();
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const normalized = value?.trim();

  return normalized ? normalized : null;
}

function formatNullable(value: string | null): string {
  return value && value.length > 0 ? value : "(none)";
}

function readArgValue(args: string[], name: string): string | null {
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === name) {
      return args[index + 1] ?? null;
    }

    if (arg?.startsWith(`${name}=`)) {
      return arg.slice(name.length + 1);
    }
  }

  return null;
}

async function runCli(args: string[], env: DebugToolEnv): Promise<number> {
  const parsedArgs = parseDebugArgs(args);

  if (!parsedArgs.ok) {
    console.error(parsedArgs.error);
    return 1;
  }

  try {
    const result = await runDebugCommand({
      cccd: parsedArgs.cccd,
      connection: createMissingSqlConnection(),
      imageBasePath: env.IMAGE_BASE_PATH,
    });
    console.log(result.output);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Debug failed";
    console.error(message);
    return 1;
  }
}

function createMissingSqlConnection(): SqlServerConnectionLike {
  throw new DebugToolError(
    "SQL Server connection is not configured for this local debug command"
  );
}

if (isDirectExecution()) {
  runCli(process.argv.slice(2), process.env).then((exitCode) => {
    process.exitCode = exitCode;
  });
}

function isDirectExecution(): boolean {
  return process.argv[1]?.endsWith("debugTool.ts") ?? false;
}
