# Tài liệu Yêu cầu Website Trung tâm Đào tạo Lái xe Thành Công

## Giới thiệu

Website chính thức cho **TRUNG TÂM ĐÀO TẠO LÁI XE CƠ GIỚI ĐƯỜNG BỘ THÀNH CÔNG**.

- **Slogan:** Vững tay lái – Vững bước thành công
- **Domain:** thanhcongdaklak.edu.vn

---

## Yêu cầu giao diện

### Tham chiếu giao diện

Giao diện được tái tạo theo bản website hiện tại do Trung tâm cung cấp làm mẫu tham chiếu nội bộ.

### Yêu cầu giữ nguyên giao diện

Giao diện phải giữ giống hiện tại **gần như 100%** về:
- Màu sắc
- Font chữ
- Layout tổng thể
- Spacing (khoảng cách)
- Card style
- Button style
- Header
- Menu navigation
- Banner
- Trang tra cứu học viên

**Không tự ý thay đổi UI.**

### Lưu ý quan trọng

- Bản tham chiếu chỉ dùng để **tham khảo giao diện và nghiệp vụ**
- **Không copy** dấu vết công cụ cũ, template cũ, hoặc nền tảng cũ
- **Không nhắc đến** trong tài liệu public các từ khóa liên quan đến công cụ tạo mã, template cũ, nền tảng cũ hoặc nội dung sinh tự động

---

## Các trang chính

1. **Trang chủ** - Giới thiệu Trung tâm, banner, thông báo mới
2. **Trang tra cứu học viên** - Tra cứu thông tin đăng ký học
3. **Trang thông báo** - Danh sách và chi tiết thông báo
4. **Trang pháp lý** - Văn bản pháp luật liên quan
5. **Trang tuyển sinh** - Thông tin khóa học, học phí, hồ sơ cần thiết

**Lưu ý:** Tuyển sinh không đặt làm nội dung đầu tiên và không được ưu tiên hơn các phần thông tin chính thống nếu chưa được xác nhận.

---

## Business Logic - Tra cứu học viên

### Định nghĩa các trường dữ liệu

| Trường | Mô tả |
|--------|-------|
| **SoCMT** | Số Căn cước công dân (CCCD) của học viên |
| **MaDK** | Mã đăng ký - là **unique key** cho từng hồ sơ/khóa học |
| **NgaySinh** | Ngày sinh học viên |
| **LoaiDaoTao** | Loại đào tạo: Mô tô hoặc Ô tô |

### Quy tắc nghiệp vụ

1. **Một SoCMT có thể có nhiều MaDK** - Một học viên có thể đăng ký nhiều khóa học/hạng khác nhau
2. **MaDK là unique key** - Mỗi hồ sơ đăng ký có mã duy nhất, dùng để upsert vào `student_lookup_cache`
3. **Tra cứu theo loại đào tạo:**
   - Nút "Tra cứu Mô tô" - Tìm các hồ sơ hạng A1, A/AM
   - Nút "Tra cứu Ô tô" - Tìm các hồ sơ hạng B (số sàn/số cơ khí/số tự động), C1, C, nâng hạng

**Lưu ý:** Không tự ý thêm các hạng A2, D, E, F nếu chưa được xác nhận. Chỉ sử dụng các hạng có trong bộ asset chính thức.

### Quan hệ join quan trọng

- `dbo.NguoiLX.MaDK = dbo.NguoiLX_HoSo.MaDK`
- Từ `MaDK` lấy được `MaKhoaHoc`, `HangDaoTao`, `DuongDanAnh` trong `NguoiLX_HoSo`
- `MaDK` là khóa duy nhất dùng để upsert mỗi hồ sơ/khóa học vào `student_lookup_cache`

### Mapping dữ liệu từ SQL Server sang MySQL

