# TEMPLATE_BẢNG CHỈ MỤC TỪ VỰNG DỰ ÁN (UBIQUITOUS LANGUAGE)

_Dự án: [TÊN_DỰ_ÁN]_

> **LỆNH QUẢN LÝ DÀNH CHO KỸ SƯ (HUMAN):**
> 
> _Nguyên lý Bounded Context (Giới hạn Ngữ cảnh):_ Nếu dự án có trên 3 phân hệ lớn (VD: Auth, Chat, Payment), KHÔNG gom tất cả vào file này. Hãy chia nhỏ thành các file riêng (VD: `glossary_core.md`, `glossary_payment.md`) để tối ưu Context Window khi prompt AI. Chỉ nạp file glossary nào liên quan đến module đang code.

> **LỆNH DÀNH CHO AI (CHUYÊN GIA DỮ LIỆU):** Tài liệu này CHỈ chứa danh sách các thuật ngữ CHUẨN MỰC, KHÔNG chứa cấu trúc Database (Schema). Khi sinh code, đặt tên biến, hoặc viết tài liệu, BẮT BUỘC phải sử dụng từ khóa trong cột "Thuật ngữ Chuẩn". Tuyệt đối không dùng các từ trong cột "Cấm/Tránh dùng". Hãy chốt tên gọi thống nhất cho Thực thể, Trạng thái và Hành động.

## 1. THỰC THỂ CỐT LÕI (CORE ENTITIES)

_(Định nghĩa các đối tượng chính trong hệ thống/phân hệ này)_

| **Thuật ngữ Chuẩn (Standard)** | **Ý nghĩa / Định nghĩa** | **Các từ Cấm/Tránh dùng** |
|---|---|---|
| **User** | Người sử dụng hệ thống đã đăng ký | Client, Customer, Account |
| **[Thực thể A]** | [Mô tả] | [Từ cấm] |

## 2. TRẠNG THÁI VÀ VÒNG ĐỜI (STATES & LIFECYCLES)

_(Định nghĩa tên gọi cho các trạng thái của thực thể)_

- **Trạng thái của [Thực thể A]:**
    - `[status_1]`: [Mô tả ý nghĩa. VD: `pending` - Chờ xử lý]
    - `[status_2]`: [Mô tả ý nghĩa. VD: `resolved` - Đã xong]

## 3. THAO TÁC / HÀNH ĐỘNG (ACTIONS / EVENTS)

_(Định nghĩa tên gọi cho các hành động để thống nhất tên API và tên Function)_

| **Tên Hành Động (Action)** | **Mô tả (Description)** | **Từ khóa Cấm dùng** |
|---|---|---|
| **Login** | Xác thực người dùng | SignIn, LogIn |
| **[Hành động B]** | [Mô tả] | [Từ cấm] |

## 4. QUY ƯỚC ĐẶT TÊN BIẾN ID (ID CONVENTIONS)

_(Cực kỳ quan trọng để chống nhầm lẫn khi JOIN Database hoặc truyền Props)_

- Tham chiếu ID người dùng hiện tại: Luôn dùng `currentUserId` (Cấm `myId`).
- Tham chiếu ID của [Thực thể A]: Luôn dùng `[A_Id]`.

## 5. QUY TẮC NGHIỆP VỤ (BUSINESS RULES / CORE LOGIC)

_(Định nghĩa các quy tắc bất biến trong hệ thống mà AI PHẢI tuân thủ khi viết code)_

- **Quy tắc 1:** [VD: Một User chỉ được phép có tối đa 1 Giỏ hàng `Cart` ở trạng thái `active`].
- **Quy tắc 2:** [VD: Không được phép xóa cứng (Hard delete) dữ liệu `Order`, chỉ được phép chuyển trạng thái sang `deleted`].