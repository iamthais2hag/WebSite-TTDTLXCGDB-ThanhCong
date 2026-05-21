# Project Context

## 1. Mục tiêu dự án

Dự án xây dựng website chính thức cho TRUNG TÂM ĐÀO TẠO LÁI XE CƠ GIỚI ĐƯỜNG BỘ THÀNH CÔNG.

Mục tiêu giai đoạn 1:

- Có website public với các trang chính theo yêu cầu.
- Có chức năng tra cứu học viên theo CCCD và loại đào tạo.
- Đồng bộ dữ liệu học viên từ SQL Server của Trung tâm sang MySQL cache.
- Tối ưu ảnh học viên local và phục vụ ảnh runtime an toàn.
- Giữ giao diện gần như 100% theo bản tham chiếu đã được duyệt.

## 2. Kiến trúc frontend/backend/sync-tool/shared

Kiến trúc chia thành bốn phần chính:

- `client/`: frontend React + TypeScript + Vite, hiển thị website public và trang tra cứu.
- `server/`: backend Express + tRPC, cung cấp API JSON, REST upload ảnh và serve ảnh runtime.
- `sync-tool/`: công cụ nội bộ đọc SQL Server, xử lý ảnh, gọi API sync và quản lý checkpoint.
- `shared/`: kiểu dữ liệu và Zod schemas dùng chung giữa client/server/sync-tool khi phù hợp.

Dữ liệu học viên phục vụ tra cứu được lưu trong MySQL table `student_lookup_cache`, đồng bộ theo `MaDK` là unique key.

## 3. Business rules giai đoạn 1

- Một `SoCMT` có thể có nhiều `MaDK`.
- `MaDK` là unique key để upsert từng hồ sơ/khóa học.
- Tra cứu Mô tô dùng nhóm hạng A1, A/AM theo dữ liệu được xác nhận.
- Tra cứu Ô tô dùng các hạng B, C1, C, nâng hạng theo dữ liệu được xác nhận.
- Không tự ý thêm hạng A2, D, E, F nếu chưa được xác nhận.
- `NgaySinh` lưu raw dạng `yyyyMMdd`, backend format public thành `dd/mm/yyyy`.
- `SoCMT` chỉ được trả public dưới dạng masked, ví dụ `********6377`.
- Checkpoint sync chỉ cập nhật sau khi batch data thành công.

## 4. Dữ liệu nhạy cảm và quy tắc bảo mật

Dữ liệu nhạy cảm gồm:

- SoCMT/CCCD gốc.
- `X-SYNC-SECRET`.
- SQL Server password.
- MySQL connection string.
- Đường dẫn ảnh nội bộ như `DuongDanAnh` và `IMAGE_BASE_PATH`.
- Ảnh học viên runtime.

Quy tắc:

- Không trả SoCMT gốc qua API public.
- Không log secret, password, connection string.
- Không expose đường dẫn ảnh nội bộ ra frontend.
- Không trả `MaDK`, `MaKhoaHoc`, `HangDaoTao`, `LoaiDaoTao`, `sourceUpdatedAt`, `syncedAt` qua lookup public.
- Không commit `.env`, ảnh học viên runtime, `node_modules`, `dist`, `build`, logs.

## 5. API rules

- API JSON dùng tRPC.
- REST chỉ dùng cho upload ảnh multipart/form-data.
- Không tạo REST endpoint cho lookup nếu đã dùng tRPC.
- `lookup.searchStudent` là tRPC query public có rate limit IP cơ bản.
- `sync.pushBatch` là tRPC mutation protected bằng `X-SYNC-SECRET`.
- `POST /api/sync/student-photo` là REST endpoint protected bằng `X-SYNC-SECRET` để upload từng ảnh JPG.

## 6. Lookup rules

- Input gồm `soCMT` và `loaiDaoTao`.
- `soCMT` phải trim, chỉ chứa số, dài 9-12 ký tự.
- `loaiDaoTao` chỉ là `moto` hoặc `oto`.
- Backend query bằng SoCMT gốc trong DB nhưng public response chỉ có `soCMTMasked`.
- Response public chỉ gồm: họ tên, SoCMT masked, ngày sinh display, giới tính, địa chỉ, tên khóa học, hạng, `photoUrl`.
- Có rate limit IP cơ bản ngay giai đoạn 1.
- Không triển khai captcha, yêu cầu ngày sinh hoặc khung giờ tra cứu trong giai đoạn 1.

## 7. Sync rules

- sync-tool đọc SQL Server theo batch nhỏ, ví dụ 100-200 records.
- `SourceUpdatedAt` là alias computed từ các cột updated/created phù hợp, không giả định SQL Server có cột thật tên `sourceUpdatedAt`.
- Batch data gửi lên `sync.pushBatch` phải được server validate toàn bộ trước khi upsert.
- Upsert theo `MaDK` trong transaction.
- Nếu transaction lỗi, rollback batch và trả thất bại.
- sync-tool chỉ ghi checkpoint sau khi nhận `success: true`.
- API sync bắt buộc header `X-SYNC-SECRET`.
- Production bắt buộc HTTPS/TLS; sync-tool production không được gửi `X-SYNC-SECRET` qua HTTP public.

## 8. Upload ảnh học viên runtime

- Ảnh học viên gốc là JP2, thường đã đúng chuẩn 3x4.
- Không crop, không cắt mặt, không đổi tỷ lệ ảnh.
- sync-tool xử lý ảnh local, không gửi ảnh lên dịch vụ nén ảnh online bên thứ ba.
- Ưu tiên `DuongDanAnh`; fallback `IMAGE_BASE_PATH/{MaKhoaHoc}/{MaDK}.jp2`.
- Convert JP2 -> JPG và tối ưu adaptive quality.
- Target 25-30KB/ảnh; chấp nhận khoảng <=40KB nếu cần giữ rõ mặt.
- Giai đoạn 1 upload từng JPG qua `POST /api/sync/student-photo` với concurrency giới hạn.
- Ảnh runtime lưu ở `public/uploads/students/{MaKhoaHoc}/{MaDK}.jpg`.
- Frontend hiển thị ảnh học viên 3:4 bằng `object-fit: contain`.

## 9. Những việc không làm ở giai đoạn 1

- Không triển khai CMS/Admin hybrid nâng cao.
- Không triển khai captcha.
- Không yêu cầu ngày sinh khi tra cứu.
- Không triển khai khung giờ tra cứu.
- Không triển khai batch ZIP upload ảnh.
- Không dùng REST cho JSON API.
- Không thay đổi màu, font, layout, menu, banner nếu chưa được xác nhận.
- Không đưa hotline/Zalo OA lên đầu trang.
- Không đưa ảnh học viên runtime vào `client/src/assets/`.
- Không commit file runtime hoặc build output.
