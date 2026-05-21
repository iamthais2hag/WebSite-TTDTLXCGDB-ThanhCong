import {
  datetime,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const studentLookupCache = mysqlTable(
  "student_lookup_cache",
  {
    id: int("id").autoincrement().primaryKey(),

    maDK: varchar("MaDK", { length: 50 }).notNull(),

    hoVaTen: varchar("HoVaTen", { length: 255 }).notNull(),
    soCMT: varchar("SoCMT", { length: 20 }).notNull(),
    ngaySinh: varchar("NgaySinh", { length: 8 }),
    gioiTinh: varchar("GioiTinh", { length: 10 }),
    diaChi: text("DiaChi"),

    tenKhoaHoc: varchar("TenKhoaHoc", { length: 255 }),
    hang: varchar("Hang", { length: 100 }),
    loaiDaoTao: mysqlEnum("LoaiDaoTao", ["moto", "oto"]).notNull(),

    maKhoaHoc: varchar("MaKhoaHoc", { length: 50 }),
    hangDaoTao: varchar("HangDaoTao", { length: 20 }),

    photoUrl: varchar("photoUrl", { length: 500 }),

    sourceUpdatedAt: datetime("sourceUpdatedAt"),
    syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("student_lookup_cache_MaDK_unique").on(table.maDK),
    index("student_lookup_cache_SoCMT_idx").on(table.soCMT),
    index("student_lookup_cache_LoaiDaoTao_idx").on(table.loaiDaoTao),
    index("student_lookup_cache_sourceUpdatedAt_idx").on(table.sourceUpdatedAt),
    index("student_lookup_cache_checkpoint_idx").on(
      table.sourceUpdatedAt,
      table.maDK
    ),
  ]
);
