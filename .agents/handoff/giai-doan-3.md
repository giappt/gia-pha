# STATE MANIFEST
### 1. Key Context
- Dự án: FAT - Family Tree Management System (Gia Phả Số).
- Milestone: Milestone 8 - Nối Phả Đa Tầng, Tự Nhận Hồ Sơ & Phê Duyệt Phân Tán Theo Huyết Thống.
- Quy ước & Quyết định kiến trúc cốt lõi vừa chốt:
  1. Bản chất nghiệp vụ: Phê duyệt (Approval / Claim Review) là MỘT chức năng chung duy nhất. Điểm khác biệt duy nhất giữa 3 nhóm người dùng chỉ là Phạm vi Thẩm quyền (Scope / Blast Radius):
     - Bố Mẹ (`claimed_member`): Scope = Gia Đình Của Bạn (phiếu con cái xin nối vào mình/vợ).
     - Trưởng Chi (`branch_editor`): Scope = Chi nhánh phụ trách (`assigned_branch_code`) hoặc phiếu được giao.
     - Super Admin (`super_admin`): Scope = Toàn họ (Toàn phả hệ, có quyền ủy quyền và lọc theo từng Chi).
  2. Đồng nhất Entry Point:
     - Gỡ bỏ hoàn toàn nút `[ Quản trị Chi ]` khỏi `src/components/navbar/Navbar.tsx` để giữ Navbar thanh thoát, chuẩn mực cho 3 tính năng công cộng (`Cây Gia Phả`, `Lịch Giỗ`, `Xưng hô`).
     - Đặt duy nhất 1 mục menu trong Dropdown Avatar người dùng (`src/components/auth/AuthButton.tsx`), nằm ngay dưới mục *"Cài đặt của tôi"*: `[ 📋 Phê Duyệt Hồ Sơ ]` (kèm badge số lượng chờ duyệt). Cả Bố Mẹ, Trưởng Chi và Super Admin đều vào từ đây.
  3. Cổng Phê Duyệt Hồ Sơ Chuẩn AdminShell (`/admin/claims`):
     - Kế thừa 100% `AdminLayout` và `AdminShell`: Sidebar 256px cố định bên trái, Fluid Canvas mở rộng 100% bên phải.
     - Triệt tiêu hoàn toàn container hạn hẹp `max-w-5xl mx-auto` và tab ngang `activeTab`.
     - Tích hợp mục `[ 📋 Phê Duyệt Hồ Sơ ]` vào `AdminSidebar.tsx` (nhóm `THÀNH VIÊN & TÀI KHOẢN`), Dropdown Avatar đóng vai trò Quick Shortcut trỏ về `/admin/claims`.
     - Bộ chọn Chi nhánh (Branch Selector Dropdown) đặt trên thanh công cụ Filter Bar của bảng danh sách.
     - Scoped Views: Super Admin quản lý toàn họ; Trưởng Chi có Sidebar scoped theo Chi; Bố Mẹ duyệt con cái qua Drawer ngữ cảnh trên Cây.
     - Route cũ `/branch` thiết lập chuyển hướng (redirect 307) về `/admin/claims`.
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
  - `src/components/admin/AdminSidebar.tsx`: Thêm mục [ 📋 Phê Duyệt Hồ Sơ ] vào nhóm THÀNH VIÊN & TÀI KHOẢN.
  - `src/app/admin/claims/page.tsx` & `src/components/admin/claims/AdminClaimsClient.tsx`: Thi công Cổng Phê Duyệt trong AdminShell (Fluid canvas 100%, Sidebar cố định, Filter Bar chọn Chi, zero layout shift).
  - `src/app/branch/page.tsx`: Redirect 307 về `/admin/claims`.
  - `src/app/tree/page.tsx` & `src/components/tree/FamilyTreeCanvas.tsx`: Đón nhận `searchParams.focus` và lia camera zoom mượt mà, mở Drawer và highlight pulse.
  - `tests/decentralized-claim.test.ts`: Bổ sung tests cho AdminSidebar claims link, AdminClaims page layout, Branch Filter và Focus Zoom.

