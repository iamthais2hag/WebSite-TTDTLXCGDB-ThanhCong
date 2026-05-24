# Tasks - Website Trung tâm Đào tạo Lái xe Thành Công

Tài liệu này chia nhỏ công việc triển khai dựa trên `requirements.md` và `design.md`.

## Nguyên tắc bắt buộc

- Giai đoạn 1 dùng tRPC cho API JSON.
- REST chỉ dùng cho upload ảnh `multipart/form-data`.
- `lookup.searchStudent` phải có rate limit IP cơ bản ngay giai đoạn 1.
- Production sync bắt buộc HTTPS/TLS.
- Sync-tool production không được dùng HTTP public để gửi `X-SYNC-SECRET`.
- Upload ảnh giai đoạn 1 dùng `POST /api/sync/student-photo` từng ảnh với concurrency giới hạn.
- Batch ZIP upload chỉ là future task/optional, chưa triển khai giai đoạn 1.
- Không triển khai CMS/Admin hybrid nâng cao ở giai đoạn đầu.
- Không triển khai captcha/yêu cầu ngày sinh/khung giờ tra cứu ở giai đoạn đầu.
- Giữ UI gần như 100%; không tự ý đổi màu, font, layout, menu, banner.
- Không đưa hotline/Zalo OA lên đầu trang.
- Không trả SoCMT gốc qua API public.
- Không commit `.env`, ảnh học viên runtime, `node_modules`, `dist`, `build`.

---

## Phase 1 - Project Foundation

### Task 1. Scaffold workspace sạch

**Mục tiêu:** Tạo cấu trúc workspace theo `design.md` nhưng chỉ gồm các file/thư mục tối thiểu cần cho dự án khi bắt đầu triển khai code.

**Công việc:**
- Tạo cấu trúc `client/`, `server/`, `sync-tool/`, `shared/`, `public/uploads/students/` theo thiết kế.
- Không đưa ảnh học viên runtime vào source.
- Không tạo logic nghiệp vụ trong task scaffold.

**Tiêu chí hoàn thành:**
- Workspace có đúng các vùng trách nhiệm: frontend, backend, sync-tool, shared.
- `public/uploads/students/` tồn tại để server có thể serve ảnh runtime nhưng được gitignore ở task sau.
- Chưa có thay đổi UI hoặc business logic.

**Lệnh kiểm tra:**
```bash
test -d client && test -d server && test -d sync-tool && test -d shared
test -d public/uploads/students
git status --short
```

### Task 2. Cấu hình `.gitignore`

**Mục tiêu:** Chặn các file không được commit theo requirements và design.

**Công việc:**
- Thêm rule cho `.env`, `.env.*`, nhưng cho phép `.env.example`.
- Chặn `node_modules/`, `dist/`, `build/`, `.vite/`, `coverage/`, `*.tsbuildinfo`.
- Chặn `public/uploads/students/`, `sync-tool/.env`, `sync-tool/temp/`, `sync-tool/dist/`, `sync-tool/last-sync.json`, log files.

**Tiêu chí hoàn thành:**
- Git không track env thật, ảnh học viên runtime, build output, dependency, log.
- `.env.example` vẫn được phép commit.

**Lệnh kiểm tra:**
```bash
git check-ignore .env sync-tool/.env public/uploads/students/example.jpg node_modules/test dist/test build/test sync-tool/last-sync.json
git status --short
```

### Task 3. Tạo env example cho server và sync-tool

**Mục tiêu:** Cung cấp mẫu cấu hình không chứa secret thật.

**Công việc:**
- Tạo `.env.example` cho server với MySQL, `SYNC_SECRET`, `CORS_ORIGIN`, `UPLOADS_DIR`, `MAX_PHOTO_SIZE`.
- Tạo `sync-tool/.env.example` với SQL Server, `API_URL`, `SYNC_SECRET`, `IMAGE_BASE_PATH`, `BATCH_SIZE`, `MAX_RETRIES`, `IMAGE_ENGINE`, `IMAGE_CONCURRENCY`.
- Ghi rõ production `API_URL` phải dùng HTTPS, ví dụ `API_URL=https://thanhcongdaklak.edu.vn`.
- Cho phép local development dùng `http://localhost:3000`.

**Tiêu chí hoàn thành:**
- Không có secret thật trong env example.
- `sync-tool/.env.example` nêu rõ production must use HTTPS.
- Env example đủ để người vận hành biết cấu hình sync.

**Lệnh kiểm tra:**
```bash
test -f .env.example && test -f sync-tool/.env.example
grep -R "API_URL=https://thanhcongdaklak.edu.vn" sync-tool/.env.example
grep -R "production must use HTTPS" sync-tool/.env.example
git status --short
```

### Task 4. Tạo README và PROJECT_CONTEXT

**Mục tiêu:** Viết tài liệu vận hành trung tính, không nhắc công cụ/template cũ.

**Công việc:**
- `README.md` gồm setup local, env example, scripts, sync-tool usage, deploy overview, troubleshooting.
- `PROJECT_CONTEXT.md` mô tả mục tiêu, kiến trúc, business rules, dữ liệu nhạy cảm, giới hạn giai đoạn 1.
- Không nhắc công cụ tạo mã, template cũ, nền tảng cũ hoặc nội dung sinh tự động trong tài liệu public.

