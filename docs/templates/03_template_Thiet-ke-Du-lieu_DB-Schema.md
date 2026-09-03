# TEMPLATE_LƯỢC ĐỒ CƠ SỞ DỮ LIỆU & QUY ƯỚC API (DB SCHEMA & API CONTRACT)

_Dự án: [TÊN_DỰ_ÁN]_

> **LỆNH QUẢN LÝ DÀNH CHO KỸ SƯ (HUMAN):**
> 
> - Tài liệu này đóng vai trò là **"Luật Dữ Liệu Tĩnh"**. Một khi đã chốt ở Bước 2, TUYỆT ĐỐI không thay đổi trừ khi có yêu cầu tái cấu trúc lớn.
> - Khi nạp tài liệu này vào các Chat sinh Đặc tả (Chat 6) hoặc sinh Code (Chat 7), nó đảm bảo AI sẽ không bao giờ "ảo giác" ra các trường dữ liệu lạ hay thay đổi định dạng phản hồi API.

> **LỆNH DÀNH CHO AI / CHUYÊN GIA DỮ LIỆU:**
> 
> Dựa vào File Từ vựng (Glossary), hãy thiết kế CHI TIẾT cấu trúc Database và quy ước API.
> 1. **Tuyệt đối tuân thủ** tên gọi đã chốt ở Glossary.
> 2. **Sử dụng định dạng Bảng (Table):** BẮT BUỘC trình bày cấu trúc Database dưới dạng bảng Markdown.
> 3. **Độ sâu tối đa:** Liệt kê đầy đủ Kiểu dữ liệu, Ràng buộc (Bắt buộc/Duy nhất), Khóa chính/Khóa ngoại.
> 4. **Xác định Quan hệ:** Ghi rõ mối quan hệ giữa các bảng (1-1, 1-n, n-n) ở mục riêng.

## 1. DATABASE SCHEMA (LƯỢC ĐỒ DỮ LIỆU TỔNG THỂ)

_(Mô tả chi tiết cấu trúc cho từng bảng/collection. Sử dụng bảng Markdown)_

### Table/Collection: `Users`

_(Mô tả ngắn gọn mục đích của bảng này. VD: Lưu trữ thông tin tài khoản người dùng)_

| **Tên trường (Field)** | **Kiểu dữ liệu (Type)** | **Ràng buộc (Constraints)** | **Mô tả / Khóa ngoại (Ref)** |
|---|---|---|---|
| `id` | UUID | Primary Key, Auto-gen | ID định danh duy nhất |
| `email` | String | Unique, Required | Email đăng nhập |
| `role` | Enum | Required, Default: `User` | Tham chiếu mục RBAC trong file Blueprint/Security |
| `status` | Enum | Required, Default: `[status_1]` | Trạng thái (phải khớp Glossary) |
| `createdAt` | Timestamp | Required, Auto-gen | Thời điểm tạo |
| `updatedAt` | Timestamp | Required, Auto-gen | Thời điểm cập nhật cuối |

### Table/Collection: `[Tên_Bảng_Khác]`

_(Mô tả ngắn gọn mục đích)_

| **Tên trường (Field)** | **Kiểu dữ liệu (Type)** | **Ràng buộc (Constraints)** | **Mô tả / Khóa ngoại (Ref)** |
|---|---|---|---|
| `id` | UUID | Primary Key, Auto-gen | |
| `[khóa_ngoại_id]` | UUID | Required, Index | Tham chiếu tới bảng `[Bảng_A]` |

## 2. QUAN HỆ CƠ SỞ DỮ LIỆU (ENTITY RELATIONSHIPS)

_(Mô tả bằng lời hoặc cú pháp đơn giản về cách các bảng liên kết với nhau để hỗ trợ truy vấn)_

- **`[Bảng A]` - `[Bảng B]` (Quan hệ 1-N):** (VD: Một User có thể có nhiều Order). Khóa ngoại `userId` đặt tại bảng `Order`.
- **`[Bảng X]` - `[Bảng Y]` (Quan hệ N-N):** (VD: Product và Category). Cần bảng trung gian `[Bảng_Trung_Gian]`.

## 3. API RESPONSE CONTRACT (CHUẨN TRẢ VỀ API)

_(Định nghĩa format JSON chung cho mọi API trong dự án. Khi Backend trả về dữ liệu, BẮT BUỘC phải bọc trong cấu trúc này)_

- **Khi Thành công (200 OK):**
```json
{
  "success": true,
  "code": 200,
  "data": { ... },
  "message": "Thông báo thành công (nếu cần)"
}
```

- **Khi Thất bại (4xx, 5xx):**
```json
{
  "success": false,
  "code": 400, // Hoặc 401, 403, 404, 500
  "errorType": "VALIDATION_ERROR", // Tên mã lỗi để Frontend dễ bắt (VD: TOKEN_EXPIRED)
  "message": "Mô tả lỗi chi tiết dành cho người dùng"
}
```

## 4. GLOBAL STATE CONTRACT (NẾU CÓ FRONTEND)

_(Quy định dữ liệu nào phải lưu trên Store toàn cục - VD: Redux/Zustand - và dữ liệu nào quản lý cục bộ)_

- **Global Store (Toàn cục):** [VD: Thông tin User đăng nhập (`auth`), Cài đặt ứng dụng (`theme`, `language`), Trạng thái Giỏ hàng (`cart`)]
- **Local State (Cục bộ):** [VD: Trạng thái nhập liệu của Form, Trạng thái Loading của một component cụ thể, Trạng thái đóng/mở của Modal]