### 2. Task Checklist
- [x] Phase 1: Onboarding, Form Nhận/Nối Người Thân & Refinement UX
- [x] Phase 2: Quyền Tự Quản Gia Đình Của Bạn & Ngữ Cảnh Thao Tác Trong Drawer (Anti-Pill & Contextual Actions)
- [x] Phase 2.5: Quản Trị Tam Đại Đồng Đường & Thuần Việt Hóa Thân Tộc Drawer
- [x] Phase 3.1: Core Logic & Review APIs (`canUserReviewClaim`, `GET /api/claims/pending`, `PATCH /api/claims/[id]/review`, Insert & Shift)
- [x] Phase 3-Spec: Cập nhật Micro-Spec 17 chuẩn AdminShell `/admin/claims`, tích hợp AdminSidebar, triệt tiêu tab ngang và container max-w-5xl
- [x] Phase 3.2: Tích hợp `[ 📋 Phê Duyệt Hồ Sơ ]` vào AdminSidebar và AuthButton dropdown, redirect `/branch` về `/admin/claims`
- [x] Phase 3.3: Thi công trang `/admin/claims` trong AdminShell (Fluid Canvas 100%, Zero Layout Shift, Filter Bar theo Chi)
- [x] Phase 3.4: Deep Zoom Camera & Highlight Node trên Cây Gia Phả (`/tree?focus=...`)
- [x] Phase 3.5: Cập nhật test suite `tests/decentralized-claim.test.ts`, chạy kiểm chứng 3 tầng `[R-VERIFY]` và bàn giao Dev_URL UAT
- [x] Phase 3.6: Fix lỗi thêm vợ 403 & Thế hệ (Generation Parity) + Mở khóa Cổng Phê Duyệt cho Bố Mẹ (`claimed_member`) với Sidebar Cách Ly (Sidebar Isolation)
  - [x] Backend: `POST /api/members` nhận diện `spouse_id` làm targetManageId, gán thế hệ cùng đời với bạn đời (`generation_level = spouse.generation_level`).
  - [x] Middleware: Forward header `x-pathname` cho Server Components layout.
  - [x] AdminLayout: Cho phép `claimed_member` truy cập `/admin/claims`, chặn truy cập các trang admin khác. Truyền `userRole` vào `AdminShell`.
  - [x] AdminSidebar: Chế độ cô lập Sidebar cho `claimed_member` (chỉ hiển thị nhóm `Gia Đình Của Bạn` -> `Phê Duyệt Hồ Sơ Con Cháu`, badge `Con Cháu`).
  - [x] AdminClaimsClient: Hiển thị tiêu đề scoped `Phê Duyệt Hồ Sơ Con Cháu` và huy hiệu `Gia Đình Của Bạn`.
  - [x] Automated Tests: Thêm `TC_INT_MEMBERS_API_CLAIMED_MEMBER_SPOUSE_ADD` và `TC_UT_CLAIMED_MEMBER_ADMIN_CLAIMS_ISOLATED_SIDEBAR`.
  - [x] 3-Tier Verification: Typecheck (0 error), Tests (403/403 PASS), Build (37/37 pages OK).

- [x] Phase 3.7: Đồng bộ Ma Trận Phân Quyền (`/admin/roles`), Cờ Tính Năng Kill Switch (`allow_member_self_edit` tại `/admin/features`), và Chuẩn hóa Danh xưng `Gia Đình Của Bạn`:
  - [x] Data Model: Thêm `allow_member_self_edit: boolean` vào `ClanFeatureFlags` trong `src/types/database.ts`.
  - [x] Admin Engine: `DEFAULT_FEATURE_FLAGS.allow_member_self_edit = true`, cập nhật `PERMISSION_MATRIX_DEFINITIONS` với `manage_own_family`, `review_family_claims`, `review_branch_claims`, `feature_flags`. Xuất `RoleMeta` và `ROLES_META` trong `admin-engine.ts`.
  - [x] UI Roles Matrix: `/admin/roles` hiển thị chuẩn xác quyền tự quản gia đình và duyệt hồ sơ con cháu cho `claimed_member`.
  - [x] UI Feature Flags: `/admin/features` bổ sung thẻ gạt On/Off "Cho Phép Con Cháu Tự Sửa Thông Tin Gia Đình" (nhãn An Toàn).
  - [x] Backend API Kill Switch: `POST /api/members`, `PUT /api/members/[id]`, `POST /api/members/quick-add-child` chặn HTTP 403 Forbidden đối với `claimed_member` khi cờ bị tắt.
  - [x] UI Drawer Kill Switch: `MemberDetailDrawer.tsx` ẩn các nút thêm/sửa của `claimed_member` khi cờ tắt và hiển thị banner thông báo tạm khóa kèm icon `Lock`.
  - [x] Chuẩn hóa danh xưng: Thay thế toàn bộ "Tiểu Gia Đình" thành "Gia Đình Của Bạn" trên toàn hệ thống (`AdminSidebar.tsx`, `AdminClaimsClient.tsx`, Drawer, test suite).
  - [x] Automated Tests: Bổ sung 5 test cases mới trong `tests/decentralized-claim.test.ts`, nâng tổng số test lên 408/408 tests pass.
  - [x] 3-Tier Verification: Typecheck (0 lỗi), Tests (408/408 PASS, 0 fail), Build (37/37 static pages OK).

### 3. Immediate Next Step
- Bàn giao kết quả thực nghiệm 3 tầng kiểm chứng và kính mời User mở trình duyệt nghiệm thu thị giác (Human Visual UAT) cho UAT_20 (Ma trận phân quyền tại `/admin/roles`), UAT_21 (Kill Switch tại `/admin/features`), và UAT_22 (Chuẩn hóa danh xưng Gia Đình Của Bạn).
