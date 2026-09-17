# STATE MANIFEST

### 1. Key Context
- **Dự án:** `gia-pha` — Hệ thống quản lý Gia Phả dòng họ Phạm.
- **Phiên làm việc (conversation 085efe27):** Xuyên suốt nhiều vòng `/feature-brainstorm` → `/feature-spec` → `/feature-code` → `/g-compact`:
  - **Milestone 5 (Anniversaries/WebPush/Cron):** Đã hoàn tất các Edge Case 39 (Smart Pairing UnlinkedMembersDrawer), Edge Case 40 (Flat Radio + Zero Box-in-Box).
  - **Brand Identity Logo:** Tạo chữ Hán thư pháp "Phạm" (范) dạng SVG vector path, tối ưu kích thước +35% (Phương án A), rescale 88% viewBox, `size=28` Navbar / `size=38` Admin Profile.
  - **Đổi tên Navbar link:** "Hỏi Vai Vế" → "Xưng hô" (đồng bộ trên Navbar.tsx, Micro-Spec, lessons_learned.md).
- **Test Suite:** 191/191 tests PASS (27+ suites, 0 fail, 0 regression) tại thời điểm build gần nhất.
- **Build:** Thành công 28/28 pages (`NEXT_DIST_DIR=.next-build`), typecheck sạch 0 errors.
- **Git:** HEAD `a19d955` (main), chưa push lên origin. Có 3 file modified chưa commit:
  - `.agents/brain/lessons_learned.md` — đổi "Hỏi Vai Vế" → "Xưng hô"
  - `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md` — đổi "Hỏi Vai Vế" → "Xưng hô"
  - `src/components/navbar/Navbar.tsx` — đổi `<span>Hỏi Vai Vế</span>` → `<span>Xưng hô</span>`
- **Dev Server:** `npm run dev` đang chạy tại `http://localhost:3000`.
- **VERIFY_COMMANDS:** `Typecheck: npm.cmd run typecheck`, `Build: npm.cmd run build`, `Test: npm.cmd test`, `Dev_URL: http://localhost:3000`.

### 2. Task Checklist
- [x] Brainstorm & phân tích Edge Case 39 (Smart Pairing — con riêng tách đôi ngoài canvas).
- [x] Cập nhật Micro-Spec 13 với Edge Case 39, test cases, RG29.
- [x] Code Edge Case 39: Smart Pairing trong `UnlinkedMembersDrawer.tsx` (172/172 PASS).
- [x] Fix dữ liệu thực tế 2 cháu Nam và Phương.
- [x] Brainstorm & phân tích Edge Case 40 (Checkbox→Radio, Box-in-Box).
- [x] Cập nhật Micro-Spec 13 với Edge Case 40, test cases, RG30.
- [x] Code Edge Case 40: Flat Radio Group + Zero Box-in-Box (174/174 PASS).
- [x] Brainstorm Logo chữ Hán thư pháp "Phạm" (范) — chọn nét chữ, bỏ màu background.
- [x] Feature-spec Logo scale up (+35%, Phương án A).
- [x] Feature-code Logo scale up — rescale SVG vector path, cập nhật 3 component files.
- [x] Tầng 1: Typecheck sạch, Build thành công.
- [x] Tầng 2: 191/191 Automated Tests PASS.
- [/] Đổi nhãn "Hỏi Vai Vế" → "Xưng hô" trên Navbar + Spec + lessons_learned (3 file modified, chưa commit).
- [ ] Tầng 3 (Human UAT): User kiểm tra thị giác logo + nhãn "Xưng hô" trên localhost:3000.
- [ ] Git push lên origin/main.

### 3. Immediate Next Step
- Commit 3 file đổi nhãn "Hỏi Vai Vế" → "Xưng hô" → chạy lại test xác nhận không regression → Human UAT trên `http://localhost:3000`.
