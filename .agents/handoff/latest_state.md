# STATE MANIFEST
### 1. Key Context

**Dự án:** FAT - Family Tree Management System
**Workspace:** d:\pj\other\fat
**Spec hiện hành:** docs/18_Micro-Spec_Milestone_9_Design_Profiles_And_Anniversary_Bloc.md
**Dev Server:** http://localhost:3000 (đang chạy `npm run dev`)

**Diễn biến chính trong phiên này (theo trình tự thời gian):**
- User phát hiện việc đồng bộ Contemporary Heritage bị "sửa cục bộ / cát cứ ốc đảo": chỉ có AnniversaryBlocCard đổi màu, 90% còn lại (Logo, Navbar, Bottom Nav, Loading, Canvas, Bus Edge, MemberNode, Modals, Admin) vẫn hardcode emerald/slate/blue/pink cũ.
- Đã brainstorm, spec và code hoàn chỉnh Scoped CSS Cascade toàn hệ thống dưới `html[data-theme-profile="contemporary_heritage"]` trong globals.css.
- Đã gán `id` cho các thành phần cốt lõi (logo, modals) và binding CSS Variables (--bg-canvas, --tree-bus-stroke, --tree-dots-color) trong components.
- Đã tạo test suite `tests/heritage-sync-integrity.test.ts` (5 TCs: TC_ARCH_HERITAGE_SYNC_01..05).
- Đã fix lỗi RG38 (login-gate ClanHanLogo phải giữ className="text-white" cho test tĩnh, CSS cascade !important sẽ override khi Contemporary Heritage active).
- **Kết quả kiểm chứng 3 tầng (ĐÃ PASS):** Typecheck 0 errors, Build 40/40 routes OK, Test 468/468 PASS (0 fail).
- Đã tick [x] trong Micro-Spec: TC_ARCH_HERITAGE_SYNC_01..05, RG20, RG21.
- Đã ghi bài học vào `.agents/brain/lessons_learned.md`.

**User bắt đầu UAT và phát hiện các vấn đề MỚI (chưa xử lý):**
1. **Trang /anniversaries nền trắng lạc lõng:** Hero header, notification banner, filter bar, và container ngoài trang Lịch Giỗ vẫn hardcode `bg-white`, `bg-slate-50`, `bg-emerald-500/10`, `border-emerald-500/20`... Không ăn theo biến `--bg-canvas: #FAF8F2` của Contemporary Heritage. Khu vực này đang "trắng toát" giữa nền giấy Dó ngà ấm.
2. **Icon FamilyTreeIcon chỗ có chỗ không:** Một số nơi dùng `text-emerald-600` hardcode trên icon, chỗ khác không chỉ định màu → không đồng bộ.
3. **User hỏi:** "Hệ Thống Design Tokens Di Sản & Cam Kết Kỹ Thuật (SSOT) có đủ để làm không?" → Câu trả lời: Tokens CSS trong globals.css đã đầy đủ (--bg-canvas, --bg-surface, --border-card...), nhưng các component trên trang /anniversaries CHƯA ĐƯỢC đấu nối tiêu thụ (consume) chúng.

**Files trọng tâm cần xử lý ở vòng kế tiếp:**
- `src/app/anniversaries/page.tsx` (L270: `bg-slate-50`, L272: `bg-white/60`, L285: `border-slate-200`, L286: `bg-emerald-500/10`, L313: `border-slate-200`, L327: `text-emerald-700`)
- `src/components/anniversaries/PushNotificationBanner.tsx` (L206: `border-emerald-500/20 bg-gradient-to-r from-emerald-500/5`, L208: `bg-emerald-600/10`, L250: `bg-emerald-600`)
- `src/components/anniversaries/AnniversaryBlocTimeline.tsx` (một số class hardcode cho desktop top bar, member divider)
- `src/components/navbar/Navbar.tsx` (L111: `text-emerald-600` trên FamilyTreeIcon)
- Nhiều nơi khác dùng FamilyTreeIcon với `text-emerald-600` hardcode

### 2. Task Checklist

**Phase trước (Hoàn tất ✅):**
- [x] Brainstorm & Root Cause: Phát hiện căn bệnh "sửa cục bộ / cát cứ ốc đảo"
- [x] Spec: Cập nhật Micro-Spec Section 5.10, TC_ARCH_HERITAGE_SYNC_01..05, UAT_43..46, RG20..21
- [x] Code: Scoped CSS Cascade toàn hệ thống trong globals.css
- [x] Code: Binding CSS Variables vào FamilyBusEdge, FamilyTreeCanvas, ClanHanLogoNavbar, login-gate, page.tsx, 4 Modals
- [x] Code: Test suite heritage-sync-integrity.test.ts (5 TCs PASS)
- [x] Fix: RG38 (giữ text-white trên ClanHanLogo login-gate, CSS !important override)
- [x] Verify: Typecheck 0 errors
- [x] Verify: Build 40/40 routes OK
- [x] Verify: Test 468/468 PASS (0 fail)
- [x] Reverse-sync: Tick [x] TC_ARCH_HERITAGE_SYNC_01..05, RG20, RG21 trong Micro-Spec
- [x] Ghi lessons_learned.md

**Phase hiện tại (User UAT phát hiện lỗ hổng mới — CHƯA XỬ LÝ):**
- [ ] Brainstorm & Root Cause: Trang /anniversaries (hero, banner, filter, container) vẫn hardcode bg-white/bg-slate-50, không tiêu thụ --bg-canvas
- [ ] Brainstorm: PushNotificationBanner vẫn hardcode emerald gradient, không đồng bộ Contemporary Heritage
- [ ] Brainstorm: FamilyTreeIcon hardcode text-emerald-600 rải rác nhiều nơi (Navbar, PersonalSettingsModal, BranchTaxonomyManager, ClanDashboard, kinship/page, anniversaries/page, prototype pages)
- [ ] Spec: Cập nhật Micro-Spec bổ sung các đối tượng mới vào phạm vi đồng bộ
- [ ] Code: Đồng bộ /anniversaries page shell (hero, banner, filter, container ngoài) theo Contemporary Heritage
- [ ] Code: Đồng bộ PushNotificationBanner
- [ ] Code: Đồng bộ FamilyTreeIcon toàn hệ thống
- [ ] Verify 3 tầng
- [ ] Human UAT

### 3. Immediate Next Step
- Chạy `/feature-brainstorm` để mổ xẻ triệt để: (1) Trang /anniversaries page shell (hero header bg-white/60, filter bar bg-slate-100, today info card border-slate-200, container bg-slate-50) cần được đấu nối tiêu thụ biến CSS --bg-canvas, --bg-surface, --border-card, --text-brand-accent; (2) PushNotificationBanner cần đồng bộ; (3) FamilyTreeIcon hardcode text-emerald-600 cần quy hoạch thống nhất toàn hệ thống. Sau đó lập implementation_plan.md và chờ User duyệt trước khi chuyển sang /feature-spec.
