# STATE MANIFEST

### 1. Key Context
- **Mục tiêu phiên làm việc vừa hoàn tất:** Tinh lọc toàn diện dữ liệu trích xuất từ tài liệu Word phả hệ (`GIA PHẢ HỌ PHẠM VĂN.docx`) sang Excel và CSDL, hoàn thiện Milestone 7 & Extension 7.4.
- **Git State:** User vừa commit `fix milestone 7` (hash: `b113dfb`) và push thành công lên `origin/main` (GitHub: `giappt/gia-pha.git`). Workspace hoàn toàn sạch sẽ (Clean working tree).
- **Các quyết định kỹ thuật cốt lõi vừa triển khai:**
  1. **Đa thê & Phân định Bà cả - Bà hai:** Phối ngẫu đa thê của Cụ Thủy Tổ Phạm Văn Chiến đã được phân cấp tuần tự: Cụ Bà Hoàng Thị Mơ (`🌸 Bà cả`, `marriage_order = 1`), Cụ Bà Đào Thị Liễu (`🌸 Bà hai`, `marriage_order = 2`). API `/api/admin/import` tự động phân tách chuỗi `spouseStt: "2, 3"`, tự động gán `marriage_order` tăng dần; lõi `genealogy-layout.ts` có cơ chế phòng vệ chống trùng lặp danh xưng.
  2. **Triệt tiêu 263 phối ngẫu ma giữ chỗ:** Script `extract_genealogy.py` loại bỏ 100% dòng rác chỉ chứa `Vợ: ` hoặc `Chồng: `, giảm dữ liệu từ 1,299 xuống đúng 1,036 thành viên thực thụ (`docs/data/gia_pha_ho_pham_van.xlsx`). File lite (`docs/data/gia_pha_ho_pham_van_lite.xlsx`) tinh gọn còn 52 dòng sạch sẽ kết nối 13 đời. Các thanh thiếu niên độc thân (Phạm Hải Nam, Phạm Hà Phương) không còn bị sinh ra vợ/chồng ma.
  3. **Tên cúng cơm (`alias_name`) & Khẳng định con đẻ:** 30 trường hợp có mở ngoặc `(...)` như `Phạm Văn Uyên (Nuôi)` được bóc tách vào `alias_name`. Toàn bộ 1,036 thành viên có `is_adopted = false` ('S'), triệt tiêu hoàn toàn lỗi hiểu nhầm Cụ Uyên thành con nuôi. `MemberNode.tsx` hiển thị trang trọng `(Tên cúng cơm: Nuôi)` kèm tooltip.
  4. **Bảo vệ người sống trước ghi chú hôn nhân & địa danh Phú Thọ:** Cột ghi chú chứa `Lấy vợ`, `Tái giá năm 2024` được đưa vào `notes` của người `Còn sống`, không bóc tách nhầm năm mất. Regex nhận diện tử tuất áp dụng ranh giới từ `\b(thọ|hưởng thọ|hd)\s*\d+` triệt tiêu lỗi bắt nhầm từ "thọ" trong `"ở Phú Thọ"`, giữ nguyên trạng thái `Còn sống` cho người trẻ tuổi.
- **Các file đang mở & liên quan mật thiết:**
  - `d:\pj\other\fat\.agents\handoff\latest_state.md`
  - `d:\pj\other\fat\src\app\tree\page.tsx`
  - `d:\pj\other\fat\src\components\tree\FamilyTreeCanvas.tsx`
  - `d:\pj\other\fat\src\components\admin\AdminSidebar.tsx`
  - `d:\pj\other\fat\scripts\extract_genealogy.py`
  - `d:\pj\other\fat\docs\16_Micro-Spec_Milestone_7_Admin_Portal_Reorganization.md`
- **Kết quả kiểm chứng 3 tầng (Code-First Verification):**
  - `Typecheck`: 0 lỗi (`npm.cmd run typecheck`).
  - `Build`: 27/27 static & dynamic routes compile sạch 0 lỗi (`npm.cmd run build`).
  - `Automated Test Suite`: **136/136 PASS 100% (22 test suites)**. Không phát sinh failure mới so với `Known_Failing_Baseline: "none"`.
  - `Dev Server`: Đang chạy ngầm ổn định tại cổng 3000 (`http://localhost:3000`).

### 2. Task Checklist
- [x] Phân tích Root Cause và cập nhật Spec Section 12 (Extension 7.4) trong `docs/16_Micro-Spec_Milestone_7_Admin_Portal_Reorganization.md`
- [x] Nâng cấp script bóc tách `scripts/extract_genealogy.py` (loại bỏ 263 dòng trống, bóc tách tên cúng cơm, sửa regex Phú Thọ, bảo vệ trạng thái sống)
- [x] Nâng cấp script Excel `scripts/build-clan-excel.mjs` hỗ trợ danh sách phối ngẫu `STT Vợ/Chồng: 2, 3`
- [x] Tái sinh dataset đầy đủ `docs/data/gia_pha_ho_pham_van.xlsx` (1,036 thành viên sạch)
- [x] Tinh gọn dataset mẫu `docs/data/gia_pha_ho_pham_van_lite.xlsx` (52 thành viên kết nối liền mạch 13 đời)
- [x] Cập nhật API `src/app/api/admin/import/route.ts` bóc tách `alias_name` và tự động suy luận `marriage_order`
- [x] Cập nhật lõi layout `src/lib/tree-layout/genealogy-layout.ts` phòng vệ chống trùng lặp danh xưng Bà cả
- [x] Cập nhật `src/components/tree/MemberNode.tsx` hiển thị tên cúng cơm kèm tooltip
- [x] Bổ sung 5 Unit Tests tự động tại `tests/root-setting-and-generation.test.ts`
- [x] Chạy kiểm chứng 3 tầng: Typecheck 0 lỗi, Build 27/27 routes, Test Suite 136/136 PASS
- [x] Reverse Sync tick `[x]` 5 tiêu chí AC trong Micro-Spec
- [x] Ghi chép bài học kinh nghiệm tại `.agents/brain/lessons_learned.md`
- [x] Khởi động lại Next.js dev server tại `http://localhost:3000`
- [x] Commit và Push mã nguồn lên GitHub (`git push` origin main thành công)
- [ ] User thực hiện nghiệm thu thị giác (Human Visual UAT) trên trình duyệt
- [ ] Lựa chọn hướng phát triển tiếp theo (Milestone 8 Claim Profile hoặc Lịch Giỗ Thông Minh / In Ấn Phả Đồ)

### 3. Immediate Next Step
- Mở trình duyệt tại **`http://localhost:3000/admin/import`**, nạp file `docs/data/gia_pha_ho_pham_van_lite.xlsx` (chế độ Clean Mode) và truy cập **`http://localhost:3000/tree`** để nghiệm thu trực quan cây phả hệ 13 đời Họ Phạm Văn trên CSDL thật.
