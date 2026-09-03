# TEMPLATE_BẢN VẼ KIẾN TRÚC TỔNG THỂ (THE BLUEPRINT)

_Dự án: [TÊN_DỰ_ÁN]_

> **Lệnh dành cho AI / Trợ lý Lập trình:** Trong tài liệu này, tuyệt đối KHÔNG sinh ra mã nguồn (code). Mục tiêu là định hình tư duy hệ thống, phân tích luồng người dùng và xác định các mảnh ghép cốt lõi.

## 1. TỔNG QUAN DỰ ÁN (OVERVIEW)

- **Mục tiêu sản phẩm:** [Mô tả ngắn gọn sản phẩm giải quyết bài toán gì, ví dụ: Ứng dụng chat bảo mật E2EE]
- **Đối tượng người dùng:** [Ai sẽ dùng hệ thống này?]
- **Nền tảng mục tiêu:** [Web / Mobile App / Desktop App / API Service]

## 2. HÀNH TRÌNH NGƯỜI DÙNG (USER JOURNEYS)

_(Mô tả các luồng thao tác chính của người dùng từ lúc bắt đầu đến lúc hoàn thành mục tiêu)_

- **[Luồng 1 - Ví dụ: Đăng ký & Đăng nhập]:** Người dùng mở App -> Nhập Số điện thoại -> Nhận OTP -> Xác thực thành công -> Chuyển hướng vào Màn hình chính.
- **[Luồng 2 - Ví dụ: Mua hàng]:** Người dùng chọn Sản phẩm -> Thêm vào giỏ -> Thanh toán qua Stripe -> Nhận email xác nhận -> Cập nhật trạng thái đơn hàng.

## 3. CÁC TÍNH NĂNG CỐT LÕI (CORE FEATURES)

_(Liệt kê các tính năng không thể thiếu để sản phẩm có thể go-live)_

1. [Tính năng A - Mô tả ngắn gọn: VD: Xác thực người dùng bằng OTP]
2. [Tính năng B - Mô tả ngắn gọn: VD: Gửi nhận tin nhắn Real-time]
3. [Tính năng C - Mô tả ngắn gọn: VD: Mã hóa đầu cuối E2EE]

## 4. LUỒNG DỮ LIỆU & KIẾN TRÚC HỆ THỐNG (DATA FLOW & ARCHITECTURE)

- **Kiến trúc đề xuất:** [Client-Server / Microservices / Serverless...]
- **Luồng dữ liệu chính:** _(Mô tả đường đi của data từ lúc User thao tác đến khi lưu vào DB)_
    - `[Thao tác User]` -> `[Frontend/Client xử lý gì]` -> `[API/Backend nhận gì]` -> `[Database lưu gì]`
- **Tích hợp bên thứ 3 (Third-party Integrations):** 
    - [Liệt kê dịch vụ ngoài: VD: AWS S3 (Lưu ảnh), Stripe (Thanh toán), Resend (Gửi Email)...]

## 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

- **Bảo mật (Security):** [VD: Mọi API phải có JWT Token, Rate limit 100 req/min]
- **Hiệu năng (Performance):** [VD: Phản hồi API dưới 200ms, sử dụng Redis cache]
- **Mở rộng (Scalability):** [VD: Sẵn sàng scale up khi có 10,000 CCU]

## 6. TÍNH NĂNG MỞ RỘNG (NICE-TO-HAVE)

_(Các tính năng sẽ làm sau khi Core Features đã hoàn thành)_

- [Tính năng D, E, F...]