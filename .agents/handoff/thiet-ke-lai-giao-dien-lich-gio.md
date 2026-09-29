# STATE MANIFEST: thiet-ke-lai-giao-dien-lich-gio
### 1. Key Context
- Tính năng: Tái thiết kế Giao diện Thông báo Lịch Giỗ theo phong cách Lịch Bloc truyền thống Việt Nam (Modern Vietnamese Heritage).
- Nguyên tắc thiết kế & Tình trạng chốt các phiên bản:
  + Màu sắc chủ đạo: Đỏ son tươi (`bg-red-600`), Vàng hoàng kim (`bg-amber-400 text-slate-950 font-black`), đường kẻ hairline siêu mảnh 1px, số ngày dương lịch to đậm trang trọng.
  + Trang Chủ PC: Thẻ ngang 2 nửa liền mạch (`items-stretch`, `max-w-xl`), cột lịch bên trái rộng 185px fit khít 3 mép (trên, trái, dưới). Áp dụng kỹ thuật Pull-Up Lunar Block kéo cụm ngày Âm lịch lên gắn liền với Dương lịch ngay dưới đường răng cưa xé lịch (triệt tiêu 100% khoảng trắng rỗng ruột khi có nhiều người giỗ). Nửa bên phải chứa danh sách người giỗ và nút hành động. [TẠM CHỐT]
  + Trang Chủ Mobile: Thẻ dọc cuốn lịch bloc nguyên bản (`w-[330px]`) chuẩn tỉ lệ bloc treo tường truyền thống. [TẠM CHỐT]
  + Danh Sách Lịch Giỗ PC (`/anniversaries`): Cột lịch bloc bên trái rộng 90px fit khít 3 mép, kéo ngày Âm lịch lên sát Dương lịch, danh sách người giỗ thông thoáng bên phải. [TẠM CHỐT]
  + Danh Sách Lịch Giỗ Mobile (`/anniversaries`): Đã chuẩn hóa 100% theo đúng bản vẽ ASCII Wireframe của User:
    * Icon lịch thu nhỏ 58px, chạm khít 2 mép (mép trên và mép trái của thẻ ngoài), góc trên-trái bo tròn mượt mà theo `rounded-2xl` của thẻ ngoài qua `overflow-hidden`.
    * Header bên phải icon gồm chính xác 3 dòng: Dòng 1 nhãn trạng thái ("HÔM NAY GIỖ" / "NGÀY MAI GIỖ" / "CÒN X NGÀY"), Dòng 2 ngày Âm lịch ("19/8 Âm Lịch", chữ to đậm rõ), Dòng 3 số lượng người giỗ ("1 người giỗ" / "X người giỗ").
    * Bỏ hoàn toàn "Năm Bính Ngọ" trên header mobile để triệt tiêu lỗi va chạm / đè chữ.
    * Nửa dưới danh sách: Họ và tên cụ `Cụ XXXXXXXXXXXX` chiếm trọn 100% bề ngang (tuyệt đối không dùng `truncate`, không bị cắt chữ).
    * Hàng dưới cùng dùng bố cục 2 tầng đối trọng: Thông tin thế hệ / chi phái / niên kỷ nằm gọn bên trái, nút `[🌿 Xem Cây]` neo dứt khoát ở góc dưới bên phải thuận tiện thao tác ngón cái.
- Files đang thao tác:
  + Nguyên mẫu thử nghiệm: `src/app/prototype/anniversary/page.tsx`
  + Tài liệu Spec mục tiêu: `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`
  + Sổ tay kinh nghiệm: `.agents/brain/lessons_learned.md`
  + Files production sắp áp dụng: `src/app/page.tsx` (Widget trang chủ), `src/app/anniversaries/page.tsx` (Trang danh sách)
- Trạng thái kiểm chứng & môi trường:
  + Dev Server: Đang chạy nền tại `http://localhost:3000` (task-164, HTTP 200 OK tại `http://localhost:3000/prototype/anniversary`).
  + Typecheck: `npm run typecheck` PASS (0 errors).
  + Test Suite: `npm test` PASS (394/394 tests passed, 0 failures).

### 2. Task Checklist
- [x] Tạo màn hình nguyên mẫu độc lập tại `src/app/prototype/anniversary/page.tsx`
- [x] Sửa bảng màu sang Đỏ son tươi (`bg-red-600`) và Vàng hoàng kim (`bg-amber-400`)
- [x] Khắc phục lỗi rỗng ruột (Stretchy Void Bug) bằng kỹ thuật Pull-Up Lunar Block (kéo Âm lịch lên dính sát Dương lịch)
- [x] Hoàn thiện Trang Chủ PC (thẻ ngang 2 nửa liền mạch) và Trang Chủ Mobile (thẻ dọc cuốn lịch bloc) - Đã tạm chốt
- [x] Hoàn thiện Danh Sách Lịch Giỗ PC (cột ngày fit khít 3 mép) - Đã tạm chốt
- [x] Tái thiết kế Danh Sách Lịch Giỗ Mobile chuẩn theo Wireframe: Icon lịch 58px chạm 2 mép, 3 dòng header, tên full-width không truncate, nút Xem Cây neo góc phải
- [x] Cập nhật bài học thiết kế vào `.agents/brain/lessons_learned.md`
- [ ] User kiểm tra và nghiệm thu giao diện Mobile trên trình duyệt tại `http://localhost:3000/prototype/anniversary`
- [x] Kích hoạt Phase 2 của `/g-compact` lưu manifest vào `.agents/handoff/thiet-ke-lai-giao-dien-lich-gio.md`
- [ ] Chạy `/feature-spec` cập nhật tài liệu `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`
- [ ] Chạy `/feature-code` chuyển đổi code từ Prototype vào các component production (`src/components/anniversaries/`, `src/app/page.tsx`, `src/app/anniversaries/page.tsx`)
- [ ] Chạy kiểm thử 3 tầng (Typecheck, Build, Test) và dọn dẹp route prototype

### 3. Immediate Next Step
- Mở cửa sổ chat mới và gõ `/g-resume thiet-ke-lai-giao-dien-lich-gio` để tiếp tục tiến trình cập nhật Spec và đưa vào Production.
