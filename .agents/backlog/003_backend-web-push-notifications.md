---
id: 003
title: "Backend Web Push Notifications Thực Tế Cho Cờ enable_push_notifications"
status: parked
priority: med
created: 2026-09-18
spawned_specs: []
---

## Pain-point / Mục tiêu
Trang `/admin/features` đã có UI toggle cho cờ `enable_push_notifications` và cờ này đã được lưu bền vững vào `clan_settings.feature_flags` trong Supabase. Tuy nhiên, khi Admin gạt cờ ON/OFF, **chưa có phân hệ backend Web Push thật** (Service Worker subscription, VAPID key management, Vercel Cron quét giỗ, gửi push notification qua Web Push API). Cờ hiện tại chỉ là placeholder UI — chưa có tác dụng thực tế nào đối với người dùng cuối.

## Phác giải pháp
1. **VAPID Key Management:** Sinh cặp khóa VAPID (public/private) lưu trong biến môi trường Vercel, expose public key qua `/api/push/vapid-public-key`.
2. **Service Worker Push Subscription:** Trong `InstallPwaButton` hoặc component riêng, yêu cầu quyền `Notification.requestPermission()`, đăng ký `pushManager.subscribe()`, gửi subscription lên `/api/push/subscribe` lưu vào bảng `push_subscriptions`.
3. **Vercel Cron Job Quét Giỗ:** Endpoint `/api/cron/anniversary-push` chạy hàng ngày, quét `members` có `death_lunar_day/month` khớp khoảng `anniversary_notify_days_before`, gửi push qua `web-push` npm package.
4. **Ràng buộc cờ `enable_push_notifications`:** Khi cờ TẮT, `/api/push/subscribe` trả 403; Cron job bỏ qua; UI ẩn nút đăng ký push. Khi BẬT, mở toàn bộ luồng.

## Rủi ro / Điểm cần lường trước
- **Quyền trình duyệt:** iOS Safari trước 16.4 không hỗ trợ Web Push — cần fallback hoặc thông báo rõ.
- **Quota VAPID:** Mỗi subscription endpoint có TTL; cần cơ chế retry và dọn subscription hết hạn.
- **Múi giờ Âm lịch:** Quy đổi ngày giỗ Âm lịch sang Dương lịch để so sánh với `NOW()` phải dùng đúng thuật toán Hồ Ngọc Đức UTC+7 (đã có sẵn trong `lunar-calendar.ts`).
- **Bảng `push_subscriptions` đã có schema** trong `database.ts` nhưng chưa có migration SQL thật trên Supabase.

## Lý do hoãn / Điều kiện nên làm
- **Lý do hoãn:** Ưu tiên hiện tại là hoàn thiện các phân hệ cốt lõi (Cây phả hệ, Xưng hô, Ngày giỗ, Quản trị quyền). Web Push là tính năng nâng cao, phụ thuộc vào việc deploy lên Vercel production (Cron Job chỉ hoạt động trên Vercel).
- **Điều kiện kích hoạt:** Khi hệ thống đã deploy production trên Vercel và có ít nhất 5 người dùng thực tế sử dụng tính năng Lịch Giỗ.