**Tiêu chí hoàn thành:**
- Tài liệu giúp người mới hiểu cách chạy và phạm vi dự án.
- Có nhắc rõ không commit `.env`, ảnh học viên runtime, build output.
- Không có nội dung trái với `requirements.md`.

**Lệnh kiểm tra:**
```bash
test -f README.md && test -f PROJECT_CONTEXT.md
grep -R "sync-tool" README.md PROJECT_CONTEXT.md
grep -R "Không commit" README.md PROJECT_CONTEXT.md
git status --short
```

---

## Phase 2 - Workspace Tooling

### Task 5. Cấu hình pnpm workspace

**Mục tiêu:** Thiết lập workspace theo `client`, `server`, `sync-tool`, `shared`.

**Công việc:**
- Tạo `pnpm-workspace.yaml`.
- Tạo root package scripts: `dev`, `build`, `check`, `test`, `lint`.
- Không thêm business logic trong task này.

**Tiêu chí hoàn thành:**
- `pnpm` nhận đúng 4 package workspace.
- Root scripts chỉ điều phối package con.

**Lệnh kiểm tra:**
```bash
pnpm -r list --depth -1
pnpm check
pnpm test
pnpm build
```

### Task 6. Cấu hình TypeScript dùng chung

**Mục tiêu:** Chuẩn hóa TypeScript strict cho toàn workspace.

**Công việc:**
- Tạo cấu hình TypeScript root/shared nếu cần.
- Cấu hình riêng cho client, server, sync-tool, shared.
- Bật strict mode và path/type phù hợp.

**Tiêu chí hoàn thành:**
- Tất cả package typecheck được.
- Không có `any` không cần thiết trong phần public contract.

**Lệnh kiểm tra:**
```bash
pnpm check
pnpm --filter client check
pnpm --filter server check
pnpm --filter sync-tool check
pnpm --filter shared check
```

### Task 7. Cấu hình Vite React frontend base

**Mục tiêu:** Tạo nền frontend React + TypeScript + Vite, chưa thay đổi UI ngoài phạm vi thiết kế.

**Công việc:**
- Cấu hình Vite, React, TypeScript.
- Chuẩn bị router/page shell cho các trang trong requirements.
- Chuẩn bị tRPC client nhưng chưa viết UI tra cứu hoàn chỉnh.

**Tiêu chí hoàn thành:**
- Frontend chạy dev/build được.
- Chưa tự ý đổi màu, font, layout, banner so với tham chiếu.

**Lệnh kiểm tra:**
```bash
pnpm --filter client check
pnpm --filter client build
pnpm --filter client test
```

### Task 8. Cấu hình Express + tRPC server base

**Mục tiêu:** Tạo backend Express dùng tRPC cho API JSON.

**Công việc:**
- Cấu hình Express server.
- Mount tRPC endpoint.
- Thêm helmet, JSON body limit, CORS theo env.
- Chuẩn bị route REST riêng cho file upload nhưng chưa triển khai upload logic ở task này.

**Tiêu chí hoàn thành:**
- Server build/typecheck được.
- API JSON đi qua tRPC, không tạo REST lookup.
- REST được giữ riêng cho upload ảnh multipart.

**Lệnh kiểm tra:**
```bash
pnpm --filter server check
pnpm --filter server build
pnpm --filter server test
```

---

## Phase 3 - Database Layer

### Task 9. Tạo Drizzle schema `student_lookup_cache`

**Mục tiêu:** Định nghĩa bảng cache học viên theo `design.md`.

**Công việc:**
- Tạo schema với `MaDK` unique.
- Lưu `SoCMT` gốc trong DB nhưng không expose qua public API.
- Thêm fields: `HoVaTen`, `NgaySinh`, `GioiTinh`, `DiaChi`, `TenKhoaHoc`, `Hang`, `LoaiDaoTao`, `MaKhoaHoc`, `HangDaoTao`, `photoUrl`, `sourceUpdatedAt`, `syncedAt`.
- Thêm index cho `SoCMT`, `LoaiDaoTao`, `sourceUpdatedAt`, checkpoint `(sourceUpdatedAt, MaDK)`.

**Tiêu chí hoàn thành:**
- Drizzle schema là source of truth.
- `MaDK` là unique key để upsert idempotent.
- Không lưu derived fields `SoCMTMasked` hoặc `NgaySinhDisplay`.

**Lệnh kiểm tra:**
```bash
pnpm --filter server check
pnpm --filter server test
pnpm --filter server build
```

### Task 10. Tạo schema `sync_log` optional

**Mục tiêu:** Chuẩn bị logging sync nếu triển khai theo design.

**Công việc:**
- Thêm bảng `sync_log` hoặc ghi chú rõ chưa bật nếu quyết định để sau.
- Các field cần có: batch number, processed/success/failed, image errors, started/completed, status, error, checkpoint.

**Tiêu chí hoàn thành:**
- Có quyết định rõ `sync_log` được triển khai ngay hay để optional.
- Nếu triển khai, schema build/typecheck pass.

**Lệnh kiểm tra:**
```bash
pnpm --filter server check
pnpm --filter server test
```

### Task 11. Cấu hình database connection và migration workflow

**Mục tiêu:** Kết nối MySQL qua Drizzle an toàn, không hardcode secret.

