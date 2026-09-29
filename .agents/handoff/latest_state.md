# STATE MANIFEST
### 1. Key Context
- **Nhiệm vụ vừa thực hiện:** Hoàn thiện Milestone 9 (Design Profiles Switcher & Tái thiết kế Lịch Giỗ theo phong cách Lịch Bloc truyền thống), chuẩn hóa nhận diện thương hiệu theo Phương Án A (Clean Lunar Red) và bố cục riêng biệt cho PC vs Mobile.
- **Các quyết định kỹ thuật & thiết kế đã chốt:**
  1. *Brand Sovereignty:* Giữ nguyên nhận diện màu chủ đạo Xanh Lục Bảo (`emerald-600`) cho H1 "DÒNG HỌ PHẠM VĂN", Eyebrow, Logo, Navbar, và nút CTA chính. Tính năng đổi màu chủ đề cho sự kiện/chào mừng sẽ tách riêng, không gộp vào Design Profile.
  2. *Phương Án A (Clean Lunar Red):* Xóa bỏ hoàn toàn dải chân nền vàng kem ngà (`bg-amber-100`) tại Desktop Timeline. Mọi ngày âm lịch trên hệ thống đồng nhất sử dụng số màu ĐỎ SON (`text-red-600 dark:text-red-400 font-black`) trên nền giấy trắng sứ, chữ ngữ cảnh mang màu xám chì.
  3. *Đỉnh Bloc Tháng Tương Lai:* Chuyển từ xám than sang Xanh Ngọc Lục Bảo Trầm (`bg-emerald-800 text-white font-bold`) để kết nối với nhận diện dòng họ, nhường sắc đỏ rực cho ngày Hôm Nay Giỗ (`bg-red-600`).
  4. *Bố cục Âm lịch Thẻ Home Spotlight (Responsive Dual Anatomy):*
     - **Trên Desktop (PC - md+):** Bố cục Lệch Trái 2 Dòng (Left-Aligned 2-Row Split). Số ngày âm `19` đỏ to căn trái cao 2 dòng; kề bên phải gồm 2 tầng: tầng trên là `tháng 8 âm lịch` (`text-xs font-bold`), tầng dưới là `Năm Bính Ngọ` (`text-[11px] font-medium`). Cụm được căn giữa hoàn hảo trong cột Lịch Bloc 185px.
     - **Trên Mobile (< md):** Bố cục Dàn Ngang 2 Mép (`justify-between`). Mép trái là `19 tháng 8 âm lịch`, mép phải là `Năm Bính Ngọ` (chuẩn 100% theo ảnh chụp thiết kế thực tế).
  5. *Tự động phân giải Ngành & Chi:* Tích hợp `resolveMemberBranchHierarchy` từ `branch-engine.ts` để tự động truy vết phụ hệ từ người giỗ lên Cụ Khởi Nhánh (`rootMemberId`) đã khai báo trong `clan_settings.branches`, hiển thị chuẩn hóa phân tầng `Đời 12 · Chi 2 · Hưởng thọ 46t`.
- **Môi trường & Trạng thái Kiểm chứng:**
  - `npm run typecheck` $\rightarrow$ Exit 0 (0 errors).
  - `npm test` $\rightarrow$ Exit 0 (417/417 tests passed, 0 failures, 0 regressions).
  - `npm run build` $\rightarrow$ Exit 0 (38/38 routes compile & generate tĩnh thành công).
  - Dev server đang chạy trên terminal nền tại cổng `http://localhost:3000`.
- **Log / Lưu ý khi test trên trình duyệt:**
  - Khi chạy `npm run build` kiểm chứng trong lúc dev server đang chạy, Next.js sinh lại chunk hash mới. Trình duyệt client nếu đang mở tab cũ cần **Hard Refresh (`Ctrl + Shift + R` hoặc `Ctrl + F5`)** để nạp lại đúng bundle dev sạch, tránh lỗi chunk 404 tạm thời.

### 2. Task Checklist
- [x] Tạo migration `20260930000000_add_theme_config.sql` & cập nhật `src/types/database.ts`
- [x] Xây dựng theme engine `admin-engine.ts`, cập nhật API `/api/clan-settings` và `AdminSidebar.tsx`
- [x] Tạo trang Quản trị Giao diện `/admin/theme` với 2 Profile, 3 mức Scope và Live Preview
- [x] Triển khai Server-side Zero-FOUC injection trong `src/app/layout.tsx` & CSS tokens trong `src/app/globals.css`
- [x] Xây dựng `AnniversaryBlocCard.tsx` (Home Spotlight) và `AnniversaryBlocTimeline.tsx` (`/anniversaries`)
- [x] Tích hợp phân giải Ngành & Chi tự động vào `src/lib/anniversaries/anniversary-engine.ts`
- [x] Chuẩn hóa Phương Án A (Clean Lunar Red) và đỉnh tháng tương lai `bg-emerald-800`
- [x] Cập nhật bố cục Âm lịch Home Spotlight: PC (Lệch trái 2 dòng) vs Mobile (Dàn ngang 2 mép)
- [x] Viết unit tests tự động cho Theme Engine (`tests/theme-profile-engine.test.ts`) và Ngành/Chi Lịch Giỗ (`tests/anniversary.test.ts`)
- [x] Vòng lặp kiểm chứng 3 tầng: Typecheck pass, Test pass (417/417), Build pass (38/38 routes)
- [x] Cập nhật Đặc tả Vi mô `docs/18_Micro-Spec_Milestone_9_Design_Profiles_And_Anniversary_Bloc.md` và ghi bài học vào `.agents/brain/lessons_learned.md`
- [ ] Mời User thực hiện Human Visual UAT trên trình duyệt tại `http://localhost:3000`

### 3. Immediate Next Step
- Người dùng mở trình duyệt, thực hiện Hard Refresh (`Ctrl + Shift + R`) tại `http://localhost:3000` và `http://localhost:3000/anniversaries` để nghiệm thu thị giác (Human Visual UAT) trên cả giao diện Desktop và Mobile.