| Trường đích | Nguồn | Ghi chú |
|-------------|-------|---------|
| **MaDK** | `dbo.NguoiLX.MaDK` | Lưu vào `student_lookup_cache.MaDK` |
| **HoVaTen** | `dbo.NguoiLX.HoVaTen` | Giữ nguyên |
| **SoCMT** | `dbo.NguoiLX.SoCMT` | Số CCCD |
| **NgaySinh** | `dbo.NguoiLX.NgaySinh` | varchar(8), format `yyyyMMdd`, frontend hiển thị `dd/mm/yyyy` |
| **GioiTinh** | `dbo.NguoiLX.GioiTinh` | Chuẩn hóa thành `Nam` hoặc `Nữ` |
| **DiaChi** | `NoiCT_MaDVQL` + `NoiCT_MaDVHC` | Join `DM_DVHC.MaDV` → lấy `TenDayDu`. Fallback: `NoiCT`, rồi `NoiTT` |
| **TenKhoaHoc** | `NguoiLX_HoSo.MaKhoaHoc` | Join `KhoaHoc.MaKH` → lấy `KhoaHoc.TenKH` |
| **Hang** | `NguoiLX_HoSo.HangDaoTao` | Join `DM_HangGPLX.MaHang` → lấy `DM_HangGPLX.TenHang` |
| **LoaiDaoTao** | `HangDaoTao` | Bắt đầu bằng "A" → `moto`, còn lại → `oto` |

### Dữ liệu được phép hiển thị trên frontend

**Được hiển thị:**
- HoVaTen
- NgaySinh (đã format `dd/mm/yyyy`)
- GioiTinh (đã format `Nam`/`Nữ`)
- DiaChi
- SoCMT (đã mask, chỉ hiển thị 4 số cuối, ví dụ: `********6377`)
- TenKhoaHoc
- Hang
- photoUrl

**Quy tắc mask SoCMT:**
- Chỉ hiển thị **4 số cuối**
- Ví dụ: `********6377`
- Không hiển thị nhiều hơn 4 số cuối nếu chưa được xác nhận

### Yêu cầu mask SoCMT ở Backend

**SoCMT/CCCD phải được mask ở tầng Backend trước khi trả JSON về Client.**

- API lookup chỉ được trả về SoCMT đã che, ví dụ: `********6377`
- Backend nên trả field public như `soCMTMasked`
- **Tuyệt đối không trả SoCMT thật/full SoCMT về frontend** rồi mới dùng React để che
- Lý do: người dùng có thể mở DevTools/Network Tab để xem JSON response
- Nếu cần dùng SoCMT thật để query thì chỉ xử lý trong server/backend
- Không log raw SoCMT trong lookup log nếu không cần; ưu tiên hash hoặc mask

**KHÔNG được hiển thị trên frontend:**
- MaDK
- MaKhoaHoc
- HangDaoTao
- LoaiDaoTao
- sourceUpdatedAt
- syncedAt
- DuongDanAnh gốc
- IMAGE_BASE_PATH

---

## Quy tắc xử lý và tối ưu ảnh học viên

**Đây là tối ưu dung lượng ảnh, không phải crop ảnh.**

### Đặc điểm ảnh gốc

- Ảnh học viên từ Trung tâm gửi ra mặc định đã là ảnh **3x4cm** và đã được cắt sẵn đúng chuẩn
- Hệ thống **không được crop lại ảnh**
- Ảnh JP2 gốc hiện thường dưới khoảng **49KB**
- Với số lượng lớn (ví dụ 5.000 học viên), tổng dung lượng có thể khoảng **240MB**

### Mục tiêu tối ưu dung lượng

| Chỉ số | Giá trị |
|--------|---------|
| **Target size** | 25–30KB/ảnh |
| **Max acceptable size** | Khoảng 40KB/ảnh (nếu ảnh nhiều chi tiết) |
| **Yêu cầu chất lượng** | Không ép nén quá mạnh làm mờ mặt học viên |

### Quy trình xử lý ảnh

