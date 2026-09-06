# STATE MANIFEST
### 1. Key Context
- **Workspace:** `/home/kakashi/sources/pj/gia-pha`
- **Các File Trọng Tâm Vừa Xử Lý Trong Phiên:**
  - `docs/15_Micro-Spec_Milestone_6_Branch_Taxonomy_Admin_Portal.md`: Đặc tả kỹ thuật vi mô Milestone 6 (đã tick `[x] PASS` toàn bộ 9 ACs kiểm thử tự động Mục 7.1 và 3 tiêu chuẩn Regression Guard Mục 8).
  - `src/components/auth/PersonalSettingsModal.tsx`: Modal cài đặt cá nhân áp dụng kiến trúc React Portal (`createPortal(..., document.body)`), xử lý phím tắt `Escape`, khóa cuộn `body` và cờ `mounted` chống hydration mismatch.
  - `src/components/admin/BranchTaxonomyManager.tsx`: Giao diện quản trị cấu trúc phân cấp Ngành/Chi đệ quy đa tầng, gán Cụ Khởi Nguồn, làm sạch 100% ký tự mã thô LaTeX `$\rightarrow$` thành mũi tên Unicode `→`.
  - `src/app/admin/settings/page.tsx`: Giao diện quản trị phẳng Anti Box-in-Box, tinh gọn thanh Tabs còn đúng 2 phân hệ cấu hình thực tế (`🌿 Cấu Trúc Ngành/Chi`, `🏛️ Thông Tin & Xưng Hô`), loại bỏ tab trùng lặp `Nhập File Excel`.
  - `src/components/navbar/Navbar.tsx` & `src/components/auth/AuthButton.tsx`: Phân định lối vào Quản trị (`[🛡️ Quản Trị Dòng Họ]`) và Cài đặt cá nhân (`[⚙️ Cài đặt của tôi]`).
  - `src/lib/tree-layout/branch-engine.ts`: Lõi Pure Functions tính toán kế thừa phả hệ tự động (`resolveMemberBranchHierarchy`), làm phẳng cây (`flattenBranchTree`), lọc thành viên (`filterMembersByBranch`) và quản lý tùy chọn `fat_user_preferences`.
  - `src/lib/tree-layout/genealogy-layout.ts`: Tối ưu hóa tra cứu hôn phối sang Map Lookup $O(1)$, đưa thời gian tính toán layout 1.500 nodes từ 160ms xuống 43ms (vượt SLA < 100ms).
  - `tests/branch-engine.test.ts`: Bộ test tự động kiểm thử phả hệ, validation cây, gate navbar, viewport resilience, latex guard, clean nav và React Portal.
- **Các Quyết Định Kiến Trúc Trọng Tâm:**
  1. *Giải quyết bài toán "Hai Chiếc Áo":* Phân định rạch ròi giữa Không Gian Cá Nhân (User Settings nằm trong Avatar Dropdown) và Quản Trị Dòng Họ (Admin Portal có nút riêng trên Navbar cho Super Admin).
  2. *Khắc phục lỗi Containing Block kinh điển của CSS bằng React Portal:* Thẻ `<header>` của Navbar có `backdrop-blur-md` (`backdrop-filter`) tự động biến thành Containing Block theo chuẩn W3C, giam lỏng thẻ con `fixed inset-0` trong dải hẹp 64px. Áp dụng `createPortal` đưa modal ra `document.body` giúp lớp phủ mờ tối bao phủ trọn vẹn 100vw × 100vh và modal hiển thị đầy đủ Header, Body, Footer.
  3. *Kế thừa phả hệ tự động (Branch Inheritance Pure Engine):* Gán Cụ Khởi Nguồn (`rootMemberId`) cho từng nhánh; thuật toán pure function tự động duyệt ngược chuỗi phụ hệ và gán danh xưng chuẩn (`Đời N · Ngành X · Chi Y`) cho toàn bộ con cháu trên Cây phả hệ và Lịch giỗ.
  4. *Ranh giới phạm vi (Scope Boundary):* Tính năng Con cháu xin nhận hồ sơ (Claim Profile & Approval Queue) được gác lại (Deferred) theo yêu cầu của User để giữ hệ thống tinh gọn.
