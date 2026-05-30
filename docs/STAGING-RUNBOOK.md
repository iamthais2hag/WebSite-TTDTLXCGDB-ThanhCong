# Staging Runbook

Runbook này dùng để chuẩn bị chạy thử local/staging với dữ liệu thật sau này. Tài liệu này không yêu cầu và không cho phép tự động connect database thật, chạy migration thật, chạy sync thật hoặc deploy production.

## Mục tiêu

- Chuẩn bị môi trường local/staging có kiểm soát.
- Kiểm tra an toàn trước khi chạm dữ liệu thật.
- Giữ secret, dữ liệu học viên, ảnh runtime và checkpoint ngoài Git.
- Chỉ chạy các bước liên quan database/sync thật sau khi có xác nhận vận hành riêng.

## 1. Yêu Cầu Môi Trường Local/Staging

- Node.js phù hợp với workspace.
- pnpm.
- MySQL test/staging, không dùng database production cho lần chạy thử đầu.
- SQL Server nguồn chỉ dùng khi đã được xác nhận quyền truy cập, phạm vi đọc và thời điểm chạy.
- ImageMagick `magick` nếu cần xử lý ảnh JP2.
- HTTPS/TLS bắt buộc cho production sync.

Giai đoạn local có thể dùng `http://localhost:3000`. Production public bắt buộc dùng `https://thanhcongdaklak.edu.vn`.

## 2. File Env Cần Chuẩn Bị Thủ Công

Các file này phải tạo thủ công trên máy chạy local/staging và không được commit:

- `.env`
- `sync-tool/.env`
- File env riêng cho server nếu quy trình vận hành tách riêng.

Các biến cần chuẩn bị:

- `DATABASE_URL`
- `SYNC_SECRET`
- `API_URL`
- `SQLSERVER_HOST`
- `SQLSERVER_PORT`
- `SQLSERVER_USER`
- `SQLSERVER_PASSWORD`
- `SQLSERVER_DATABASE`
- `IMAGE_BASE_PATH`
- `UPLOADS_DIR`
- `MAX_PHOTO_SIZE`
- `BATCH_SIZE`
- `MAX_RETRIES`
- `IMAGE_ENGINE`
- `IMAGE_CONCURRENCY`

Chỉ dùng `.env.example` và `sync-tool/.env.example` làm mẫu. Không điền secret thật vào file example.

## 3. Cảnh Báo Bảo Mật

- Không dùng HTTP public để gửi `X-SYNC-SECRET`.
- `API_URL` production phải là `https://thanhcongdaklak.edu.vn`.
- Không log raw SoCMT/CCCD.
- Không log secret, password, API key hoặc connection string.
- Không commit `sync-tool/last-sync.json`.
- Không commit ảnh học viên runtime trong `public/uploads/students/`.
- Không expose `IMAGE_BASE_PATH`, `DuongDanAnh` hoặc path vật lý server ra frontend/API public.
- Không đưa `.env`, `node_modules`, `dist`, `build`, logs hoặc file runtime vào Git.
- Nếu nghi ngờ `SYNC_SECRET` bị lộ, rotate secret trước khi chạy tiếp.

## 4. Thứ Tự Chạy Thử Local/Staging Đề Xuất

1. Cài dependencies:

   ```bash
   pnpm install
   ```

2. Kiểm tra toàn workspace:

   ```bash
   pnpm verify
   ```

3. Chuẩn bị MySQL test/staging.

4. Rà soát `.env` thủ công, bảo đảm không dùng secret production nếu chưa được phép.

5. Chỉ chạy migration khi đã có xác nhận riêng:

   ```bash
   pnpm --filter server db:generate
   pnpm --filter server db:migrate
   ```

   Không chạy migration vào database thật nếu chưa có xác nhận vận hành.

6. Chạy server local/staging.

7. Chạy client local.

8. Test lookup với dữ liệu mẫu trước, xác nhận API public không trả SoCMT gốc hoặc field nội bộ.

