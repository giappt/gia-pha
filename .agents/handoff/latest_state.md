# STATE MANIFEST
### 1. Key Context
- **Trạng thái dự án:** Dự án FAT (Family Tree Management System) đã hoàn tất trọn vẹn Milestone 7 với đầy đủ kiểm chứng 3 tầng:
  - **Tái Cấu Trúc Admin Portal:** Sidebar Fluid 4 nhóm thuần Việt (`AdminSidebar.tsx`), chuẩn hóa hình học phẳng `rounded-md`, loại bỏ viền cong `border-r-2`.
  - **Bàn Điều Hành Tông Tộc (`ClanDashboard.tsx`):** Chuẩn hóa card `rounded-lg`, tích hợp Khay Rà Soát Nối Phả tại chỗ (`UnlinkedMembersDrawer`), hỗ trợ xem 10 người thiếu cha mẹ, tìm kiếm và nối vào cha mẹ hoặc xóa rác trực tiếp.
  - **Tách chuyên biệt các màn hình:** Căn Cước Dòng Họ (`/admin/profile`), Cấu Trúc Ngành/Chi (`/admin/branches`), Quy Ước Xưng Hô (`/admin/kinship`), Quản Lý Tài Khoản (`/admin/users`), Bật/Tắt 6 Cờ Tính Năng (`/admin/features`), và trang tab tương thích ngược (`/admin/settings`).
  - **Chất lượng kiểm chứng:** Typecheck 0 lỗi, Build 27/27 routes, Test Suite **121/121 tests PASS 100%**, dev server đang chạy tại `http://localhost:3002`.
- **Định hướng chiến lược chặng tiếp theo (Chuyển giao từ Mock sang Real Database):**
  - **Milestone 8 (Con cháu tự nhận node & Hàng đợi duyệt phân cấp):** Đã hoàn tất bản thiết kế sâu và **được lưu trữ an toàn trong Kho Ý Tưởng** tại `.agents/backlog/002_phan-quyen-phan-cap-cay-con-va-duyet-claim.md` để triển khai sau này khi dòng họ có nhu cầu mở cổng cho con cháu.
  - **Mục tiêu ưu tiên số 1 hiện tại (Hướng 3):** Đưa hệ thống vào trạng thái **CHẠY THỰC TẾ TRÊN CƠ SỞ DỮ LIỆU (Production Database Integration & Readiness)**. Chấm dứt hoàn toàn việc phụ thuộc vào dữ liệu mẫu (mock data fallback) trong code, chuyển sang chạy 100% trên dữ liệu lưu trong PostgreSQL (Supabase).

### 2. Task Checklist
- [x] Hoàn tất Milestone 7: Tái cấu trúc Admin Portal, Bàn Điều Hành Dashboard, Fluid Sidebar và Khay Rà Soát Nối Phả tại chỗ
- [x] Chuẩn hóa hình học kiến trúc sắc sảo (Crisp Geometry): 0 `rounded-2xl`, 0 `border-r-2`, 100% `rounded-lg` và `rounded-md`
- [x] Đạt 121/121 Automated Tests PASS 100%, biên dịch sạch sẽ 27/27 routes
- [x] Lưu trữ toàn diện thiết kế Milestone 8 vào Kho Ý Tưởng `.agents/backlog/002_phan-quyen-phan-cap-cay-con-va-duyet-claim.md` (Parked)
- [ ] [HƯỚNG 3] Rà soát cấu hình kết nối Supabase DB thực tế trong `.env.local` và kiểm tra quyền truy cập CSDL
- [ ] [HƯỚNG 3] Xây dựng script nạp dữ liệu seed chuẩn (Seed Data) vào CSDL: nạp các bảng `clan_settings`, `members`, `spouse_relations`
- [ ] [HƯỚNG 3] Chuyển đổi toàn bộ các luồng đọc/ghi dữ liệu (`/api/tree`, `/api/members`, `/api/clan-settings`) chạy hoàn toàn trên PostgreSQL, gỡ bỏ hoặc kiểm soát chặt chẽ mock data fallback
- [ ] [HƯỚNG 3] Kiểm tra chính sách bảo mật RLS (Row Level Security) và cơ chế che mờ người sống (`mask_living_member_privacy`) trên DB thật

### 3. Immediate Next Step
- Khảo sát file `.env.local` và trạng thái kết nối Supabase PostgreSQL hiện tại; xây dựng kịch bản nạp dữ liệu seed chuẩn vào database để hệ thống chạy 100% dữ liệu thực từ CSDL thay vì dữ liệu mock.
