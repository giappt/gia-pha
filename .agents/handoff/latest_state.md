# STATE MANIFEST

### 1. Key Context
- **Dự án:** FAT (Family Tree Management System - Hệ thống Quản lý Gia phả Dòng họ Trực tuyến).
- **Tech Stack cốt lõi:** Next.js 14.2.35 (App Router), React 18, TypeScript (Strict Mode), TailwindCSS, `@supabase/ssr`, `@supabase/supabase-js`, Zustand, Lucide Icons, Vercel Cron, PWA Web Push.
- **Phong cách Thiết kế (Modern Vietnamese Heritage):**
  - Triết lý kiến trúc mở (Open Architecture), chống lồng hộp "box-in-box", đường kẻ hairline siêu mảnh 1px (`border-slate-200/60`).
  - Phông chữ chuẩn: **Be Vietnam Pro** (`next/font/google`).
  - Màu sắc: Ngọc bích Jade Emerald (`#059669`, `#10B981`), Ánh kim Warm Gold (`#F59E0B`, `#D97706`).
  - Nền bề mặt: Trắng sứ tinh khiết kết hợp quầng sáng lan tỏa `radial-gradient` ngọc bích 7% (light mode) và 12% (dark mode).
- **CSDL & Backend:** Supabase Cloud PostgreSQL (`https://zhwyrbokeajrynfrtswx.supabase.co`). User đã chạy toàn bộ script DDL `supabase/migrations/20260903000000_init_schema.sql` khởi tạo 6 bảng (`clan_settings`, `members`, `users`, `spouse_relations`, `claim_requests`, `push_subscriptions`).
- **Môi trường & Bảo mật:**
  - File `.env.local` đã lưu cấu hình khóa Supabase thật, VAPID keys, `CRON_SECRET`, và đã được `.gitignore` bảo vệ tuyệt đối (kiểm tra `git status` không bị lộ).
  - Git repository đã khởi tạo (`git init`), đã liên kết remote: `git@github.com:giappt/gia-pha.git`.
  - Quy tắc công cụ Node trên Windows: Bắt buộc dùng `npm.cmd` và `npx.cmd` để tránh lỗi PowerShell Execution Policy.
- **Tiến độ đã hoàn thành:**
  - **Phase 1 & 2 (The Shell):** Hoàn tất và đóng băng 100% tài liệu kiến trúc: `idea.md`, `docs/01_Architecture-Blueprint.md` đến `docs/08_Deployment-Environments.md`, `docs/08.5_README.md`, file cấu hình `vercel.json` và `.env.example`.
  - **Milestone 1 (Setup & Auth):** Đã thi công hoàn chỉnh mã nguồn và nghiệm thu qua Vòng lặp Kiểm chứng 3 Tầng:
    - Code: `src/lib/supabase/` (client, server, middleware dùng `getAll`/`setAll` chuẩn mới, tích hợp cơ chế Dev Mock Login an toàn trong môi trường development), `src/middleware.ts`, `src/types/database.ts`, `src/app/auth/callback/route.ts`, `src/app/api/auth/dev-login/route.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/navbar/Navbar.tsx`, `src/components/auth/AuthButton.tsx`.
    - Verification Proof: `tsc --noEmit` đạt 0 lỗi, `next build` compile production thành công 100%, test kết nối CSDL Supabase Cloud thành công, `browser_subagent` kiểm thử UI tại `http://localhost:3000` và trigger nút `[Đăng nhập Google]` thành công với 0 lỗi console.
    - Toàn bộ 7 AC và 3 RG trong `docs/09_Micro-Spec_Milestone_1_Setup_Auth.md` đã được tick `[x]`.
