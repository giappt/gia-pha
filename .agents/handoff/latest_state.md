# STATE MANIFEST
### 1. Key Context
- **Mục tiêu tính năng hoàn tất:** 
  1. Cá nhân hóa danh xưng người quá cố trong thông báo Web Push theo quan hệ thân tộc với người nhận (`Kinship Engine`: `findLowestCommonAncestor` + `resolveKinshipTerms`).
  2. Mở rộng phạm vi thân tộc (`Extended Family Scope`): Trích xuất toàn bộ hậu duệ từ đời Ông Bà trở xuống (bao gồm Bác, Chú, Cô, Cậu, Dì, vợ/chồng và con cháu chắt của họ) để con cháu không bị bỏ sót ngày giỗ của người thân trong nhà.
  3. Tối ưu hiển thị Web Push trên Android: Service Worker (`public/sw.js`) nạp URL icon tuyệt đối (`new URL(data.icon, self.location.origin).href`) chống fallback chữ 'G' của Google; hỗ trợ `tag: data.tag` và `renotify: Boolean(data.tag)` để 2 thông báo (Hôm nay & Ngày mai) xuất hiện song song, độc lập trên màn hình khóa.
  4. Vượt qua bộ nhớ đệm Next.js Server App Router cho Supabase Client (`cache: 'no-store'` trong `global.fetch` của `createAdminClient()`).
- **Các tệp cốt lõi đã hoàn thiện & kiểm chứng:**
  - `src/lib/anniversaries/anniversary-engine.ts`: Hàm pure function `getExtendedFamilyMemberIds`.
  - `src/lib/supabase/admin.ts`: Cấu hình bypass Data Cache cho Supabase admin client.
  - `src/app/api/cron/anniversary-reminder/route.ts`: Tích hợp Kinship Engine, batching theo người nhận, gửi song song hôm nay và ngày mai.
  - `public/sw.js`: URL icon tuyệt đối, xử lý `tag` và `renotify`.
  - `tests/cron-anniversary.test.ts` & `tests/pwa-manifest.test.ts`: Bổ sung 4 Automated Test Cases (`TC_UT_CRON_PERSONALIZED_KINSHIP`, `TC_UT_EXTENDED_FAMILY_LINEAGE_SCOPE`, `TC_UT_SW_ABSOLUTE_URL_AND_TAG_OPTIONS`, `TC_INT_CRON_SENDS_BOTH_TODAY_AND_TOMORROW_FOR_EXTENDED_FAMILY`).
  - `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`: Reverse-sync tick `[x] PASS` 100% Mục 7.1.
  - `.agents/brain/lessons_learned.md`: Đã lưu trữ bài học kinh nghiệm về Kinship Push, Extended Family Scope và Android SW tagging.
- **Bằng chứng kiểm chứng thực tế:**
  - `npm run typecheck`: 0 lỗi.
  - `npm run build`: 0 lỗi, 31/31 routes thành công.
  - `npm test`: **349/349 tests PASS 100%**.
  - Thực nghiệm live curl: Gửi thành công 2/2 push notification (`"sent": 2`) đến điện thoại Android của User `Phạm Tiến Giáp`.
- **Trạng thái Git:** User đã thực hiện `git add .`, commit `add push noti` (`4a6da98`) và push lên nhánh `main` thành công.

### 2. Task Checklist
- [x] Phân tích căn nguyên lỗi thiếu giỗ Bác/Chú và format hiển thị Android Web Push (/feature-brainstorm)
- [x] Cập nhật Đặc tả kỹ thuật vi mô Milestone 5 (/feature-spec)
- [x] Viết hàm `getExtendedFamilyMemberIds` trong `anniversary-engine.ts`
- [x] Khắc phục Data Cache Supabase trong `admin.ts`
- [x] Tích hợp Kinship Engine & phân luồng push kép trong `route.ts`
- [x] Cập nhật `public/sw.js` nạp URL tuyệt đối và hỗ trợ `tag` / `renotify`
- [x] Bổ sung 4 automated tests trong `tests/`
- [x] Kiểm chứng 3 tầng: Typecheck (0 lỗi) -> Build (0 lỗi) -> Test (349/349 pass) -> Live push test ("sent": 2)
- [x] Reverse-sync tài liệu Spec 14 và cập nhật `lessons_learned.md`
- [x] Commit và push mã nguồn lên Git remote `main` (commit: `4a6da98`)
- [ ] User Human Visual UAT nghiệm thu hiển thị thông báo trên màn hình điện thoại Android thực tế
- [ ] Lên kế hoạch triển khai Milestone / Backlog tiếp theo

### 3. Immediate Next Step
- Kiểm tra trực quan 2 thẻ thông báo trên điện thoại Android, sau đó chọn một đầu việc tiếp theo từ Backlog (ví dụ: `001_dang-ky-nhan-push-thong-minh-theo-chi-nhanh.md` hoặc `002_phan-quyen-phan-cap-cay-con-va-duyet-claim.md`).
