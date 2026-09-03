# STATE MANIFEST
### 1. Key Context
- **Dự án:** FAT — Family Tree Management System (Hệ Thống Quản Lý Gia Phả Dòng Họ).
- **Môi trường & Git:**
  - Nhánh: `main` — Các commit gần nhất:
    - `71e19e8`: docs: add lesson 15 on next dev and next build cache conflict.
    - `8364f16`: fix(kinship): implement zero-latency in-memory resolver and live reactive UI.
    - `cb84471`: docs: close milestone 2, tick UAT checklist and add rule 14 browser rate guard.
    - `55bbee7`: update agent (lưu bản nháp promote profile v4).
- **Nâng cấp Hệ thống Toàn cầu (Global Profile v4):**
  - Đã thăng cấp thành công Global Profile `software-engineer` lên `Version 4` tại `~/.gemini/config/profiles/software-engineer/template_AGENTS.md` và `CHANGELOG.md` với 3 nguyên tắc tối thượng:
    1. Browser Subagent Pre-flight Gate & Rate Guard (Quy tắc 14).
    2. Spec Contract & Test Truth Hierarchy (Quy tắc 13).
    3. Scratchpad & Self-Cleanup Policy (Quy tắc 12).
- **Trạng thái Hoàn thành Milestone 2 (Kinship Engine & Lịch Âm):**
  - **Lõi Thuật toán & API:** `lca-finder.ts`, `regional-dictionaries.ts`, `vietnamese-lunar.ts`, `/api/kinship`.
  - **Dữ liệu mẫu 7 thế hệ:** `mock-data.ts` gồm 26 thành viên đa chi, đa thê, con nuôi, hôn nhân nội tộc.
  - **Trang Tra cứu Vai vế:** `src/app/kinship/page.tsx` gồm Sơ đồ Cây Chữ V Ngược từ LCA, Smart Folding nén tầng trung gian, Thẻ Diễn Giải Phong Tục Cấu Trúc Hóa và 4 kịch bản mẫu.
  - **Khắc phục triệt để lỗi đóng băng giao diện (Zero-Latency Live Reactivity):**
    - Chuyển toàn bộ cơ chế tính toán sang In-Memory Client (< 1ms), thoát ly khỏi sự phụ thuộc vào mạng ngoài.
    - Live Reactivity: Tự động tính toán lại tức thì khi thay đổi dropdown Người A/B hoặc tab Vùng miền.
    - Tự động xóa sạch ô tìm kiếm khi click nút kịch bản mẫu.
    - Bổ sung `api/kinship` vào danh sách loại trừ trong `src/middleware.ts` để giải phóng khỏi độ trễ `supabase.auth.getUser()`.
  - **Khắc phục lỗi đụng độ bộ nhớ đệm Next.js (`Cannot find module './602.js'`):**
    - Xử lý xung đột khi `npm run build` ghi đè thư mục `.next/` trong khi `next dev` đang chạy.
    - Đã dọn dẹp tiến trình cũ và khởi động lại dev server sạch sẽ trên cổng `http://localhost:3000`.
- **Hệ thống Kiểm thử & Tài liệu:**
  - Build & Typecheck: 10/10 routes PASS 100%, 0 lỗi TypeScript.
  - Unit tests: 12/12 tests PASS (Kinship 8/8, Lunar 4/4).
  - Đã tick `[x]` trọn vẹn 100% Tiêu chí Nghiệm thu (`AC1–AC13`) và Bảo vệ Chống thoái lui (`RG01–RG06`) trong `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md`.
  - Đã lưu đầy đủ 15 bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`.

### 2. Task Checklist
- [x] Khởi tạo dự án Next.js 14, Supabase, TailwindCSS, font Be Vietnam Pro (Milestone 1).
- [x] Tái thiết kế giao diện Modern Vietnamese Heritage.
- [x] Dev Mock Login Bypass Google OAuth.
- [x] Trang Cài đặt Dòng họ `/admin/settings`.
- [x] Commit & Push Milestone 1.
- [x] Khởi tạo tài liệu Micro-Spec Milestone 2.
- [x] Xây dựng `lca-finder.ts` (LCA + khoảng cách thế hệ).
- [x] Xây dựng `regional-dictionaries.ts` (Từ điển xưng hô 3 miền + phong tục cấu trúc hóa).
- [x] Xây dựng `vietnamese-lunar.ts` (Âm - Dương UTC+7, Can Chi).
- [x] Xây dựng API `/api/kinship/route.ts`.
- [x] Xây dựng `/kinship/page.tsx` (Cây Chữ V Ngược, Smart Folding, Thẻ Phong Tục, 4 nút mẫu).
- [x] Mở rộng `mock-data.ts` lên 26 thành viên, 7 đời, 3 chi.
- [x] Unit tests 12/12 PASS + Build 10/10 PASS.
- [x] Đồng bộ tài liệu kiến trúc: `05_Technical-Blueprint.md`, `03_DB-Schema.md`, `04_UI-UX-Flow.md`.
- [x] Hoàn thành UAT thực tế trên trình duyệt cho Milestone 2.
- [x] Ban hành Quy tắc 14 (Rate Guard) vào Local `AGENTS.md`.
- [x] Thăng cấp Global Profile `software-engineer` lên Version 4.
- [x] Khắc phục triệt để lỗi đóng băng giao diện `/kinship` (Zero-Latency Live Reactivity & Middleware Bypass).
- [x] Khắc phục lỗi đụng độ cache build (`./602.js`) và khởi động lại dev server sạch sẽ.
- [x] Hoàn tất 100% Milestone 2 (Đã nghiệm thu AC1–AC13, RG01–RG06).

### 3. Immediate Next Step
- Khởi động **Milestone 3: Cây Phả Hệ Tương Tác Canvas Toàn Màn Hình (@xyflow/react v12)**:
  - Chạy `/feature-brainstorm` cho Milestone 3.
  - Thiết kế Canvas đồ thị phả hệ quy mô lớn: Node tùy biến phong cách Jade Heritage, hỗ trợ đa thê (vợ cả/hai), con nuôi, Ghost Node 🔗 khi kết hôn nội tộc và tiếp nhận Deep Link camera focus từ `/kinship`.