| Bước | Mô tả |
|------|-------|
| **1. Nguồn ảnh** | Ưu tiên `NguoiLX_HoSo.DuongDanAnh` nếu có và file tồn tại |
| **2. Fallback** | Nếu không có, dùng `IMAGE_BASE_PATH\{MaKhoaHoc}\{MaDK}.jp2` |
| **3. Xử lý local** | Chạy trong sync-tool, **không gửi ảnh lên dịch vụ nén ảnh online bên thứ ba** |
| **4. Chuyển đổi** | Đọc ảnh gốc JP2, convert trực tiếp sang JPG đã tối ưu |
| **5. Lưu trữ** | Lưu vào `public/uploads/students/{MaKhoaHoc}/{MaDK}.jpg` |
| **6. MySQL** | Lưu `photoUrl` dạng `/uploads/students/{MaKhoaHoc}/{MaDK}.jpg` |
| **7. Bảo mật** | Không trả đường dẫn nội bộ cho frontend |

### Yêu cầu kỹ thuật xử lý ảnh

**KHÔNG được làm:**
- Không crop
- Không cắt mặt
- Không thay đổi bố cục ảnh
- Không đổi tỷ lệ ảnh gốc

**PHẢI đảm bảo:**
- Giữ nguyên aspect ratio
- Vì ảnh là 3x4, kích thước web đề xuất: **max width 300px** hoặc **max height 400px**
- Chỉ resize nếu ảnh gốc lớn hơn giới hạn
- Xóa metadata thừa để giảm dung lượng
- Dùng JPG progressive nếu phù hợp

### Cơ chế adaptive quality

**Đây là tối ưu dung lượng ảnh, không phải crop ảnh.**

Dùng cơ chế thử nhiều quality level để đạt target size:

```
quality 88 → 85 → 82 → 78
```

**Logic xử lý:**
1. Ưu tiên đạt target size **25–30KB/ảnh**
2. Nếu không đạt target nhưng file **≤40KB** thì chấp nhận
3. Nếu sau quality 78 mà ảnh vẫn **>40KB** thì giữ bản rõ mặt nhất và **log warning**
4. Không tiếp tục ép nén nếu làm mặt học viên bị bệt/mờ

---

## Nguyên tắc checkpoint theo batch (Sync Tool)

Sync tool phải xử lý dữ liệu theo **batch nhỏ** (ví dụ 100–200 records/batch), thay vì coi toàn bộ 5.000 records là một giao dịch duy nhất.

### Quy tắc checkpoint

- Batch 1 thành công → cập nhật checkpoint
- Batch 2 thành công → cập nhật checkpoint
- Batch 3 lỗi ở record nào → log lỗi chi tiết, không checkpoint sai
- Khi chạy lại → retry từ batch lỗi hoặc dựa theo `sourceUpdatedAt`/`MaDK` để tiếp tục an toàn

**KHÔNG được làm:**
- Không cập nhật `last-sync.json` trước khi batch hiện tại được xác nhận xử lý thành công
- Không đánh dấu batch thất bại là đã sync thành công

### Yêu cầu idempotent và an toàn dữ liệu

- Nếu mất mạng ở giữa quá trình sync, lần chạy sau **không được tạo dữ liệu trùng**, **không bỏ sót dữ liệu**, **không tạo dữ liệu rác**
- Vì `MaDK` là unique key nên sync phải **idempotent**: chạy lại cùng record thì upsert/cập nhật, không insert trùng

### Xử lý lỗi riêng biệt

- Nếu một vài record lỗi ảnh nhưng dữ liệu học viên đã sync thành công → **log lỗi ảnh riêng** và không làm fail toàn bộ batch dữ liệu
- Nếu lỗi database trong batch → ưu tiên **transaction** cho phần upsert MySQL để tránh ghi dở dang
- Upload/convert ảnh là file operation nên không rollback giống database → cần **log riêng trạng thái ảnh** và có thể retry ảnh ở lần chạy sau

### Mục tiêu

**Sync có thể dừng giữa chừng và chạy tiếp an toàn.**

### Ví dụ luồng xử lý

1. Đọc batch records từ SQL Server
2. Xử lý ảnh từng record, log lỗi ảnh nếu có
3. Gửi batch data lên server API
4. Server upsert MySQL trong transaction nếu phù hợp
5. Nếu API/server xác nhận batch thành công → sync-tool mới cập nhật checkpoint
6. Nếu batch lỗi → giữ checkpoint cũ, ghi log lỗi và retry theo giới hạn
7. Lần chạy sau tiếp tục từ checkpoint gần nhất hoặc retry các record lỗi theo `MaDK`/`sourceUpdatedAt`