**Công việc:**
- Đọc database URL/config từ env.
- Cấu hình Drizzle Kit.
- Tài liệu hóa lệnh migration/push.
- Không chạy migration production nếu chưa được xác nhận.

**Tiêu chí hoàn thành:**
- Server import DB layer không lỗi.
- Không log connection string.
- Migration local có lệnh rõ ràng.

**Lệnh kiểm tra:**
```bash
pnpm --filter server check
pnpm --filter server build
pnpm --filter server test
```

---

## Phase 4 - tRPC Context, Router, Middleware

### Task 12. Tạo tRPC context và root router

**Mục tiêu:** Chuẩn hóa context cho request và routers.

**Công việc:**
- Tạo `createContext` lấy `req`, `res`, `x-sync-secret`.
- Tạo root router gồm `lookupRouter` và `syncRouter`.
- Không triển khai `contentRouter` ở giai đoạn 1 nếu chưa có CMS/Admin.

**Tiêu chí hoàn thành:**
- tRPC server expose đúng root router.
- Client/server type sharing hoạt động.
- Không có REST API JSON thay cho tRPC.

**Lệnh kiểm tra:**
```bash
pnpm --filter server check
pnpm --filter shared check
pnpm --filter client check
```

### Task 13. Tạo protected sync procedure

**Mục tiêu:** Bảo vệ sync APIs bằng `X-SYNC-SECRET`.

**Công việc:**
- Implement middleware timing-safe compare cho `X-SYNC-SECRET`.
- Reject request thiếu/sai secret.
- Không log secret.

**Tiêu chí hoàn thành:**
- `sync.pushBatch` chỉ chạy khi secret hợp lệ.
- Test thiếu/sai secret đều bị reject.
- Không có log chứa `X-SYNC-SECRET`.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
```

### Task 14. Tạo shared Zod schemas

**Mục tiêu:** Chuẩn hóa input/output contract.

**Công việc:**
- Schema lookup: `soCMT` trim, 9-12 số, `loaiDaoTao` là `moto`/`oto`.
- Schema sync record: `MaDK`, `SoCMT`, `NgaySinh`, `photoUrl`, `sourceUpdatedAt` và fields mapping.
- Không thêm field public bị cấm.

**Tiêu chí hoàn thành:**
- Validation dùng chung được cho server và tests.
- Invalid input bị reject trước business logic.
- Không có schema public trả SoCMT gốc.

**Lệnh kiểm tra:**
```bash
pnpm --filter shared check
pnpm --filter server test
```

---

## Phase 5 - Public Lookup API

### Task 15. Implement utility mask và format

**Mục tiêu:** Tạo service format dữ liệu public ở backend.

**Công việc:**
- `maskSoCMT`: chỉ hiện 4 số cuối.
- `formatNgaySinh`: `yyyyMMdd` -> `dd/mm/yyyy`, không dùng timezone-sensitive Date parsing.
- `formatGender`: chuẩn hóa `Nam`/`Nữ`.
- `buildPublicStudentResponse`: chỉ trả fields được phép.

**Tiêu chí hoàn thành:**
- `SoCMT` gốc không bao giờ nằm trong response public.
- `NgaySinh` hiển thị đúng format.
- Internal fields không xuất hiện trong public response.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
```

### Task 16. Implement `lookup.searchStudent`

**Mục tiêu:** Tra cứu học viên theo CCCD và loại đào tạo bằng tRPC.

**Công việc:**
- Query `student_lookup_cache` theo `SoCMT` và `LoaiDaoTao`.
- Trả nhiều hồ sơ nếu một CCCD có nhiều `MaDK`.
- Chỉ trả public fields: `hoVaTen`, `soCMTMasked`, `ngaySinh`, `gioiTinh`, `diaChi`, `tenKhoaHoc`, `hang`, `photoUrl`.
- Không trả `MaDK`, `MaKhoaHoc`, `HangDaoTao`, `LoaiDaoTao`, `sourceUpdatedAt`, `syncedAt`, `DuongDanAnh`, `IMAGE_BASE_PATH`.

**Tiêu chí hoàn thành:**
- API là tRPC query, không phải REST.
- Một SoCMT có nhiều hồ sơ trả về array.
- Không có SoCMT gốc trong JSON response.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
```

### Task 17. Thêm rate limit IP cơ bản cho lookup

**Mục tiêu:** Bảo vệ `lookup.searchStudent` ngay giai đoạn 1.

**Công việc:**
- Áp dụng rate limit cơ bản cho route tRPC lookup.
- Cấu hình mặc định 10 requests/IP/phút theo design.
- Không log raw SoCMT khi bị rate limit.
- Để Redis/captcha/ngày sinh/khung giờ tra cứu cho future tasks.

**Tiêu chí hoàn thành:**
- Gọi quá limit bị reject với message tiếng Việt thân thiện.
- Rate limit áp dụng đúng endpoint lookup.
- Không triển khai captcha, yêu cầu ngày sinh, khung giờ ở task này.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
```

---

## Phase 6 - REST Photo Upload

### Task 18. Serve static ảnh học viên runtime

**Mục tiêu:** Server phục vụ ảnh từ `public/uploads/students/` an toàn.

