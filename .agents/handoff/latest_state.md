# STATE MANIFEST
### 1. Key Context

**Dự án:** FAT — Hệ thống Quản lý Gia Phả (Family Tree Management)
**Tech Stack:** Next.js 14 App Router, React, TypeScript, TailwindCSS, Supabase, React Flow
**Dev Server:** `npm run dev` đang chạy tại `http://localhost:3000`
**Test Baseline:** 315/315 tests PASS (33 suites), Typecheck 0 lỗi, Build 31/31 routes thành công

**Phiên này giải quyết 2 nhóm vấn đề lớn:**

**Nhóm A — PWA Install Synchronization (Home vs Login Gate):**
- Brainstorm xong căn nguyên: `deferredPrompt` bị mất khi unmount component → chọn Phương án 1 (Mini Banner trong Auth Card).
- Đã cập nhật Spec `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md` (Section 5.14, TC_UT mới, UAT_36, RG29–RG30).
- Đã code xong toàn bộ: `src/lib/pwa/pwa-store.ts` (Singleton PWA Store), `src/components/pwa/InstallPwaButton.tsx` (xóa alert, thêm Modal hướng dẫn), `src/app/login-gate/page.tsx` (Mini Banner PWA 2 tầng), `src/components/pwa/ServiceWorkerRegister.tsx` (tích hợp PWA Store).
- Đã kiểm chứng 3 tầng PASS.
- Đã ghi lesson learned về Singleton PWA Store, Two-Tier Mini Banner Layout, loại bỏ alert().

**Nhóm B — Triệt tiêu rò rỉ dữ liệu tạm (Zero Mock Leak) & Chuẩn hóa thương hiệu:**
- Brainstorm xong căn nguyên: Dữ liệu mock họ Nguyễn rò rỉ qua useState initial state + API fallback ngầm + 8 chip kịch bản mẫu hardcoded + chuỗi fallback `'DÒNG HỌ NGUYỄN VĂN'` ở 15 vị trí.
- Đã code xong: Dọn sạch `src/app/kinship/page.tsx` (state rỗng, Skeleton Loading, Empty State, xóa 8 chip), cắt fallback ngầm trên 6 API routes, phân lập test fixture (cờ `npm_lifecycle_event === 'test'` / header `x-test-fixture`), chuẩn hóa 100% fallback thương hiệu thành `'GIA PHẢ PHẠM VĂN'` trên 10+ files.
- Đã bổ sung 4 test AST integrity: `TC_UT_ZERO_MOCK_LEAK_IN_KINSHIP`, `TC_UT_ZERO_MOCK_LEAK_IN_API_ROUTES`, `TC_UT_ZERO_MOCK_LEAK_IN_UI_PAGES`, `TC_UT_BRAND_INTEGRITY_NO_NGUYEN_VAN_FALLBACK`.
- Đã kiểm chứng 3 tầng PASS: Typecheck 0 lỗi, Test 315/315, Build 31/31 routes.
- Đã tick `[x]` AC51–AC56 và RG28–RG30 trong Spec `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md`.
- Đã ghi lesson learned về Zero Mock Leak Policy & Runtime vs Test Fixture Isolation.

**Quyết định kiến trúc quan trọng:**
- Cơ chế phân lập test fixture: API route nhận diện `process.env.npm_lifecycle_event === 'test' || process.argv.some(a => a.includes('test')) || request.headers.get('x-test-fixture') === 'true'` → cho phép mock chỉ trong test runner, runtime thật trả rỗng.
- `FamilyTreeCanvas.tsx` giữ import `sample-data` cho dataset switcher debug (`polygamy`, `clan1500`), nhưng runtime mặc định (`live`) chỉ vẽ dữ liệu từ DB.
- Thương hiệu fallback toàn hệ thống thống nhất: `'GIA PHẢ PHẠM VĂN'`.

