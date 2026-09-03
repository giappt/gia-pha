---
name: "idea-park"
description: "Gác một ý tưởng tính năng vào Kho Ý tưởng (.agents/backlog/) để cân nhắc/làm sau — không thực thi ngay."
---

# LỆNH: /idea-park [Tiêu đề]

**Mục tiêu:** Lưu lại một ý tưởng (có thể làm hoặc chưa làm) vào Kho Ý tưởng để không bị mất, kèm đủ ngữ cảnh để "sống lại" sau này. KHÔNG code, KHÔNG thực thi.

> Đây là bước "gác lại" song song với pipeline. Thường dùng ngay sau `/feature-brainstorm` khi bạn quyết định "hay nhưng chưa làm bây giờ", hoặc bất cứ lúc nào nảy ý tưởng thô.

**Các bước:**
1. **Xác định nguồn nội dung:**
   - Nếu vừa chạy `/feature-brainstorm` và có `implementation_plan.md` → đóng gói **nguyên gói** (giải pháp, các rủi ro đã lường, bản đồ liên kết, ngữ cảnh) vào draft — đây là draft "giàu", kích hoạt lại rất dễ.
   - Nếu chỉ là ý tưởng thô (chưa brainstorm) → lưu **bản nhẹ**: Pain-point/Mục tiêu + phác thảo sơ bộ.
2. **Soạn draft theo cấu trúc chuẩn** (xem Template bên dưới): cấp `id` kế tiếp (quét `.agents/backlog/` lấy số lớn nhất +1), `title` từ tham số, `status: parked`, `created` (ngày hiện tại), hỏi User mức `priority` (high/med/low).
3. 🔴 **[GATING]:** Trình toàn văn draft ra chat để User xem. DỪNG LẠI, chờ `/approve` (hoặc "đồng ý"). TUYỆT ĐỐI không ghi file trước khi được duyệt.
4. **Ghi file:** Sau khi duyệt, dùng `write_to_file` ghi `.agents/backlog/[id]_[slug-tiêu-đề].md` (tạo thư mục `.agents/backlog/` nếu chưa có).
5. **Hoàn tất:** Báo đã gác ý tưởng; gợi ý dùng `/idea-list` để xem lại danh sách.

> Lệnh này cũng là **cửa "cất lại"**: khi `/idea-get` thảo luận xong nhưng User chọn "chưa làm", nhánh đó gọi `/idea-park` để lưu lại (kèm `implementation_plan` vừa bàn) và đưa `status` về `parked`.

---
### 📝 Template draft (AI dùng để soạn ở bước 2):
```markdown
---
id: <NNN>
title: "<Tiêu đề ý tưởng>"
status: parked
priority: <high|med|low>
created: <YYYY-MM-DD>
spawned_specs: []
---

## Pain-point / Mục tiêu
<Vì sao cần ý tưởng này? Giải quyết vấn đề gì?>

## Phác giải pháp
<Bản tóm tắt giải pháp; hoặc dán nguyên implementation_plan.md nếu đã brainstorm.>

## Rủi ro / Điểm cần lường trước
<Edge cases, hiệu năng, bảo mật, phụ thuộc... nếu đã brainstorm.>

## Lý do hoãn / Điều kiện nên làm
<Vì sao chưa làm bây giờ; khi nào thì nên kích hoạt.>
```