**Công việc:**
- Dùng `UPLOADS_DIR` env optional, fallback về `public/uploads/students`.
- Tạo thư mục upload nếu chưa có.
- Serve static qua `/uploads/students`.
- Không đưa ảnh học viên vào `client/src/assets`.

**Tiêu chí hoàn thành:**
- URL `/uploads/students/...` phục vụ file runtime.
- Đường dẫn vật lý không expose qua API.
- `public/uploads/students/` đã được gitignore.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test
pnpm --filter server check
git check-ignore public/uploads/students/example.jpg
```

### Task 19. Implement REST `POST /api/sync/student-photo`

**Mục tiêu:** Upload từng ảnh JPG đã tối ưu từ sync-tool.

**Công việc:**
- Tạo REST route riêng cho multipart/form-data.
- Bắt buộc `X-SYNC-SECRET`.
- Nhận `MaKhoaHoc`, `MaDK`, `photo`.
- Chỉ nhận `image/jpeg`, giới hạn size mặc định 200KB.
- Sanitize path, chống path traversal.
- Lưu vào `public/uploads/students/{MaKhoaHoc}/{MaDK}.jpg`.
- Trả `photoUrl` dạng `/uploads/students/{MaKhoaHoc}/{MaDK}.jpg`.

**Tiêu chí hoàn thành:**
- REST chỉ dùng cho upload ảnh multipart.
- Request thiếu/sai secret bị reject.
- File sai type/quá size/path traversal bị reject.
- Không trả path vật lý server.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
pnpm --filter server build
```

### Task 20. Không triển khai ZIP upload trong giai đoạn 1

**Mục tiêu:** Khóa phạm vi upload ảnh giai đoạn 1.

**Công việc:**
- Đảm bảo không có endpoint `POST /api/sync/student-photo-batch` trong code giai đoạn 1.
- Ghi nhận batch ZIP ở phần future tasks nếu cần tối ưu sau.

**Tiêu chí hoàn thành:**
- Chỉ có `POST /api/sync/student-photo` cho upload ảnh.
- Không có code xử lý ZIP batch trong server hoặc sync-tool.

**Lệnh kiểm tra:**
```bash
grep -R "student-photo-batch" server sync-tool && exit 1 || exit 0
pnpm --filter server test
```

---

## Phase 7 - Sync Batch API

### Task 21. Implement `sync.pushBatch` validation

**Mục tiêu:** Nhận batch dữ liệu học viên qua tRPC mutation.

**Công việc:**
- Input `{ records }` min 1 max 200.
- Validate toàn bộ batch trước khi ghi DB.
- Reject critical invalid data: thiếu `MaDK`, thiếu `SoCMT`, `NgaySinh` sai `yyyyMMdd`.
- Tự tính `LoaiDaoTao` từ `HangDaoTao`: bắt đầu `A` -> `moto`, còn lại -> `oto`.

**Tiêu chí hoàn thành:**
- Validation fail thì không upsert record nào.
- Response lỗi có chi tiết theo record khi phù hợp.
- API là tRPC mutation, không phải REST.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
```

### Task 22. Implement atomic transaction/upsert theo `MaDK`

**Mục tiêu:** Đồng bộ batch idempotent và an toàn checkpoint.

**Công việc:**
- Upsert theo unique key `MaDK`.
- Bọc batch data trong transaction.
- Nếu transaction lỗi, rollback toàn bộ batch và trả `success: false`.
- Lỗi ảnh không làm fail data batch nếu `photoUrl` null đã được sync-tool xử lý riêng.

**Tiêu chí hoàn thành:**
- Chạy lại cùng batch không tạo record trùng.
- Batch DB lỗi không ghi dở dang.
- Sync-tool chỉ được checkpoint khi response `success: true`.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
pnpm --filter server build
```

### Task 23. Thêm tests bảo mật sync API

**Mục tiêu:** Chứng minh sync API được bảo vệ đúng.

**Công việc:**
- Test thiếu `X-SYNC-SECRET`.
- Test sai `X-SYNC-SECRET`.
- Test đúng secret.
- Test không log secret.

**Tiêu chí hoàn thành:**
- Các endpoint sync không truy cập được nếu thiếu/sai secret.
- Test không chứa secret thật.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
```

---

## Phase 8 - Sync Tool Data Flow

### Task 24. Implement SQL Server reader

**Mục tiêu:** Đọc dữ liệu học viên từ SQL Server theo mapping trong requirements.

**Công việc:**
- Join `NguoiLX.MaDK = NguoiLX_HoSo.MaDK`.
- Join khóa học, hạng GPLX, địa chỉ DVHC theo design.
- Ưu tiên `DuongDanAnh` từ `NguoiLX_HoSo`.
- Tạo `SourceUpdatedAt` là alias computed từ cột updated/created phù hợp.
- Không giả định SQL Server có cột thật tên `sourceUpdatedAt`.

**Tiêu chí hoàn thành:**
- Query trả đủ fields cần sync.
- Mapping `LoaiDaoTao` chỉ dựa trên hạng đã xác nhận.
- Không tự ý thêm hạng A2, D, E, F.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test
pnpm --filter sync-tool check
```

### Task 25. Implement checkpoint state

**Mục tiêu:** Cho sync dừng/chạy tiếp an toàn.

