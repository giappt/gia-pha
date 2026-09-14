# STATE MANIFEST

### 1. Key Context
- **Môi trường & Nền tảng:** Windows (PowerShell), Next.js 14 App Router, TypeScript, `@xyflow/react` v12, Supabase PostgreSQL, Node.js Test Runner (`node:test`).
- **Lệnh kiểm chứng (`[VERIFY_COMMANDS]`):**
  - Typecheck: `npm.cmd run typecheck` (0 errors)
  - Build: `$env:NEXT_DIST_DIR=".next-build"; npm.cmd run build` (27/27 pages generated, isolated build)
  - Test: `npm.cmd test` (148/148 tests PASS, 24 test suites, 0 fail)
  - Dev Server: Đang chạy nền tại `http://localhost:3001` (Task ID `task-452`)
- **Các quyết định kỹ thuật & thiết kế cốt lõi vừa chốt và hoàn thành:**
  1. *Cố định Y dòng tên thẻ Node (`MemberNode.tsx`):* Text container cố định `h-8` ($32\text{px}$) khớp avatar; dòng 2 giữ slot `h-[14px]` với fallback `\u00A0` khi rỗng $\rightarrow$ Dòng tên của người không có năm sinh/mất (`Nguyễn Thị Kim`) và người có năm sinh/mất (`Phạm Văn Cường`) luôn nằm trên cùng một hàng ngang phẳng phiu ($y$ không đổi).
  2. *Màu viền giới tính & Bỏ ký tự `†`:* Viền thẻ (`borderColor`) luôn theo giới tính (`isMale ? blue : pink`) bất kể sinh hay tử; avatar bên trong giữ nền xám trang trọng cho người đã mất; xóa sạch ký tự `†` ở tất cả các nơi (`MemberNode`, `MemberFormModal`, `age-utils`), chỉ hiển thị trang nhã chữ `Đã mất`.
  3. *Avatar Initials cho tên có mở ngoặc:* Hàm `getMemberInitials` lọc sạch nội dung trong ngoặc đơn/vuông trước khi split từ $\rightarrow$ `Phạm Văn Uyên (Nuôi)` sinh đúng initials **VU** (Tên đệm `Văn` + Tên chính `Uyên`).
  4. *Tách bạch triệt để Tên chính và Tên húy / Bí danh:*
     - Ô `Họ và Tên (*)` chỉ lưu tên chính `Phạm Văn Uyên`. Ô `Tên húy / Bí danh` lưu `Nuôi`.
     - Tự động bóc tách ngoặc khi nạp vào form (edit), khi người dùng gõ/blur, và khi submit form.
     - Khi import Excel vào DB (`import/route.ts`): Làm sạch `full_name` và lưu tên húy vào `alias_name`.
     - Drawer và thẻ Node chỉ hiển thị tên chính sạch, không bị tràn viền `Phạm Văn Uyên (N...` và không lặp lại chữ `(Nuôi)` 2 lần.
  5. *Đổi nhãn tiền tố `Tự:` thành `Tức:`:* Trên `MemberDetailDrawer.tsx` và tooltip, đổi `Tự: [alias_name]` thành `Tức: [alias_name]`.
- **Tệp nguồn đã chỉnh sửa:**
  - `src/lib/tree-layout/avatar-utils.ts` (lọc ngoặc đơn/vuông)
  - `src/lib/tree-layout/age-utils.ts` (bỏ ký tự `†`)
  - `src/components/tree/MemberNode.tsx` (cố định Y dòng tên, viền giới tính, bỏ `†`, hiển thị tên sạch)
  - `src/components/tree/MemberDetailDrawer.tsx` (đổi `Tự:` $\rightarrow$ `Tức:`, tiêu đề hiển thị tên sạch)
  - `src/components/modals/MemberFormModal.tsx` (tự động bóc tách tên chính và tên húy, bỏ `<span>†</span>`)
  - `src/app/api/admin/import/route.ts` (lưu tên chính sạch vào `full_name` và tên húy vào `alias_name`)
  - `tests/avatar-utils.test.ts` (bổ sung test case lọc ngoặc)
  - `tests/age-utils.test.ts` (cập nhật assertion bỏ `†`)
  - `tests/ui-normalization-and-identity.test.ts` (tạo mới bộ 6 automated test cases kiểm tra UI contract)
  - `docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md` (đồng bộ Edge Cases 24–28, tick `[x]` Mục 7.1 và RG19, RG20)
  - `.agents/brain/lessons_learned.md` (ghi chép bài học kỹ thuật chuẩn hóa UI & định danh)

### 2. Task Checklist
- [x] Phân tích căn nguyên gốc rễ 5 vấn đề UI/UX qua `/feature-brainstorm`.
- [x] Lập bản quy hoạch chi tiết trong `implementation_plan.md`.
- [x] Soạn thảo đặc tả vi mô bổ sung Edge Cases 24-28 và Ma trận Test trong `Micro-Spec 13` qua `/feature-spec`.
- [x] Thi công mã nguồn và tự động kiểm chứng 3 tầng qua `/feature-code`.
- [x] Tầng 1: Typecheck sạch (0 errors), Build thành công 27/27 pages.
- [x] Tầng 2: Automated Test Suite đạt 148/148 tests PASS 100% (24 suites, 0 fail).
- [x] Cập nhật ngược lại Micro-Spec 13 và ghi chú bài học vào `lessons_learned.md`.
- [ ] Tầng 3 (Human UAT): Người dùng mở trình duyệt kiểm tra thị giác độ thẳng hàng dòng tên, màu viền giới tính người đã mất, avatar VU và tiêu đề Drawer.

### 3. Immediate Next Step
- Người dùng mở trình duyệt tại `http://localhost:3000` (hoặc `http://localhost:3001`) để nghiệm thu thị giác theo 5 điểm checklist trong [walkthrough.md](file:///C:/Users/giap.pham/.gemini/antigravity-ide/brain/341a4b1e-e547-446a-8843-a572a74367b2/walkthrough.md), hoặc nêu tiếp các tính năng/tinh chỉnh tiếp theo.