- **Hạ Tầng Kiểm Chứng 3 Tầng (`[VERIFY_COMMANDS]`):**
  - Typecheck: `npm run typecheck` $\rightarrow$ **0 lỗi** (`tsc --noEmit` PASS clean).
  - Test Suite: `npm test` $\rightarrow$ **106/106 tests PASS 100%** qua 18 suites (0 failures, 0 regressions).
  - Production Build: `NEXT_DIST_DIR=.next-build npm run build` $\rightarrow$ **21/21 routes** compiled & static pages generated thành công 100%.
  - Dev Server: Đang chạy sẵn sàng tại `http://localhost:3000`.

### 2. Task Checklist
- [x] Tạo kiến trúc & đặc tả kỹ thuật vi mô Milestone 4 (`docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md`)
- [x] Triển khai bộ parser & topological sort cho file Excel nạp hàng loạt (`src/lib/excel/excel-parser.ts`)
- [x] Xây dựng script Ingestion Pipeline bóc tách 1.299 nhân khẩu Họ Phạm Văn sang file Excel chuẩn 19 cột `docs/data/gia_pha_ho_pham_van.xlsx` (0 lỗi, `canImport: true`)
- [x] Tạo tài liệu hướng dẫn nhập liệu cho dòng họ `docs/data/HUONG_DAN_NHAP_LIEU.md` kèm script `npm run data:convert`
- [x] Triển khai Milestone 5 (Lịch Giỗ 30 Ngày, Vercel Cron & PWA Web Push Notification) (`docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`)
- [x] Tạo kiến trúc & đặc tả kỹ thuật vi mô Milestone 6 (`docs/15_Micro-Spec_Milestone_6_Branch_Taxonomy_Admin_Portal.md`)
- [x] Mở rộng `BranchNode` đệ quy đa tầng và kiểu dữ liệu `UserPreferences` (`src/types/database.ts`)
- [x] Xây dựng Lõi Thuật toán Kế thừa Phả hệ Tự động Pure Functions (`src/lib/tree-layout/branch-engine.ts`)
- [x] Tách bạch Hai Không Gian ("Hai Chiếc Áo"): Nút `[🛡️ Quản Trị Dòng Họ]` trên Navbar & Modal Cài Đặt Cá Nhân (`PersonalSettingsModal.tsx`, `AuthButton.tsx`)
- [x] Thiết kế giao diện Quản trị phẳng Anti Box-in-Box với 2 Tabs cấu hình thực tế (`src/app/admin/settings/page.tsx`, `BranchTaxonomyManager.tsx`)
- [x] Cập nhật API Quản trị Dòng họ `/api/clan-settings` hỗ trợ validation cây phân chi và dev cookie fallback
- [x] Đồng bộ bộ lọc tuyến dưới: Lịch giỗ `/anniversaries` & Cây phả hệ `/tree` hiển thị danh xưng tôn ti `Đời N · Ngành X · Chi Y`
- [x] Tối ưu hóa hiệu năng tính toán cây layout từ 160ms xuống 43ms bằng Map lookup O(1)
- [x] Sửa lỗi Flexbox Modal cá nhân bị trượt lên nóc cắt cụt Header (`PersonalSettingsModal.tsx` viewport resilience)
- [x] Áp dụng kiến trúc React Portal (`createPortal`) đưa PersonalSettingsModal ra `document.body`, thoát khỏi containing block của Navbar backdrop-blur, phủ kín 100% viewport và hỗ trợ phím Escape
- [x] Thay thế toàn bộ chuỗi ký tự mã thô LaTeX rightarrow thành mũi tên Unicode `→` (`BranchTaxonomyManager.tsx`)
- [x] Tinh gọn phân tầng điều hướng Admin: Loại bỏ tab thừa trùng lặp `tab-btn-import` trên `/admin/settings`
- [x] Bổ sung 4 unit tests tự động (`tests/branch-engine.test.ts`)
- [x] Chạy kiểm chứng 3 tầng: Typecheck 0 lỗi, Build 21/21 pages, Test Suite 106/106 tests PASS 100% (18 suites, 0 regressions)

### 3. Immediate Next Step
- Bàn giao `Dev_URL` (`http://localhost:3000/tree`) để User tự mở trình duyệt nghiệm thu thị giác (Human Visual UAT) theo Checklist Mục 7.2 của Micro-Spec 15 (thử nghiệm Modal toàn màn hình qua React Portal, phím Escape, lớp nền tối và giao diện Admin phẳng không tab trùng lặp).
