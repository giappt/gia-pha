# STATE MANIFEST

### 1. Key Context
- **Dự án:** `gia-pha` — Hệ thống quản lý Gia Phả dòng họ Phạm.
- **Tính năng vừa hoàn tất (Milestone 7.5):** Enforce Cờ `enable_public_tree` — Middleware Auth Gate & Guest Visibility Matrix:
  - `src/lib/auth/auth-gate.ts`: Pure function `evaluateAuthGate` xử lý bypass, phân luồng guest theo `enable_public_tree`.
  - `src/middleware.ts`: Enforce cổng chặn, cookie-first caching TTL 5 phút cho `fat_feature_flags_cache`.
  - `src/app/login-gate/page.tsx` & `src/components/auth/LoginGateAuthButton.tsx`: Trang Login Gate trang trọng với huy hiệu chữ Hán "Phạm" (范), Google OAuth, Dev bypass.
  - `src/app/page.tsx`: Ẩn Spotlight "Ngày Giỗ Gần Nhất" khi `isGuest = true`.
  - `src/components/navbar/Navbar.tsx`: Ẩn Lịch Giỗ & Xưng hô cho guest.
  - `src/components/navigation/MobileBottomNav.tsx`: Đồng bộ nhãn "Xưng hô", ẩn Lịch Giỗ & Xưng hô cho guest.
- **Verification Status:**
  - **Tầng 1 (Compile & Build):** `npm run typecheck` (0 errors), `npm run build` (29/29 routes build sạch 100%).
  - **Tầng 2 (Automated Test Suite):** `npm test` đạt **208/208 tests PASS (0 fail, 0 regression)**.
  - **Tầng 3 (Human UAT):** Đang chờ nghiệm thu thị giác từ User tại `http://localhost:3000`.

### 2. Task Checklist
- [x] Reverse Sync toàn bộ tinh chỉnh thủ công của User vào Specs (`10`, `16`, `01`, `04`, `05`).
- [x] Tạo `src/lib/auth/auth-gate.ts` phân luồng logic Auth Gate.
- [x] Cập nhật `src/lib/supabase/middleware.ts` trả về user và supabase client.
- [x] Cập nhật `src/middleware.ts` enforce Auth Gate và cookie cache.
- [x] Tạo `src/components/auth/LoginGateAuthButton.tsx` (Google OAuth).
- [x] Tạo `src/app/login-gate/page.tsx` (Login Gate Page trang trọng).
- [x] Cập nhật `src/app/page.tsx` ẩn Spotlight Giỗ cho Guest.
- [x] Cập nhật `src/components/navbar/Navbar.tsx` ẩn link nội bộ cho Guest.
- [x] Cập nhật `src/components/navigation/MobileBottomNav.tsx` đổi nhãn "Xưng hô" và lọc tabs cho Guest.
- [x] Cập nhật `src/app/layout.tsx` truyền `isGuest` và `enablePublicTree`.
- [x] Tạo `tests/auth-gate.test.ts` phủ 17 kịch bản kiểm thử tự động (208/208 PASS).
- [x] Tầng 1: Typecheck sạch 0 lỗi, Build thành công 29/29 routes.
- [x] Tầng 2: Automated Tests 208/208 PASS.
- [ ] Tầng 3: Human Visual UAT trên trình duyệt thực tế (`http://localhost:3000`).

### 3. Immediate Next Step
- Bàn giao checklist UAT (UAT_17 ~ UAT_24) để User mở trình duyệt ẩn danh kiểm chứng trên `http://localhost:3000`.
