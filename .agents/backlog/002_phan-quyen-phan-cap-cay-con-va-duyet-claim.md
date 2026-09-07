---
id: 002
title: "Con Cháu Tự Nhận Node & Hàng Đợi Duyệt Phân Cấp (Self-Service Claiming & Delegated Subtree RBAC)"
status: parked
priority: high
created: 2026-09-07
updated: 2026-09-07
spawned_specs: []
---

# Ý TƯỞNG 002: CON CHÁU TỰ NHẬN NODE & HÀNG ĐỢI DUYỆT PHÂN CẤP (MILESTONE 8)

## 1. PAIN-POINT & MỤC TIÊU CỐT LÕI
- **Phía Con Cháu:**
  - Sau khi đăng nhập Google, con cháu chưa có luồng tự định danh "Tôi là ai trên cây gia phả?".
  - Con cháu mới sinh hoặc các nhánh đi xa thất lạc chưa có tên trên cây không có cách nào báo danh để được ghi nhận vào sổ họ.
  - Cần các điểm chạm tương tác tự nhiên, tinh tế, không ép buộc và không làm phiền người chỉ muốn vào xem cây.
- **Phía Ban Quản Trị:**
  - Dòng họ lớn (hàng trăm đến hàng nghìn nhân khẩu) khiến Trưởng tộc (Super Admin) bị quá tải nếu phải tự tay xác minh và duyệt từng tài khoản.
  - Cần cơ chế ủy quyền quản trị dòng họ tự nhiên: **Trưởng Chi (`branch_editor`)** được quyền phê duyệt đơn nhận node của con cháu thuộc Chi mình, đồng thời có thể phân quyền biên tập cho các nhánh nhỏ hơn (Nhánh, Phái) dưới quyền.

---

## 2. KIẾN TRÚC GIẢI PHÁP TOÀN DIỆN (END-TO-END WORKFLOW)

### PHẦN A: HÀNH TRÌNH CON CHÁU (SELF-SERVICE MEMBER CLAIMING)

#### 1. Bốn Điểm Chạm Tự Nhiên (4 Non-intrusive Persistent Touchpoints):
- **Điểm chạm 1 - Dropdown Avatar & Cài đặt cá nhân (`AuthButton.tsx` / `PersonalSettingsModal.tsx`):**
  - Trong dropdown Avatar: hiển thị menu nổi bật `[🙋 Bạn là ai trong gia tộc? Nhận hồ sơ →]` (nếu chưa liên kết) hoặc `[⏳ Đang chờ duyệt đơn]` (nếu pending).
  - Trong modal Cài đặt của tôi: Khối "Hồ sơ huyết thống dòng họ" cho phép xem trạng thái liên kết và bấm nhận node bất cứ lúc nào.
- **Điểm chạm 2 - Smart Banner trên Trang chủ / Cây Phả Hệ:**
  - Thanh thông báo thanh mảnh (~40px) dưới Navbar: *"Bạn đã đăng nhập với email `abc@gmail.com`. Bạn là ai trên cây gia phả? [🙋 Nhận hồ sơ] [✕ Để sau]"*.
  - Bấm `[✕ Để sau]`: Tự ẩn đi và lưu nhớ trong 7 ngày không hỏi lại, đảm bảo màn hình luôn sạch sẽ.
- **Điểm chạm 3 - Ngay trên Cây Phả Hệ (`/tree` - Member Detail Drawer):**
  - Khi con cháu lướt cây tìm thấy thẻ của mình $\rightarrow$ Bấm mở Drawer $\rightarrow$ Xuất hiện nút nổi bật: **`[🙋 Đây chính là tôi (Gửi đơn nhận hồ sơ)]`** (1-click, tự điền sẵn tên, đời, chi nhánh).
- **Điểm chạm 4 - Trên Trang Tra Cứu Xưng Hô (`/kinship`):**
  - Gợi ý nhận node để hệ thống tự động điền "Người gọi = Chính bạn", không cần chọn lại tên mình mỗi lần tra cứu.