**Files đang mở:**
- `src/components/admin/ClanDashboard.tsx` (active, cursor line 35)
- `src/components/tree/FamilyTreeCanvas.tsx`
- `src/app/api/kinship/route.ts`
- `src/app/api/members/route.ts`
- `src/app/api/spouse-relations/route.ts`
- `src/app/admin/page.tsx`

### 2. Task Checklist

**Nhóm A — PWA Install Synchronization:**
- [x] Brainstorm phân tích căn nguyên gốc rễ lỗi `deferredPrompt` và lệch giao diện Login Gate (`/feature-brainstorm`).
- [x] Lập kế hoạch đồng bộ và chốt Phương án 1 (Mini Banner trong Auth Card) với User.
- [x] Cập nhật Đặc tả Vi mô `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md` (Section 5.14, TC_UT mới, UAT_36, RG29–RG30).
- [x] Xây dựng Global PWA Store `src/lib/pwa/pwa-store.ts` (Singleton pattern, bảo toàn `deferredPrompt` qua SPA client routing).
- [x] Tích hợp PWA Store vào `src/components/pwa/ServiceWorkerRegister.tsx`.
- [x] Cập nhật `src/components/pwa/InstallPwaButton.tsx`: Đọc từ PWA Store, xóa bỏ 100% `alert(...)`, bổ sung Modal hướng dẫn trực quan Desktop & Android.
- [x] Chuẩn hóa `src/app/login-gate/page.tsx`: Triển khai Mini Banner PWA với tiêu đề "Cài đặt ứng dụng Gia Phả lên màn hình chính" và mô tả ngày giỗ theo Phương án 1.
- [x] Viết test tự động `TC_UT_PWA_GLOBAL_STORE_01`, `TC_UT_LOGIN_GATE_INSTALL_PWA_TITLE`, `TC_UT_NO_RAW_ALERT_IN_PWA_BUTTON`, `TC_UT_PWA_MINI_BANNER_LOGIN_GATE` trong `tests/theme-and-layout.test.ts`.
- [x] Thực thi Vòng Lặp Kiểm Chứng 3 Tầng: `Typecheck`, `Test`, `Build` 0 lỗi, reverse-sync tick `[x]` các test cases và RG.
- [x] Bàn giao kết quả và kịch bản Human Visual UAT `UAT_36` cho User.

**Nhóm B — Zero Mock Leak & Chuẩn hóa thương hiệu:**
- [x] Brainstorm căn nguyên rò rỉ dữ liệu tạm (kiểm kê 15 vị trí, phân tích 3 chiều routing).
- [x] Lập Đặc tả Vi mô bổ sung AC51–AC56 và RG28–RG30 vào `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md`.
- [x] Code dọn sạch `src/app/kinship/page.tsx` (xóa mock state, thêm Skeleton Loading & Empty State, xóa 8 chip mẫu).
- [x] Cắt fallback ngầm trên 6 API routes, phân lập test fixture.
- [x] Chuẩn hóa 100% fallback thương hiệu `'GIA PHẢ PHẠM VĂN'` trên 10+ files (grep confirm: 0 leak `'DÒNG HỌ NGUYỄN VĂN'`).
- [x] Bổ sung 4 test AST integrity vào `tests/theme-and-layout.test.ts`.
- [x] Kiểm chứng 3 tầng PASS: Typecheck 0 lỗi, Test 315/315, Build 31/31 routes.
- [x] Tick `[x]` AC51–AC56 và RG28–RG30 trong Spec.
- [x] Ghi bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`.
- [x] Tạo `walkthrough.md` tổng kết và bàn giao Human Visual UAT cho User.

### 3. Immediate Next Step
- **Không có task dang dở** — cả 2 nhóm công việc (PWA Install Sync + Zero Mock Leak) đã hoàn tất 100% cùng kiểm chứng 3 tầng PASS. Phiên mới có thể chọn tính năng tiếp theo từ backlog hoặc theo yêu cầu của User.
- Gợi ý: `task.md` hiện vẫn chứa checklist cũ (Nhóm A) chưa được tick. Nếu cần, phiên mới nên cập nhật `task.md` hoặc xóa/đổi nó thành task mới.