### Công cụ debug/vận hành nội bộ (Sync Tool)

Sync tool cần có chức năng debug nội bộ để kiểm tra dữ liệu của một CCCD cụ thể. Công cụ này **chỉ chạy nội bộ trong sync-tool**, không expose ra frontend public.

**Mục đích:**
- Kiểm tra dữ liệu học viên trước/sau khi sync
- Debug lỗi mapping, lỗi ảnh, lỗi join
- Hỗ trợ vận hành khi cần tra cứu nội bộ

**Thông tin hiển thị khi debug một CCCD:**

| Trường | Mô tả |
|--------|-------|
| `MaDK` | Mã đăng ký (có thể có nhiều nếu học viên đăng ký nhiều khóa) |
| `MaKhoaHoc` | Mã khóa học |
| `HangDaoTao` | Hạng đào tạo gốc từ SQL Server |
| `TenKhoaHoc` | Tên khóa học đã join |
| `Hang` | Tên hạng đã join |
| `LoaiDaoTao` | Loại đào tạo đã mapping (moto/oto) |
| `NgaySinh` | Giá trị raw và giá trị display (dd/mm/yyyy) |
| `GioiTinh` | Giá trị raw và giá trị display (Nam/Nữ) |
| `DiaChi` | Địa chỉ đã mapping từ DVHC |
| `DuongDanAnh` | Đường dẫn ảnh gốc từ SQL Server |
| `Fallback image path` | Đường dẫn fallback nếu DuongDanAnh không có |
| `File exists` | Kiểm tra file ảnh có tồn tại không |
| `photoUrl` | Đường dẫn ảnh đã convert (nếu đã sync) |

**Quy tắc bảo mật debug tool:**
- Chỉ chạy local trong sync-tool
- Không expose qua API public
- Không log secrets (password, connection string) khi debug
- Output debug có thể ghi ra console hoặc file log nội bộ
- Không trả về thông tin debug cho frontend

**Ví dụ lệnh debug (tham khảo):**
```
sync-tool debug --cccd 012345678901
```

---

## Nguyên tắc sắp xếp nội dung website

Website là website chính thức của Trung tâm, không phải website cá nhân hoặc landing page bán hàng. Vì vậy **không được tự ý đẩy nội dung tuyển sinh, hotline, Zalo OA hoặc lời kêu gọi đăng ký lên đầu trang** nếu chưa được xác nhận.

### Thứ tự ưu tiên nội dung

Các phần nội dung public nên được sắp xếp theo hướng chính thống, uy tín:

1. Giới thiệu Trung tâm / nhận diện thương hiệu
2. Thông tin đào tạo và các hạng đào tạo
3. Tra cứu học viên
4. Thông báo
5. Pháp lý / văn bản liên quan
6. Tuyển sinh / đăng ký tư vấn

### Vị trí phần tuyển sinh

- Phần tuyển sinh **không đặt làm nội dung đầu tiên**
- Phần tuyển sinh nên nằm ở **cuối trang** hoặc sau các phần thông tin chính thống
- Không tự ý biến trang chủ thành landing page tuyển sinh
- Không tự ý thêm lời kêu gọi đăng ký quá mạnh nếu chưa được xác nhận
- Các nút như "Đăng ký ngay", "Liên hệ ngay", "Tư vấn ngay" chỉ dùng ở vị trí phù hợp, ưu tiên cuối trang hoặc khu vực tuyển sinh

### Quy tắc hiển thị hotline và Zalo OA

**KHÔNG được làm:**
- Không để lộ hotline hoặc Zalo OA ở các phần đầu trang nếu chưa được xác nhận
- Không đặt hotline/Zalo OA nổi bật ở hero/banner đầu trang nếu chưa được xác nhận
- Không đặt nút Zalo OA nổi cố định trên toàn trang trong giai đoạn hiện tại nếu chưa được xác nhận
- Không hiển thị hotline/Zalo OA trong các phần trên cùng của trang chủ
- Không tự ý thêm số điện thoại, link Zalo hoặc thông tin liên hệ nếu chưa được cung cấp chính thức

