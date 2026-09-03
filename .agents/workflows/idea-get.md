---
name: "idea-get"
description: "Lôi một ý tưởng khỏi Kho ra để thảo luận (brainstorm). Cuối phiên hỏi 'Chốt chưa?': chốt → spec→code; chưa → park lại."
---

# LỆNH: /idea-get [id]

**Mục tiêu:** Lấy MỘT ý tưởng đang gác ra làm việc: thảo luận/làm giàu qua brainstorm, rồi ở cuối tự quyết **làm tiếp hay cất lại** — không cần nhớ phải gõ thêm lệnh gì.

> Đây là cửa duy nhất để "lôi ý tưởng ra". Không có lệnh refine/activate riêng: mọi việc thảo luận đều diễn ra ở đây, và ngã rẽ nằm ở câu hỏi "Chốt chưa?" cuối phiên.

**Các bước:**
1. **Nạp draft (nhẹ token):** Đọc ĐÚNG MỘT file có `id` = [id] trong `.agents/backlog/` (không nạp cả kho). Nếu không tìm thấy → báo lỗi + gợi ý `/idea-list` để xem id hợp lệ. DỪNG.
2. **Đánh dấu đang làm:** Cập nhật frontmatter `status: active`.
3. 🔴 **[THẢO LUẬN QUA BRAINSTORM]:** Nạp nội dung ý tưởng làm đầu vào cho `/feature-brainstorm` và thảo luận/làm mới thiết kế (ngữ cảnh có thể đã đổi kể từ lúc gác). Kết quả nằm trên `implementation_plan.md` như luồng brainstorm chuẩn.
4. 🔴 **[NGÃ RẼ — HỎI "CHỐT CHƯA?"]:** Cuối phiên, hỏi rõ User:
   - **✅ CHỐT (làm luôn):** gợi ý chạy `/feature-spec` → `/feature-code`. Giữ `status: active`. Ghi mỗi Micro-Spec sinh ra vào trường `spawned_specs` của draft (để `/idea-done` đối chiếu sau).
   - **⏸️ CHƯA (chưa làm):** chạy `/idea-park` để **cất lại** (lưu cả `implementation_plan` vừa bàn vào draft), đưa `status` về `parked`. Không mất công thảo luận đã làm.
5. Nhắc: sau khi build xong, chạy `/idea-done [id]` (thủ công) để archive hoặc re-draft phần còn lại.