**Công việc:**
- Đọc/ghi `sync-tool/last-sync.json`.
- Lưu `lastSuccessfulBatch`, `lastMaDK`, `lastSourceUpdatedAt`, `totalProcessed`, `lastRunAt`.
- Chỉ ghi checkpoint sau khi batch data thành công.
- Không commit `last-sync.json`.

**Tiêu chí hoàn thành:**
- Batch fail giữ checkpoint cũ.
- Batch success cập nhật checkpoint theo record cuối.
- `last-sync.json` được gitignore.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
git check-ignore sync-tool/last-sync.json
```

### Task 26. Implement sync-tool API client

**Mục tiêu:** Gọi đúng tRPC và REST APIs từ sync-tool.

**Công việc:**
- Gọi tRPC `sync.pushBatch` cho dữ liệu JSON.
- Gọi REST `POST /api/sync/student-photo` cho từng ảnh multipart.
- Gửi `X-SYNC-SECRET` nhưng không log secret.
- Không dùng REST cho lookup hoặc push batch JSON.

**Tiêu chí hoàn thành:**
- API client phân tách rõ tRPC JSON và REST upload ảnh.
- Response photo upload trả `photoUrl`.
- Test đảm bảo header secret không bị log.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
```

### Task 27. Implement main batch sync flow

**Mục tiêu:** Xử lý batch records theo đúng thứ tự an toàn.

**Công việc:**
- Đọc batch 100-200 records từ SQL Server theo checkpoint.
- Xử lý ảnh từng record, log lỗi ảnh riêng.
- Merge `photoUrl` vào records.
- Gọi `sync.pushBatch`.
- Chỉ save checkpoint khi `sync.pushBatch` trả `success: true`.
- Retry theo `MAX_RETRIES`.

**Tiêu chí hoàn thành:**
- Lỗi ảnh không fail toàn bộ batch data.
- Lỗi DB/API không cập nhật checkpoint.
- Chạy lại batch không tạo dữ liệu trùng.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
pnpm --filter sync-tool build
```

---

## Phase 9 - HTTPS/TLS Production Guard

### Task 28. Guard `API_URL` production trong sync-tool

**Mục tiêu:** Không cho sync-tool production gửi `X-SYNC-SECRET` qua HTTP public.

**Công việc:**
- Validate `API_URL` khi sync-tool khởi động.
- Production bắt buộc `https://`.
- Cho phép `http://localhost:3000` và `http://127.0.0.1:3000` cho local development.
- Nếu `API_URL` là `http://` public trong production, cảnh báo rõ và từ chối chạy.

**Tiêu chí hoàn thành:**
- `NODE_ENV=production` + HTTP public bị fail trước khi gửi request.
- HTTPS production chạy được.
- Localhost HTTP vẫn chạy được cho dev.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
```

### Task 29. Tài liệu hóa TLS production deployment

**Mục tiêu:** Ghi rõ yêu cầu SSL/TLS cho server production.

**Công việc:**
- README mô tả Nginx/reverse proxy cần SSL/TLS.
- HTTP nên redirect sang HTTPS.
- Có thể bật HSTS sau khi domain và SSL ổn định.
- Có kế hoạch rotate `SYNC_SECRET` nếu nghi ngờ bị lộ.

**Tiêu chí hoàn thành:**
- README không cho phép cấu hình sync production qua HTTP public.
- Env example production dùng `https://thanhcongdaklak.edu.vn`.

**Lệnh kiểm tra:**
```bash
grep -R "HTTPS" README.md sync-tool/.env.example
grep -R "thanhcongdaklak.edu.vn" sync-tool/.env.example
git status --short
```

---

## Phase 10 - Image Processing

### Task 30. Implement Image Processing Adapter base

**Mục tiêu:** Tạo adapter pattern cho xử lý JP2/JPG local.

**Công việc:**
- Interface xử lý ảnh gồm kiểm tra engine, convert JP2 -> JPG, optimize JPG.
- Ưu tiên ImageMagick `magick` CLI.
- Sharp là optional fallback nếu cần.
- Không gửi ảnh lên dịch vụ nén online bên thứ ba.

**Tiêu chí hoàn thành:**
- Adapter phát hiện engine khả dụng.
- Fallback có log warning, không crash không kiểm soát.
- Không crop, không đổi tỷ lệ ảnh.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test
pnpm --filter sync-tool check
```

### Task 31. Implement resolve image path

**Mục tiêu:** Tìm ảnh gốc đúng theo requirements.

**Công việc:**
- Ưu tiên `DuongDanAnh` nếu có và file tồn tại.
- Fallback `IMAGE_BASE_PATH/{MaKhoaHoc}/{MaDK}.jp2`.
- Log lỗi ảnh riêng nếu không tìm thấy file.
- Không expose `IMAGE_BASE_PATH` ra frontend.

**Tiêu chí hoàn thành:**
- Resolve đúng ưu tiên.
- Missing image không làm fail batch data.
- Log không chứa secret/password.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
```

### Task 32. Implement adaptive quality optimization

**Mục tiêu:** Convert/tối ưu ảnh học viên theo target size.

**Công việc:**
- Convert JP2 -> JPG.
- Adaptive quality `88 -> 85 -> 82 -> 78`.
- Target 25-30KB, chấp nhận <=40KB.
- Nếu vẫn >40KB sau quality 78, giữ bản rõ mặt nhất và log warning.
- Xóa metadata thừa, giữ aspect ratio.

