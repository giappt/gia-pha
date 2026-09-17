# STATE MANIFEST

### 1. Key Context
- **Môi trường & Nền tảng:** Linux, Next.js 14 App Router, TypeScript, `@xyflow/react` v12, Supabase PostgreSQL, Node.js Test Runner (`node:test`).
- **Lệnh kiểm chứng (`[VERIFY_COMMANDS]`):**
   - Typecheck: `npm run typecheck` (0 errors)
   - Build: `NEXT_DIST_DIR=".next-build" npm run build` (28/28 pages static generated, isolated build)
   - Test: `npm test` (174/174 tests PASS, 27 test suites, 0 fail, 100% pass)
   - Dev Server: Đang chạy nền tại `http://localhost:3000`
- **Các quyết định kỹ thuật & thiết kế cốt lõi hoàn thành (Edge Case 40 - Flat Radio & Zero Box-in-Box):**
  1. *Thống Nhất 100% Sang Radio Group Phẳng (Unified Flat Radio Group):*
     - Dù người cha/mẹ có 1 vợ hay $\ge 2$ vợ, giao diện dùng DUY NHẤT một nhóm Radio Buttons.
     - Lựa chọn người phối ngẫu hiển thị theo danh xưng (`Mẹ` hoặc `Mẹ (Bà cả)`, `Mẹ (Bà 2)...`), kèm năm sinh và dòng chú thích xanh ngọc `✓ Con chung của cả hai người (hạ nhánh chính giữa cặp vợ chồng)`. Mặc định chọn người vợ đầu tiên.
     - Lựa chọn con riêng: `Không chọn mẹ/bố (Lưu làm con riêng của {tên})` kèm dòng chú thích hổ phách `⚠️ Lưu làm con riêng (hạ nhánh trực tiếp từ Bố/Mẹ)`.
  2. *Triệt Tiêu Triệt Để Vết Xe Đổ Box-in-Box (Zero Box-in-Box):*
     - Bỏ 100% các container viền lồng hộp (`border-emerald-200 bg-emerald-50` và `border-amber-200 bg-amber-50`).
     - Khối lựa chọn phẳng hoàn toàn, chỉ phân cách bằng đường kẻ mỏng `border-t border-amber-200/60 pt-2.5 mt-2`.
  3. *Rào Chắn Kiểm Thử Tự Động Cấu Trúc Mã Nguồn:*
     - `TC_UT_DRAWER_ZERO_BOX_IN_BOX_GUARD_01`: Quét mã nguồn `UnlinkedMembersDrawer.tsx` chặn đứng nguy cơ tái xuất hiện container lồng hộp và bảo đảm 100% dùng `type="radio"`.
     - Toàn bộ Test Suite đạt **174/174 tests PASS 100%** (27 suites, 0 fail).

- **Tệp nguồn đã chỉnh sửa & tạo mới:**
  - `src/components/tree/UnlinkedMembersDrawer.tsx` (Flat Radio Group, Zero Box-in-Box)
  - `tests/child-unlink-and-parent-reassignment.test.ts` (Bổ sung 2 tests Edge Case 40)
  - `docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md` (Tick `[x]` 2 tiêu chí 7.1 và RG30)
  - `.agents/brain/lessons_learned.md` (Ghi chép bài học Edge Case 40)

### 2. Task Checklist
- [x] Phân tích bất đồng nhất phong cách (Checkbox vs Radio) và vết xe đổ Box-in-Box qua `/feature-brainstorm`.
- [x] Cập nhật Edge Case 40, 2 tiêu chí automated tests mới, 2 tiêu chí UAT mới và RG30 vào `Micro-Spec 13` qua `/feature-spec`.
- [x] Thi công mã nguồn Flat Radio Group, xóa bỏ 100% lồng hộp trong `UnlinkedMembersDrawer.tsx` qua `/feature-code`.
- [x] Tầng 1: Typecheck sạch (0 errors), Build thành công 28/28 pages (`NEXT_DIST_DIR=.next-build`).
- [x] Tầng 2: Automated Test Suite mở rộng lên 174/174 tests PASS 100% (27 suites, 0 fail, 0 regression).
- [ ] Tầng 3 (Human UAT): Người dùng mở trình duyệt kiểm tra thị giác theo checklist UAT_61, UAT_62.

### 3. Immediate Next Step
- Bàn giao báo cáo nghiệm thu thực nghiệm terminal cho người dùng và mời người dùng thực hiện Human UAT (UAT_61, UAT_62) trên trình duyệt thực tế.