#### 2. Ba Con Đường Tìm Kiếm & Nhận Diện:
- **Cách 1 - Tìm theo Họ Tên:** Gõ tên mình $\rightarrow$ Danh sách gợi ý hiển thị kèm năm sinh, tên Bố/Mẹ và Chi nhánh (ví dụ: *"Nguyễn Văn Tuấn • SN 1995 • Con ông Bình bà Hoa • Chi 2"*) để tránh nhầm người trùng tên.
- **Cách 2 - Lọc theo Ngành / Chi:** Chọn Ngành $\rightarrow$ Chọn Chi $\rightarrow$ Danh sách con cháu trong chi thu hẹp lại $\rightarrow$ Chọn đúng mình.
- **Cách 3 - Nhận trực tiếp trên Cây:** Click thẻ node của mình trên Canvas.

#### 3. Báo Danh Khi Chưa Có Tên Trên Cây (Con cháu mới sinh / Nhánh xa tìm về):
- Nút bấm: *"Chưa tìm thấy tên bạn trong gia phả? Báo danh con cháu mới"*.
- Điền form: Họ tên, Giới tính, Năm sinh, SĐT.
- **Chọn Bố hoặc Mẹ đã có trên cây:** Gõ tìm kiếm người cha/mẹ trong họ.
- **Nếu cả Bố và Mẹ đều chưa có trên cây:**
  - Cho phép chọn **Ngành / Chi / Cụ Tiền Nhân gần nhất** mà gia đình nhớ được.
  - Cung cấp ô: **"Gốc tích gia đình / Lời nhắn xác minh"** (ví dụ: *"Nhánh cụ Dũng Chi 2 di cư vào Đồng Nai năm 1980, bố con tên Hùng, ông nội tên Dũng, SĐT liên hệ: 0912..."*).
  - Đơn được gắn nhãn `[Cần kết nối nhánh]` để Trưởng Chi/Trưởng họ liên hệ gọi điện xác minh và tạo chuỗi nối nhánh.

#### 4. Ma Trận Trạng Thái & Quyền Hạn (State Machine & Permissions):
- **Không nhận node (Role: `viewer`):** Hoàn toàn tự do, xem 100% cây, giỗ, xưng hô công khai. Tuyệt đối không ép buộc.
- **Đang chờ duyệt (`pending`):**
  - Vẫn xem 100% tính năng bình thường.
  - Hiển thị banner trạng thái đơn nhẹ nhàng.
  - **Tự do 100%:** Được quyền bấm **`[Hủy đơn]`** hoặc **`[Chọn lại]`** bất cứ lúc nào nếu phát hiện chọn nhầm.
  - Chưa được quyền sửa thông tin hay thêm con cái cho node đó.
- **Đã được duyệt (`claimed_member`):**
  - Trở thành thành viên chính thức gắn với node phả hệ.
  - Khóa nút tự đổi node (chống mượn máy phá hoại hoặc tranh chấp). Muốn đổi phải liên hệ Super Admin/Trưởng Chi gỡ liên kết trên `/admin/users` trước.

---

### PHẦN B: BAN QUẢN TRỊ & PHÊ DUYỆT PHÂN CẤP (DELEGATED SUBTREE RBAC)

#### 1. Mô Hình 4 Role Kết Hợp Subtree Scope:
- Giữ nguyên 4 role cốt lõi: `viewer`, `claimed_member`, `branch_editor`, `super_admin`.
- Phân cấp thông qua cột `assigned_branch_id` trong bảng `users`.

#### 2. Hàng Đợi Duyệt Đơn (Claim Approval Queue):
- Tích hợp vào **Bàn Điều Hành (`/admin`)** tại khối Trung tâm việc khẩn:
  - Badge cảnh báo: *"Có N đơn nhận node mới chờ xử lý"* kèm nút `[Xem xét →]`.
