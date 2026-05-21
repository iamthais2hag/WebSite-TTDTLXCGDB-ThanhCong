# Tài liệu Thiết kế Website Trung tâm Đào tạo Lái xe Thành Công

**Version:** 2.0 - Production Grade  
**Last Updated:** 2026-05-21

---

## Mục lục

1. [Tổng quan kiến trúc](#tổng-quan-kiến-trúc)
2. [Bộ tài nguyên hình ảnh chính thức](#bộ-tài-nguyên-hình-ảnh-chính-thức)
3. [Static Uploads - Ảnh học viên runtime](#static-uploads---ảnh-học-viên-runtime)
4. [Drizzle Schema Design](#drizzle-schema-design)
5. [Thiết kế API với tRPC](#thiết-kế-api-với-trpc)
6. [API Upload ảnh học viên (REST)](#api-upload-ảnh-học-viên-rest)
7. [Thiết kế Sync Tool](#thiết-kế-sync-tool)
8. [Image Processing Adapter](#image-processing-adapter)
9. [Validation & Normalization Layer](#validation--normalization-layer)
10. [Utility Functions & Services](#utility-functions--services)
11. [Thiết kế Frontend](#thiết-kế-frontend)
12. [Security Hardening](#security-hardening)
13. [Testing Strategy](#testing-strategy)
14. [Dev Scripts & Workspace](#dev-scripts--workspace)
15. [.gitignore Design](#gitignore-design)
16. [Documentation](#documentation)
17. [Definition of Done](#definition-of-done)

---

## Tổng quan kiến trúc

### Stack công nghệ

| Layer | Công nghệ | Lý do |
|-------|-----------|-------|
| **Frontend** | React + TypeScript + Vite | SPA hiện đại, type-safe, build nhanh |
| **Styling** | Tailwind CSS | Utility-first, dễ maintain, responsive |
| **Backend** | Node.js + Express + tRPC | End-to-end type safety |
| **Database** | MySQL | Lưu cache học viên đã sync |
| **ORM** | Drizzle ORM | Type-safe, lightweight, hỗ trợ MySQL tốt |
| **Sync Tool** | Node.js + TypeScript | Đồng bộ dữ liệu từ SQL Server |
| **Image Processing** | Image Processing Adapter | ImageMagick ưu tiên, Sharp fallback |


### Cấu trúc thư mục

```
WebSite-TTDTLXCGDB-ThanhCong/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── assets/            # Logo, mascot, ảnh xe (static assets chính thức)
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Utilities, tRPC client
│   │   ├── types/             # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                     # Backend Express + tRPC
│   ├── src/
│   │   ├── trpc/              # tRPC routers
│   │   │   ├── routers/
│   │   │   │   ├── lookup.ts
│   │   │   │   ├── sync.ts
│   │   │   │   └── index.ts
│   │   │   ├── context.ts
│   │   │   └── trpc.ts
│   │   ├── routes/            # REST routes (chỉ cho file upload)
│   │   │   └── syncPhoto.ts
│   │   ├── services/          # Business logic
│   │   ├── db/                # Drizzle schema & connection
│   │   ├── middleware/        # Auth, rate limit
│   │   ├── schema/            # Zod schemas
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── sync-tool/                  # Sync từ SQL Server
│   ├── src/
│   │   ├── sync.ts            # Main sync logic
│   │   ├── sqlReader.ts       # SQL Server queries
│   │   ├── image-adapter.ts   # Image Processing Adapter
│   │   ├── apiClient.ts       # tRPC + REST client
│   │   ├── syncState.ts       # Checkpoint management
│   │   ├── debug.ts           # Debug tool
│   │   └── types.ts
│   ├── package.json
│   └── tsconfig.json
├── shared/                     # Shared types & schemas
│   ├── types.ts
│   └── schemas.ts             # Zod schemas dùng chung
├── public/
│   └── uploads/
│       └── students/          # Ảnh học viên runtime (gitignore)
├── requirements.md
├── design.md
├── tasks.md
├── pnpm-workspace.yaml
├── package.json               # Root workspace
├── .gitignore
├── .env.example
└── README.md
```

---

## Bộ tài nguyên hình ảnh chính thức

### Danh sách assets chính thức

Các file sau đặt tại `client/src/assets/`:

| File | Mô tả |
|------|-------|
| `logo-thanh-cong.png` | Logo chính thức của Trung tâm |
| `mascot-car.png` | Xe mascot/xe đại diện |
| `A1.png` | Mô tô hạng A1 |
| `AM.png` | Mô tô hạng A/AM |
| `BSCK.png` | Hạng B số sàn, B số cơ khí và B số tự động |
| `C1.png` | Ô tô tải hạng C1 |
| `C.png` | Ô tô tải hạng C |
| `NH.png` | Nâng hạng |

### Quy tắc sử dụng assets

**KHÔNG được làm:**
- Không tự ý thay đổi màu xe, logo, biển tập lái, tem nhận diện hoặc bố cục ảnh
- Không thay thế bằng ảnh khác nếu chưa được xác nhận
- Không dùng ảnh có logo thương hiệu xe
- Không tự ý thêm hạng A2, D, E, F nếu chưa xác nhận

**Phân biệt với ảnh học viên:**
- Assets chính thức → `client/src/assets/` → build vào frontend bundle
- Ảnh học viên runtime → `public/uploads/students/` → KHÔNG đưa vào source

---

## Static Uploads - Ảnh học viên runtime

### Quy tắc lưu trữ

| Loại | Vị trí | Git | Build |
|------|--------|-----|-------|
| Ảnh học viên runtime | `public/uploads/students/` | **gitignore** | **KHÔNG build** |
| Assets chính thức | `client/src/assets/` | commit | build vào bundle |


### Server Express serve static (Production-safe)

```typescript
// server/src/index.ts
// KHÔNG dùng __dirname cứng vì build TypeScript ra dist thay đổi path

const uploadsDir = 
  process.env.UPLOADS_DIR ?? 
  path.join(process.cwd(), "public", "uploads", "students");

// Tạo thư mục nếu chưa có
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads/students", express.static(uploadsDir));
```

### Quy tắc bắt buộc

1. **KHÔNG** đưa ảnh học viên vào `client/src/assets/`
2. **KHÔNG** build ảnh học viên vào frontend bundle
3. `public/uploads/students/` **PHẢI** nằm trong `.gitignore`
4. `UPLOADS_DIR` là env optional, không commit
5. Server tạo thư mục nếu chưa có

---

## Drizzle Schema Design

### Source of Truth

**Drizzle schema là source of truth khi code.** Raw SQL chỉ dùng để tham khảo migration.

### Bảng `student_lookup_cache`

```typescript
// server/src/db/schema.ts
import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

export const studentLookupCache = mysqlTable(
  "student_lookup_cache",
  {
    id: int("id").autoincrement().primaryKey(),
    
    // Unique key
    maDK: varchar("MaDK", { length: 50 }).notNull(),
    
    // Thông tin học viên
    hoVaTen: varchar("HoVaTen", { length: 255 }).notNull(),
    soCMT: varchar("SoCMT", { length: 20 }).notNull(),  // KHÔNG expose ra public API
    ngaySinh: varchar("NgaySinh", { length: 8 }),       // Format yyyyMMdd (raw)
    gioiTinh: varchar("GioiTinh", { length: 10 }),      // Nam/Nữ
    diaChi: text("DiaChi"),
    
    // Thông tin khóa học
    tenKhoaHoc: varchar("TenKhoaHoc", { length: 255 }),
    hang: varchar("Hang", { length: 100 }),             // Tên hạng đã join
    loaiDaoTao: mysqlEnum("LoaiDaoTao", ["moto", "oto"]).notNull(),
    
    // Internal fields (KHÔNG trả ra public API)
    maKhoaHoc: varchar("MaKhoaHoc", { length: 50 }),
    hangDaoTao: varchar("HangDaoTao", { length: 20 }),
    
    // Ảnh
    photoUrl: varchar("photoUrl", { length: 500 }),
    
    // Metadata sync
    sourceUpdatedAt: datetime("sourceUpdatedAt"),
    syncedAt: timestamp("syncedAt").defaultNow().notNull(),
  },
  (table) => ({
    maDKUnique: uniqueIndex("student_lookup_cache_MaDK_unique").on(table.maDK),
    soCMTIdx: index("student_lookup_cache_SoCMT_idx").on(table.soCMT),
    loaiDaoTaoIdx: index("student_lookup_cache_LoaiDaoTao_idx").on(table.loaiDaoTao),
    sourceUpdatedAtIdx: index("student_lookup_cache_sourceUpdatedAt_idx").on(table.sourceUpdatedAt),
    checkpointIdx: index("student_lookup_cache_checkpoint_idx").on(
      table.sourceUpdatedAt, 
      table.maDK
    ),
  })
);
```


### Bảng `sync_log` (optional)

```typescript
export const syncLog = mysqlTable("sync_log", {
  id: int("id").autoincrement().primaryKey(),
  batchNumber: int("batchNumber"),
  recordsProcessed: int("recordsProcessed"),
  recordsSuccess: int("recordsSuccess"),
  recordsFailed: int("recordsFailed"),
  imageErrors: int("imageErrors"),
  startedAt: datetime("startedAt"),
  completedAt: datetime("completedAt"),
  status: mysqlEnum("status", ["running", "success", "failed", "partial"]),
  errorMessage: text("errorMessage"),
  checkpointMaDK: varchar("checkpointMaDK", { length: 50 }),
  checkpointSourceUpdatedAt: datetime("checkpointSourceUpdatedAt"),
});
```

### Ghi chú về derived fields

**KHÔNG lưu trong DB:**
- `SoCMTMasked` - Backend service tính khi trả response
- `NgaySinhDisplay` - Backend service tính khi trả response

**Lý do:** Tránh lệch dữ liệu. Backend luôn tính từ giá trị gốc khi cần.

---

## Thiết kế API với tRPC

### Nguyên tắc

- **API JSON dùng tRPC** để có end-to-end type safety
- **Không thiết kế lookup bằng REST** nếu đã chọn tRPC
- **Zod schemas** đặt trong `shared/schemas.ts` hoặc `server/src/schema/`
- **Ngoại lệ duy nhất:** Upload ảnh dùng REST (multipart/form-data)

### tRPC Routers

#### 1. lookupRouter

```typescript
// server/src/trpc/routers/lookup.ts
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

// Input schema
const searchStudentInput = z.object({
  soCMT: z.string().trim().min(9).max(12).regex(/^\d+$/, "CCCD chỉ chứa số"),
  loaiDaoTao: z.enum(["moto", "oto"]),
});

// Output type - CHỈ public fields
interface StudentLookupPublic {
  hoVaTen: string;
  soCMTMasked: string;      // ********6377
  ngaySinh: string;         // dd/mm/yyyy
  gioiTinh: string;
  diaChi: string | null;
  tenKhoaHoc: string | null;
  hang: string | null;
  photoUrl: string | null;
}

export const lookupRouter = router({
  searchStudent: publicProcedure
    .input(searchStudentInput)
    .query(async ({ input }): Promise<StudentLookupPublic[]> => {
      // Query DB, transform, return public fields only
      // KHÔNG trả: SoCMT gốc, MaDK, MaKhoaHoc, HangDaoTao, LoaiDaoTao, 
      //            sourceUpdatedAt, syncedAt
    }),
});
```

**KHÔNG trả về:**
- SoCMT gốc
- MaDK
- MaKhoaHoc
- HangDaoTao
- LoaiDaoTao
- sourceUpdatedAt
- syncedAt
- DuongDanAnh
- IMAGE_BASE_PATH


#### 2. syncRouter

```typescript
// server/src/trpc/routers/sync.ts
import { z } from "zod";
import { protectedSyncProcedure, router } from "../trpc";

const BATCH_SIZE = 200;

const syncStudentRecordSchema = z.object({
  MaDK: z.string().min(1),
  HoVaTen: z.string().min(1),
  SoCMT: z.string().min(9).max(12),
  NgaySinh: z.string().regex(/^\d{8}$/).nullable(),  // yyyyMMdd
  GioiTinh: z.string().nullable(),
  DiaChi: z.string().nullable(),
  TenKhoaHoc: z.string().nullable(),
  Hang: z.string().nullable(),
  MaKhoaHoc: z.string().nullable(),
  HangDaoTao: z.string().nullable(),
  photoUrl: z.string().nullable(),
  sourceUpdatedAt: z.string().datetime().nullable(),
});

const pushBatchInput = z.object({
  records: z.array(syncStudentRecordSchema).min(1).max(BATCH_SIZE),
});

export const syncRouter = router({
  pushBatch: protectedSyncProcedure
    .input(pushBatchInput)
    .mutation(async ({ input }) => {
      // 1. Validate toàn bộ batch
      // 2. Nếu critical error → reject, không upsert
      // 3. Upsert trong transaction
      // 4. Tự tính LoaiDaoTao từ HangDaoTao (A* → moto, còn lại → oto)
      // 5. Return success/failure
    }),
});
```

**Response success:**
```json
{
  "success": true,
  "processed": 100,
  "upserted": 100
}
```

**Response validation error:**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    { "MaDK": "DK099", "error": "Missing required field" }
  ]
}
```

#### 3. contentRouter (Định hướng giai đoạn sau)

```typescript
// Dành cho nội dung public: thông báo, pháp lý, tuyển sinh
// Chưa triển khai giai đoạn 1 nếu chưa có CMS/Admin
export const contentRouter = router({
  // getAnnouncements
  // getLegalDocuments
  // getEnrollmentInfo
});
```

### tRPC Context & Middleware

```typescript
// server/src/trpc/context.ts
import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
  const syncSecret = req.headers["x-sync-secret"];
  return { req, res, syncSecret };
};

export type Context = inferAsyncReturnType<typeof createContext>;

// server/src/trpc/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { timingSafeEqual } from "crypto";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Protected procedure cho sync - kiểm tra X-SYNC-SECRET
export const protectedSyncProcedure = t.procedure.use(async ({ ctx, next }) => {
  const expected = process.env.SYNC_SECRET;
  const received = ctx.syncSecret;
  
  if (!expected || !received) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  
  // Timing-safe compare
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(String(received));
  
  if (expectedBuf.length !== receivedBuf.length || 
      !timingSafeEqual(expectedBuf, receivedBuf)) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  
  return next();
});
```


### Atomic Transaction cho Batch Data

**Thiết kế batch data phải atomic để tránh checkpoint sai.**

```typescript
// server/src/services/syncService.ts
async function upsertBatch(records: SyncStudentRecord[]) {
  // 1. Validate toàn bộ batch trước
  const validationErrors = validateBatch(records);
  if (validationErrors.length > 0) {
    return { success: false, error: "Validation failed", errors: validationErrors };
  }
  
  // 2. Upsert trong transaction
  try {
    await db.transaction(async (tx) => {
      for (const record of records) {
        await tx
          .insert(studentLookupCache)
          .values(transformRecord(record))
          .onDuplicateKeyUpdate({
            set: transformRecord(record),
          });
      }
    });
    
    return { success: true, processed: records.length, upserted: records.length };
  } catch (error) {
    // Rollback tự động
    return { success: false, error: "Database error" };
  }
}
```

**Quy tắc:**
- Server validate toàn bộ batch trước
- Nếu critical error → reject, không upsert record nào
- Nếu batch hợp lệ → upsert toàn bộ trong transaction
- Transaction lỗi → rollback, trả success: false
- Sync-tool chỉ checkpoint khi nhận success: true
- Lỗi ảnh không làm fail data batch (đã log riêng trước đó)

---

## API Upload ảnh học viên (REST)

### Lý do dùng REST

- tRPC phù hợp API JSON
- Upload ảnh multipart/form-data nên dùng Express route riêng
- Không giả định sync-tool và web server cùng filesystem
- Production có thể sync từ máy Trung tâm lên server/VPS

### Endpoint

```
POST /api/sync/student-photo
```

### Request

**Headers:**
```
X-SYNC-SECRET: {secret}
Content-Type: multipart/form-data
```

**Form data:**
- `MaKhoaHoc`: string
- `MaDK`: string
- `photo`: file (image/jpeg, đã tối ưu)

### Response

```json
{
  "success": true,
  "photoUrl": "/uploads/students/K45/DK001.jpg"
}
```

### Security

```typescript
// server/src/routes/syncPhoto.ts
import multer from "multer";
import path from "path";

// Sanitize để chống path traversal
function sanitizePath(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "");
}

const upload = multer({
  limits: {
    fileSize: parseInt(process.env.MAX_PHOTO_SIZE || "204800"), // 200KB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "image/jpeg") {
      cb(new Error("Only JPEG allowed"));
      return;
    }
    cb(null, true);
  },
});

router.post("/api/sync/student-photo", 
  verifySyncSecret,
  upload.single("photo"),
  async (req, res) => {
    const { MaKhoaHoc, MaDK } = req.body;
    
    // Sanitize
    const safeMaKhoaHoc = sanitizePath(MaKhoaHoc);
    const safeMaDK = sanitizePath(MaDK);
    
    // Lưu file
    const dir = path.join(uploadsDir, safeMaKhoaHoc);
    const filePath = path.join(dir, `${safeMaDK}.jpg`);
    
    // Không ghi ra ngoài uploads
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(400).json({ success: false, error: "Invalid path" });
    }
    
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, req.file.buffer);
    
    // Không trả path vật lý
    res.json({ 
      success: true, 
      photoUrl: `/uploads/students/${safeMaKhoaHoc}/${safeMaDK}.jpg` 
    });
  }
);
```

### Photo Upload Strategy

**Giai đoạn 1:**
- Sync-tool convert/tối ưu từng ảnh JP2 -> JPG local
- Upload từng JPG qua `POST /api/sync/student-photo`
- Dùng concurrency có giới hạn để không tạo quá nhiều request cùng lúc
- Cách này đơn giản, dễ debug, dễ retry từng ảnh

**Giai đoạn tối ưu sau:**
- Nếu batch 100-200 ảnh gây quá nhiều HTTP requests hoặc sync chậm, có thể thêm endpoint upload ZIP theo batch
- Vì mỗi JPG đã tối ưu khoảng 25-30KB, ZIP không giảm dung lượng nhiều, nhưng giảm overhead số lượng request
- Với 200 ảnh x 30KB, payload ảnh khoảng 6MB trước overhead; cần cấu hình giới hạn hợp lý
- Đây là nâng cấp có kiểm soát, không bắt buộc triển khai ngay giai đoạn 1

### Endpoint đề xuất cho batch ZIP

```
POST /api/sync/student-photo-batch
```

**Auth:**
- Bắt buộc `X-SYNC-SECRET`
- Production bắt buộc HTTPS

**Request:**
- `multipart/form-data`
- `manifest`: JSON mô tả danh sách ảnh
- `photosZip`: file `.zip` chứa các ảnh JPG đã tối ưu

**Manifest ví dụ:**
```json
{
  "batchId": "20260521-001",
  "photos": [
    {
      "MaKhoaHoc": "K45",
      "MaDK": "DK001",
      "filename": "K45_DK001.jpg"
    }
  ]
}
```

**Quy tắc xử lý batch ZIP:**
- Server chỉ giải nén trong thư mục tạm được kiểm soát
- Reject file không phải `.jpg`/`image/jpeg`
- Reject filename có path traversal, ký tự lạ hoặc không khớp manifest
- Giới hạn tổng kích thước ZIP và số lượng ảnh mỗi batch
- Ghi file cuối cùng vào `public/uploads/students/{MaKhoaHoc}/{MaDK}.jpg` sau khi validate xong
- Lỗi từng ảnh phải trả về chi tiết theo `MaDK` để sync-tool retry được ảnh lỗi
- Không trả path vật lý của server
- Không log `X-SYNC-SECRET`

---

## Thiết kế Sync Tool

### Luồng xử lý Production

```
┌─────────────────┐
│  SQL Server     │
│  (Trung tâm)    │
└────────┬────────┘
         │ 1. Query batch theo checkpoint
         ▼
┌─────────────────────────────────────────────────┐
│  Sync Tool (Local)                              │
│  ┌────────────────────────────────────────────┐ │
│  │ 2. Với từng record trong batch:            │ │
│  │    - Resolve ảnh (DuongDanAnh/fallback)    │ │
│  │    - Convert JP2 → JPG (p-limit concurrency)│ │
│  │    - Upload JPG → POST /api/sync/student-photo │
│  │    - Nhận photoUrl hoặc log image error    │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │ 3. Gọi tRPC sync.pushBatch với data        │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │ 4. Nếu success → cập nhật checkpoint       │ │
│  │    Nếu fail → giữ checkpoint cũ, retry     │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Server API     │
│  (MySQL)        │
└─────────────────┘
```

### Cấu hình

```env
# sync-tool/.env
SQLSERVER_HOST=192.168.x.x
SQLSERVER_PORT=1433
SQLSERVER_USER=readonly_user
SQLSERVER_PASSWORD=xxx
SQLSERVER_DATABASE=TTDTLX

API_URL=http://localhost:3000
SYNC_SECRET=xxx

IMAGE_BASE_PATH=\\server\share\images

BATCH_SIZE=100
MAX_RETRIES=3

# Image Processing
IMAGE_ENGINE=magick
IMAGE_CONCURRENCY=5
```

**Production trong `sync-tool/.env.example`:**
```env
API_URL=https://thanhcongdaklak.edu.vn
```

Ghi chú: production must use HTTPS. Local development được phép dùng `http://localhost:3000`.

### Checkpoint & Recovery

**File `last-sync.json`:**
```json
{
  "lastSuccessfulBatch": 15,
  "lastMaDK": "DK1500",
  "lastSourceUpdatedAt": "2024-01-15T10:30:00Z",
  "totalProcessed": 1500,
  "lastRunAt": "2024-01-15T11:00:00Z"
}
```

### SourceUpdatedAt là Alias Computed

**Quan trọng:** `SourceUpdatedAt` là alias do sync query tính từ các cột `NgaySua`/updated fields của bảng nguồn. Không giả định SQL Server có cột thật tên `sourceUpdatedAt`.

**Query tiếp an toàn khi nhiều record có cùng sourceUpdatedAt:**

```sql
-- Dùng CTE nếu SQL Server không cho dùng alias trong WHERE
WITH StudentData AS (
  SELECT 
    n.MaDK,
    n.HoVaTen,
    n.SoCMT,
    -- ... other fields
    COALESCE(n.NgaySua, n.NgayTao) AS SourceUpdatedAt
  FROM dbo.NguoiLX n
  JOIN dbo.NguoiLX_HoSo h ON n.MaDK = h.MaDK
)
SELECT * FROM StudentData
WHERE 
  SourceUpdatedAt > @lastSourceUpdatedAt
  OR (SourceUpdatedAt = @lastSourceUpdatedAt AND MaDK > @lastMaDK)
ORDER BY SourceUpdatedAt ASC, MaDK ASC
```

**Quy tắc checkpoint:**
1. Chỉ cập nhật checkpoint **SAU KHI** batch thành công
2. Nếu batch lỗi → giữ checkpoint cũ, log lỗi, retry theo giới hạn
3. Không đoán schema SQL Server - nếu thiếu cột, hỏi lại


### Xử lý ảnh với Concurrency có giới hạn

Convert JP2 → JPG là CPU-bound. Không chạy đồng thời không giới hạn.

```typescript
// sync-tool/src/sync.ts
import pLimit from "p-limit";

const IMAGE_CONCURRENCY = parseInt(process.env.IMAGE_CONCURRENCY || "5");
const limit = pLimit(IMAGE_CONCURRENCY);

async function processBatch(records: SqlServerRecord[]) {
  // Xử lý ảnh concurrent có giới hạn
  const imageResults = await Promise.all(
    records.map((record) =>
      limit(async () => {
        try {
          const photoUrl = await processAndUploadImage(record);
          return { MaDK: record.MaDK, photoUrl, error: null };
        } catch (error) {
          // Log image error riêng
          logImageError(record.MaDK, error);
          return { MaDK: record.MaDK, photoUrl: null, error };
        }
      })
    )
  );
  
  // Merge photoUrl vào records
  const dataRecords = records.map((record, i) => ({
    ...transformRecord(record),
    photoUrl: imageResults[i].photoUrl,
  }));
  
  // Gọi tRPC sync.pushBatch
  const result = await apiClient.sync.pushBatch.mutate({ records: dataRecords });
  
  if (result.success) {
    // Cập nhật checkpoint
    await saveCheckpoint(records[records.length - 1]);
  }
  
  return result;
}
```

**Quy tắc:**
- Concurrency mặc định: 5
- Cấu hình qua env: `IMAGE_CONCURRENCY=5`
- Không chạy đồng thời toàn bộ 100-200 ảnh
- Lỗi ảnh log riêng, không fail batch data

---

## Image Processing Adapter

### Thiết kế Adapter Pattern

```
┌─────────────────────────────────────────┐
│         Image Processing Adapter        │
├─────────────────────────────────────────┤
│  interface ImageProcessor {             │
│    convertJp2ToJpg(input, output): bool │
│    optimizeJpg(input, quality): bool    │
│    isAvailable(): bool                  │
│  }                                      │
└─────────────────────────────────────────┘
           │
           ├── MagickAdapter (ImageMagick CLI) ← Ưu tiên cho JP2→JPG
           ├── SharpAdapter (Sharp library)    ← Tùy chọn cho tối ưu JPG
           └── FallbackAdapter                 ← Fallback nếu engine lỗi
```

### Thứ tự ưu tiên

| Bước | Engine | Mục đích | Ghi chú |
|------|--------|----------|---------|
| 1 | **ImageMagick/magick CLI** | Convert JP2 → JPG | Ưu tiên trên Windows, đã test thành công |
| 2 | Sharp (optional) | Tối ưu JPG sau convert | Chỉ dùng nếu cần |
| 3 | Fallback | Xử lý khi engine lỗi | Log warning, thử engine khác |

### Luồng xử lý ảnh

```
1. Resolve path: DuongDanAnh hoặc fallback IMAGE_BASE_PATH\{MaKhoaHoc}\{MaDK}.jp2
2. Kiểm tra file tồn tại
3. Convert JP2 → JPG:
   - Ưu tiên: magick convert input.jp2 output.jpg
   - Fallback: Sharp nếu magick lỗi
4. Adaptive quality: 88 → 85 → 82 → 78
   - Target: 25-30KB
   - Max: 40KB
   - Nếu sau quality 78 vẫn >40KB → giữ bản rõ mặt nhất, log warning
5. Upload JPG qua POST /api/sync/student-photo
6. Nhận photoUrl
7. Nếu lỗi → log riêng, photoUrl = null
```

### Quy tắc bắt buộc

**KHÔNG được làm:**
- Crop ảnh
- Cắt mặt
- Thay đổi tỷ lệ (aspect ratio)
- Gửi ảnh học viên lên dịch vụ nén online bên thứ ba


---

## Validation & Normalization Layer

### Frontend Validation

```typescript
// client/src/lib/validation.ts
const cccdSchema = z.string()
  .trim()
  .min(9, "CCCD phải có ít nhất 9 số")
  .max(12, "CCCD không quá 12 số")
  .regex(/^\d+$/, "CCCD chỉ chứa số");

const loaiDaoTaoSchema = z.enum(["moto", "oto"]);
```

**Yêu cầu:**
- CCCD input chỉ nhận số
- Trim whitespace
- Độ dài 9-12 ký tự
- Hiển thị lỗi thân thiện tiếng Việt

### Backend/tRPC Validation

```typescript
// server/src/schema/lookup.ts
export const searchStudentInput = z.object({
  soCMT: z.string()
    .trim()
    .min(9)
    .max(12)
    .regex(/^\d+$/),
  loaiDaoTao: z.enum(["moto", "oto"]),
});
```

**Quy tắc:**
- Validate bằng Zod
- Không log raw SoCMT
- Trả error message thân thiện
- Chỉ trả public fields

### Sync Input Validation

```typescript
// server/src/schema/sync.ts
export const syncStudentRecordSchema = z.object({
  MaDK: z.string().min(1, "MaDK bắt buộc"),
  SoCMT: z.string().min(9).max(12, "SoCMT bắt buộc"),
  NgaySinh: z.string().regex(/^\d{8}$/).nullable(), // yyyyMMdd
  // ... other fields
});
```

**Quy tắc:**
- MaDK bắt buộc
- SoCMT bắt buộc
- NgaySinh nếu có phải yyyyMMdd
- Reject batch nếu critical data invalid
- Không upsert batch nếu validation critical fail

---

## Utility Functions & Services

### Server Services

```typescript
// server/src/services/studentLookupService.ts

/**
 * Mask SoCMT: chỉ hiện 4 số cuối
 * Input: "012345678901" → Output: "********8901"
 */
export function maskSoCMT(soCMT: string): string {
  if (!soCMT || soCMT.length < 4) return "****";
  const last4 = soCMT.slice(-4);
  const masked = "*".repeat(soCMT.length - 4);
  return masked + last4;
}

/**
 * Format NgaySinh: yyyyMMdd → dd/mm/yyyy
 * KHÔNG dùng new Date() để tránh timezone issues
 */
export function formatNgaySinh(raw: string | null): string {
  if (!raw || raw.length !== 8) return "";
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  return `${day}/${month}/${year}`;
}

/**
 * Format GioiTinh
 */
export function formatGender(value: string | null): string {
  if (!value) return "";
  const v = value.toLowerCase().trim();
  if (v === "1" || v === "nam" || v === "male") return "Nam";
  if (v === "2" || v === "nữ" || v === "nu" || v === "female") return "Nữ";
  return value;
}

/**
 * Build public response - không trả field nội bộ
 */
export function buildPublicStudentResponse(record: StudentLookupCache): StudentLookupPublic {
  return {
    hoVaTen: record.hoVaTen,
    soCMTMasked: maskSoCMT(record.soCMT),
    ngaySinh: formatNgaySinh(record.ngaySinh),
    gioiTinh: record.gioiTinh || "",
    diaChi: record.diaChi,
    tenKhoaHoc: record.tenKhoaHoc,
    hang: record.hang,
    photoUrl: record.photoUrl,
    // KHÔNG trả: soCMT, maDK, maKhoaHoc, hangDaoTao, loaiDaoTao, sourceUpdatedAt, syncedAt
  };
}
```


### Sync Tool Utilities

```typescript
// sync-tool/src/sqlReader.ts

export function normalizeNgaySinh(value: any): string | null {
  if (!value) return null;
  // Giữ format yyyyMMdd
  const str = String(value).replace(/\D/g, "");
  return str.length === 8 ? str : null;
}

export function normalizeGender(value: any): string {
  if (!value) return "";
  const v = String(value).toLowerCase().trim();
  if (v === "1" || v === "nam") return "Nam";
  if (v === "2" || v === "nữ" || v === "nu") return "Nữ";
  return String(value);
}

export function mapLoaiDaoTao(hangDaoTao: string | null): "moto" | "oto" {
  if (!hangDaoTao) return "oto";
  return hangDaoTao.toUpperCase().startsWith("A") ? "moto" : "oto";
}

// sync-tool/src/image-adapter.ts

export function resolveImagePath(record: SqlServerRecord): string | null {
  // Ưu tiên DuongDanAnh
  if (record.DuongDanAnh && fs.existsSync(record.DuongDanAnh)) {
    return record.DuongDanAnh;
  }
  // Fallback
  const fallback = path.join(
    process.env.IMAGE_BASE_PATH || "",
    record.MaKhoaHoc || "",
    `${record.MaDK}.jp2`
  );
  return fs.existsSync(fallback) ? fallback : null;
}

export async function convertAndOptimizeStudentPhoto(
  inputPath: string,
  outputPath: string
): Promise<void> {
  // 1. Convert JP2 → JPG với ImageMagick
  // 2. Adaptive quality loop
  // 3. Target 25-30KB, max 40KB
}

export function getFileSizeKB(filePath: string): number {
  const stats = fs.statSync(filePath);
  return stats.size / 1024;
}

// sync-tool/src/apiClient.ts

export async function uploadStudentPhoto(
  maKhoaHoc: string,
  maDK: string,
  photoBuffer: Buffer
): Promise<string> {
  // POST /api/sync/student-photo
  // Return photoUrl
}

// sync-tool/src/syncState.ts

export function getCheckpoint(): Checkpoint | null {
  // Read last-sync.json
}

export function saveCheckpoint(checkpoint: Checkpoint): void {
  // Write last-sync.json
  // CHỈ gọi sau khi batch thành công
}
```

---

## Thiết kế Frontend

### Pages

| Route | Component | Mô tả |
|-------|-----------|-------|
| `/` | `HomePage` | Trang chủ với banner, giới thiệu, thông báo |
| `/tra-cuu` | `LookupPage` | Tra cứu học viên |
| `/thong-bao` | `AnnouncementsPage` | Danh sách thông báo |
| `/thong-bao/:id` | `AnnouncementDetailPage` | Chi tiết thông báo |
| `/phap-ly` | `LegalPage` | Văn bản pháp lý |
| `/tuyen-sinh` | `EnrollmentPage` | Thông tin tuyển sinh |

### Components

```
components/
├── layout/
│   ├── Header.tsx          # Logo, menu navigation
│   ├── Footer.tsx          # Thông tin liên hệ (hotline/Zalo chỉ ở đây)
│   └── Layout.tsx
├── home/
│   ├── HeroBanner.tsx      # KHÔNG có hotline/Zalo
│   ├── IntroSection.tsx
│   ├── TrainingTypes.tsx
│   └── LatestNews.tsx
├── lookup/
│   ├── LookupForm.tsx
│   ├── LookupResults.tsx
│   └── StudentCard.tsx     # Ảnh 3x4 với aspect-ratio
└── common/
    ├── Button.tsx
    ├── Card.tsx
    ├── Input.tsx
    └── Loading.tsx
```

### Yêu cầu UI/CSS

**Giữ nguyên từ bản tham chiếu:**
- Màu sắc, font, layout, spacing
- Card style, button style
- Header/Menu, Banner
- Trang tra cứu

**Aspect Ratio cho ảnh:**

| Loại ảnh | CSS |
|----------|-----|
| Logo tròn | `object-fit: contain`, giữ tròn |
| Mascot, ảnh xe | `object-fit: contain` |
| **Ảnh học viên 3x4** | `aspect-ratio: 3 / 4` + `object-fit: contain` |

```css
.student-photo-container {
  aspect-ratio: 3 / 4;
  width: 150px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.student-photo {
  width: 100%;
  height: 100%;
  object-fit: contain; /* KHÔNG dùng cover */
}
```

**KHÔNG được làm:**
- Không dùng `object-fit: cover` cho ảnh học viên
- Không crop, cắt mặt, kéo giãn ảnh
- Không đưa hotline/Zalo lên đầu trang
- Không đẩy tuyển sinh lên đầu menu


---

## Security Hardening

### Rate Limit cho Lookup (Giai đoạn 1)

**Bắt buộc có rate limit cơ bản ngay từ đầu** vì lookup bằng CCCD là điểm nhạy cảm.

```typescript
// server/src/middleware/rateLimit.ts
import rateLimit from "express-rate-limit";

export const lookupRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 phút
  max: 10, // Tối đa 10 requests / IP / phút
  message: {
    success: false,
    error: "Bạn đã tra cứu quá nhiều lần. Vui lòng thử lại sau 1 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Không log raw SoCMT khi bị rate limit
});

// Áp dụng cho tRPC lookup route
app.use("/api/trpc/lookup.searchStudent", lookupRateLimit);
```

**Ghi chú:**
- Memory store chỉ phù hợp single-server
- Production nhiều instance cần Redis (giai đoạn sau)
- Rate limit nâng cao, lockout, captcha, yêu cầu ngày sinh → giai đoạn sau

### Express/tRPC Security

```typescript
// server/src/index.ts
import helmet from "helmet";

// Security headers
app.use(helmet());

// JSON body limit
app.use(express.json({ limit: "1mb" }));

// CORS - chỉ mở theo cấu hình
app.use(cors({
  origin: process.env.CORS_ORIGIN || false,
}));

// Không expose stack trace ở production
if (process.env.NODE_ENV === "production") {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal server error" });
  });
}
```

### HTTPS/TLS cho Sync API

Các API sync dùng `X-SYNC-SECRET` để xác thực. Trong môi trường production, mọi request từ sync-tool đến server bắt buộc phải đi qua HTTPS/TLS.

**Lý do:**
- Sync-tool có thể chạy tại máy local của Trung tâm
- Server production có thể chạy trên VPS
- Nếu dùng HTTP thường qua internet, `X-SYNC-SECRET` có thể bị lộ qua packet sniffing hoặc proxy không an toàn
- HTTPS bảo vệ secret, payload học viên, metadata và photo upload trên đường truyền

**Quy tắc production:**
- `API_URL` trong `sync-tool/.env` production phải bắt đầu bằng `https://`
- Sync-tool phải cảnh báo hoặc từ chối chạy production nếu `API_URL` là `http://` và không phải `localhost`/`127.0.0.1`
- Các endpoint sau bắt buộc HTTPS ở production:
  - tRPC `sync.pushBatch`
  - REST `POST /api/sync/student-photo`
  - REST batch photo upload nếu có sau này
- Nginx hoặc reverse proxy phải cấu hình SSL/TLS
- HTTP nên redirect sang HTTPS
- Có thể bật HSTS sau khi domain và SSL ổn định
- Không log `X-SYNC-SECRET`
- Có kế hoạch rotate `SYNC_SECRET` nếu nghi ngờ bị lộ

**Ngoại lệ development:**
- Local development được phép dùng `http://localhost:3000`
- Staging nội bộ có thể dùng HTTP chỉ khi nằm hoàn toàn trong mạng local an toàn, nhưng production public bắt buộc HTTPS

### API Security Summary

| Endpoint | Auth | Rate Limit | Transport |
|----------|------|------------|-----------|
| `lookup.searchStudent` | None (public) | **10 req/IP/phút** | HTTPS production |
| `sync.pushBatch` | `X-SYNC-SECRET` | None | **HTTPS bắt buộc production** |
| `POST /api/sync/student-photo` | `X-SYNC-SECRET` | None | **HTTPS bắt buộc production** |
| `POST /api/sync/student-photo-batch` (nếu thêm sau) | `X-SYNC-SECRET` | None | **HTTPS bắt buộc production** |

### Data Security

1. **SoCMT/CCCD:**
   - Lưu gốc trong DB để query
   - API public chỉ trả `soCMTMasked` (tính runtime)
   - Không log SoCMT gốc

2. **Sync Secret:**
   - Timing-safe compare
   - Không log secret
   - Có kế hoạch rotate `SYNC_SECRET` nếu nghi ngờ bị lộ

3. **File Upload:**
   - Sanitize path chống traversal
   - Chỉ cho phép image/jpeg
   - Giới hạn file size (200KB default)
   - Không trả path vật lý

4. **Không expose:**
   - Connection string
   - Stack trace (production)
   - Internal fields (MaDK, MaKhoaHoc, etc.)

---

## Testing Strategy

### Frontend Tests

```typescript
// Render smoke test
// Lookup page: loading, empty, success, error states
// UI không méo ảnh: kiểm tra aspect-ratio/object-fit
// Tuyển sinh không xuất hiện đầu trang
// Hotline/Zalo không hiện ở hero/top page
```

### Backend/tRPC Tests

```typescript
// maskSoCMT chỉ trả 4 số cuối
test("maskSoCMT", () => {
  expect(maskSoCMT("012345678901")).toBe("********8901");
  expect(maskSoCMT("123456789")).toBe("*****6789");
});

// formatNgaySinh yyyyMMdd → dd/mm/yyyy
test("formatNgaySinh", () => {
  expect(formatNgaySinh("19901231")).toBe("31/12/1990");
  expect(formatNgaySinh(null)).toBe("");
});

// lookup.searchStudent không trả SoCMT gốc
// lookup.searchStudent validate input
// rate limit lookup hoạt động
// sync secret middleware reject request sai secret
// sync.pushBatch validation
// sync.pushBatch transaction/upsert theo MaDK
// sync-photo sanitize path
// sync-photo reject file sai type
// sync-photo reject file quá lớn
```

### Sync Tool Tests

```typescript
// normalizeNgaySinh
// mapLoaiDaoTao
// checkpoint update only after successful batch
// failed batch does not update checkpoint
// image adapter fallback
// adaptive quality target 25-30KB
// image concurrency limit hoạt động
// debug tool output đúng field và không log secret
```

### Commands bắt buộc

```bash
pnpm check
pnpm test
pnpm build
cd sync-tool && pnpm build && pnpm test
```


---

## Dev Scripts & Workspace

### pnpm Workspace

```yaml
# pnpm-workspace.yaml
packages:
  - "client"
  - "server"
  - "sync-tool"
  - "shared"
```

### Root Scripts

```json
// package.json (root)
{
  "scripts": {
    "dev": "concurrently \"pnpm --filter client dev\" \"pnpm --filter server dev\"",
    "build": "pnpm --filter client build && pnpm --filter server build",
    "check": "pnpm --filter \"*\" check",
    "test": "pnpm --filter \"*\" test",
    "lint": "pnpm --filter \"*\" lint"
  }
}
```

### Client Scripts

```json
// client/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "check": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint src"
  }
}
```

### Server Scripts

```json
// server/package.json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "check": "tsc --noEmit",
    "test": "vitest run",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Sync Tool Scripts

```json
// sync-tool/package.json
{
  "scripts": {
    "sync": "tsx src/sync.ts",
    "debug": "tsx src/debug.ts",
    "build": "tsc",
    "check": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

---

## .gitignore Design

```gitignore
# Environment
.env
.env.*
!.env.example

# Dependencies
node_modules/

# Build outputs
dist/
build/
.vite/

# Logs
*.log

# Runtime uploads (ảnh học viên)
public/uploads/students/

# Sync tool
sync-tool/.env
sync-tool/temp/
sync-tool/dist/
sync-tool/last-sync.json
sync-tool/node_modules/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo

# Test
coverage/
```

---

## Documentation

### Tài liệu cần tạo

| File | Mô tả |
|------|-------|
| `README.md` | Hướng dẫn chính thức cho Trung tâm |
| `PROJECT_CONTEXT.md` | Context kỹ thuật trung tính |
| `.env.example` | Mẫu env cho server |
| `sync-tool/.env.example` | Mẫu env cho sync-tool |

### README.md phải có

- Setup local
- Env example
- Run scripts (dev, build, test)
- Sync-tool usage
- Deploy overview
- Troubleshooting

**KHÔNG nhắc** công cụ/template cũ trong tài liệu public.

---

## Definition of Done

Mỗi task/code chỉ hoàn thành khi:

### Code Quality
- [ ] `pnpm check` pass
- [ ] `pnpm test` pass
- [ ] `pnpm build` pass
- [ ] `cd sync-tool && pnpm build && pnpm test` pass (nếu có)

### Security
- [ ] Không trả SoCMT gốc qua API public
- [ ] Rate limit lookup cơ bản hoạt động
- [ ] Sync secret được verify đúng cách
- [ ] Production sync API dùng HTTPS
- [ ] Không cấu hình sync production qua HTTP public

### Git
- [ ] Không có file cấm trong git status
- [ ] Không có ảnh học viên runtime trong git
- [ ] Không có .env trong git

### UI
- [ ] Không thay đổi UI ngoài phạm vi được xác nhận
- [ ] Không có hotline/Zalo OA ở phần đầu trang
- [ ] Không có ảnh bị méo do CSS sai tỷ lệ
- [ ] Ảnh học viên dùng `object-fit: contain`

### Business Logic
- [ ] Không tự ý thêm hạng A2, D, E, F
- [ ] SoCMT mask đúng (********XXXX)
- [ ] NgaySinh format đúng (dd/mm/yyyy)
- [ ] Checkpoint chỉ cập nhật sau batch thành công

---

## Debug Tool

```bash
pnpm run debug --cccd 012345678901
```

**Output:**
```
=== Debug CCCD: 012345678901 ===

Found 2 records:

Record 1:
  MaDK: DK001
  MaKhoaHoc: K45
  HangDaoTao: B1
  TenKhoaHoc: Khóa 45
  Hang: B1 số tự động
  LoaiDaoTao: oto
  NgaySinh (raw): 19900101
  NgaySinh (display): 01/01/1990
  GioiTinh (raw): 1
  GioiTinh (display): Nam
  DiaChi: Xã ABC, Huyện XYZ, Tỉnh Đắk Lắk
  DuongDanAnh: D:\Images\K45\DK001.jp2
  Fallback path: \\server\share\images\K45\DK001.jp2
  File exists: Yes
  photoUrl: /uploads/students/K45/DK001.jpg
```

**Quy tắc:**
- Chỉ chạy local trong sync-tool
- Không expose qua API public
- Không log secrets (password, connection string)

---

## Ghi chú thiết kế

### Những điều KHÔNG làm

1. Không tự ý thay đổi UI so với bản tham chiếu
2. Không đẩy tuyển sinh/hotline/Zalo lên đầu trang
3. Không crop ảnh học viên
4. Không gửi ảnh lên dịch vụ bên thứ ba
5. Không trả SoCMT gốc về frontend
6. Không commit .env, ảnh học viên, log
7. Không dùng `object-fit: cover` cho ảnh học viên
8. Không đưa ảnh học viên vào `client/src/assets/`
9. Không thay đổi màu, logo, biển tập lái của assets chính thức
10. Không tự ý thêm hạng A2, D, E, F

### Những điều CẦN hỏi trước khi làm

1. Thay đổi màu sắc, font, layout
2. Thay đổi thứ tự nội dung
3. Thay đổi business logic tra cứu
4. Thay đổi schema database
5. Deploy production
6. Chạy migration thật

---

**Tài liệu này là thiết kế kỹ thuật production-grade. Không tạo source code cho đến khi tasks.md được tạo và xác nhận.**
