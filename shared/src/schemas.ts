import { z } from "zod";

export const loaiDaoTaoSchema = z.enum(["moto", "oto"]);

export const lookupSearchInputSchema = z.object({
  soCMT: z
    .string()
    .trim()
    .min(9)
    .max(12)
    .regex(/^\d+$/, "CCCD chi chua so"),
  loaiDaoTao: loaiDaoTaoSchema,
});

export const studentLookupPublicSchema = z
  .object({
    hoVaTen: z.string(),
    soCMTMasked: z.string(),
    ngaySinh: z.string(),
    gioiTinh: z.string(),
    diaChi: z.string().nullable(),
    tenKhoaHoc: z.string().nullable(),
    hang: z.string().nullable(),
    photoUrl: z.string().nullable(),
  })
  .strict();

export const syncStudentRecordSchema = z.object({
  MaDK: z.string().min(1),
  HoVaTen: z.string().min(1),
  SoCMT: z.string().min(9).max(12),
  NgaySinh: z.string().regex(/^\d{8}$/).nullable(),
  GioiTinh: z.string().nullable(),
  DiaChi: z.string().nullable(),
  TenKhoaHoc: z.string().nullable(),
  Hang: z.string().nullable(),
  MaKhoaHoc: z.string().nullable(),
  HangDaoTao: z.string().nullable(),
  photoUrl: z.string().nullable(),
  sourceUpdatedAt: z.string().datetime().nullable(),
});

export const syncBatchMaxRecords = 200;

export const pushBatchInputSchema = z.object({
  records: z.array(syncStudentRecordSchema).min(1).max(syncBatchMaxRecords),
});

export type LoaiDaoTao = z.infer<typeof loaiDaoTaoSchema>;
export type LookupSearchInput = z.infer<typeof lookupSearchInputSchema>;
export type StudentLookupPublic = z.infer<typeof studentLookupPublicSchema>;
export type SyncStudentRecord = z.infer<typeof syncStudentRecordSchema>;
export type PushBatchInput = z.infer<typeof pushBatchInputSchema>;
