# STATE MANIFEST
### 1. Key Context
- Dự án: FAT - Family Tree Management System (Gia Phả Số).
- Milestone: Milestone 8 - Nối Phả Đa Tầng, Tự Nhận Hồ Sơ & Phê Duyệt Phân Tán Theo Huyết Thống.
- Quy ước & Quyết định kiến trúc cốt lõi vừa chốt:
  1. Bản chất nghiệp vụ: Phê duyệt (Approval / Claim Review) là MỘT chức năng chung duy nhất. Điểm khác biệt duy nhất giữa 3 nhóm người dùng chỉ là Phạm vi Thẩm quyền (Scope / Blast Radius):
     - Bố Mẹ (`claimed_member`): Scope = Tiểu gia đình (phiếu con cái xin nối vào mình/vợ).
     - Trưởng Chi (`branch_editor`): Scope = Chi nhánh phụ trách (`assigned_branch_code`) hoặc phiếu được giao.
     - Super Admin (`super_admin`): Scope = Toàn họ (Toàn phả hệ, có quyền ủy quyền và lọc theo từng Chi).
  2. Đồng nhất Entry Point:
     - Gỡ bỏ hoàn toàn nút `[ Quản trị Chi ]` khỏi `src/components/navbar/Navbar.tsx` để giữ Navbar thanh thoát, chuẩn mực cho 3 tính năng công cộng (`Cây Gia Phả`, `Lịch Giỗ`, `Xưng hô`).
     - Đặt duy nhất 1 mục menu trong Dropdown Avatar người dùng (`src/components/auth/AuthButton.tsx`), nằm ngay dưới mục *"Cài đặt của tôi"*: `[ 📋 Phê Duyệt Hồ Sơ ]` (kèm badge số lượng chờ duyệt). Cả Bố Mẹ, Trưởng Chi và Super Admin đều vào từ đây.
  3. Cổng Phê Duyệt Đồng Nhất Phẳng Chuẩn Admin Settings (`/branch` & `/approvals`):
     - Khung cố định `max-w-5xl mx-auto px-4 sm:px-6 py-6`.
     - Header icon bo góc `rounded-xl`, viền mảnh `border border-emerald-200/80 dark:border-emerald-800`.
     - Triệt tiêu hoàn toàn thẻ card viền xám lơ lửng và tab gạch chân giật giật; sử dụng bảng cố định cấu trúc chiều ngang (`w-[38%]`, `w-[22%]`, `w-[15%]`, `w-[25%]`) hairline divider `divide-y divide-slate-100 dark:divide-slate-800` ngăn chặn 100% co giật lề trang (Zero Layout Shift).
     - Scoped Views: Bố Mẹ (phiếu tiểu gia đình), Trưởng Chi (phiếu và thành viên chi), Super Admin có Branch Selector Dropdown (`[ ⏳ Hồ sơ đang chờ duyệt ]` | `[ 👥 Xem theo Chi ▾ ]`), tuyệt đối không xả phẳng 52 người ra màn hình.
  4. Tương tác Deep Zoom & Highlight Node Trên Cây:
     - Nút `[🎯 Xem trên cây]` trỏ tới `/tree?focus={member_id}`.
     - `FamilyTreeCanvas.tsx` đón nhận `focus`: lia camera mượt mà `reactFlowInstance.setCenter(node.x, node.y, { zoom: 1.15, duration: 800 })`, tự động mở Drawer chi tiết và bật hiệu ứng viền phát sáng (Highlight Pulse) 2.5s.
- Trạng thái tài liệu:
  - File [docs/17_Micro-Spec_Milestone_8_Member_Onboarding_Decentralized_Approval.md](file:///d:/pj/other/fat/docs/17_Micro-Spec_Milestone_8_Member_Onboarding_Decentralized_Approval.md) đã cập nhật xong Section 1.1 (Phase 3), Section 5.4-5.7, Section 7.1 (6 TC mới ở dạng `[ ]`), Section 7.2 (UAT mới ở dạng `[ ]`), Section 8 (Regression Guards ở dạng `[ ]`).
- Lệnh kiểm chứng `[VERIFY_COMMANDS]`:
  - Typecheck: `npm.cmd run typecheck`
  - Build: `npm.cmd run build`
  - Test: `npm.cmd test` (Baseline: 394/394 tests pass, 38 suites).
- Các file đang mở / sẽ thao tác:
  - `src/components/navbar/Navbar.tsx`: Xóa link `[ Quản trị Chi ]`.
  - `src/components/auth/AuthButton.tsx`: Thêm `[ 📋 Phê Duyệt Hồ Sơ ]` vào dropdown dưới Cài đặt cá nhân.
  - `src/app/branch/page.tsx` & `src/components/branch/BranchPortalClient.tsx`: Tái thiết kế phẳng chuẩn Settings, hỗ trợ Scoped Views (Bố Mẹ, Trưởng Chi, Super Admin Branch Selector) & Zero Layout Shift.
  - `src/app/tree/page.tsx` & `src/components/tree/FamilyTreeCanvas.tsx`: Đón nhận `searchParams.focus` và lia camera zoom mượt mà, mở Drawer và highlight pulse.
  - `tests/decentralized-claim.test.ts`: Bổ sung tests cho Entry Point, Scoped Views, Fixed Layout và Focus Zoom.

### 2. Task Checklist
- [x] Phase 1: Onboarding, Form Nhận/Nối Người Thân & Refinement UX
- [x] Phase 2: Quyền Tự Quản Tiểu Gia Đình & Ngữ Cảnh Thao Tác Trong Drawer (Anti-Pill & Contextual Actions)
- [x] Phase 2.5: Quản Trị Tam Đại Đồng Đường & Thuần Việt Hóa Thân Tộc Drawer
- [x] Phase 3.1: Core Logic & Review APIs (`canUserReviewClaim`, `GET /api/claims/pending`, `PATCH /api/claims/[id]/review`, Insert & Shift)
- [x] Phase 3-Spec: Cập nhật Micro-Spec 17 với kiến trúc Unified Entry Point, giao diện phẳng chuẩn Settings, Super Admin Branch Selector và Deep Zoom Camera
- [/] Phase 3.2: Đồng nhất Entry Point trong AuthButton dropdown & gỡ bỏ link khỏi Navbar
- [/] Phase 3.3: Tái thiết kế Cổng Phê Duyệt Đồng Nhất phẳng chuẩn Admin Settings (Bố Mẹ, Trưởng Chi, Super Admin Branch Selector)
- [/] Phase 3.4: Deep Zoom Camera & Highlight Node trên Cây Gia Phả (`/tree?focus=...`)
- [ ] Phase 3.5: Cập nhật test suite `tests/decentralized-claim.test.ts`, chạy kiểm chứng 3 tầng `[R-VERIFY]` và bàn giao Dev_URL UAT

### 3. Immediate Next Step
- Khởi động `/feature-code` để thi công mã nguồn: gỡ link khỏi `Navbar.tsx`, bổ sung entry point `[ 📋 Phê Duyệt Hồ Sơ ]` vào `AuthButton.tsx`, tái cấu trúc `BranchPortalClient.tsx` phẳng chuẩn Settings (hỗ trợ Bố Mẹ, Trưởng Chi, Super Admin Branch Selector) và kích hoạt camera Deep Zoom trong `FamilyTreeCanvas.tsx`.
