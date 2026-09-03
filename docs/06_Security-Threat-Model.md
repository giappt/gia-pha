# BẢO MẬT & MÔ HÌNH ĐE DOẠ (SECURITY & THREAT MODEL)

_Dự án: FAT (Family Tree - Hệ Thống Quản Lý Gia Phả Dòng Họ)_

> **Lệnh dành cho AI (Security Auditor):** Đóng vai "kẻ tấn công có thiện chí". CHỈ phân tích trên các tài liệu được cung cấp (`docs/01_Architecture-Blueprint.md` cho vai trò/phân quyền, `docs/03_DB-Schema.md` cho dữ liệu, `docs/05_Technical-Blueprint.md` cho API/Auth). KHÔNG bịa thêm thực thể/endpoint. Mỗi rủi ro phải kèm một yêu cầu cụ thể để đưa vào Micro-Spec/Code.

---

## 1. TÀI SẢN CẦN BẢO VỆ (ASSETS)

1. **Thông tin Cá nhân Nhạy cảm của Người Còn Sống (PII):** 
   - Số điện thoại, địa chỉ nơi ở, ngày sinh nhật chính xác, các ghi chú đời tư của thành viên có `life_status = 'living'`. Rủi ro bị kẻ xấu thu thập để lừa đảo mạo danh người nhà.
2. **Tính Toàn Vẹn Của Cây Phả Hệ (Tree Data Integrity):**
   - Cấu trúc huyết thống dòng họ (cha, mẹ, con, hôn phối). Rủi ro bị chỉnh sửa sai lệch, đảo lộn thứ bậc, hoặc cố tình tạo vòng lặp phả hệ (vandalism).
3. **Quyền Hạn Quản Trị & Duyệt Thành Viên (Administrative Control):**
   - Quyền hạn `super_admin` và `branch_editor`. Tránh bị chiếm quyền hoặc vượt cấp phê duyệt trái phép `claim_requests`.
4. **Bí Mật Hạ Tầng & Khóa Mật Mã (Infrastructure Secrets):**
   - `SUPABASE_SERVICE_ROLE_KEY` (Quyền can thiệp sâu DB).
   - `CRON_SECRET` (Bảo vệ tiến trình Vercel Cron quét ngày giỗ hằng ngày).
   - `VAPID_PRIVATE_KEY` (Khóa ký thông báo đẩy Web Push).

---

## 2. MA TRẬN ĐE DOẠ (THREAT MATRIX)

| **Tài sản** | **Đe doạ (Threat)** | **Ảnh hưởng** | **Biện pháp giảm thiểu (Mitigation)** |
|---|---|---|---|
| **Dữ liệu người còn sống** | Thu thập tự động (Web Scraping / Crawling PII) | Rò rỉ thông tin cá nhân của con cháu | **Living Person Privacy Guard:** Route Handlers & RLS tự động che (`phone`, `address`, `notes`) đối với role `viewer`. |
| **Node phả hệ** | Mạo danh nhận node (Fake Claim Attack) | Nhận bừa cụ/ông/bác làm mình để chiếm quyền | **Approval Gate:** Bắt buộc có Super Admin phê duyệt; Cột `linked_member_id UNIQUE` ngăn 1 node bị 2 người nhận. |
| **Cây gia phả** | Chỉnh sửa trái thẩm quyền (IDOR / Unauthorized Write) | Trưởng Chi này sửa dữ liệu của Chi khác | **RBAC & Branch Validation:** `branch_editor` chỉ được sửa thành viên thuộc phạm vi cây con (subtree) của chi mình phụ trách. |
| **Endpoint Lịch giỗ** | Kích hoạt trái phép Cron Job (`/api/cron/anniversary`) | Bắn thông báo spam liên tục, tốn quota Vercel | **Bearer Token Check:** Bắt buộc kiểm tra Header `Authorization: Bearer CRON_SECRET` khớp với cấu hình Vercel. |
| **Công cụ Import** | File Excel độc hại / Cố tình tạo vòng lặp (Cycle Attack) | Làm sập thuật toán đệ quy hoặc nghẽn bộ nhớ | Giới hạn file < 5MB; chạy thuật toán Topological Sort / Cycle Detection trước khi insert vào DB. |
| **CSDL Supabase** | Tấn công tiêm mã (SQL Injection) | Rò rỉ hoặc xóa sạch CSDL | Sử dụng 100% Parameterized Queries qua Supabase Client SDK; không ghép chuỗi SQL thô. |
| **Giao diện Web** | Tấn công XSS khi hiển thị Tên / Ghi chú phả hệ | Đánh cắp session cookie của Admin | React DOM tự động escape HTML; cấu hình Content Security Policy (CSP) nghiêm ngặt. |

