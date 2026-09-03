# STATE MANIFEST
### 1. Key Context
- **Dự án:** FAT — Family Tree Management System (Gia Phả Dòng Họ)
- **Nhánh Git:** `main` — commit `2996cf5` "code milestone 2" đã push lên `origin/main`.
- **Trạng thái Milestone 1:** Hoàn thành 100% (Next.js 14, Supabase, Modern Vietnamese Heritage UI, Dev Mock Auth, Clan Settings).
- **Trạng thái Milestone 2 — Kinship Engine & Lịch Âm:**
  - **Lõi backend hoàn chỉnh:** `lca-finder.ts`, `regional-dictionaries.ts`, `vietnamese-lunar.ts`, `api/kinship/route.ts`.
  - **Bộ dữ liệu mẫu:** `mock-data.ts` gồm 26 thành viên, 7 thế hệ, 3 chi, vợ cả/vợ hai, con nuôi, hôn nhân nội tộc.
  - **UI Kinship page:** `src/app/kinship/page.tsx` — Sơ đồ Cây Chữ V Ngược từ LCA, Smart Folding, Thẻ Phong Tục Cấu Trúc Hóa, 4 nút kịch bản mẫu.
  - **Unit tests:** 12/12 PASS (kinship + lunar).
  - **Build:** 10/10 routes, 0 lỗi TypeScript.
- **Tài liệu đã đồng bộ:** `05_Technical-Blueprint.md` (§4 Milestone 2/3/4), `03_DB-Schema.md` (`is_adopted`), `04_UI-UX-Flow.md` (S-03), `10_Micro-Spec_Milestone_2_Kinship_Lunar.md` (TC08–TC11, AC7–AC10, RG04–RG05).
- **Bài học quan trọng ghi nhận:** Lạm dụng `browser_subagent` 4 lần liên tiếp gây 429 quota exhausted; quy trình đúng là verify bằng `curl` trước rồi gọi browser 1 lần duy nhất. Khởi tạo state `'use client'` từ mock data trực tiếp (không chỉ dựa `useEffect` fetch).
- **Dev server:** `npm run dev` đang chạy tại `http://localhost:3000`.

### 2. Task Checklist
- [x] Khởi tạo dự án Next.js 14, Supabase, TailwindCSS, font Be Vietnam Pro (Milestone 1).
- [x] Tái thiết kế giao diện Modern Vietnamese Heritage.
- [x] Dev Mock Login Bypass Google OAuth.
- [x] Trang Cài đặt Dòng họ `/admin/settings`.
- [x] Commit & Push Milestone 1.
- [x] Khởi tạo tài liệu Micro-Spec Milestone 2.
- [x] Xây dựng `lca-finder.ts` (LCA + khoảng cách thế hệ).
- [x] Xây dựng `regional-dictionaries.ts` (Từ điển xưng hô 3 miền + `attachStructuredMetadata`).
- [x] Xây dựng `vietnamese-lunar.ts` (Âm - Dương UTC+7, Can Chi).
- [x] Xây dựng API `/api/kinship/route.ts`.
- [x] Xây dựng `/kinship/page.tsx` (Cây Chữ V Ngược, Smart Folding, Thẻ Phong Tục, 4 nút mẫu).
- [x] Mở rộng `mock-data.ts` lên 26 thành viên, 7 đời, 3 chi.
- [x] Unit tests 12/12 PASS + Build 10/10 PASS.
- [x] Đồng bộ kiến trúc vào `05_Technical-Blueprint.md`, `03_DB-Schema.md`, `04_UI-UX-Flow.md`.
- [x] Commit & Push Milestone 2 (`2996cf5`).
- [x] **AC7–AC10, RG04–RG05:** User UAT trực tiếp trên trình duyệt xác nhận đạt 100% → Đã tick `[x]` toàn bộ trong `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md`.
- [x] Ban hành **Quy tắc 14 (Browser Subagent Pre-flight Gate & Rate Guard)** vào `.agents/AGENTS.md` để chống lãng phí token vĩnh viễn.

### 3. Immediate Next Step
- Khởi động **Milestone 3: Cây Phả Hệ Tương Tác Canvas Toàn Màn Hình (@xyflow/react v12)**:
  - Chạy `/feature-brainstorm` hoặc `/feature-spec` cho Milestone 3.
  - Thiết kế Canvas đồ thị phả hệ lớn: Node tùy biến phong cách Jade Heritage, hỗ trợ Đa thê (vợ cả/hai), Con nuôi, Ghost Node 🔗 khi kết hôn nội tộc, và tiếp nhận Deep Link focus camera từ `/kinship`.

### 4. Process Fix Applied — Quy tắc 14 Bổ Sung vào AGENTS.md
- Đã chính thức luật hóa **Quy tắc 14** vào `.agents/AGENTS.md`:
  1. Cấm dùng browser để debug mò lỗi.
  2. Cổng Pre-flight bắt buộc: Build pass 0 lỗi + Unit test pass 100% + curl verify API hợp lệ trước khi gọi browser.
  3. Single-shot verification: Gom toàn bộ kịch bản test vào 1 lần chạy browser duy nhất.
  4. Hard stop khi fail: Dừng lại hỏi User, tuyệt đối không retry làm cháy quota.
  5. Luôn neo viewport chuẩn 1280x800 ở bước đầu tiên.