- Mở Drawer/Modal danh sách đơn chờ duyệt:
  - Hiển thị thông tin người xin nhận: Email Google, Avatar, Tên node muốn nhận (hoặc thông tin báo danh mới), Lời nhắn xác minh, SĐT.
  - 2 Nút thao tác dứt khoát: **`[✓ Phê Duyệt]`** và **`[✕ Từ Chối]`** (kèm lý do từ chối gửi về cho user).

#### 3. Phân Quyền Theo Cây Con (Subtree Approval Gate):
- **Trưởng Chi (`branch_editor`):** Khi đăng nhập vào `/admin`, hệ thống tự động lọc danh sách đơn: Chỉ hiển thị các đơn thuộc Chi nhánh mà người đó phụ trách (`assigned_branch_id`). Trưởng Chi duyệt xong $\rightarrow$ Tài khoản con cháu tự động nâng lên `claimed_member`.
- **Trưởng Tộc (`super_admin`):** Thấy toàn bộ đơn của toàn dòng họ và có quyền tối cao can thiệp duyệt/hủy bất kỳ đơn nào.

#### 4. Cơ Chế Ủy Quyền Cấp Dưới (Delegated Assignment):
- `branch_editor` của một Chi có quyền chỉ định một `claimed_member` trong Chi của mình làm biên tập viên cho một nhánh con nhỏ hơn (Nhánh, Phái).
- **Khóa an toàn chống leo thang đặc quyền (Privilege Escalation Guard):** Biên tập viên tuyệt đối không thể tự thăng cấp lên Super Admin và không thể gán quyền cho người ngoài phạm vi chi của mình.

---

## 3. MÔ HÌNH CƠ SỞ DỮ LIỆU DỰ KIẾN
- **Bảng `claim_requests`:**
  - `id`: UUID (Primary Key).
  - `user_id`: UUID (Foreign Key trỏ tới `users.id`).
  - `member_id`: UUID (Nullable, trỏ tới `members.id` nếu là nhận node có sẵn).
  - `request_type`: Text (`link_existing` | `create_draft`).
  - `draft_data`: JSONB (Lưu họ tên, giới tính, năm sinh, parent_id, branch_id khi báo danh mới).
  - `verification_note`: Text (Lời nhắn xác minh của con cháu).
  - `status`: Text (`pending` | `approved` | `rejected` | `cancelled`).
  - `rejection_reason`: Text (Nullable).
  - `reviewer_id`: UUID (Nullable, người duyệt).
  - `created_at`, `updated_at`: Timestamp with time zone.
- **Ràng buộc duy nhất (Unique Constraint):**
  - Một `member_id` chỉ được có tối đa 1 yêu cầu `pending` hoặc `approved`.
  - Một `user_id` chỉ được có tối đa 1 yêu cầu `pending` tại một thời điểm.

---

## 4. RỦI RO & ĐIỂM CẦN LƯỜNG TRƯỚC
1. **Tranh chấp Node (Node Collision):** Hai người cùng nhận một người $\rightarrow$ Hệ thống cảnh báo cho người duyệt: *"Node này đã có đơn khác đang chờ duyệt / đã có người liên kết"*.
2. **Kiểm soát bảo mật IDOR ở cấp API:** Backend route bắt buộc kiểm tra xem người duyệt (`session.user`) có quyền trên chi nhánh của node đó hay không trước khi cập nhật.
3. **Thu hồi quyền (Revocation):** Khi Trưởng Chi bị giáng cấp, các quyền con dưới quyền cần được kiểm soát an toàn.

---

## 5. ĐIỀU KIỆN KÍCH HOẠT (TRIGGER CRITERIA)
- Ý tưởng đã hoàn thiện toàn diện cả mặt UX lẫn Kiến trúc phân quyền.
- **Sẵn sàng kích hoạt thành Milestone 8:** Gọi lệnh `/idea-get 002` hoặc `/feature-brainstorm` để tạo `implementation_plan.md` thi công mã nguồn khi bước vào giai đoạn tiếp theo của dự án.
