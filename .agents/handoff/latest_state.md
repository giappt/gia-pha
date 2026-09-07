# STATE MANIFEST

### 1. Key Context
- **Mục tiêu phiên làm việc vừa hoàn tất:** Giải quyết triệt để vấn đề các bà vợ bị gán nhầm `Đời 1` & huy hiệu `✨ Cụ Tổ`, chuẩn hóa kiến trúc Cụ Thủy Tổ duy nhất (`Single Root Policy`), tự động suy diễn thế hệ theo đồ thị (`Graph-Derived Generation`), và chuẩn hóa tệp gia phả `gia_pha_ho_pham_van_lite.xlsx` (60 thành viên) kết nối liền mạch từ Đời 1 đến Đời 13.
- **Các quyết định kiến trúc & kỹ thuật cốt lõi:**
  1. **Single Source of Truth (`clan_settings.root_ancestor_id`):** CSDL chỉ lưu duy nhất 1 Cụ Thủy Tổ tại bảng `clan_settings`. Không đánh cờ tĩnh tràn lan trên bảng `members`. Cung cấp dropdown chọn Cụ Thủy Tổ nội tộc tại cả 2 trang [ClanProfilePage](file:///d:/pj/other/fat/src/app/admin/profile/page.tsx) và [ClanSettingsPage](file:///d:/pj/other/fat/src/app/admin/settings/page.tsx).
  2. **Duyệt phân tầng BFS (`genealogy-layout.ts`):** Thế hệ được tính động: Cụ Thủy Tổ là `Đời 1` (`isRoot = true`), con cái nhận `cha/mẹ + 1`, phối ngẫu (dâu/rể) tự động nhận cùng thế hệ với người bạn đời huyết thống (`isRoot = false`). Tọa độ Y phân tầng chuẩn mực `(computedGen - 1) * 220px`.
  3. **Độc quyền Huy Hiệu `✨ Cụ Tổ` (`MemberNode.tsx`):** Xóa bỏ hoàn toàn điều kiện `|| nodeData.generationLevel === 1`. Chỉ render huy hiệu khi `nodeData.isRoot === true`. Các bà vợ Cụ Tổ hiển thị danh xưng `🌸 Bà cả / Bà hai` và `† Đã mất`, các dâu đời sau nhận đúng thế hệ theo chồng.
  4. **Import Clean Mode Sync (`/api/admin/import`):** Tự động đồng bộ `root_ancestor_id` vào `clan_settings` khi gặp dòng `isRoot: true`, kèm Pass 2 đồng bộ `generation_level` cho phối ngẫu ngoại tộc.
  5. **Chuẩn hóa tệp `gia_pha_ho_pham_van_lite.xlsx`:** Bổ sung đầy đủ STT Bố/Mẹ cho các nhánh chính (STT 4, 6, 32, 34, 36, 69, 122, 795, 797), sắp xếp topological sort không có chu trình (no cycles).
- **Kết quả kiểm chứng 3 tầng (Code-First Verification):**
  - `Typecheck`: 0 lỗi (`tsc --noEmit`).
  - `Build`: 27/27 static & dynamic routes compiled thành công.
  - `Automated Test Suite`: **131/131 PASS 100% (22 test suites)**, 0 failure mới so với baseline `none`. File test mới `tests/root-setting-and-generation.test.ts` pass trọn vẹn 5/5 test cases.
  - `Reverse Sync`: Đã tick duyệt toàn bộ tiêu chí Mục 7.1 và Mục 8 trong `docs/16_Micro-Spec_Milestone_7_Admin_Portal_Reorganization.md`.
  - `Dev Server Status`: Đang chạy sạch sẽ, ổn định tại **`http://localhost:3000`** (HTTP 200 OK).

### 2. Task Checklist
- [x] Phân tích nguyên nhân gốc rễ (Root Cause Analysis) và cập nhật Spec Section 12 (Mở rộng Milestone 7.3)
- [x] Nâng cấp API `GET`/`PATCH` `/api/clan-settings` hỗ trợ đọc/ghi `root_ancestor_id`
- [x] Bổ sung UI chọn Cụ Thủy Tổ trên `/admin/profile` và `/admin/settings`
- [x] Nâng cấp lõi layout `src/lib/tree-layout/genealogy-layout.ts` duyệt BFS tính thế hệ động và gán `isRoot` độc quyền
- [x] Sửa `src/components/tree/MemberNode.tsx` loại bỏ điều kiện hiển thị sai `generationLevel === 1`
- [x] Cập nhật `src/app/api/admin/import/route.ts` tự động đồng bộ Cụ Thủy Tổ và thế hệ phối ngẫu
- [x] Chuẩn hóa dữ liệu `docs/data/gia_pha_ho_pham_van_lite.xlsx` nối liền mạch 60 thành viên từ Đời 1 đến Đời 13
- [x] Xây dựng test suite `tests/root-setting-and-generation.test.ts` kiểm thử tự động 5 tiêu chí AC
- [x] Chạy kiểm chứng 3 tầng: Typecheck 0 lỗi, Build 27/27 routes, Test Suite 131/131 PASS
- [x] Ghi chép bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`
- [x] Khởi động lại Next.js dev server tại `http://localhost:3000` phục vụ nghiệm thu
- [ ] User thực hiện nghiệm thu thị giác (Human Visual UAT) trên trình duyệt: Nạp file Excel lite vào DB và ngắm cây tại `/tree`
- [ ] Sau khi nghiệm thu xong: Chọn hướng tiếp theo (Milestone 8 Claim Profile hoặc Lịch Giỗ Thông Minh / Xuất Phả Đồ In Ấn)

### 3. Immediate Next Step
- Mở trình duyệt tại **`http://localhost:3000/admin/import`**, nạp file `docs/data/gia_pha_ho_pham_van_lite.xlsx` (chế độ Clean Mode) và truy cập **`http://localhost:3000/tree`** để nghiệm thu cây phả hệ 13 đời Họ Phạm Văn trên CSDL thật.
