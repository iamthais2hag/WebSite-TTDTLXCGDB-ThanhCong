# Database Runbook

Runbook này chuẩn bị workflow tạo/chạy database local/staging an toàn cho dự án. Tài liệu này không yêu cầu và không cho phép tự động connect MySQL thật, chạy migration thật, chạy `db:push`, chạy sync dữ liệu thật hoặc deploy production.

## 1. Phạm Vi Hiện Tại

Schema Drizzle hiện nằm ở `server/src/db/schema.ts`.

Các bảng chính:

- `student_lookup_cache`: cache dữ liệu học viên phục vụ lookup public.
- `sync_log`: schema log sync optional để dùng cho vận hành sau này.

Drizzle config hiện nằm ở `server/drizzle.config.ts` và chỉ đọc `DATABASE_URL` từ biến môi trường khi chạy Drizzle Kit command. Không hardcode username, password, host thật hoặc secret trong source.

Các script liên quan DB hiện có trong `server/package.json`:

- `db:generate`
- `db:migrate`
- `db:studio`

Không có bước nào trong runbook này chạy migration thật.

## 2. Migration Safety Checklist

Trước khi chạy bất kỳ migration nào, phải xác nhận đủ checklist:

- [ ] Luôn dùng database local/staging trước.
- [ ] Backup trước khi chạy production migration.
- [ ] Không chạy migration khi chưa có tag release.
- [ ] Không chạy migration nếu Git working tree dirty.
- [ ] Không chạy migration nếu `pnpm verify` fail.
- [ ] Không dùng `DATABASE_URL` production trong local terminal nếu chưa có xác nhận riêng.
- [ ] Không paste `DATABASE_URL` thật vào chat, log, issue, tài liệu hoặc terminal output được chia sẻ.
- [ ] Không chạy `db:migrate`, `db:push`, `drizzle-kit migrate` hoặc `drizzle-kit push` vào database thật khi chưa được duyệt.
- [ ] Xác nhận đúng branch, đúng commit hash, đúng tag release.
- [ ] Xác nhận người chịu trách nhiệm rollback đang sẵn sàng.

## 3. Thứ Tự Chuẩn Bị DB Local/Staging

1. Tạo MySQL database test/staging.

2. Tạo user database quyền hạn tối thiểu:

   - Chỉ cấp quyền cần thiết cho schema staging.
   - Không dùng root user.
   - Không dùng chung user production cho local/staging.

3. Cấu hình `DATABASE_URL` trong `.env` local hoặc môi trường shell riêng.

   - Không commit `.env`.
   - Không in `DATABASE_URL` ra console/log.
   - Không paste `DATABASE_URL` thật vào chat.

4. Chạy env readiness check:

   ```bash
   pnpm check:env
   ```

   Lệnh này chỉ kiểm tra presence/format và không connect database.

5. Chạy kiểm tra toàn workspace:

   ```bash
   pnpm verify
   ```

6. Rà lại diff/tag trước migration:

   ```bash
   git status --short
   git log --oneline --decorate --max-count 5
   git tag --list
   ```

7. Chỉ sau khi người quản lý xác nhận mới chạy migration.

8. Nếu được xác nhận chạy migration local/staging, dùng script đã định nghĩa:

   ```bash
   pnpm --filter server db:generate
   pnpm --filter server db:migrate
   ```

   Trước khi chạy, kiểm tra lại terminal đang dùng env local/staging, không phải production.

## 4. Rollback Plan

Trước migration staging/production cần có rollback plan cụ thể:

- Backup database trước migration.
- Ghi tag Git trước migration.
- Ghi commit hash đang deploy.
- Lưu danh sách migration file đã chạy.
- Ghi thời điểm bắt đầu/kết thúc migration.
- Có kế hoạch restore backup nếu migration lỗi.
- Có người xác nhận dữ liệu sau migration.
- Không tiếp tục chạy sync nếu migration lỗi hoặc schema chưa được xác nhận.

Nếu migration lỗi:

1. Dừng server/sync nếu cần để tránh ghi thêm dữ liệu.
2. Giữ nguyên logs vận hành nhưng không public secret.
3. Không tự sửa trực tiếp database production nếu chưa có xác nhận.
4. Restore backup hoặc chạy rollback theo kế hoạch đã duyệt.
5. Ghi lại commit hash/tag và migration file liên quan.

## 5. Dữ Liệu Học Viên

- Không dùng dữ liệu thật để test UI công khai.
- Nếu cần test lookup/UI, dùng dữ liệu mẫu ẩn danh.
- Không log raw SoCMT/CCCD.
- Không trả SoCMT gốc qua API public.
- Không commit ảnh học viên runtime.
- Không commit `sync-tool/last-sync.json`.
- Không đưa ảnh học viên runtime vào `client/src/assets/`.
- Không expose `IMAGE_BASE_PATH`, `DuongDanAnh` hoặc path vật lý server.

## 6. Production Notes

- Production sync bắt buộc HTTPS/TLS.
- `API_URL` production phải là `https://thanhcongdaklak.edu.vn`.
- Không dùng HTTP public để gửi `X-SYNC-SECRET`.
- Uploads dir production nên nằm ngoài source code.
- Zalo OA placeholder phải được thay bằng link thật trước production.
- `SYNC_SECRET` phải đủ mạnh và rotate nếu nghi ngờ bị lộ.
- `DATABASE_URL` production không được xuất hiện trong log, tài liệu, Git hoặc output CI.
- Chỉ chạy production migration khi có tag release, backup, rollback plan và xác nhận vận hành.

## 7. Lệnh An Toàn Được Phép Trước Khi Duyệt Migration

Các lệnh sau chỉ kiểm tra source/config hoặc env format, không chạy migration:

```bash
pnpm check:env
pnpm verify
pnpm --filter server check
pnpm --filter server test
pnpm --filter server build
```

Không chạy các lệnh sau nếu chưa có xác nhận riêng:

```bash
pnpm --filter server db:migrate
pnpm --filter server db:generate
pnpm --filter server db:studio
drizzle-kit migrate
drizzle-kit push
```
