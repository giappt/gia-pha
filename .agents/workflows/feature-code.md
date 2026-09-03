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
   - **Tầng 1 (Compile & Typecheck):** Chạy `npm run build` hoặc lệnh build tương ứng. Đảm bảo 0 lỗi cú pháp, 0 lỗi TypeScript.
   - **Tầng 2 (Thực thi Test Cases Tự động):**
     - *Với Logic / Thuật toán:* Chạy Unit Test hoặc test script trong `scratch/` để kiểm tra các asserts.
     - *Với Giao diện UI / Tương tác:* Khởi chạy công cụ `browser_subagent` tự động mở trình duyệt, thực hiện đúng các bước trong cột **When** của từng Test Case, kiểm tra DOM và Console log (0 lỗi đỏ).
   - **Tầng 3 (Kiểm tra Chống Thoái Lui - Regression Guard):** Chạy kiểm tra nhanh các mục trong Regression Guard Checklist (TOC, Wikilinks, Dark mode) để đảm bảo không có hiệu ứng cánh bướm làm gãy tính năng cũ.

4. **[ĐỒNG BỘ NGƯỢC (REVERSE-SYNC) & TICK DUYỆT AC]:**
   - Nếu trong quá trình code buộc phải đổi giải pháp kỹ thuật do hạn chế framework $\rightarrow$ Mở lại file Micro-Spec để sửa lại nội dung cho khớp 100% với code thực tế.
   - **Chỉ khi TẤT CẢ các Test Cases đều PASS (có log/bằng chứng thực tế):** AI mới được phép mở file Micro-Spec và chuyển dấu `- [ ] AC_i` thành `- [x] AC_i`.

5. **[BÁO CÁO THỰC NGHIỆM & MỜI UAT]:**
   - Xuất Bảng Báo cáo Kết quả Kiểm thử (Test Run Summary) kèm kết quả Pass/Fail và bằng chứng.
   - Mời User mở ứng dụng lên để trải nghiệm và nghiệm thu thực tế (Human UAT).
   - Nếu User phát hiện điểm chưa ưng ý hoặc lỗi sâu $\rightarrow$ Khuyên User quay lại `/feature-brainstorm` (để mổ xẻ Root Cause) hoặc `/feature-fix` (nếu là lỗi nhỏ/typo).
