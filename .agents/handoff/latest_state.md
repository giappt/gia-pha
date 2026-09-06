# STATE MANIFEST
### 1. Key Context
- **Workspace:** `/home/kakashi/sources/pj/gia-pha`
- **Mục tiêu đã hoàn tất trong phiên:**
  - Giải quyết triệt để các câu hỏi cốt lõi về hiện trạng Database (CSDL Supabase đã kết nối, cấu trúc bảng sẵn sàng, số lượng bản ghi thực tế hiện tại là 0).
  - Khẳng định lộ trình dọn dẹp Mock data có kiểm soát (Decoupling & Migration Plan) thay vì xóa chắp vá.
  - Phân tích cấu trúc gốc 1.336 dòng từ file `GIA PHẢ HỌ PHẠM VĂN.docx` và `GIA_PHA_HO_PHAM_VAN.md`.
  - Thiết lập nguyên tắc bất biến: Tuyệt đối cấm AI tự ý suy đoán quan hệ Cha - Con (Anti-Hallucination Guard) từ Đời 5 đến Đời 14; cột `STT Bố` và `STT Mẹ` bắt buộc để trống cho ban trị sự điền tay theo sổ phả gốc.
  - Xây dựng hoàn chỉnh Ingestion Pipeline (`scripts/extract_genealogy.py` & `scripts/build-clan-excel.mjs`) bóc tách 1.299 nhân khẩu sang file Excel chuẩn 19 cột `docs/data/gia_pha_ho_pham_van.xlsx` (1.299/1.299 dòng hợp lệ, 0 lỗi, `canImport: true`, Topological Sort pass 100%).
  - Tự động liên kết trục truyền đơn 4 đời đầu: Cụ Thủy Tổ Chiến (`STT = 1`, Cụ Tổ = 'Đ') $\rightarrow$ Cụ Đồng $\rightarrow$ Cụ Chức $\rightarrow$ Cụ Tường.
  - Tự động sửa lỗi chu trình tự trỏ (self-loop) ở Cụ Tường Đời 4 trong `docs/data/GIA_PHA_HO_PHAM_VAN.md`.
  - Cung cấp lệnh một chạm `npm run data:convert` trong `package.json` và biên soạn tài liệu `docs/data/HUONG_DAN_NHAP_LIEU.md`.
  - Cập nhật Mục 4.4 Ingestion Pipeline vào `docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md` và ghi bài học vào `.agents/brain/lessons_learned.md`.
- **Hạ tầng kiểm chứng 3 tầng (`[VERIFY_COMMANDS]`):**
  - Typecheck: `npm run typecheck` $\rightarrow$ **0 lỗi** (`tsc --noEmit` PASS).
  - Test Suite: `npm test` $\rightarrow$ **82/82 tests PASS 100%** (11 suites, 0 failures, 0 skipped).
  - Production Build: `NEXT_DIST_DIR=.next-build npm run build` $\rightarrow$ **17/17 pages static generation thành công 100%**.
- **Dev Server:** Đang sẵn sàng tại `http://localhost:3000`.

### 2. Task Checklist
- [x] Tạo kiến trúc & đặc tả kỹ thuật vi mô Milestone 4 (`docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md`)
- [x] Triển khai bộ thư viện kiểm tra chu trình đồ thị & phát hiện hôn nhân nội tộc (`src/lib/tree-layout/graph-validation.ts`)
- [x] Triển khai bộ parser & topological sort cho file Excel nạp hàng loạt (`src/lib/excel/excel-parser.ts`)
- [x] Triển khai API quản lý thành viên, hôn phối & bulk import (`src/app/api/members`, `src/app/api/spouse-relations`, `src/app/api/admin/import`)
- [x] Xây dựng màn hình Bulk Excel Import `/admin/import` và xuất template mẫu
- [x] Xây dựng Drawer Khay thành viên chưa nối phả (`UnlinkedMembersDrawer.tsx`)
- [x] Hoàn thiện Form Thành viên 1 màn hình adaptive (`MemberFormModal.tsx`)
- [x] Cải tổ thẩm mỹ Form Thành viên: Flat Seamless UI, xóa bỏ box-in-box, sửa rớt dòng, ẩn checkbox Cụ Tổ, đồng nhất Pill button & Segmented control
- [x] Khắc phục triệt để lỗi sụp đổ chiều cao Flexbox container trên `/tree` & neo chiều cao viewport React Flow
- [x] Khắc phục triệt để lỗi xung đột theme Dark/Light Frankenstein & đồng bộ `colorMode` reactive
- [x] Khắc phục lỗi Sticky Footer đè cắt ngang phả hệ trên trang `/kinship`
- [x] Bổ sung tính toán song song Tuổi Dương & Tuổi Mụ kèm tooltip giải thích công thức
- [x] Chuẩn hóa toàn bộ danh xưng thân tộc thuần Việt qua `KINSHIP_TERMS`
- [x] Dọn trùng thứ tự sinh `birth_order` và chuyển giao con trưởng `is_senior` tự động
- [x] Rà soát & khắc phục lỗi nhân bản bản ghi khi Thêm Phối ngẫu Nội tộc (`POST /api/spouse-relations` thay vì `POST /api/members`)
- [x] Tích hợp nút `[🗑️ Xóa hồ sơ]` Safe Delete RESTRICT trên `MemberDetailDrawer.tsx` kèm hộp thoại xác nhận và nối handler vào Canvas
- [x] Chuẩn hóa hình học trang Import Excel (`rounded-lg` / `rounded-md` Crisp Architectural Geometry)
- [x] Chuẩn hóa xử lý lỗi DB trong API Import (`fail-fast HTTP 500`)
- [x] Viết bổ sung 4 test tự động (`TC_INT_INTERNAL_SPOUSE_SUBMIT`, `TC_INT_IMPORT_DB_ERROR_PROPAGATION`, `TC_UT_DRAWER_SAFE_DELETE_STATUS`, `TC_UT_IMPORT_PAGE_GEOMETRY`)
- [x] Chạy kiểm chứng 3 tầng: Typecheck 0 lỗi, Build 17/17 pages, Test Suite 82/82 tests PASS 100%
- [x] Bổ sung Mục 4.4 Ingestion Pipeline vào `docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md`
- [x] Xây dựng script Ingestion Pipeline bóc tách tự động 1.299 nhân khẩu Họ Phạm Văn sang file Excel chuẩn 19 cột `docs/data/gia_pha_ho_pham_van.xlsx` (0 lỗi, canImport: true)
- [x] Sửa triệt để lỗi chu trình tự trỏ (self-loop) ở Cụ Tường Đời 4 trong `docs/data/GIA_PHA_HO_PHAM_VAN.md`
- [x] Tạo tài liệu hướng dẫn nhập liệu cho dòng họ `docs/data/HUONG_DAN_NHAP_LIEU.md` kèm script `npm run data:convert`
- [x] Đồng bộ ngược (Reverse-Sync) Micro-Spec và ghi bài học Lineage Integrity vào `.agents/brain/lessons_learned.md`
- [ ] Lập Đặc tả Kỹ thuật Vi mô cho **Milestone 5 (Lịch Giỗ 30 Ngày, Vercel Cron & PWA Web Push Notification)** (`docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`)

### 3. Immediate Next Step
- Chạy `/feature-spec` để lập file Đặc tả Vi mô `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md` cho **Milestone 5 (Lịch Giỗ 30 Ngày, Vercel Cron & PWA Web Push Notification)**.