**Tiêu chí hoàn thành:**
- Ảnh không crop, không méo, không cắt mặt.
- File JPG output đạt target/acceptable size theo khả năng.
- Có tests cho fallback và size logic.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
```

### Task 33. Implement image upload concurrency limit

**Mục tiêu:** Không xử lý/upload quá nhiều ảnh cùng lúc.

**Công việc:**
- Dùng concurrency mặc định `IMAGE_CONCURRENCY=5`.
- Không chạy đồng thời toàn bộ batch 100-200 ảnh.
- Upload từng JPG qua `POST /api/sync/student-photo`.
- Log lỗi từng ảnh riêng theo `MaDK`.

**Tiêu chí hoàn thành:**
- Concurrency limit được test.
- Lỗi một ảnh không fail batch data.
- Không có batch ZIP upload trong giai đoạn 1.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
grep -R "student-photo-batch" sync-tool && exit 1 || exit 0
```

---

## Phase 11 - Internal Debug Tool

### Task 34. Implement sync-tool debug command

**Mục tiêu:** Debug nội bộ theo CCCD, không expose ra public API.

**Công việc:**
- Lệnh debug nhận `--cccd`.
- Hiển thị các record theo `MaDK`.
- In fields: `MaDK`, `MaKhoaHoc`, `HangDaoTao`, `TenKhoaHoc`, `Hang`, `LoaiDaoTao`, `NgaySinh raw/display`, `GioiTinh raw/display`, `DiaChi`, `DuongDanAnh`, fallback path, file exists, `photoUrl`.
- Không log password, connection string, `SYNC_SECRET`.

**Tiêu chí hoàn thành:**
- Debug chỉ chạy trong sync-tool.
- Không có route frontend/backend public cho debug.
- Output đủ field vận hành.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
pnpm --filter sync-tool build
```

---

## Phase 12 - Frontend UI

### Task 35. Tạo layout và navigation theo UI tham chiếu

**Mục tiêu:** Xây dựng layout giữ gần như 100% giao diện tham chiếu.

**Công việc:**
- Header, menu, footer, layout base.
- Menu ưu tiên thông tin chính thống; không đặt tuyển sinh đầu tiên nếu chưa xác nhận.
- Hotline/Zalo chỉ ở footer/trang liên hệ/khu vực được duyệt, không ở hero/top page.

**Tiêu chí hoàn thành:**
- Không tự ý đổi màu, font, spacing, card, button, header, menu, banner.
- Không có hotline/Zalo OA ở phần đầu trang.
- Không đẩy tuyển sinh lên đầu menu.

**Lệnh kiểm tra:**
```bash
pnpm --filter client test
pnpm --filter client check
pnpm --filter client build
```

### Task 36. Tạo các page public cơ bản

**Mục tiêu:** Có đủ trang chính theo requirements.

**Công việc:**
- Trang chủ.
- Trang tra cứu học viên.
- Trang thông báo danh sách và chi tiết.
- Trang pháp lý.
- Trang tuyển sinh.
- Nội dung giai đoạn 1 có thể là static/public content, không dùng CMS/Admin hybrid.

**Tiêu chí hoàn thành:**
- Đủ route/page theo design.
- Không triển khai Directus CMS/Admin hybrid ở giai đoạn đầu.
- Không biến trang chủ thành landing page tuyển sinh.

**Lệnh kiểm tra:**
```bash
pnpm --filter client test
pnpm --filter client check
pnpm --filter client build
```

### Task 37. Implement lookup UI với tRPC client

**Mục tiêu:** Trang tra cứu gọi `lookup.searchStudent`.

**Công việc:**
- Form nhập CCCD, chọn Mô tô/Ô tô.
- Validate frontend: chỉ số, trim, 9-12 ký tự.
- Gọi tRPC `lookup.searchStudent`.
- Hiển thị loading, empty, success, error states.
- Hiển thị nhiều hồ sơ nếu một CCCD có nhiều `MaDK`.

**Tiêu chí hoàn thành:**
- Không gọi REST lookup.
- Không hiển thị SoCMT gốc, chỉ dùng `soCMTMasked`.
- Error message tiếng Việt thân thiện.

**Lệnh kiểm tra:**
```bash
pnpm --filter client test -- --run
pnpm --filter client check
pnpm --filter client build
```

### Task 38. Implement StudentCard và giữ tỷ lệ ảnh

**Mục tiêu:** Hiển thị ảnh học viên 3x4 không méo/crop.

**Công việc:**
- Container ảnh học viên tỷ lệ 3:4.
- Dùng `object-fit: contain`, không dùng `cover`.
- Logo, mascot, ảnh xe giữ tỷ lệ gốc.

**Tiêu chí hoàn thành:**
- Ảnh học viên không crop, không cắt mặt, không kéo giãn.
- Không dùng `object-fit: cover` cho ảnh học viên.
- Responsive không làm méo logo/mascot/ảnh xe.

**Lệnh kiểm tra:**
```bash
pnpm --filter client test -- --run
pnpm --filter client check
pnpm --filter client build
grep -R "object-fit: cover" client/src && exit 1 || exit 0
```

---

## Phase 13 - Official Assets

### Task 39. Thêm assets chính thức

**Mục tiêu:** Đưa đúng bộ ảnh chính thức vào frontend source.

**Công việc:**
- Thêm `logo-thanh-cong.webp`, `car.mp4`, `a1.png`, `am.png`, `b.png`, `c1.png`, `c.png`, `nh.png` vào `client/src/assets/`.
- Giữ nguyên tên file.
- Không thay đổi màu xe, logo, biển tập lái, tem nhận diện, bố cục ảnh.
- Không thêm ảnh/hạng A2, D, E, F nếu chưa xác nhận.

**Tiêu chí hoàn thành:**
- Đủ file asset chính thức.
- Không có ảnh học viên runtime trong `client/src/assets/`.
- Không dùng ảnh có logo thương hiệu xe ngoài bộ được duyệt.

**Lệnh kiểm tra:**
```bash
test -f client/src/assets/logo-thanh-cong.webp
test -f client/src/assets/car.mp4
test -f client/src/assets/a1.png
test -f client/src/assets/am.png
test -f client/src/assets/b.png
test -f client/src/assets/c1.png
test -f client/src/assets/c.png
test -f client/src/assets/nh.png
git status --short
```

---

## Phase 14 - Tests, Check, Build

### Task 40. Backend tests

**Mục tiêu:** Kiểm thử business/security backend.

**Công việc:**
- Test `maskSoCMT`.
- Test `formatNgaySinh`.
- Test `lookup.searchStudent` không trả SoCMT gốc.
- Test lookup validation và rate limit.
- Test sync secret middleware.
- Test `sync.pushBatch` validation, transaction/upsert theo `MaDK`.
- Test upload ảnh reject sai type/quá size/path traversal.

**Tiêu chí hoàn thành:**
- Backend tests pass.
- Không có public response chứa internal fields.
- Rate limit lookup được test.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test -- --run
pnpm --filter server check
pnpm --filter server build
```

