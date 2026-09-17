# STATE MANIFEST

### 1. Key Context
- **Môi trường & Nền tảng:** Linux, Next.js 14 App Router, TypeScript, `@xyflow/react` v12, Supabase PostgreSQL, Node.js Test Runner (`node:test`).
- **Lệnh kiểm chứng (`[VERIFY_COMMANDS]`):**
   - Typecheck: `npm run typecheck` (0 errors)
   - Build: `NEXT_DIST_DIR=".next-build" npm run build` (28/28 pages static generated, isolated build)
   - Test: `npm test` (174/174 tests PASS, 27 test suites, 0 fail, 100% pass)
   - Dev Server: Đang chạy nền tại `http://localhost:3000`
- **Các quyết định kỹ thuật & thiết kế cốt lõi hoàn thành trong phiên này:**
  1. *Edge Case 39 — Nối Phả Thông Minh Trong Khay Chưa Nối (Smart Pairing & Stepchild Relink):*
     - Pure function `resolveRelinkPayload(selectedParent, selectedSpouseId, isSpouseOptedOut)` trong `UnlinkedMembersDrawer.tsx`.
     - 1 vợ/chồng: Tự động đề xuất người phối ngẫu (mặc định checked, cho phép opt-out con riêng).
     - $\ge 2$ vợ/chồng: Radio Buttons chọn Bà cả / Bà hai / Con riêng.
     - Độc thân: Tự động lưu làm con riêng.
     - Nâng cấp `onRelinkMember` trong `FamilyTreeCanvas.tsx` và `ClanDashboard.tsx` nhận payload `{ father_id, mother_id }` hoặc string cũ để tương thích ngược.
     - Fix dữ liệu thực tế: Cháu `Phạm Hải Nam` và `Phạm Hà Phương` nhận đồng thời `father_id: Phạm Văn Bẩy` và `mother_id: Nguyễn Thị Thuý Hiền`, triệt tiêu 100% tình trạng 1 xanh 1 tím trên Cây.
     - 3 test cases mới, nâng tổng từ 169 lên 172 tests PASS. Tick RG29.
  2. *Edge Case 40 — Thống Nhất Phong Cách Radio Phẳng & Xóa Bỏ Box-in-Box (Unified Flat Radio Group & Zero Box-in-Box):*
     - Xóa bỏ hoàn toàn Checkbox cho trường hợp 1 vợ, thống nhất 100% sang Radio Button cho tất cả trường hợp ($\ge 1$ vợ).
     - Triệt tiêu 100% container viền lồng hộp (`border-emerald-200 bg-emerald-50` và `border-amber-200 bg-amber-50`). Khối lựa chọn phẳng hoàn toàn (Flat & Seamless).
     - Rào chắn kiểm thử tự động cấu trúc mã nguồn `TC_UT_DRAWER_ZERO_BOX_IN_BOX_GUARD_01`: Quét mã nguồn `UnlinkedMembersDrawer.tsx` chặn đứng box-in-box tái xuất hiện.
     - 2 test cases mới, nâng tổng từ 172 lên 174 tests PASS. Tick RG30.

- **Tệp nguồn đã chỉnh sửa trong phiên này:**
  - `src/components/tree/UnlinkedMembersDrawer.tsx` (Edge Case 39: Smart Pairing → Edge Case 40: Flat Radio + Zero Box-in-Box)
  - `src/components/tree/FamilyTreeCanvas.tsx` (Hỗ trợ payload `{ father_id, mother_id }` trong `handleRelinkMember`)
  - `src/components/admin/ClanDashboard.tsx` (Hỗ trợ payload `{ father_id, mother_id }` trong `handleRelinkMember`)
  - `tests/child-unlink-and-parent-reassignment.test.ts` (Bổ sung 5 tests: 3 Edge Case 39 + 2 Edge Case 40)
  - `docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md` (Tick `[x]` 5 tiêu chí 7.1, RG29, RG30, thêm Edge Case 39 & 40)
  - `.agents/brain/lessons_learned.md` (Ghi chép bài học Edge Case 39 & 40)

### 2. Task Checklist
- [x] Phân tích căn nguyên gốc rễ tình trạng tách đôi con riêng ngoài Canvas (Edge Case 39) qua `/feature-brainstorm`.
- [x] Cập nhật Edge Case 39, 3 tiêu chí automated tests mới, 3 tiêu chí UAT mới và RG29 vào `Micro-Spec 13` qua `/feature-spec`.
- [x] Thi công mã nguồn Edge Case 39: Smart Pairing trong `UnlinkedMembersDrawer.tsx`, nâng cấp `onRelinkMember` nhận `{ father_id, mother_id }` qua `/feature-code` (172/172 tests PASS).
- [x] Fix dữ liệu thực tế cho 2 cháu Nam và Phương nhận cả Cụ Bẩy và Bà Hiền.
- [x] Phân tích bất đồng nhất phong cách (Checkbox vs Radio) và vết xe đổ Box-in-Box (Edge Case 40) qua `/feature-brainstorm`.
- [x] Cập nhật Edge Case 40, 2 tiêu chí automated tests mới, 2 tiêu chí UAT mới và RG30 vào `Micro-Spec 13` qua `/feature-spec`.
- [x] Thi công mã nguồn Edge Case 40: Flat Radio Group + Zero Box-in-Box trong `UnlinkedMembersDrawer.tsx` qua `/feature-code` (174/174 tests PASS).
- [x] Tầng 1: Typecheck sạch (0 errors), Build thành công 28/28 pages (`NEXT_DIST_DIR=.next-build`).
- [x] Tầng 2: Automated Test Suite mở rộng lên 174/174 tests PASS 100% (27 suites, 0 fail, 0 regression).
- [ ] Tầng 3 (Human UAT): Người dùng mở trình duyệt kiểm tra thị giác theo checklist UAT_58–UAT_62.

### 3. Immediate Next Step
- Bàn giao cho người dùng thực hiện Human UAT (UAT_58, UAT_59, UAT_60 cho Edge Case 39 và UAT_61, UAT_62 cho Edge Case 40) trên trình duyệt thực tế tại `http://localhost:3000/tree`.
