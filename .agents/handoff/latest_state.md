# STATE MANIFEST
### 1. Key Context
- **Nền tảng & Dự án:** FAT (Family Tree Management System) - Gia Phả Phạm Văn (Next.js 14 App Router, Supabase, TailwindCSS, TypeScript).
- **Trạng thái Git:** Commit `4cc971e update splash` đã được commit và push lên `origin/main` thành công 100%. `git status` sạch hoàn toàn (`working tree clean`).
- **Nhiệm vụ vừa hoàn thành (Zero-React Splash & Pure OS Native Splash):**
  - Loại bỏ hoàn toàn React Splash Screen Overlay (`AppSplashScreen`): gỡ bỏ khỏi `src/app/layout.tsx`, component `src/components/pwa/AppSplashScreen.tsx` trả về `null` (zero DOM footprint).
  - Triệt tiêu 100% tình trạng 2 màn hình Splash kế tiếp nhau trên Android PWA / iOS.
  - Tối ưu Native Splash duy nhất của OS: Icon `purpose: "any"` (`icon-512x512.png` & `icon-192x192.png`) là chữ Hán "范" thư pháp màu ngọc bích `#059669` trên nền trắng/trong suốt kết hợp `background_color: "#ffffff"`. Khởi động chớp mắt (~0.3s - 0.5s) rồi vào thẳng app.
  - Launcher icon ngoài màn hình chính Android: Giữ nguyên `icon-512x512-maskable.png` nền xanh tròn/vuông chuẩn Google Safe Zone 40%.
  - Cơ chế điều hướng: Trực tiếp qua Auth Gate & Next.js Middleware (`user === null` vào `/login-gate`, thành viên đã đăng nhập vào `/`).
  - Bảo tồn `ClanHanCalligraphyWriter.tsx` làm component nghệ thuật độc lập cho dòng họ.
- **Kết quả Kiểm chứng 3 Tầng (`[R-VERIFY.TIERS]`):**
  - Tầng 1: `npm run typecheck` (0 lỗi), `npm run build` (31/31 pages biên dịch thành công 100%).
  - Tầng 2: `npm test` (Toàn bộ 339/339 tests PASS 100%, 0 regression).
  - Tầng 3: Sẵn sàng phục vụ Human UAT tại `http://localhost:3000`.
- **Tài liệu & Đồng bộ:**
  - `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`: Đã cập nhật mục 5.18, 7.1 (`TC_UT_ZERO_REACT_SPLASH_IN_LAYOUT`, `TC_UT_AUTH_GATE_DIRECT_ROUTING`), 7.2 (UAT_42-UAT_44), Mục 8 (RG40-RG43) và tick `[x] PASS`.
  - `.agents/brain/lessons_learned.md`: Đã bổ sung bài học kinh nghiệm Zero-React Splash.
- **Các file đang mở:**
  - `docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md`
  - `.agents/brain/lessons_learned.md`
  - `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`
  - `.agents/backlog/001_dang-ky-nhan-push-thong-minh-theo-chi-nhanh.md`
  - `.agents/backlog/002_phan-quyen-phan-cap-cay-con-va-duyet-claim.md`
  - `.agents/AGENTS.md`

### 2. Task Checklist
- [x] Brainstorm & thống nhất giải pháp Zero-React Splash (/feature-brainstorm)
- [x] Cập nhật Đặc tả kỹ thuật vi mô Milestone 5 (/feature-spec)
- [x] Gỡ bỏ `<AppSplashScreen />` khỏi `src/app/layout.tsx`
- [x] Làm sạch `src/components/pwa/AppSplashScreen.tsx` trả về `null`
- [x] Cập nhật test suite `tests/pwa-assets.test.ts`
- [x] Chạy Typecheck & Build kiểm chứng (0 lỗi, 31/31 pages pass)
- [x] Chạy Automated Test Suite (339/339 tests PASS 100%)
- [x] Reverse-Sync cập nhật `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`
- [x] Ghi bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`
- [x] Commit và Push lên Git `main` (`4cc971e`)
- [ ] User Human Visual UAT kiểm tra khởi động PWA trên thiết bị thực tế
- [ ] Tiếp tục backlog tiếp theo (ví dụ: `001_dang-ky-nhan-push-thong-minh-theo-chi-nhanh.md` hoặc `002_phan-quyen-phan-cap-cay-con-va-duyet-claim.md`)

### 3. Immediate Next Step
- Chọn một ý tưởng tiếp theo từ Kho Ý tưởng (`.agents/backlog/`) bằng lệnh `/idea-get` HOẶC nghiệm thu thị giác Human UAT trên điện thoại/trình duyệt.
