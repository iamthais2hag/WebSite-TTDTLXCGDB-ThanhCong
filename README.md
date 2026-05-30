# Website Trung tâm Đào tạo Lái xe Thành Công

Website chính thức cho TRUNG TÂM ĐÀO TẠO LÁI XE CƠ GIỚI ĐƯỜNG BỘ THÀNH CÔNG.

Domain production dự kiến: `thanhcongdaklak.edu.vn`.

## 1. Giới thiệu dự án

Dự án xây dựng website public cho Trung tâm, gồm các trang chính:

- Trang chủ
- Trang tra cứu học viên
- Trang thông báo
- Trang pháp lý
- Trang tuyển sinh

Giao diện cần giữ gần như 100% theo bản tham chiếu đã được Trung tâm cung cấp: màu sắc, font, layout, spacing, card, button, header, menu, banner và trang tra cứu.

## 2. Cấu trúc workspace

Workspace dự kiến gồm các vùng trách nhiệm:

```text
client/                  Frontend React + TypeScript + Vite
server/                  Backend Express + tRPC
sync-tool/               Công cụ đồng bộ từ SQL Server về server API
shared/                  Kiểu dữ liệu và schema dùng chung
public/uploads/students/ Ảnh học viên runtime, không đưa vào source frontend
```

Ảnh học viên runtime nằm ở `public/uploads/students/` và được phục vụ qua server. Ảnh chính thức của website, như logo hoặc ảnh xe, sẽ thuộc frontend assets khi triển khai UI.

## 3. Setup local

Các bước setup local dự kiến:

1. Cài Node.js và pnpm phù hợp với cấu hình dự án.
2. Tạo file `.env` từ `.env.example` cho server.
3. Tạo file `sync-tool/.env` từ `sync-tool/.env.example` nếu cần chạy đồng bộ.
4. Cấu hình MySQL cho server.
5. Cấu hình SQL Server readonly cho sync-tool nếu cần đọc dữ liệu thật.
6. Chạy scripts dự kiến sau khi workspace/package scripts được cấu hình ở task tiếp theo.

Trong local development, sync-tool có thể dùng `API_URL=http://localhost:3000`.

## 4. Cách dùng `.env.example`

Root `.env.example` dành cho server:

- `DATABASE_URL`: kết nối MySQL
- `SYNC_SECRET`: secret dùng để xác thực sync API
- `CORS_ORIGIN`: origin frontend được phép gọi API
- `UPLOADS_DIR`: thư mục ảnh học viên runtime, optional
- `MAX_PHOTO_SIZE`: giới hạn dung lượng ảnh upload

`sync-tool/.env.example` dành cho sync-tool:

- Thông tin SQL Server: host, port, user, password, database
- `API_URL`: URL server API
- `SYNC_SECRET`: secret gửi qua header `X-SYNC-SECRET`
- `IMAGE_BASE_PATH`: thư mục ảnh gốc fallback
- `BATCH_SIZE`, `MAX_RETRIES`
- `IMAGE_ENGINE`, `IMAGE_CONCURRENCY`

Không điền secret thật vào file example.

## 5. Scripts dự kiến

Các script dự kiến khi workspace tooling được cấu hình:

```bash
pnpm dev
pnpm build
pnpm check
pnpm test
pnpm lint
```

Lệnh kiểm tra bắt buộc trước khi hoàn thành một thay đổi:

```bash
pnpm check
pnpm test
pnpm build
cd sync-tool && pnpm build && pnpm test
```

## 6. Sync-tool usage

sync-tool đọc dữ liệu học viên từ SQL Server theo batch, xử lý ảnh học viên local, upload ảnh JPG đã tối ưu, rồi gửi dữ liệu JSON lên server API.

Luồng chính:

