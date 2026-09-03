---
name: "idea-list"
description: "Liệt kê toàn bộ Kho Ý tưởng (.agents/backlog/) dạng bảng. Read-only, chỉ đọc frontmatter nên nhẹ token."
---

# LỆNH: /idea-list

**Mục tiêu:** Cho User thấy toàn cảnh các ý tưởng đang gác để quyết định nên lôi cái nào ra làm.

**QUY TẮC:** TUYỆT ĐỐI READ-ONLY. Không tạo/sửa/xóa file. **Chỉ đọc frontmatter** mỗi file (KHÔNG nạp thân bài) để tiết kiệm token.

**Các bước:**
1. Quét toàn bộ file `.agents/backlog/*.md` (bỏ qua thư mục `_done/`). Nếu thư mục không tồn tại hoặc rỗng → báo "Kho ý tưởng đang trống; dùng `/idea-park` để gác ý tưởng đầu tiên." và dừng.
2. Đọc frontmatter mỗi file, in ra **bảng**: `id | title | status | priority | created`.
   - Nhóm/sắp xếp: `parked` và `active` lên trên; trong nhóm sắp theo `priority` (high → low).
3. (Tuỳ chọn) Nếu muốn, tóm tắt 1 dòng Pain-point của mỗi ý tưởng để dễ nhớ.
4. Gợi ý: "Dùng `/idea-get [id]` để lôi một ý tưởng ra làm việc, hoặc `/idea-done [id]` để dọn ý tưởng đã hoàn tất."
