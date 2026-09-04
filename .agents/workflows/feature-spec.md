---
description: "[Bước 10/12] Tạo hoặc Cập nhật Đặc tả Vi mô (Micro-Spec), Sinh Ma trận Test Cases & Tiêu chuẩn Nghiệm thu."
---

# LỆNH: /feature-spec

**Mục tiêu:** Chuyển hóa kế hoạch từ `/feature-brainstorm` thành Đặc tả kỹ thuật vi mô (Single Source of Truth) và **Thiết lập Bộ Tiêu Chuẩn Kiểm Thử (Test Specification Contract)** trước khi viết code.

1. **[ĐỊNH TUYẾN TÀI LIỆU - DOCUMENT ROUTING GATE]:**
   - Đọc kết luận phân định từ buổi `/feature-brainstorm`:
     - **Nếu là Nhánh A (Tính năng mới độc lập):** Tạo file mới `docs/XX_Micro-Spec_Milestone_Y_[Ten-Tinh-Nang].md` theo mẫu `09_template_Dac-ta-Vi-mo_Micro-Spec_n.md`.
     - **Nếu là Nhánh B (Mở rộng / Bổ sung Spec cũ):** **CẤM TẠO FILE MỚI**. Dùng `grep_search` tìm đúng file Micro-Spec cha, bổ sung các Sub-sections mới (ví dụ `Section 6.X`), cập nhật Sequence Diagram và giữ nguyên vẹn tính duy nhất của tài liệu.

2. **[SINH MA TRẬN TEST CASES & TIÊU CHÍ NGHIỆM THU PHÂN TÁCH]:**
   - Tại **Mục 7 (Acceptance Criteria & Test Matrix)**: Bắt buộc chia thành **2 phân khu kiểm thử rạch ròi**:
     - **7.1. Automated Test Suite (trong `Test_Dir` khai báo tại `[VERIFY_COMMANDS]`):** Mọi tính năng có chứa Logic / Thuật toán / Data / API bắt buộc phải có các test case tự động (`TC_UT_xx`, `TC_INT_xx`) với Bộ 3 Đo Đếm Được: Given (Dữ liệu fixture/mock) - When (Gọi hàm/API) - Then (Kết quả trả về, tọa độ, state, HTTP status). CẤM viết Spec chỉ toàn kịch bản trình duyệt khi có logic toán học hoặc API.
     - **7.2. Human Visual UAT Matrix:** Các kịch bản dành riêng cho User tự nghiệm thu thị giác trên trình duyệt (màu sắc, hiệu ứng, pan/zoom, responsive, căn chỉnh layout, console sạch).
   - Phân loại rõ: `Happy Path`, `Edge Case`, `Error Handling`. Ban đầu mọi tiêu chí đều ở trạng thái `- [ ]`.

3. **[THIẾT LẬP DANH SÁCH BẢO VỆ CHỐNG THOÁI LUI (REGRESSION GUARD)]:**
   - Tại **Mục 8**: Liệt kê các tính năng lân cận trong Blast Radius (như TOC, Wikilinks, Dark Mode, Guest Mode, PWA) ở dạng `- [ ] RG_i` để bắt buộc verify lại ở khâu code.

4. **[BẢN TRÌNH DUYỆT TÓM TẮT 10 GIÂY (10-SECOND EXECUTIVE DIFF)]:**
   - **🛑 DỪNG LẠI (STOP ACTION):** Gửi bản tóm tắt súc tích cho User Review:
     - 🎯 **Nội dung thay đổi:** (2 câu tóm tắt cốt lõi).
     - 🧪 **Kịch bản Test Cases mới:** (Liệt kê các `[ ] AC` vừa sinh).
     - 🛡️ **Regression Guards:** (Các vùng lân cận sẽ được kiểm tra chéo).
     - *(Kèm link trỏ đến file Micro-Spec)*.
   - **Thông báo:** *"Bản Đặc tả (Micro-Spec) và Kịch bản Test đã sẵn sàng. Xin hãy Review. Nếu đồng ý, hãy gõ lệnh `/feature-code` để tôi bắt đầu thi công. CẤM TỰ Ý VIẾT CODE Ở BƯỚC NÀY."*
