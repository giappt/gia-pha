# STATE MANIFEST
### 1. Key Context
- **Phiên làm việc:** /feature-brainstorm — Thiết kế lại giao diện toàn bộ hệ thống FAT theo phong cách "Di Sản Đương Đại" (Heritage Minimalism). Xây dựng prototype tương tác tại `src/app/prototype/redesign/page.tsx` gồm 7 màn hình (Trang Chủ, Lịch Giỗ, Cây Gia Phả, Xưng Hô, Quản Trị, Form Nhập Liệu, và Bảng Quy Chuẩn Design Tokens).
- **Quyết định thiết kế cốt lõi đã chốt:**
  1. Bảng màu Di Sản: Nền giấy Dó ngà ấm `#FAF8F2`, viền đá hairline ấm `#EAE5D9`, xanh ngọc chủ đạo `#0F382C`, bóng đổ 100% sắc nâu than chì `rgba(28,25,23,...)`.
  2. Anti-Pill Law: 100% thẻ dùng `rounded-2xl (16px)`, nút/input dùng `rounded-lg (8px)`, huy hiệu dùng `rounded-md (6px)`. Cấm tuyệt đối `rounded-full` trên nút bấm và badge. 0 emoji trong mã nguồn.
  3. Windows Vietnamese Kerning Fix: 100% `font-sans` cho Form, Admin, Modal, Data Table. Chỉ `font-serif` cho Hero Title trang trọng.
  4. Phương Án 1 Chọn cho PA Giới Tính Phả Hệ: Sáng & Trong Trẻo (Nam `#38BDF8`, Nữ `#FB7185`) là mặc định.
  5. Tem Lịch Bloc: Khóa cứng `90×108px` desktop, `76×96px` mobile. Gáy đỏ `#B91C1C`, đường xé nét đứt, số âm lịch lệch trái `#BE123C`.
  6. Prototype cách ly hoàn toàn trong `src/app/prototype/redesign/` — KHÔNG chạm production components.
- **Trạng thái kiểm chứng (đã pass tại thời điểm compact):**
  - `npm.cmd run typecheck` → Exit 0 (0 errors).
  - `npm.cmd test` → Exit 0 (445/445 tests passed, 0 failures).
  - `tests/anti-pill-integrity.test.ts` → PASS 4/4 (0 emoji, 0 pill vi phạm).
- **File chính đang thao tác:**
  - `d:\pj\other\fat\src\app\prototype\redesign\page.tsx` (4593 dòng, 7 màn hình prototype)
  - `d:\pj\other\fat\.agents\brain\lessons_learned.md` (đã cập nhật bài học 10 Trụ Cột Thiết Kế)
  - `d:\pj\other\fat\docs\16_Micro-Spec_Milestone_7_Admin_Portal_Reorganization.md`
- **Dev server:** `npm run dev` đang chạy liên tục trên port 3000.

### 2. Task Checklist
- [x] Prototype 7 màn hình hoàn chỉnh tại `/prototype/redesign` (Trang Chủ, Lịch Giỗ, Cây Gia Phả, Xưng Hô, Quản Trị, Form Nhập Liệu, Tokens)
- [x] Header Bar thống nhất với logo ấn triện 范, tab điều hướng có trạng thái active, sticky top
- [x] Studio Inspector Ribbon (dải đen chì 32px) cho DevTools (Desktop/Mobile toggle, kịch bản giỗ, v.v.)
- [x] Live Modal popup thành viên tương tác thật (form nhập liệu 5 tab)
- [x] Hệ thống 4 Phương Án màu sắc phả hệ (PA 1-4) với Live Palette Switcher trên tab Cây Gia Phả
- [x] Màn hình 7: Bảng Quy Chuẩn Thiết Kế Toàn Diện — 10 phân khu thị giác + CSS Variables Manifest + Tailwind Config Extension
- [x] Fix lỗi TypeScript (duplicate `)`) trên dòng 3771 gây TS1381
- [x] Ghi bài học kinh nghiệm "10 Trụ Cột Thiết Kế Bắt Buộc" vào lessons_learned.md
- [x] Kiểm chứng 3 tầng: Typecheck 0 lỗi, Test 445/445 pass, Anti-Pill 4/4 pass
- [/] **Phản hồi User chưa xử lý xong:** User hỏi "Phân khu 9 (Quy Chuẩn Tem Lịch Bloc) chỉ có mỗi màu đỏ thì có đủ không? Còn ngày mai và ngày bình thường đâu?" — cần bổ sung thêm màu sắc cho 3 trạng thái thời gian của tem lịch bloc (Hôm nay giỗ / Ngày mai giỗ / Ngày bình thường tương lai)
- [ ] Bổ sung vào Phân Khu 9 đầy đủ 3 trạng thái thời gian: (1) Hôm nay giỗ = Đỏ `#B91C1C`/`bg-red-600`, (2) Ngày mai giỗ = Vàng Hổ Phách `bg-amber-400 text-slate-950`, (3) Ngày bình thường tương lai = Xanh Ngọc `bg-emerald-800 text-white` — phải khớp 100% với logic thực tế trong `AnniversaryBlocCard.tsx` và `AnniversaryBlocTimeline.tsx`
- [ ] Bổ sung vào Phân Khu 9 màu sắc nhãn trạng thái văn bản: (1) `text-red-600` HÔM NAY GIỖ + icon Flame, (2) `text-amber-600` NGÀY MAI GIỖ + icon Star, (3) `text-slate-500` Còn X ngày + icon Clock
- [ ] Human Visual UAT toàn bộ 7 màn hình prototype tại `http://localhost:3000/prototype/redesign`

### 3. Immediate Next Step
- Bổ sung vào Phân Khu 9 (Quy Chuẩn Tem Lịch Bloc) trong Màn Hình 7 đầy đủ 3 trạng thái thời gian của gáy tem lịch bloc: **Hôm nay giỗ** (đỏ `bg-red-600`), **Ngày mai giỗ** (vàng hổ phách `bg-amber-400`), **Ngày bình thường tương lai** (xanh ngọc `bg-emerald-800`), cùng 3 nhãn trạng thái văn bản tương ứng — phải trích xuất chính xác từ mã nguồn production thực tế trong `AnniversaryBlocCard.tsx` dòng 25-35 và `AnniversaryBlocTimeline.tsx` dòng 25-43. Sau đó cập nhật CSS Variables Manifest và Tailwind Config tương ứng.
