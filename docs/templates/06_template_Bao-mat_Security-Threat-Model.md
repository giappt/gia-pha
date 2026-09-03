# TEMPLATE_BẢO MẬT & MÔ HÌNH ĐE DOẠ (SECURITY & THREAT MODEL)

_Dự án: [TÊN_DỰ_ÁN]_

> **Lệnh dành cho AI (Security Auditor):** Đóng vai "kẻ tấn công có thiện chí". CHỈ phân tích trên các tài liệu được cung cấp (`01_Ban-ve-Kien-truc` cho vai trò/phân quyền, `03_Thiet-ke-Du-lieu` cho dữ liệu, `05_Thiet-ke-Ky-thuat` cho API/Auth). KHÔNG bịa thêm thực thể/endpoint. Mỗi rủi ro phải kèm một yêu cầu cụ thể để đưa vào Micro-Spec/Code.

## 1. TÀI SẢN CẦN BẢO VỆ (ASSETS)

_(Liệt kê dữ liệu/chức năng giá trị cao)_

- [VD: Mật khẩu & token người dùng]
- [VD: Dữ liệu cá nhân (PII): email, số điện thoại]
- [VD: Chức năng thanh toán / quyền admin]

## 2. MA TRẬN ĐE DOẠ (THREAT MATRIX)

|**Tài sản**|**Đe doạ (Threat)**|**Ảnh hưởng**|**Biện pháp giảm thiểu (Mitigation)**|
|---|---|---|---|
|Token đăng nhập|Đánh cắp qua XSS|Chiếm tài khoản|Lưu httpOnly cookie; CSP; hết hạn ngắn|
|API danh sách|Truy cập vượt quyền (IDOR)|Lộ dữ liệu người khác|Kiểm tra `ownerId == currentUserId`|
|[Tài sản]|[Threat]|[Ảnh hưởng]|[Mitigation]|

## 3. CHECKLIST BẢO MẬT

### Authentication (Xác thực)
- [ ] Mật khẩu được hash (bcrypt/argon2), KHÔNG lưu plaintext
- [ ] Chống brute-force (rate limit / lockout)
- [ ] Token có thời hạn + cơ chế refresh/thu hồi

### Authorization (Phân quyền)
- [ ] Mọi endpoint/màn hình kiểm tra quyền theo Vai trò (theo `01_Ban-ve-Kien-truc`)
- [ ] Chống IDOR: kiểm tra quyền sở hữu tài nguyên trước khi thao tác

### Input & Data
- [ ] Validate & sanitize mọi input (chống SQL Injection, XSS)
- [ ] Mã hoá dữ liệu nhạy cảm khi lưu/khi truyền (TLS)
- [ ] Không trả về thông tin nhạy cảm trong response/log

### Secrets & Hạ tầng
- [ ] Secret nằm trong biến môi trường, KHÔNG commit vào repo
- [ ] CORS cấu hình đúng origin; security headers (CSP, HSTS...)

## 4. YÊU CẦU BẢO MẬT BẮT BUỘC (SECURITY REQUIREMENTS)

_(Đây là output chính — danh sách ràng buộc đưa thẳng vào Micro-Spec/Code)_

- **SEC-01:** [VD: Mọi API ghi dữ liệu phải qua middleware `requireAuth` + kiểm tra quyền sở hữu]
- **SEC-02:** [VD: Endpoint đăng nhập giới hạn 5 lần/phút theo IP]
- **SEC-03:** ...