**Vị trí cho phép:**
- Footer
- Trang liên hệ (nếu có)
- Phần tuyển sinh ở cuối trang
- Khu vực thông tin liên hệ được phê duyệt

### Menu/navigation

Nếu có menu điều hướng, thứ tự nên ưu tiên thông tin chính thống trước. Mục "Tuyển sinh" **không đặt đầu tiên** nếu chưa được xác nhận. Có thể đặt sau các mục như Trang chủ, Tra cứu, Thông báo, Pháp lý hoặc ở gần cuối menu.

### Yêu cầu giữ UI hiện tại

- Chỉ thay đổi yêu cầu tài liệu ở giai đoạn này
- Không tự ý sửa layout, màu sắc, font, button, header hoặc menu trong code
- Khi sang giai đoạn thiết kế/code, mọi thay đổi về thứ tự menu hoặc vị trí tuyển sinh phải được xác nhận trước

---

## Bộ tài nguyên hình ảnh chính thức

Website sử dụng bộ hình ảnh chính thức do Trung tâm cung cấp. Các hình ảnh này là asset chính thức, không tự tạo lại, không thay đổi phong cách, không thay thế bằng ảnh khác nếu chưa được xác nhận.

### Logo và mascot

| File | Mô tả |
|------|-------|
| `logo-thanh-cong.png` | Logo chính thức của Trung tâm |
| `mascot-car.png` | Xe mascot/xe đại diện hiện tại của website, giữ nguyên như bản đang dùng |

### Hình ảnh phục vụ phần tuyển sinh / khóa học

Các ảnh xe dùng để hiển thị trong phần tuyển sinh, khóa học, hoặc card hạng đào tạo:

| File | Mô tả |
|------|-------|
| `A1.png` | Mô tô hạng A1 |
| `AM.png` | Mô tô hạng A/AM |
| `BSCK.png` | Hạng B số sàn, B số cơ khí và B số tự động |
| `C1.png` | Ô tô tải hạng C1 |
| `C.png` | Ô tô tải hạng C |
| `NH.png` | Nâng hạng |

### Quy tắc sử dụng hình ảnh

**Giữ nguyên:**
- Giữ nguyên tên file
- Khi triển khai code, đặt các file trong `client/src/assets/`

**KHÔNG được làm:**
- Không tự ý đổi màu xe, logo, biển tập lái, tem nhận diện hoặc bố cục ảnh
- Không tự ý thay thế bằng ảnh khác
- Không dùng ảnh có logo thương hiệu xe

**Phạm vi sử dụng:**
- Ảnh được dùng cho giao diện public, đặc biệt là trang chủ, tuyển sinh, khóa học
- Tối ưu dung lượng ảnh public nếu cần, nhưng không làm vỡ logo, không làm nhòe chữ, không làm giảm chất lượng nhận diện thương hiệu

**Lưu ý:**
- Các ảnh này **không phải ảnh học viên runtime**, được phép đưa vào source nếu là asset chính thức của website

### Yêu cầu giữ tỷ lệ ảnh (Aspect Ratio) trên giao diện

Tất cả hình ảnh trên website phải giữ đúng tỷ lệ gốc, không bị méo hoặc kéo giãn khi responsive.

**Yêu cầu CSS/UI:**
- Logo, mascot, ảnh xe, ảnh học viên **không được bị méo** trên mọi kích thước màn hình
- Sử dụng CSS như `object-fit: contain`, `max-width: 100%`, `height: auto`, hoặc `aspect-ratio` để đảm bảo tỷ lệ
- Logo tròn phải **giữ nguyên hình tròn**, không bị kéo thành hình elip
- Ảnh học viên 3x4 phải nằm trong container phù hợp, **không crop**, **không kéo giãn**

**Áp dụng cho:**