---

## 3. CHECKLIST BẢO MẬT

### Authentication (Xác thực)
- [x] Đăng nhập 100% qua Google OAuth 2.0 (Supabase Auth); không lưu mật khẩu plaintext trong hệ thống.
- [x] Session được mã hóa và lưu trữ trong `httpOnly`, `Secure`, `SameSite=Lax` Cookie qua `@supabase/ssr`.
- [x] Tự động làm mới (refresh) token phiên làm việc; cơ chế đăng xuất thu hồi session lập tức.

### Authorization (Phân quyền & RLS)
- [x] Bật Row Level Security (RLS) trên 100% các bảng trong CSDL (`clan_settings`, `members`, `spouse_relations`, `users`, `claim_requests`, `push_subscriptions`).
- [x] Mọi API Route ghi (`POST`, `PUT`, `DELETE`) bắt buộc kiểm tra quyền qua middleware/server handler.
- [x] Khóa chặn IDOR: `branch_editor` chỉ có quyền thao tác trên cây con thuộc chi nhánh được gán (`assigned_branch_code`).

### Input & Data Protection
- [x] Bật lá chắn Privacy Guard: Trả về dữ liệu đã lược bỏ (omitted) các trường nhạy cảm cho khách vãng lai.
- [x] Ràng buộc miền giá trị dữ liệu chặt chẽ ở cấp DB: `death_lunar_day BETWEEN 1 AND 30`, `gender IN ('male', 'female', 'other')`.
- [x] Thuật toán phát hiện chu trình (Cycle Detection) ngăn chặn tuyệt đối việc tạo con làm cha mẹ của cụ tổ.

### Secrets & Hạ tầng Vercel / Supabase
- [x] Tuyệt đối KHÔNG commit file `.env` hoặc `.env.local` chứa khóa bí mật vào GitHub Repo.
- [x] Khóa `SUPABASE_SERVICE_ROLE_KEY` chỉ được dùng ở Server-side (Route Handlers / Cron), CẤM phơi bày ra Client qua `NEXT_PUBLIC_`.
- [x] Endpoint Cron Job được bảo vệ bằng `CRON_SECRET`.

---

## 4. YÊU CẦU BẢO MẬT BẮT BUỘC (SECURITY REQUIREMENTS)

Đây là các tiêu chuẩn bắt buộc phải tuân thủ nghiêm ngặt khi viết mã nguồn:

- **SEC-01 (Privacy Masking Filter):**
  Tại `/api/tree` và `/api/members`, nếu người gọi có role `viewer` (chưa đăng nhập hoặc chưa được duyệt claim), hệ thống BẮT BUỘC phải gán `phone = null`, `address = null`, `notes = null`, và chỉ hiển thị `birth_year` (ẩn ngày/tháng sinh chính xác) đối với mọi thành viên có `life_status = 'living'`.
- **SEC-02 (Cron Route Authentication):**
  Route Handler `/api/cron/anniversary/route.ts` BẮT BUỘC phải kiểm tra header:
  `request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}``. Nếu không khớp, lập tức trả về HTTP `401 Unauthorized`.
- **SEC-03 (Single Node Claim Lock):**
  Khi phê duyệt một `claim_request`, hệ thống BẮT BUỘC phải chạy trong Database Transaction:
  1. Kiểm tra node `member_id` đó đã có `linked_member_id` ở bảng `users` chưa.
  2. Nếu đã có người khác liên kết $\rightarrow$ Hủy bỏ và trả về HTTP `409 Conflict` (`ALREADY_CLAIMED`).
  3. Nếu chưa $\rightarrow$ Cập nhật `linked_member_id` cho user và cập nhật `claim_status = 'approved'`.
- **SEC-04 (Anti-Cycle Guard for Relationships):**
  Trước khi tạo hoặc cập nhật quan hệ cha-con (`father_id`, `mother_id`), Backend BẮT BUỘC phải chạy truy vấn kiểm tra đệ quy: Nếu `new_parent_id` là con cháu (descendant) của `target_member_id`, lập tức từ chối và trả về HTTP `400` (`CYCLE_DETECTED`).
- **SEC-05 (Excel Bulk Ingestion Sandbox):**
  API nhận file Excel `/api/admin/import` chỉ chấp nhận định dạng `.xlsx`, giới hạn kích thước tối đa 5MB, và BẮT BUỘC phải thực hiện kiểm tra toàn vẹn bộ nhớ (Dry-run validation) trước khi thực hiện ghi vào CSDL.
