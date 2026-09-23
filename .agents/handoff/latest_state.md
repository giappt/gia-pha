# STATE MANIFEST
### 1. Key Context

**Dự án:** FAT — Hệ thống Quản lý Gia Phả (Family Tree Management)
**Tech Stack:** Next.js 14 App Router, React, TypeScript, TailwindCSS, Supabase, React Flow
**Dev Server:** `npm run dev` đang chạy tại `http://localhost:3000`
**Test Baseline:** 320/320 tests PASS (34 suites), Typecheck 0 lỗi, Build 31/31 routes thành công

**Phiên này giải quyết 3 nhóm vấn đề lớn:**

**Nhóm A — PWA Install Synchronization (Home vs Login Gate):**
- Brainstorm xong căn nguyên: `deferredPrompt` bị mất khi unmount component → chọn Phương án 1 (Mini Banner trong Auth Card).
- Đã cập nhật Spec `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md` (Section 5.14, TC_UT mới, UAT_36, RG29–RG30).
- Đã code xong toàn bộ: `src/lib/pwa/pwa-store.ts` (Singleton PWA Store), `src/components/pwa/InstallPwaButton.tsx` (xóa alert, thêm Modal hướng dẫn), `src/app/login-gate/page.tsx` (Mini Banner PWA 2 tầng), `src/components/pwa/ServiceWorkerRegister.tsx` (tích hợp PWA Store).
- Đã kiểm chứng 3 tầng PASS.
- Đã ghi lesson learned về Singleton PWA Store, Two-Tier Mini Banner Layout, loại bỏ alert().

**Nhóm B — Triệt tiêu rò rỉ dữ liệu tạm (Zero Mock Leak) & Chuẩn hóa thương hiệu:**
- Brainstorm xong căn nguyên: Dữ liệu mock họ Nguyễn rò rỉ qua useState initial state + API fallback ngầm + 8 chip kịch bản mẫu hardcoded + chuỗi fallback `'DÒNG HỌ NGUYỄN VĂN'` ở 15 vị trí.
- Đã code xong: Dọn sạch `src/app/kinship/page.tsx` (state rỗng, Skeleton Loading, Empty State, xóa 8 chip), cắt fallback ngầm trên 6 API routes, phân lập test fixture (cờ `npm_lifecycle_event === 'test'` / header `x-test-fixture`), chuẩn hóa 100% fallback thương hiệu thành `'GIA PHẢ PHẠM VĂN'` trên 10+ files.
- Đã bổ sung 4 test AST integrity.
- Đã kiểm chứng 3 tầng PASS: Typecheck 0 lỗi, Test 315/315, Build 31/31 routes.
- Đã tick `[x]` AC51–AC56 và RG28–RG30 trong Spec.

**Nhóm C — Phản Hồi Chuyển Màn Toàn Cục & Kiến Trúc Cây Phả Hệ 1.500 Người:**
- Brainstorm phân tích căn nguyên Zero Navigation Feedback (không có `loading.tsx`, không có progress bar, không có pending state trên nav) và rủi ro DOM/UX khi scale 1.500 người (DOM bloat ~40K elements, main thread freeze 300-800ms).
- Giải đáp 3 câu hỏi User: (1) Skeleton cho TẤT CẢ màn hình, không chỉ phả hệ; (2) Progress bar đồng bộ biến CSS `--brand-primary`/`--brand-glow`, không hardcode màu; (3) Khách/người chưa liên kết xem mặc định Thủy Tổ + 3 đời đầu + banner gợi ý nhận node.
- Đã cập nhật Spec `docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md` (AC11–AC15, RG04–RG06, TC_UT11–TC_UT15, UAT_08–UAT_11) và `docs/04_UI-UX-Flow.md`.
- Đã code xong toàn bộ:
  - `src/app/globals.css`: Biến màu `--brand-primary`, `--brand-glow` và keyframe shimmer animation.
  - `src/components/navigation/TopProgressBar.tsx` [MỚI]: Thanh 3px cố định đỉnh trang, shimmer ngọc bích, kích hoạt 50ms khi click link.
  - `src/app/layout.tsx`: Tích hợp `TopProgressBar`.
  - `src/components/navigation/MobileBottomNav.tsx`: Pending state, active bounce `scale-95`, haptic feedback `navigator.vibrate(10)`.
  - `src/app/loading.tsx` [MỚI]: Global Root Skeleton.
  - `src/app/tree/loading.tsx` [MỚI]: Skeleton Canvas Cây Phả Hệ.
  - `src/app/anniversaries/loading.tsx` [MỚI]: Skeleton Lịch Giỗ.
  - `src/app/kinship/loading.tsx` [MỚI]: Skeleton Tra Cứu Xưng Hô.
  - `src/app/admin/loading.tsx` [MỚI]: Skeleton Quản Trị Dòng Họ.
  - `src/components/tree/FamilyTreeCanvas.tsx`: Cấu hình `onlyRenderVisibleElements={true}` (Viewport Virtualization) + Banner đón tiếp Khách/Unlinked User.