| Loại ảnh | Yêu cầu |
|----------|---------|
| Logo Trung tâm | Giữ tỷ lệ gốc, logo tròn phải tròn |
| Mascot xe | Giữ tỷ lệ gốc, không méo |
| Ảnh xe (A1, AM, BSCK, C1, C, NH) | Giữ tỷ lệ gốc, không méo |
| Ảnh học viên 3x4 | Container đúng tỷ lệ 3:4, `object-fit: contain` hoặc `cover` tùy thiết kế, không crop thêm |

**Lưu ý:**
- Khi thiết kế responsive, ưu tiên giảm kích thước thay vì thay đổi tỷ lệ
- Không dùng `width: 100%; height: 100%` cứng nếu container không đúng tỷ lệ ảnh

---

## Yêu cầu bảo mật cơ bản

### Các file không được commit vào repository

- `.env`
- `sync-tool/.env`
- `node_modules`
- `dist`
- `build`
- `sync-tool/temp`
- `sync-tool/dist`
- `last-sync.json`
- `public/uploads/students` (ảnh học viên runtime)
- File log

### Quy tắc bảo mật

1. **Không log secret/password** ra console hoặc file log
2. **API sync bắt buộc header `X-SYNC-SECRET`** - Từ chối request không có header hợp lệ
3. **Không expose đường dẫn nội bộ ra frontend** - Không trả về `IMAGE_BASE_PATH`, `DuongDanAnh` gốc

---

## Yêu cầu giai đoạn sau (Chưa triển khai)

Các yêu cầu sau đây chỉ ghi nhận trong tài liệu, **chưa triển khai trong giai đoạn hiện tại:**

### 1. Bảo mật tra cứu nâng cao

- Rate limiting cho API tra cứu
- Logging tra cứu với SoCMT đã hash
- Cài đặt khung giờ cho phép tra cứu
- Yêu cầu nhập thêm ngày sinh khi tra cứu
- Bật/tắt chức năng tra cứu từ Admin

### 2. Định hướng CMS/Admin hybrid

**Ưu tiên Directus CMS** dùng database riêng để quản lý nội dung public.

**CMS (Directus) quản lý nội dung public:**
- Thông báo
- Văn bản pháp lý
- Nội dung tuyển sinh
- Banner
- FAQ
- File PDF/hình ảnh

**Admin Panel riêng trong website** quản lý chức năng hệ thống:
- Bật/tắt tra cứu
- Bật/tắt tra cứu Mô tô/Ô tô riêng
- Yêu cầu ngày sinh khi tra cứu
- Khung giờ cho phép tra cứu
- Trạng thái sync
- Log sync
- Log lượt tra cứu
- Cài đặt bảo mật

**Quy tắc phân quyền:**
- CMS **không được** đọc hoặc sửa dữ liệu học viên
- Dữ liệu học viên **không được** expose qua CMS
- CMS và Admin Panel tách biệt về chức năng và database

### 3. Cài đặt tra cứu dự kiến

| Cài đặt | Mô tả |
|---------|-------|
| `lookup.enabled` | Bật/tắt chức năng tra cứu toàn bộ |
| `lookup.motoEnabled` | Bật/tắt tra cứu Mô tô |
| `lookup.otoEnabled` | Bật/tắt tra cứu Ô tô |
| `lookup.requireDateOfBirth` | Yêu cầu nhập ngày sinh khi tra cứu |
| `lookup.openTime` | Giờ mở tra cứu (VD: "06:00") |
| `lookup.closeTime` | Giờ đóng tra cứu (VD: "22:00") |
| `lookup.disabledMessage` | Thông báo khi tra cứu bị tắt |

### 4. Tối ưu hệ thống

- Caching cho dữ liệu tra cứu
- CDN cho static assets
- Database optimization
- Performance monitoring

---

## Quản lý kỹ thuật

**Người quản lý:** Giang Quốc Thái

---

**Lưu ý:** Tài liệu này chỉ là requirements. Không tạo source code, package.json, src, App.tsx, main.tsx hoặc cấu trúc project cho đến khi requirements và design được xác nhận.
