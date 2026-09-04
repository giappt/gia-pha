# STATE MANIFEST
### 1. Key Context
- **Dự án:** FAT (Family Tree Management System) — Next.js 14 App Router, TypeScript, TailwindCSS, `@xyflow/react`, Supabase.
- **Trạng thái Milestone 3.1:** ĐÃ HOÀN THÀNH 100%. Toàn bộ 30/30 tests PASS (`Kinship`, `Lunar`, `Tree API`, `Tree Layout`), `npm.cmd run typecheck` 0 lỗi, `npm.cmd run build` 0 lỗi.
- **Thành quả cốt lõi Milestone 3.1 đã chốt:**
  - Hệ trục thước thợ Bus Hierarchy $90^\circ$ phẳng lì (`FamilyBusEdge.tsx`).
  - Hôn nhân nội tộc đối xứng 2 chiều tuân thủ quy ước *"Nam tả Nữ hữu"* (Chi 1 có Ghost Node Dâu nội tộc bên phải, Chi 2 có Ghost Node Rể nội tộc bên trái, không nhân đôi số đinh).
  - Công tắc ẩn/hiện Rể nội tộc `showInternalHusbands` trên Toolbar và thẻ con gái.
  - Flat Seamless Footer cho thẻ thành viên ngăn cách bởi hairline siêu mảnh, khống chế `overflow-hidden` chống tràn viền bo tròn, loại bỏ chú thích ngoại tộc thừa thãi.
  - Gốc phả đồ tùy biến (Dynamic Focus Root) tự động đổi vai dâu/rể, cháu nội/ngoại theo đồ thị.
- **Quyết định kiến trúc cho Milestone 3.2:**
  - Thiết kế **Slide-over Drawer (`MemberDetailDrawer.tsx`)** trượt êm ái từ cạnh phải thay vì Modal Dialog popup ở giữa màn hình, giữ trọn vẹn ngữ cảnh phả đồ bên dưới.
  - Hiển thị hồ sơ cá nhân toàn diện: Ngày giỗ Âm lịch chuẩn phong tục (Ngày, Tháng, Năm Can Chi), Ngày giỗ Dương lịch kế tiếp, Nơi an táng / Mộ phần (`burial_location`), Tiểu sử phả ký (`notes`).
  - Bảng thân tộc trực hệ 1 đời: Phụ mẫu, Phu thê (Vợ cả / Vợ hai), Hậu duệ (con đẻ / con nuôi, con trưởng), Huynh đệ.
  - Cụm hành động nhanh: Đặt làm Gốc, Tra cứu vai vế `/kinship`, Căn giữa phả đồ.
- **Môi trường vận hành:**
  - Dev server đang chạy nền tại `http://localhost:3000`.
  - Baseline tests: 30 tests PASS.
- **Các file đang thao tác chính:**
  - `src/components/tree/FamilyTreeCanvas.tsx`
  - `src/components/tree/MemberNode.tsx`
  - `src/components/tree/GhostNode.tsx`
  - `src/components/tree/TreeToolbar.tsx`
  - `src/lib/tree-layout/genealogy-layout.ts`
  - `src/types/tree.ts`
  - `docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md`

### 2. Task Checklist
- [x] Nâng cấp toàn diện Luật kiểm thử lên Version 7 (`[R-VERIFY]`, `[VERIFY_COMMANDS]`, 30/30 tests pass).
- [x] Hoàn thành thi công, kiểm chứng tự động và tinh chỉnh UI Milestone 3.1 (Core Canvas, Bus Hierarchy, Focus Root, Ghost Node nội tộc đối xứng 2 chiều, Flat Seamless Footer).
- [x] Brainstorm và lập bản quy hoạch kỹ thuật cho Milestone 3.2 (Bảng chi tiết thành viên Member Detail Drawer & Thân tộc trực hệ).
- [ ] Chạy `/feature-spec` khởi tạo file đặc tả `docs/12_Micro-Spec_Milestone_3.2_Member_Detail_Drawer.md` kèm Ma trận Test Cases.
- [ ] Mở rộng types `MemberRecord` (`alias_name`, `burial_location`, `notes`, `death_lunar_year_name`) và nạp dữ liệu mẫu phong phú vào `SAMPLE_MEMBERS_28`.
- [ ] Xây dựng Component `MemberDetailDrawer.tsx` theo chuẩn phong cách Modern Vietnamese Heritage.
- [ ] Tích hợp `onNodeClick` trên `FamilyTreeCanvas.tsx` để điều khiển mở Drawer và đồng bộ điều hướng camera.
- [ ] Viết bộ test tự động `tests/member-detail.test.ts` (kiểm thử trích xuất quan hệ tiểu gia đình, tính ngày giỗ) và chạy `npm.cmd test` (mục tiêu $\ge 33$ tests PASS).
- [ ] Kiểm chứng 3 tầng (Typecheck → Automated Test Suite → Human UAT trên `http://localhost:3000/tree`).

### 3. Immediate Next Step
- Chạy `/feature-spec` để tạo file Đặc tả Vi mô `docs/12_Micro-Spec_Milestone_3.2_Member_Detail_Drawer.md` cho Milestone 3.2.
