---
name: "idea-done"
description: "Dọn một ý tưởng đã (hoàn tất/làm một phần) khỏi Kho Ý tưởng — archive nếu xong, re-draft thông minh nếu còn dư. Thủ công."
---

# LỆNH: /idea-done [id]

**Mục tiêu:** Chốt vòng đời của một ý tưởng sau khi đã kích hoạt và thi công.

> 🔴 **Đây là lệnh THỦ CÔNG** — chỉ chạy khi User đích thân gõ. TUYỆT ĐỐI không lệnh nào khác tự động gọi lệnh này (tránh dọn/xóa ý tưởng ngoài ý muốn).

**Các bước:**
1. **Nạp & đối chiếu:** Đọc draft `[id]` trong `.agents/backlog/`. Đối chiếu nội dung ý tưởng gốc với những gì THỰC SỰ đã giao — dựa vào các Micro-Spec đã hoàn tất (trường `spawned_specs`) và, nếu cần, `grep_search` trên `docs/` + source để xác nhận phạm vi đã làm.
2. **Xác nhận với User** mức độ hoàn tất (trình bày phần đã làm vs phần còn trong ý tưởng), rồi phân nhánh:
   - **Đã giao TRỌN VẸN:**
     - Cập nhật `status: done`, chuyển file sang `.agents/backlog/_done/` (tạo thư mục nếu chưa có). Giữ lịch sử, không xóa hẳn.
   - **Chỉ giao MỘT PHẦN:**
     - 🔴 **[SMART RE-DRAFT]:** Soạn lại nội dung draft **chỉ giữ phần CHƯA thực thi** — loại bỏ các phần đã giao (tránh lặp lại), giữ nguyên/cập nhật Pain-point, rủi ro và lý do hoãn cho phần còn lại. Đặt `status: parked`.
     - **[GATING]:** Trình bản re-draft ra chat → chờ `/approve` → mới ghi đè file. Không xóa file.
3. **Hoàn tất:** Báo kết quả (đã archive, hoặc đã re-draft còn lại những gì). Gợi ý `/idea-list` để xem kho hiện tại.