- Đã bổ sung 5 tests mới TC_UT11–TC_UT15 trong `tests/theme-and-layout.test.ts`.
- Đã kiểm chứng 3 tầng PASS: Typecheck 0 lỗi, Test 320/320 (nâng từ 315), Build 31/31 routes.
- Đã tick `[x]` AC11–AC15 và RG04–RG06 trong Micro-Spec.
- Đã ghi bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`.
- Đã bàn giao kịch bản Human Visual UAT (UAT_08 đến UAT_11) cho User.

**Quyết định kiến trúc quan trọng:**
- Cơ chế phân lập test fixture: API route nhận diện `process.env.npm_lifecycle_event === 'test' || process.argv.some(a => a.includes('test')) || request.headers.get('x-test-fixture') === 'true'` → cho phép mock chỉ trong test runner, runtime thật trả rỗng.
- `FamilyTreeCanvas.tsx` giữ import `sample-data` cho dataset switcher debug (`polygamy`, `clan1500`), nhưng runtime mặc định (`live`) chỉ vẽ dữ liệu từ DB.
- Thương hiệu fallback toàn hệ thống thống nhất: `'GIA PHẢ PHẠM VĂN'`.
- Theme-Tokenized Navigation: Toàn bộ progress bar, skeleton, shimmer đều sử dụng CSS Variables (`--brand-primary`, `--brand-glow`) → đổi màu chủ đề 1 chỗ, tự động lan tỏa toàn app.
- Viewport Virtualization: `onlyRenderVisibleElements={true}` giữ DOM < 100 nodes dù cây có 1.500+ người → chống crash OOM trên mobile.

### 2. Task Checklist

**Nhóm A — PWA Install Synchronization:**
- [x] Brainstorm phân tích căn nguyên gốc rễ lỗi `deferredPrompt` và lệch giao diện Login Gate (`/feature-brainstorm`).
- [x] Lập kế hoạch đồng bộ và chốt Phương án 1 (Mini Banner trong Auth Card) với User.
- [x] Cập nhật Đặc tả Vi mô `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`.
- [x] Xây dựng Global PWA Store `src/lib/pwa/pwa-store.ts`.
- [x] Tích hợp PWA Store vào `src/components/pwa/ServiceWorkerRegister.tsx`.
- [x] Cập nhật `src/components/pwa/InstallPwaButton.tsx`.
- [x] Chuẩn hóa `src/app/login-gate/page.tsx`.
- [x] Viết test tự động TC_UT_PWA_* trong `tests/theme-and-layout.test.ts`.
- [x] Thực thi Vòng Lặp Kiểm Chứng 3 Tầng.
- [x] Bàn giao kết quả và kịch bản Human Visual UAT `UAT_36` cho User.

**Nhóm B — Zero Mock Leak & Chuẩn hóa thương hiệu:**
- [x] Brainstorm căn nguyên rò rỉ dữ liệu tạm.
- [x] Lập Đặc tả Vi mô bổ sung AC51–AC56 và RG28–RG30.
- [x] Code dọn sạch `src/app/kinship/page.tsx`.
- [x] Cắt fallback ngầm trên 6 API routes, phân lập test fixture.
- [x] Chuẩn hóa 100% fallback thương hiệu `'GIA PHẢ PHẠM VĂN'` trên 10+ files.
- [x] Bổ sung 4 test AST integrity vào `tests/theme-and-layout.test.ts`.
- [x] Kiểm chứng 3 tầng PASS: Typecheck 0 lỗi, Test 315/315, Build 31/31 routes.
- [x] Tick `[x]` AC51–AC56 và RG28–RG30 trong Spec.
- [x] Ghi bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`.
- [x] Tạo `walkthrough.md` tổng kết và bàn giao Human Visual UAT cho User.

**Nhóm C — Phản Hồi Chuyển Màn & Kiến Trúc Cây Phả Hệ 1.500 Người:**
- [x] Brainstorm phân tích căn nguyên Zero Navigation Feedback và rủi ro DOM/UX khi scale 1.500 người.
- [x] Lập kế hoạch quy hoạch và giải đáp 3 câu hỏi của User (implementation_plan.md).
- [x] Cập nhật Đặc tả Vi mô `docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md` và `docs/04_UI-UX-Flow.md`.
- [x] Khởi tạo biến màu theme token `--brand-primary` và `--brand-glow` trong `src/app/globals.css`.
- [x] Xây dựng component `TopProgressBar.tsx` đồng bộ theme token và shimmer animation.
- [x] Tích hợp `TopProgressBar` vào RootLayout `src/app/layout.tsx`.
- [x] Nâng cấp `MobileBottomNav.tsx` với pending state, active bounce và haptic feedback.
- [x] Xây dựng bộ 5 màn hình Loading Skeleton: `loading.tsx` cho `/`, `/tree`, `/anniversaries`, `/kinship`, `/admin`.
- [x] Tối ưu hóa `FamilyTreeCanvas.tsx`: Viewport Virtualization và Banner đón tiếp Khách/Unlinked User.
- [x] Bổ sung bộ 5 tests tự động TC_UT11 đến TC_UT15 vào `tests/theme-and-layout.test.ts`.
- [x] Thực thi Vòng Lặp Kiểm Chứng 3 Tầng: Typecheck 0 lỗi, Build 31/31 routes OK, Test 320/320 PASS.
- [x] Đồng bộ ngược (Reverse Sync): Tick [x] AC11–AC15 và RG04–RG06 trong Micro-Spec.
- [x] Ghi chép bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`.
- [x] Bàn giao kết quả và kịch bản Human Visual UAT (UAT_08 đến UAT_11) cho User.

### 3. Immediate Next Step
- **Không có task dang dở** — cả 3 nhóm công việc (PWA Install Sync + Zero Mock Leak + Navigation Feedback & Tree Scale) đã hoàn tất 100% cùng kiểm chứng 3 tầng PASS (320/320 tests, 34 suites).
- Phiên mới có thể chọn tính năng tiếp theo từ backlog hoặc theo yêu cầu của User.