### Task 41. Sync-tool tests

**Mục tiêu:** Kiểm thử sync an toàn và xử lý ảnh.

**Công việc:**
- Test normalize ngày sinh, gender, loại đào tạo.
- Test checkpoint chỉ cập nhật sau batch success.
- Test failed batch không cập nhật checkpoint.
- Test HTTPS production guard.
- Test image adapter fallback, adaptive quality, concurrency.
- Test debug output không log secret.

**Tiêu chí hoàn thành:**
- Sync-tool tests pass.
- Production HTTP public bị chặn.
- Batch ZIP chưa xuất hiện trong giai đoạn 1.

**Lệnh kiểm tra:**
```bash
pnpm --filter sync-tool test -- --run
pnpm --filter sync-tool check
pnpm --filter sync-tool build
```

### Task 42. Frontend tests

**Mục tiêu:** Kiểm thử UI public và tra cứu.

**Công việc:**
- Render smoke tests cho pages chính.
- Test lookup loading/empty/success/error.
- Test không hiển thị SoCMT gốc.
- Test hotline/Zalo không ở hero/top page.
- Test tuyển sinh không nằm đầu trang/menu nếu chưa xác nhận.
- Test ảnh học viên giữ tỷ lệ.

**Tiêu chí hoàn thành:**
- Frontend tests pass.
- UI không tự ý lệch khỏi tham chiếu.
- Không có `object-fit: cover` cho ảnh học viên.

**Lệnh kiểm tra:**
```bash
pnpm --filter client test -- --run
pnpm --filter client check
pnpm --filter client build
```

### Task 43. Root verification scripts

**Mục tiêu:** Đảm bảo toàn repo có lệnh kiểm tra thống nhất.

**Công việc:**
- Root `pnpm check`.
- Root `pnpm test`.
- Root `pnpm build`.
- Riêng sync-tool chạy được `pnpm build` và `pnpm test`.

**Tiêu chí hoàn thành:**
- Các lệnh bắt buộc trong Definition of Done pass.
- Không còn package nào thiếu script check/test/build.

**Lệnh kiểm tra:**
```bash
pnpm check
pnpm test
pnpm build
cd sync-tool && pnpm build && pnpm test
```

---

## Phase 15 - Final Verification

### Task 44. Kiểm tra Definition of Done

**Mục tiêu:** Rà soát toàn bộ yêu cầu trước khi coi giai đoạn 1 hoàn thành.

**Công việc:**
- Chạy toàn bộ check/test/build.
- Kiểm tra API public không trả SoCMT gốc.
- Kiểm tra rate limit lookup hoạt động.
- Kiểm tra sync secret và HTTPS production guard.
- Kiểm tra checkpoint chỉ cập nhật sau batch success.
- Kiểm tra UI không đổi ngoài phạm vi.
- Kiểm tra ảnh học viên dùng `object-fit: contain`.

**Tiêu chí hoàn thành:**
- Definition of Done trong `design.md` đạt đầy đủ.
- Không có blocker bảo mật hoặc dữ liệu.
- Không có task giai đoạn 1 bị lẫn future scope.

**Lệnh kiểm tra:**
```bash
pnpm check
pnpm test
pnpm build
cd sync-tool && pnpm build && pnpm test
```

### Task 45. Kiểm tra git hygiene

**Mục tiêu:** Đảm bảo repository không chứa file cấm.

