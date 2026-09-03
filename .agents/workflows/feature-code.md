---
description: "[Bước 11/12] Code tự động bám sát Micro-Spec 100%, Thực thi Kiểm thử 3 Tầng và Báo cáo Nghiệm thu."
---

# LỆNH: /feature-code

**Mục tiêu:** Thi công thực tế mã nguồn và **Tự động thực thi kiểm thử 3 tầng** để biến các tiêu chí `- [ ] AC` trong Micro-Spec thành `- [x] AC` có bằng chứng thực nghiệm.

1. **[ĐỌC SPEC & NHẬN DIỆN MỤC TIÊU - TARGET RECOGNITION]:**
   - Đọc file Micro-Spec vừa được User chốt ở Bước 10.
   - Quét toàn bộ danh sách các tiêu chí đang ở trạng thái `- [ ] AC_i` và `- [ ] RG_i` cần hoàn thành.

2. **[VIẾT CODE BÁM SÁT SPEC 100% - ZERO HALLUCINATION]:**
   - Viết code chính xác theo mô tả kiến trúc và ràng buộc của Spec. Không tự ý bịa thêm tính năng ngoài tài liệu.

3. **[VÒNG LẶP KIỂM CHỨNG 3 TẦNG (3-TIER VERIFICATION LOOP)]:**
   Code xong **TUYỆT ĐỐI CẤM** báo cáo hoàn thành ngay. AI bắt buộc phải tự động chạy qua 3 tầng kiểm chứng:
   - **Tầng 1 (Compile & Typecheck):** Chạy `npm run typecheck` và `npm run build`. Đảm bảo 0 lỗi cú pháp, 0 lỗi TypeScript.
   - **Tầng 2 (Thực thi Test Cases Phân Tách - Decoupled Verification):**
     - *Với Logic / Thuật toán / Data / API:* Chạy Unit Test tự động (`npm test`) $\rightarrow$ Pass 100%. Bằng chứng thực nghiệm là Test Log output.
     - *Với Giao diện UI / Visual / CSS / Text / DOM:*
       - 🚫 **LỆNH CẤM TRÌNH DUYỆT (BROWSER ACTIVE OVERRIDE):** Khi User đang mở trình duyệt (Browser State is `[ACTIVE]`) HOẶC đối với các tinh chỉnh UI (đổi text, ẩn/hiển thị thẻ, đổi màu, sửa layout tĩnh) $\rightarrow$ **CẤM TUYỆT ĐỐI dùng `browser_subagent`**. Mọi khâu nghiệm thu giao diện thuộc về User UAT trực tiếp trên tab trình duyệt đang mở.
       - Chỉ được triệu hồi `browser_subagent` khi: (1) Headless mode không có User ngồi máy; HOẶC (2) User đích thân yêu cầu chạy browser subagent. Khi được gọi, bắt buộc khóa ngân sách $\le 5$ bước.
   - **Tầng 3 (Kiểm tra Chống Thoái Lui - Regression Guard):** Chạy kiểm tra Unit test và build để bảo vệ các tính năng lân cận chống thoái lui.

4. **[ĐỒNG BỘ NGƯỢC (REVERSE-SYNC) & TICK DUYỆT AC]:**
   - Nếu trong quá trình code buộc phải đổi giải pháp kỹ thuật do hạn chế framework $\rightarrow$ Mở lại file Micro-Spec để sửa lại nội dung cho khớp 100% với code thực tế.
   - **Khi Tầng 1 và Unit Test Tầng 2 đạt PASS 100%:** AI được phép tick `- [x] AC` và kính mời User nghiệm thu thực tế (Human UAT). Với UI, User là người quyết định cuối cùng.

5. **[BÁO CÁO THỰC NGHIỆM & MỜI UAT]:**
   - Xuất Bảng Báo cáo Kết quả Kiểm thử (Test Run Summary) kèm kết quả Pass/Fail và bằng chứng.
   - Mời User mở ứng dụng lên để trải nghiệm và nghiệm thu thực tế (Human UAT).
   - Nếu User phát hiện điểm chưa ưng ý hoặc lỗi sâu $\rightarrow$ Khuyên User quay lại `/feature-brainstorm` (để mổ xẻ Root Cause) hoặc `/feature-fix` (nếu là lỗi nhỏ/typo).