9. Test upload ảnh mẫu bằng JPG nhỏ, không dùng ảnh học viên thật trong repo.

10. Test sync-tool với batch nhỏ 1-5 record trước.

11. Kiểm tra checkpoint:

    - Chỉ cập nhật sau khi `sync.pushBatch` success.
    - Không commit `sync-tool/last-sync.json`.

12. Kiểm tra logs:

    - Không có raw SoCMT/CCCD.
    - Không có `SYNC_SECRET`.
    - Không có SQL Server password.
    - Không có `DATABASE_URL`.

## 5. Checklist Trước Khi Chạy Sync Thật

- [ ] `pnpm verify` pass.
- [ ] Working tree Git clean.
- [ ] `.env` và `sync-tool/.env` tồn tại local nhưng không bị Git track.
- [ ] `DATABASE_URL` trỏ đúng MySQL test/staging.
- [ ] `SYNC_SECRET` đủ mạnh và không dùng lại secret đã nghi ngờ bị lộ.
- [ ] `API_URL` production dùng `https://thanhcongdaklak.edu.vn`.
- [ ] Không dùng HTTP public để gửi `X-SYNC-SECRET`.
- [ ] SQL Server source đã được xác nhận quyền đọc và thời điểm chạy.
- [ ] `IMAGE_BASE_PATH` đúng môi trường chạy và không expose ra frontend.
- [ ] `UPLOADS_DIR` staging/production nằm ngoài source code nếu triển khai production.
- [ ] ImageMagick `magick` khả dụng nếu xử lý ảnh JP2.
- [ ] Batch đầu tiên chỉ 1-5 record.
- [ ] Có người theo dõi logs khi chạy thử.

## 6. Checklist Trước Production

- [ ] Zalo OA link thật đã cập nhật, không còn `#cap-nhat-zalo-oa`.
- [ ] HTTPS hoạt động cho domain production.
- [ ] HTTP redirect sang HTTPS.
- [ ] Có thể bật HSTS sau khi domain và SSL ổn định.
- [ ] `SYNC_SECRET` đã rotate/đủ mạnh.
- [ ] `DATABASE_URL` không lộ trong log, tài liệu, Git hoặc CI output.
- [ ] Uploads dir production nằm ngoài source code nếu có thể.
- [ ] Có backup database.
- [ ] Có rollback plan.
- [ ] `pnpm verify` pass.
- [ ] Git clean.
- [ ] Tag release đã tạo.
- [ ] Không có `.env` thật trong Git.
- [ ] Không có `last-sync.json` trong Git.
- [ ] Không có ảnh học viên runtime trong Git.

## 7. Lệnh Kiểm Tra An Toàn Gợi Ý

Kiểm tra file nhạy cảm phổ biến:

```powershell
Get-ChildItem -Recurse -Force -File |
  Where-Object {
    $_.FullName -notmatch '\\(node_modules|\.git|dist|build|coverage)\\' -and
    (
      $_.Name -eq ".env" -or
      $_.Name -eq "last-sync.json" -or
      ($_.FullName -match '\\public\\uploads\\students\\' -and $_.Name -ne ".gitkeep")
    )
  } |
  Select-Object FullName
```

Kiểm tra dấu vết không mong muốn theo danh sách đã thống nhất trong quy trình kiểm tra của dự án. Không đưa nội dung template/công cụ cũ vào source, tài liệu public hoặc file runtime.

```powershell
Get-ChildItem -Recurse -Force -File |
  Where-Object {
    $_.FullName -notmatch '\\(node_modules|\.git|dist|build|coverage)\\'
  } |
  Select-String -Pattern "<danh-sach-dau-vet-khong-mong-muon>" |
  Select-Object Path, LineNumber, Line
```

Các lệnh trên chỉ để kiểm tra file trong workspace. Chúng không connect database, không gọi API thật và không chạy sync.