**Công việc:**
- Rà `git status`.
- Đảm bảo không commit `.env`, `sync-tool/.env`, `node_modules`, `dist`, `build`, `public/uploads/students`, logs.
- Đảm bảo ảnh học viên runtime không nằm trong source.

**Tiêu chí hoàn thành:**
- Git status chỉ có file source/docs/assets hợp lệ.
- Không có file cấm được staged/tracked.

**Lệnh kiểm tra:**
```bash
git status --short
git ls-files | grep -E '(^|/)(\.env|node_modules|dist|build|public/uploads/students|sync-tool/last-sync\.json|.*\.log$)' && exit 1 || exit 0
```

---

## Future / Optional Tasks - Không triển khai giai đoạn 1

### Future Task 1. Directus CMS/Admin hybrid

**Mục tiêu:** Quản lý nội dung public và quản trị hệ thống ở giai đoạn sau.

**Công việc:**
- Directus CMS dùng database riêng cho thông báo, pháp lý, tuyển sinh, banner, FAQ, media public.
- Admin Panel riêng quản lý bật/tắt tra cứu, trạng thái sync, log sync, log lookup, bảo mật.
- CMS không được đọc/sửa dữ liệu học viên.

**Tiêu chí hoàn thành:**
- CMS và Admin tách biệt chức năng/database.
- Dữ liệu học viên không expose qua CMS.
- Chỉ triển khai khi có xác nhận scope mới.

**Lệnh kiểm tra:**
```bash
pnpm check
pnpm test
pnpm build
```

### Future Task 2. Bảo mật tra cứu nâng cao

**Mục tiêu:** Tăng bảo mật lookup sau khi giai đoạn 1 ổn định.

**Công việc:**
- Logging lookup với SoCMT hash/masked.
- Captcha nếu cần.
- Yêu cầu ngày sinh nếu được duyệt.
- Khung giờ tra cứu.
- Bật/tắt tra cứu từ Admin.
- Redis rate limit nếu production nhiều instance.

#### Lookup abuse protection và cảnh báo sử dụng hợp lệ

**Yêu cầu tương lai, chưa triển khai code ở giai đoạn hiện tại:**
- Khi người dùng bấm Tra cứu, hiển thị cảnh báo:
  "Tôi cam kết chỉ tra cứu thông tin của chính mình hoặc người mà tôi được ủy quyền hợp pháp. Tôi không sử dụng chức năng này để thu thập, dò quét hoặc tra cứu trái phép thông tin cá nhân của người khác."
- Nút Tra cứu chỉ bật sau khi người dùng xác nhận checkbox.
- Có thể tạo anonymous `deviceId` bằng UUID ngẫu nhiên lưu trong cookie/localStorage.
- `deviceId` không phải serial máy, không phải IMEI, không phải thông tin phần cứng thật.
- Frontend có thể gửi kèm metadata cơ bản: `deviceId`, timezone, language, screen width/height/devicePixelRatio, platform/browser tương đối.
- Backend lấy thêm IP và User-Agent từ request.
- Log lookup phải an toàn: không log raw SoCMT, ưu tiên hash hoặc mask SoCMT, không log secret/password.
- Có thể rate limit theo IP + `deviceId`.
- Có thể tạm blacklist theo IP/`deviceId` nếu tra cứu quá nhiều CCCD khác nhau hoặc vượt limit nhiều lần.
- Blacklist nên có thời hạn, ví dụ 1 giờ, 24 giờ, 7 ngày, không mặc định khóa vĩnh viễn.
- Không cố đọc serial ổ cứng, mainboard, IMEI, MAC address, danh sách file hoặc thông tin phần cứng định danh sâu.
- Không dùng fingerprint xâm lấn như canvas/audio/font fingerprint nếu chưa được xác nhận riêng.
- Không yêu cầu người dùng cài phần mềm riêng.
- Giai đoạn 1 Task 17 vẫn chỉ triển khai rate limit IP cơ bản.

**Tiêu chí hoàn thành:**
- Không làm lộ SoCMT gốc.
- Có cấu hình bật/tắt rõ ràng.
- Không thay đổi behavior giai đoạn 1 nếu chưa được duyệt.

**Lệnh kiểm tra:**
```bash
pnpm check
pnpm test
pnpm build
```

### Future Task 3. ZIP batch photo upload

**Mục tiêu:** Tối ưu số lượng HTTP requests nếu upload từng ảnh quá chậm.

**Công việc:**
- Chỉ xem xét khi batch 100-200 ảnh gây quá nhiều request hoặc sync chậm.
- Endpoint đề xuất: `POST /api/sync/student-photo-batch`.
- Auth bắt buộc `X-SYNC-SECRET`.
- Production bắt buộc HTTPS.
- Request `multipart/form-data` gồm `manifest` JSON và `photosZip`.
- Validate ZIP size, số lượng ảnh, filename, MIME, manifest match, path traversal.
- Trả lỗi chi tiết theo `MaDK` để retry ảnh lỗi.

**Tiêu chí hoàn thành:**
- Không thay thế upload từng ảnh nếu chưa có nhu cầu thực tế.
- ZIP không làm giảm yêu cầu bảo mật hiện có.
- Có tests cho manifest, ZIP validation, lỗi từng ảnh, HTTPS production.

**Lệnh kiểm tra:**
```bash
pnpm --filter server test
pnpm --filter sync-tool test
pnpm check
```
