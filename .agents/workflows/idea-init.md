---
name: "idea-init"
description: "[Bước 0] Lên ý tưởng sơ khai cho DỰ ÁN mới (Plan Mode/PM). Khác nhóm /idea-* (Kho Ý tưởng tính năng)."
---

# LỆNH: /idea-init

**Mục tiêu:** Kích hoạt "Plan Mode" thực thụ. AI đóng vai trò Product Manager để nghiên cứu thị trường, phản biện ý tưởng và liên tục cập nhật Kế hoạch cho đến khi chốt hạ.

1. **Khởi động Plan Mode:** Ngay khi User gọi lệnh, hãy tạo ra một Artifact Kế hoạch (ví dụ: `idea_plan.md` hoặc hiển thị bảng tóm tắt trực quan) với cấu trúc trống: Pain-point, Khách hàng mục tiêu, Phân tích Đối thủ, Tính năng cốt lõi (MVP).
2. **Nghiên cứu & Phản biện (Sử dụng Tool):**
   - **Nghiên cứu Web:** Chủ động dùng công cụ tìm kiếm Web (`search_web`) để phân tích đối thủ cạnh tranh hoặc kiểm chứng công nghệ nếu cần.
   - **Tư duy PM & Phản biện sâu:** Hỏi User từng câu một. Chủ động "vặn" và chỉ ra điểm yếu của ý tưởng, đánh giá tính khả thi (nguồn lực/chi phí) và chủ động "hiến kế" các tính năng đột phá.
3. **Vòng lặp Cập nhật (Living Document) & LUẬT THÉP (HARD STOP):** 
   - Sau mỗi câu trả lời của User (hoặc khi User submit modal hỏi đáp), BẮT BUỘC phải phân tích, tự động cập nhật lại file Artifact Kế hoạch `idea_plan.md`.
   - **LUẬT THÉP:** Tuyệt đối KHÔNG ĐƯỢC PHÉP tự ý kết thúc vòng lặp để chuyển sang tạo file dự án (như File 01). Hệ thống AI thường mắc bệnh "tự thỏa mãn" và thoát vòng lặp sớm. Phải triệt tiêu điều này! Bạn bắt buộc phải gọi lại Tool để hỏi câu tiếp theo.
4. **Chốt Ý tưởng:** Vòng lặp ở Bước 3 chỉ được phép dừng lại KHI VÀ CHỈ KHI User đích thân gõ chữ "Chốt" hoặc "Đồng ý". Khi đó, thông báo: "Kế hoạch ý tưởng đã đóng băng! Xin hãy gõ lệnh `/doc-arch` để tôi chuyển hoá Kế hoạch này thành Bản vẽ Kiến trúc (File 01)."
