---
description: "[Bước 9/12] Thảo luận Tính năng mới, Mở rộng Spec HOẶC Mổ xẻ Căn nguyên Lỗi (Root Cause), Đề xuất Kiến trúc, và Lập kế hoạch Đồng bộ (Impact Planning)."
---

# LỆNH: /feature-brainstorm

**Mục tiêu:** Bộ não tư duy chiều sâu của hệ thống. Khởi đầu cho MỌI thay đổi kiến trúc cần thiết kế — bao gồm **Tính năng mới**, **Mở rộng/Bổ sung Specs đã có**, và **Mổ xẻ Nguyên nhân Gốc rễ Lỗi hóc búa (Deep Root Cause Analysis)** từ UAT.

1. **[TƯ DUY SÂU & MỔ XẺ RỦI RO / NGUYÊN NHÂN GỐC RỄ - DEEP THINKING & ROOT CAUSE]:**
   - **Với Tính năng Mới / Mở rộng:** AI BẮT BUỘC phải "stress-test" trong suy nghĩ để tìm mọi hố đen:
     - Các trường hợp ngoại lệ (Edge cases) và trạng thái biên (Corner cases).
     - Nút thắt cổ chai về Hiệu năng / Mở rộng (N+1 query, re-render bừa bãi, Rate limits).
     - Rủi ro về Logic hoặc Bảo mật (Race conditions, DOM Hydration, Phân quyền).
   - **Với Ca Báo Lỗi / Thất Bại UAT (Diagnostic Mode):**
     - Tuyệt đối CẤM sửa vá víu phần ngọn. Bắt buộc truy vết tận gốc: *Tại sao lại phát sinh hành vi này? Lỗi do Model, do AST parsing, do Multi-block range hay do Bất đồng bộ ID?*

2. **[MA TRẬN ĐỊNH TUYẾN 3 CHIỀU (3-DIMENSIONAL ROUTING LITMUS TEST)]:**
   - AI tự động chấm điểm để phân định nhánh tài liệu trước khi lên plan (Yes = 1, No = 0):
     1. *Có tạo Domain Model / DB Collection mới độc lập không?*
     2. *Có tạo Route URL / Màn hình / User Journey mới độc lập không?*
     3. *Có phục vụ một Job-to-be-done hoàn toàn mới tách biệt với các Milestone trước không?*
   - **Điểm = 0 $\rightarrow$ NHÁNH B (Mở rộng / Bổ sung Spec cũ):** CẤM tạo file Milestone mới. Cập nhật trực tiếp vào file Micro-Spec hiện có.
   - **Điểm $\ge 2 \rightarrow$ NHÁNH A (Tính năng mới độc lập):** Tạo file `docs/XX_Micro-Spec_Milestone_Y.md` mới.
   - **Điểm = 1 $\rightarrow$ VÙNG XÁM:** AI dừng lại hỏi ý kiến User để chốt phương án gộp hay tách.

3. **[MA TRẬN VÙNG ẢNH HƯỞNG & CHỐNG THOÁI LUI (BLAST RADIUS & REGRESSION MATRIX)]:**
   - Dùng `grep_search` quét toàn bộ hệ thống để lập bảng rà soát tác động lan truyền (Side-effects):
     - Xác định rõ: *Nếu thay đổi hàm/component X thì các tính năng vệ tinh Y, Z (như TOC, Wikilinks, Dark Mode, Guest Mode, PWA) có nguy cơ bị gãy không?*
     - Định nghĩa sẵn các kịch bản kiểm tra chống thoái lui (Regression Guards) bắt buộc phải test lại sau khi sửa.

4. **[THẢO LUẬN TRỌNG TÂM & GIẢI PHÁP TỐI ƯU - FOCUSED CONSULTATION]:**
   - Trình bày Giải pháp tối ưu + Căn nguyên vấn đề + Ma trận Blast Radius cho User. Đặt các câu hỏi gom nhóm, trọng tâm để User chốt phương án. (Không hỏi vặn, không hỏi dàn trải).

5. **[LẬP KẾ HOẠCH ĐỒNG BỘ - PLANNING MODE]:** 
   - Sinh ra `implementation_plan.md` liệt kê chi tiết:
     - Tóm tắt chiến lược kỹ thuật (High-level summary).
     - Phân định Nhánh tài liệu (Nhánh A: Tạo mới vs Nhánh B: Cập nhật Spec nào).
     - Danh sách các tệp bị ảnh hưởng (Blast Radius).
     - Kế hoạch kiểm thử sơ bộ.
   - **Dừng lại (STOP ACTION):** Xin phép User phê duyệt bản quy hoạch trước khi tiến hành bước tiếp theo.
   - Sau khi User duyệt: Khuyên User chạy `/feature-spec` để chuyển bản quy hoạch thành Đặc tả Vi mô và Ma trận Test Cases — nối tiếp Context Value Chain.
   - **[TÙY CHỌN — GÁC LẠI]:** Nếu User thấy ý tưởng hay nhưng CHƯA muốn làm ngay, gợi ý chạy `/idea-park` để lưu nguyên bản quy hoạch này vào Kho Ý tưởng.
