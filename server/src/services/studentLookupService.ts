export type StudentLookupPublicResponse = {
  hoVaTen: string;
  soCMTMasked: string;
  ngaySinh: string;
  gioiTinh: string;
  diaChi: string | null;
  tenKhoaHoc: string | null;
  hang: string | null;
  photoUrl: string | null;
};

export type StudentLookupRecordForPublic = {
  hoVaTen: string;
  soCMT: string;
  ngaySinh: string | null;
  gioiTinh: string | null;
  diaChi: string | null;
  tenKhoaHoc: string | null;
  hang: string | null;
  photoUrl: string | null;
};

export function maskSoCMT(soCMT: string): string {
  if (soCMT.length <= 4) {
    return "****";
  }

  return `${"*".repeat(soCMT.length - 4)}${soCMT.slice(-4)}`;
}

export function formatNgaySinh(raw: string | null): string {
  if (!raw || !/^\d{8}$/.test(raw)) {
    return "";
  }

  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);

  return `${day}/${month}/${year}`;
}

export function formatGender(value: string | null): string {
  if (!value) {
    return "";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "1" || normalized === "nam" || normalized === "male") {
    return "Nam";
  }

  if (
    normalized === "2" ||
    normalized === "nữ" ||
    normalized === "nu" ||
    normalized === "female"
  ) {
    return "Nữ";
  }

  return value.trim();
}

export function buildPublicStudentResponse(
  record: StudentLookupRecordForPublic
): StudentLookupPublicResponse {
  return {
    hoVaTen: record.hoVaTen,
    soCMTMasked: maskSoCMT(record.soCMT),
    ngaySinh: formatNgaySinh(record.ngaySinh),
    gioiTinh: formatGender(record.gioiTinh),
    diaChi: record.diaChi,
    tenKhoaHoc: record.tenKhoaHoc,
    hang: record.hang,
    photoUrl: record.photoUrl,
  };
}