1. Đọc batch từ SQL Server theo checkpoint.
2. Resolve ảnh từ `DuongDanAnh` hoặc `IMAGE_BASE_PATH`.
3. Convert/tối ưu JP2 -> JPG local.
4. Upload từng ảnh qua `POST /api/sync/student-photo` với concurrency giới hạn.
5. Gửi batch dữ liệu qua tRPC `sync.pushBatch`.
6. Chỉ cập nhật checkpoint khi server xác nhận batch thành công.

sync-tool không được gửi ảnh học viên lên dịch vụ nén ảnh online bên thứ ba.

## 7. Deploy overview

Production dự kiến gồm:

- Frontend build static từ `client/`.
- Backend Express + tRPC chạy Node.js.
- MySQL lưu `student_lookup_cache`.
- `public/uploads/students/` là thư mục runtime cho ảnh học viên.
- Nginx hoặc reverse proxy đứng trước server.
- sync-tool có thể chạy tại máy nội bộ của Trung tâm và gọi server production qua API.

Không chạy migration production hoặc thay đổi dữ liệu thật nếu chưa có xác nhận vận hành.

## 8. HTTPS/TLS production requirement

Production sync bắt buộc dùng HTTPS/TLS.

Quy tắc:

- `API_URL` production trong `sync-tool/.env` phải là `https://thanhcongdaklak.edu.vn`.
- Không cấu hình sync production qua HTTP public; không gửi `X-SYNC-SECRET` qua HTTP public.
- `X-SYNC-SECRET`, payload học viên, metadata và ảnh upload phải được bảo vệ trên đường truyền.
- Nginx hoặc reverse proxy production phải cấu hình SSL/TLS hợp lệ.
- HTTP nên redirect sang HTTPS.
- Có thể bật HSTS sau khi domain và chứng chỉ SSL ổn định.
- Có kế hoạch rotate `SYNC_SECRET` nếu nghi ngờ bị lộ.

Ngoại lệ: local development được phép dùng `http://localhost:3000`. Production public bắt buộc dùng `https://`.

## 9. Troubleshooting

Các điểm cần kiểm tra khi lỗi:

- Server không kết nối MySQL: kiểm tra `DATABASE_URL`.
- sync-tool không gọi được API: kiểm tra `API_URL`, HTTPS production, network và `SYNC_SECRET`.
- Upload ảnh lỗi: kiểm tra `MAX_PHOTO_SIZE`, MIME `image/jpeg`, quyền ghi `UPLOADS_DIR`.
- Không thấy ảnh học viên: kiểm tra file trong `public/uploads/students/` và URL `/uploads/students/...`.
- Lookup không trả dữ liệu: kiểm tra dữ liệu đã sync, `SoCMT`, `LoaiDaoTao`, và rate limit IP.
- Checkpoint sai hoặc không cập nhật: chỉ cập nhật checkpoint sau khi `sync.pushBatch` thành công.

Không log secret, password, connection string hoặc SoCMT gốc nếu không cần thiết.

## 10. Git hygiene

Không commit các file/thư mục sau:

- `.env`
- `sync-tool/.env`
- Ảnh học viên runtime trong `public/uploads/students/`
- `node_modules/`
- `dist/`
- `build/`
- `.vite/`
- `coverage/`
- `*.tsbuildinfo`
- `*.log`
- `sync-tool/temp/`
- `sync-tool/last-sync.json`

Chỉ commit `.env.example` và `sync-tool/.env.example` nếu không chứa secret thật.

## 11. Local/Staging runbook

Trước khi chạy thử database, upload ảnh hoặc sync với dữ liệu thật, xem checklist an toàn trong `docs/STAGING-RUNBOOK.md`.

Runbook này ghi rõ:

- File env cần tạo thủ công và không commit.
- Thứ tự chạy thử local/staging.
- Các cảnh báo bảo mật cho `X-SYNC-SECRET`, `DATABASE_URL`, SQL Server password, SoCMT/CCCD và ảnh học viên runtime.
- Checklist trước sync thật và trước production.

Không connect database thật, không chạy migration thật, không chạy sync thật hoặc deploy production nếu chưa có xác nhận vận hành riêng.
