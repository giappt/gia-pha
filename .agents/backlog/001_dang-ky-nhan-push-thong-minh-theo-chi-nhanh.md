---
id: 001
title: "Đăng ký nhận Push thông báo giỗ thông minh theo Chi nhánh"
status: parked
priority: med
created: 2026-09-07
spawned_specs: []
---

## Pain-point / Mục tiêu
- Khi gia tộc phát triển qua nhiều thế hệ, số lượng thành viên và ngày giỗ trong năm rất nhiều.
- Con cháu (đặc biệt là thế hệ trẻ ở các nhánh xa) thường e ngại bị "spam" thông báo ngày giỗ của những người thuộc nhánh xa mà họ không quen biết hoặc không trực tiếp dự giỗ.
- Bắt buộc người dùng phải đăng nhập Google và chờ Admin duyệt gán node thì quá phức tạp, cản trở trải nghiệm ban đầu.
- Mục tiêu: Khi bấm [Bật thông báo], hệ thống chỉ hỏi 1 câu ngắn gọn, nhẹ nhàng:
  "Bạn muốn nhận thông báo giỗ cho: ○ Toàn dòng họ ● Riêng Chi 2 (đang chọn)"

## Phác giải pháp
1. Frontend UX:
   - Tại banner [Bật thông báo] (trên trang Lịch giỗ hoặc trên Cây gia phả):
   - Mở popover chọn nhanh phạm vi: "Toàn dòng họ" hoặc "Riêng [Tên Chi nhánh]" (tự động điền theo Chi mà người dùng đang lọc/xem).
   - Khi người dùng đồng ý, trình duyệt lưu subscription kèm trường `branch_filter`.
2. Backend & Database:
   - Thêm cột `target_branch_code` (nullable) trong bảng `push_subscriptions`.
   - API `/api/push/subscribe` tiếp nhận thông tin chi nhánh lọc.
3. Cron Reminder:
   - Khi quét lúc 7:00 AM hàng ngày: chỉ gửi Web Push đến các subscription có `target_branch_code IS NULL` hoặc trùng với `member.branch_code`.

## Rủi ro / Điểm cần lường trước
- Người dùng muốn đổi nhánh quan tâm: Cần có nút "Đổi phạm vi thông báo" gọn gàng ngay trên banner thay vì bắt họ huỷ rồi đăng ký lại.
- Hôn nhân nội tộc: Cần đảm bảo nếu người mất liên quan đến cả 2 chi thì thông báo vẫn đến đúng người cần nhận.

## Lý do hoãn / Điều kiện nên làm
- Lý do hoãn: Milestone 5 cốt lõi (tính ngày giỗ Âm lịch UTC+7, Timeline, Web Push PWA, Vercel Cron) vừa dựng xong; cần giữ vững tính ổn định và nghiệm thu dữ liệu cơ bản trước.
- Điều kiện kích hoạt: Khi người dùng trải nghiệm thực tế và có nhu cầu cá nhân hoá thông báo theo từng chi nhánh cụ thể.
