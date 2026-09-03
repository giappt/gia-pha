# STATE MANIFEST
### 1. Key Context
- **Dự án:** FAT (Family Tree Management System - Quản Lý Gia Phả Dòng Họ).
- **Tech Stack:** Next.js 14 App Router, TypeScript, TailwindCSS, Supabase Cloud (PostgreSQL + Auth), Lucide Icons, Shadcn/Radix UI.
- **Git State:** Đã commit toàn bộ Milestone 1 và push thành công lên nhánh chính `origin/main` (commit `ea25b68: add ms 01`).
- **Giao diện:** Đã hoàn tất chuyển đổi sang phong cách Modern Vietnamese Heritage (nền trắng sứ, quầng sáng ngọc bích Emerald `#059669`, viền hairline 1px `border-slate-200/60`, font Be Vietnam Pro, loại bỏ hoàn toàn cấu trúc bo tròn lồng hộp box-in-box).
- **Cơ chế Dev Mock Login (Bypass Google OAuth):**
  - Đã tích hợp `/api/auth/dev-login` (chỉ mở ở `development`) cấp quyền Super Admin (`giap.pt.90@gmail.com`) qua cookie `fat_dev_user`.
  - Giúp phát triển và test tính năng quản trị mượt mà ngay cả khi môi trường mạng chặn Google OAuth / Supabase Auth.
- **Tính năng Cài đặt Dòng họ (`/admin/settings`):**
  - Đã xây dựng layout bảo vệ phân quyền `src/app/admin/layout.tsx`.
  - Đã tạo trang cài đặt `src/app/admin/settings/page.tsx` cho phép đổi tên dòng họ với giới hạn cứng `maxLength={40}` (tối thiểu 2 ký tự), có bộ đếm ký tự `(X/40)` và Live Preview box.
  - Đã tạo API `PATCH /api/clan-settings` và cơ chế chống vỡ giao diện Hero trên trang chủ (`text-balance`, `break-words`, adaptive font size).
- **Milestone 2 - Trạng thái Spec:**
  - Đã khởi tạo hoàn chỉnh file Đặc tả Vi mô `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md` theo đúng mẫu chuẩn và quy tắc kiến trúc (Tách rời Lõi Đồ thị DAG tìm LCA và Bộ Từ điển Vùng miền; Lõi Lịch Âm - Dương UTC+7; Giao diện `/kinship`).

### 2. Task Checklist
- [x] Khởi tạo dự án Next.js 14, Supabase client/server/middleware, TailwindCSS và font Be Vietnam Pro (Milestone 1).
- [x] Tái thiết kế toàn bộ giao diện từ box-in-box cũ kỹ sang Modern Vietnamese Heritage tươi sáng.
- [x] Xây dựng cơ chế Dev Mock Login Bypass Google OAuth khi mạng nội bộ bị chặn.
- [x] Xây dựng trang Cài đặt Dòng họ `/admin/settings`, API `/api/clan-settings` kèm giới hạn 40 ký tự chống vỡ giao diện.
- [x] Commit và Push toàn bộ mã nguồn Milestone 1 lên GitHub (`origin/main`).
- [x] Khởi tạo tài liệu Đặc tả Kỹ thuật Vi mô `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md` cho Milestone 2.
- [ ] Chạy lệnh `/feature-code` để thi công mã nguồn Milestone 2:
  - [ ] Xây dựng `src/lib/kinship-engine/lca-finder.ts` (Lõi toán học đồ thị tìm LCA, tính khoảng cách thế hệ $\Delta G$).
  - [ ] Xây dựng `src/lib/kinship-engine/regional-dictionaries.ts` (Từ điển xưng hô 3 miền Bắc - Trung - Nam).
  - [ ] Xây dựng `src/lib/lunar/vietnamese-lunar.ts` (Quy đổi Âm - Dương UTC+7, Tháng Nhuận & Can Chi).
  - [ ] Xây dựng API `/api/kinship/route.ts` (Phân tích huyết thống & breadcrumbs).
  - [ ] Xây dựng Màn hình Tra cứu Vai vế `/kinship` (`src/app/kinship/page.tsx`).
  - [ ] Viết bộ Unit Test (`tests/kinship.test.ts`, `tests/lunar.test.ts`) kiểm chứng 100% 7 kịch bản Test Cases trong Spec.

### 3. Immediate Next Step
- Chạy lệnh `/feature-code` để bắt đầu thi công mã nguồn cho Milestone 2 (Lõi Thuật toán Kinship Engine & Lịch Âm) bám sát 100% tài liệu `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md`.
