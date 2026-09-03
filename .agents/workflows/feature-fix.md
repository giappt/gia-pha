---
description: "[Bước 12/12] Làn Sửa Nhanh Có Kiểm Soát (Fast-Track Fix) & Cổng Leo Thang Sang Brainstorm."
---

# LỆNH: /feature-fix

**Mục tiêu:** Xử lý nhanh các lỗi nhỏ/tinh chỉnh giao diện phát sinh trong quá trình kiểm thử (UAT) theo nguyên tắc **LÀN NHANH CÓ KIỂM SOÁT (Fast-Track)** và **TỰ ĐỘNG LEO THANG (Escalation)** nếu phát hiện lỗi kiến trúc phức tạp.

1. **[LẮNG NGHE FEEDBACK & CHẨN ĐOÁN ĐỘ SÂU - TRIAGE GATE]:**
   AI phân loại ngay lỗi của User theo 2 cấp độ:
   - 🟢 **CẤP ĐỘ 1: LỖI NHỎ / GIAO DIỆN (Fast-Track):**
     - Sửa typo chữ, chỉnh class CSS, căn lề padding, chỉnh màu sắc, đính chính toán tử so sánh đơn giản.
     - *Hành động:* Tiến hành bước 2 và 3 dưới đây để sửa nhanh trong 1 nhịp.
   - 🔴 **CẤP ĐỘ 2: LỖI KIẾN TRÚC / HỎNG LOGIC HÓC BÚA / ĐỤNG NHIỀU FILE (Complex Defect):**
     - Lỗi liên quan đến luồng dữ liệu, bất đồng bộ, phân rã AST/DOM, hoặc thiếu hẳn một kịch bản biên (Edge Case) quan trọng.
     - **CỔNG TỰ ĐỘNG LEO THANG (HARD ESCALATION GATE):** AI **TUYỆT ĐỐI CẤM SỬA VÁ ẨU**. Bắt buộc dừng lại và thông báo:
       > *"Đây là lỗi kiến trúc/logic hóc búa, không thể vá cục bộ. Cần tư duy sâu về nguyên nhân gốc rễ (Root Cause) và ma trận tác động. Đề xuất chuyển sang lệnh `/feature-brainstorm`."*

2. **[SỬA NHANH & CHỐNG THOÁI LUI (FAST FIX & REGRESSION CHECK)]:**
   - Với Cấp độ 1:
     - Sửa code tối thiểu, trực diện vào đúng dòng bị lỗi.
     - Chạy `npm run build` để kiểm tra cú pháp.
     - Kiểm tra nhanh kịch bản liên quan để không làm gãy UI lân cận.

3. **[BÁO CÁO KẾT QUẢ & MỜI TEST LẠI]:**
   - Báo cáo rõ ràng: *"Đã sửa xong [Mô tả ngắn]. Kết quả build sạch 0 lỗi."*
   - Mời User kiểm tra lại trên trình duyệt (UAT).
   - Nếu lỗi vẫn lặp lại hoặc phức tạp hơn dự kiến $\rightarrow$ Tự động leo thang sang `/feature-brainstorm`.
