---
description: "[Bước 11/12] Code tự động bám sát Micro-Spec 100%, Thực thi Kiểm thử 3 Tầng và Báo cáo Nghiệm thu."
---

# LỆNH: /feature-code

**Mục tiêu:** Thi công thực tế mã nguồn và **Tự động thực thi Vòng Lặp Kiểm Chứng Bằng Code Thật (Code-First Verification Loop)** để biến các tiêu chí `- [ ] AC` kiểm thử tự động trong Micro-Spec thành `- [x] AC` có bằng chứng thực nghiệm terminal.

0. 🔴 **[CỔNG HẠ TẦNG KIỂM CHỨNG - VERIFICATION GATE]:**
   - Đọc khối `[VERIFY_COMMANDS]` trong `.agents/AGENTS.md`.
   - Nếu `Test` còn trống, hoặc lệnh đó chưa từng chạy xanh một lần nào $\rightarrow$ **DỪNG NGAY, CẤM viết một dòng code nào**. Thông báo:
     > *"Dự án chưa có hạ tầng kiểm thử bằng code (`[VERIFY_COMMANDS].Test` chưa khai báo). Không có cách nào chứng minh code viết ra là đúng. Xin hãy chạy `/doc-qa` để dựng hạ tầng test trước."*
   - Đây là cổng cấu trúc, **CẤM lách** bằng cách hứa "sẽ kiểm thử thủ công" hay "sẽ bổ sung test sau".

1. **[ĐỌC SPEC & NHẬN DIỆN MỤC TIÊU - TARGET RECOGNITION]:**
   - Đọc file Micro-Spec vừa được User chốt ở Bước 10.
   - Quét toàn bộ danh sách các tiêu chí tại Mục 7: phân định rõ Mục 7.1 (Automated Tests trong `Test_Dir`) và Mục 7.2 (Human Visual UAT).

2. **[VIẾT CODE & VIẾT TEST SONG HÀNH - CODE-WITH-TESTS]:**
   - Viết code chính xác theo mô tả kiến trúc và ràng buộc của Spec. Không tự ý bịa thêm tính năng ngoài tài liệu.
   - **BẮT BUỘC:** Đối với mọi file logic/thuật toán/data transformation/API route, **phải tạo hoặc cập nhật file test tương ứng trong `Test_Dir`** để kiểm thử tự động. CẤM hoàn toàn việc code tính năng có logic mà không viết test code chứng minh.
   - Test phải có assert thật vào giá trị kỳ vọng của Spec. Tuân thủ `[R-VERIFY.INTEGRITY]` (Liêm chính của bằng chứng) trong `AGENTS.md`.

3. **[VÒNG LẶP KIỂM CHỨNG BẰNG CODE THẬT (CODE-FIRST VERIFICATION LOOP)]:**
   Code xong **TUYỆT ĐỐI CẤM** báo cáo hoàn thành ngay. AI bắt buộc chạy qua 3 tầng kiểm chứng, dùng đúng các lệnh đã khai báo tại `[VERIFY_COMMANDS]`:
   - **Tầng 1 (Compile & Typecheck):** Chạy lệnh `Typecheck` và `Build` — 0 lỗi.
   - **Tầng 2 (Automated Test Suite):** Chạy lệnh `Test` **một lần**. Tiêu chuẩn đạt: **0 failure mới so với `Known_Failing_Baseline`** và mọi test phủ AC sắp tick đều pass. Bằng chứng duy nhất là output log terminal.
     - Nếu fail: sửa **code**, không sửa test cho vừa code. Nếu không thể làm xanh trung thực $\rightarrow$ dừng và báo cáo fail kèm log.
     - 🔴 Nếu xuất hiện failure mới mà bạn tin là **không do thay đổi này gây ra**: **CẤM tự nâng `Known_Failing_Baseline`**. Dừng lại, đưa log, xin User xác nhận (`[R-VERIFY.CMD]` — chỉ `/doc-qa` hoặc User có quyền ghi baseline).
   - **Tầng 3 (Human UAT):** Bàn giao `Dev_URL` cho User tự mở trình duyệt nghiệm thu thị giác. Loại bỏ hoàn toàn sự phụ thuộc vào `browser_subagent`. CẤM TUYỆT ĐỐI AI tự ý gọi `browser_subagent` để kiểm thử giao diện.

4. **[ĐỒNG BỘ NGƯỢC (REVERSE-SYNC) & TICK DUYỆT AC]:**
   - Nếu trong quá trình code buộc phải đổi giải pháp kỹ thuật do hạn chế framework $\rightarrow$ Mở lại file Micro-Spec để sửa lại nội dung cho khớp 100% với code thực tế.
   - **Khi Tầng 1 và Tầng 2 đạt chuẩn:** AI được phép tick `- [x] AC` cho các tiêu chí kiểm thử tự động (Mục 7.1). Các tiêu chí thị giác (Mục 7.2) giữ nguyên để User tự nghiệm thu.

5. **[BÁO CÁO THỰC NGHIỆM & BÀN GIAO CHO HUMAN UAT]:**
   - Xuất Bảng Báo cáo Kết quả Kiểm thử (Test Run Summary) kèm trích đoạn log terminal của lệnh `Test`, và nêu rõ đối chiếu với `Known_Failing_Baseline`.
   - Cung cấp `Dev_URL` và checklist các điểm thị giác cần trải nghiệm để kính mời User tự mở trình duyệt nghiệm thu (Human UAT).
   - Nếu User phát hiện điểm chưa ưng ý hoặc lỗi sâu $\rightarrow$ Khuyên User dùng `/feature-fix` (nếu là lỗi nhỏ/typo/CSS) hoặc quay lại `/feature-brainstorm` (nếu là lỗi kiến trúc/logic).