- **Các quyết định nghiệp vụ quan trọng đã chốt:**
  - Bỏ bảng `clan_branches` độc lập; quản lý Master Data Chi tộc trong `clan_settings.branches` (JSONB) với `root_member_id` để tự suy luận con cháu qua thuật toán đồ thị.
  - Mục tiêu cốt lõi ngày mất: Lưu Âm lịch (`death_lunar_day`, `death_lunar_month`, `death_lunar_year_name` Can Chi) phục vụ tính ngày giỗ hằng năm. Dương lịch chỉ là phụ trợ, không bắt buộc nhập năm mất.
  - Hôn nhân nội tộc: Áp dụng cơ chế Ghost Node (🔗) tại nhánh phối ngẫu, tuyệt đối không nhân bản bản ghi trong CSDL (1 ID duy nhất).
  - Thành viên độc lập (Unlinked Node): Cho phép tạo node chưa rõ cha mẹ, có khay lọc riêng S-09, và nối cây tự nhiên bằng cách mở modal chọn Bố/Mẹ là tự động gắn vào cây.
  - Quản lý & Phân quyền User: Đã bổ sung màn hình `S-10: Quản Lý & Phân Quyền Người Dùng` (`/admin/users`) vào `docs/04_UI-UX-Flow.md` và `docs/05_Technical-Blueprint.md`. Email `giap.pt.90@gmail.com` được tự động cấp quyền `super_admin`.

### 2. Task Checklist
- [x] **Phase 1: Ý Tưởng Sản Phẩm & Nghiên Cứu Thị Trường** (`idea.md`)
- [x] **Phase 2: Bộ Hợp Đồng Kỹ Thuật & Kiến Trúc (The Shell)**
  - [x] Bước 1: `/doc-arch` -> `docs/01_Architecture-Blueprint.md`
  - [x] Bước 2: `/doc-glossary` -> `docs/02_Project-Glossary.md`
  - [x] Bước 3: `/doc-db` -> `docs/03_DB-Schema.md` & `supabase/migrations/20260903000000_init_schema.sql`
  - [x] Bước 4: `/doc-ui` -> `docs/04_UI-UX-Flow.md` (9 Màn hình + S-09 Khay chưa nối + S-10 Phân quyền + Modern Heritage UI)
  - [x] Bước 5: `/doc-tech` -> `docs/05_Technical-Blueprint.md` (Tech Stack + 5 Milestones)
  - [x] Bước 6: `/doc-security` -> `docs/06_Security-Threat-Model.md` (Privacy Guard, RBAC, Cron Secret)
  - [x] Bước 7: `/doc-qa` -> `docs/07_Test-QA-Strategy.md` (3-Tier Verification Loop)
  - [x] Bước 8: `/doc-deploy` -> `docs/08_Deployment-Environments.md`, `.env.example`, `vercel.json`
  - [x] Bước 8.5: `/doc-readme` -> `README.md`
- [x] **Phase 3 - Milestone 1: Nền Tảng Dự Án & Đăng Nhập Google Auth**
  - [x] Bước 9: `/feature-brainstorm Milestone 1` -> `implementation_plan.md`
  - [x] Bước 10: `/feature-spec Milestone 1` -> `docs/09_Micro-Spec_Milestone_1_Setup_Auth.md`
  - [x] Bước 11: `/feature-code Milestone 1` -> Thi công Next.js 14, Supabase SSR, Tailwind, Font Be Vietnam Pro, Navbar, AuthButton, Dev-login helper
  - [x] Thực thi Vòng lặp Kiểm chứng 3 Tầng: Compile (PASS 0 lỗi), Test tự động & Trình duyệt ảo (PASS 0 lỗi), Regression Check (PASS)
  - [x] Nghiệm thu Milestone 1 hoàn tất -> `walkthrough.md`
- [ ] **Phase 3 - Milestone 2: Lõi Thuật Toán Gia Phả (Kinship Engine LCA & Lịch Âm - Dương UTC+7)** (Tiếp theo)
- [ ] **Phase 3 - Milestone 3: Dựng Cây Phả Hệ Tương Tác & Ghost Node 🔗 Canvas**
- [ ] **Phase 3 - Milestone 4: Quản Trị Thành Viên 1 Cấp, Excel Bulk Import & Node Chưa Nối Phả**
- [ ] **Phase 3 - Milestone 5: Lịch Giỗ 30 Ngày, Vercel Cron & PWA Web Push Notification**

### 3. Immediate Next Step
- Chạy lệnh: `/feature-brainstorm Milestone 2: Lõi Thuật Toán Kinship Engine & Lịch Âm` tại cửa sổ chat mới.
