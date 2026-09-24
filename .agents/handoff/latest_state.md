# STATE MANIFEST
### 1. Key Context
- Dự án: FAT - Family Tree Management System (Gia Phả Họ Phạm).
- Môi trường: Windows, Next.js 14+ App Router, TypeScript, TailwindCSS, Supabase, Web Push API / PWA.
- Trạng thái Git: Đã commit và push toàn bộ lên branch `main` (`5b8c8f1 "fix push noti"`), working tree sạch 100%.
- Quyết định kỹ thuật cốt lõi vừa hoàn tất (Web Push Lịch Giỗ Milestone 5):
  + **Khôi phục Biểu tượng Thư pháp Chữ "范" & Xóa sổ Logo Chữ "G":** Trong `src/lib/anniversaries/anniversary-engine.ts` và `public/sw.js`, luôn nạp `icon: '/icons/icon-192x192.png'` với URL tuyệt đối, triệt tiêu 100% tình trạng Android Chrome tự chèn icon fallback chữ "G" màu xám của Google.
  + **Gộp 1 Thẻ Duy Nhất Chống Nuốt Mất "Ngày mai" (Single Aggregated Digest):** Do W3C Web Push API không có native grouping API như Android Native SDK (`setGroup()`), gửi 2 push riêng biệt sẽ bị FCM/Android throttle hoặc nuốt mất tin thứ 2. Đã chuyển sang gộp cả Hôm nay và Ngày mai vào 1 push duy nhất (`tag: 'anniversary-daily-digest'`) cho mỗi người nhận.
  + **Tiêu đề Chuẩn & Phân Cách Trực Quan:** Tiêu đề cố định là `Lịch giỗ`, hai khối sự kiện Hôm nay và Ngày mai được phân tách bằng đường kẻ ngang `───────────────────────`.
  + **RFC 8030 High Priority:** Luôn gửi kèm `{ TTL: 86400, urgency: 'high' }` và `TTL: 86400` để vượt qua Android Doze Mode và nhận tin trong vòng 2 giây.
- Kết quả kiểm chứng 3 tầng (`[VERIFY_COMMANDS]`):
  + Typecheck (`npm.cmd run typecheck`): 0 lỗi.
  + Automated Tests (`npm.cmd test`): 354/354 tests PASS trên 35 suites (0 failures so với baseline `none`).
  + Build: Sạch 100% (31/31 routes).
- Các tệp chính đã can thiệp trong đợt sửa vừa qua:
  + `src/lib/anniversaries/anniversary-engine.ts`
  + `src/app/api/cron/anniversary-reminder/route.ts`
  + `public/sw.js`
  + `public/icons/badge-72x72.png`
  + `tests/cron-anniversary.test.ts`
  + `tests/pwa-manifest.test.ts`
  + `tests/pwa-assets.test.ts`
  + `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`
  + `.agents/brain/lessons_learned.md`
- Các tài liệu đang mở trên IDE người dùng liên quan đến Milestone tiếp theo:
  + `docs/15_Micro-Spec_Milestone_6_Branch_Taxonomy_Admin_Portal.md`
  + `src/components/tree/TreeToolbar.tsx`
  + `src/components/auth/AuthButton.tsx`
  + `src/app/api/users/route.ts`
  + `.env.example`

### 2. Task Checklist
- [x] Phân tích căn nguyên biểu tượng chữ "G" và mất thông báo Ngày mai trên Android (/feature-brainstorm)
- [x] Thống nhất giải pháp Lựa chọn 1: Gộp 1 thẻ Web Push duy nhất (Single Aggregated Digest) với đường kẻ ngang `───────────────────────` và icon chữ "范"
- [x] Cập nhật Đặc tả vi mô Milestone 5 [docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md](file:///d:/pj/other/fat/docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md) (/feature-spec)
- [x] Thi công cập nhật Service Worker `public/sw.js` luôn trỏ `options.icon` về icon chữ "范"
- [x] Thi công Backend `src/app/api/cron/anniversary-reminder/route.ts` và `src/lib/anniversaries/anniversary-engine.ts` gửi 1 push gộp duy nhất per recipient
- [x] Cập nhật bộ kiểm thử tự động `tests/cron-anniversary.test.ts` và `tests/pwa-manifest.test.ts`
- [x] Thực thi Vòng lặp Kiểm chứng 3 tầng: Typecheck (0 lỗi) -> Build (0 lỗi) -> Test Suite PASS 354/354 (100%)
- [x] Ghi chép bài học kinh nghiệm tại trận vào `.agents/brain/lessons_learned.md`
- [x] Commit và Push toàn bộ thay đổi lên Git remote repository (`main` - commit `5b8c8f1`)
- [ ] Bắt đầu thảo luận hoặc triển khai Milestone 6 (Branch Taxonomy & Admin Portal) theo tài liệu `docs/15_Micro-Spec_Milestone_6_Branch_Taxonomy_Admin_Portal.md`

### 3. Immediate Next Step
- Sẵn sàng chuyển giao sang phiên làm việc mới để bắt đầu Milestone 6 (Phân loại Chi Nhánh & Cổng Quản Trị Dòng Họ - `docs/15_Micro-Spec_Milestone_6_Branch_Taxonomy_Admin_Portal.md`).
