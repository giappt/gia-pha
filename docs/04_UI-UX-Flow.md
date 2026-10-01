# THIẾT KẾ GIAO DIỆN & LUỒNG (UI/UX FLOW & SCREEN MAP)

_Dự án: FAT (Family Tree - Hệ Thống Quản Lý Gia Phả Dòng Họ)_

> **Lệnh dành cho AI (UX/Product Designer):** Tài liệu này thiết kế Ở MỨC BẢN VẼ, KHÔNG sinh code. Mọi nhãn/đối tượng phải dùng đúng "Thuật ngữ Chuẩn" trong `docs/02_Project-Glossary.md`. Mỗi màn hình phải gắn với Vai trò được phép truy cập (theo `docs/01_Architecture-Blueprint.md`).

---

## 1. KIỂM KÊ MÀN HÌNH (SCREEN INVENTORY)

| **Mã** | **Tên màn hình** | **Mục đích** | **Vai trò được truy cập** |
|---|---|---|---|
| **S-01** | Cây Gia Phả Tương Tác (Family Tree View) | Màn hình chính xem cây gia phả, pan/zoom, spotlight tìm kiếm, lọc Chi nhánh và toggle Nội/Ngoại | Tất cả (`viewer`, `claimed_member`, `branch_editor`, `super_admin`) |
| **S-02** | Thẻ Chi Tiết & Modal Form 1 Cấp (Member Modal) | Xem thông tin cá nhân, tiểu sử, ngày giỗ, mộ phần; mở popup thêm vợ/chồng hoặc con trực tiếp 1 cấp | Xem: Tất cả; Sửa/Thêm: `branch_editor`, `super_admin` |
| **S-03** | Tra Cứu Vai Vế Xưng Hô (Kinship Resolver View) | Chọn 2 người để hệ thống tự động suy luận vai vế xưng hô 2 chiều kèm sơ đồ huyết thống | Tất cả (`viewer`, `claimed_member`, `branch_editor`, `super_admin`) |
| **S-04** | Lịch Giỗ 30 Ngày & Đăng Ký Push (Anniversaries View) | Xem danh sách các ngày giỗ sắp tới xếp theo âm lịch; nút bấm kích hoạt nhận Web Push Notification | Tất cả (`viewer`, `claimed_member`, `branch_editor`, `super_admin`) |
| **S-05** | Đăng Nhập & Phiếu Nhận Node (Auth & Claim Profile) | Đăng nhập Google OAuth và gửi phiếu xác nhận "Đây là tôi trên cây Gia Phả" | Chưa đăng nhập (`viewer`) |
| **S-06** | Hàng Đợi Duyệt Claim (Claim Review Queue) | Xem danh sách phiếu xin nhận node, đối soát thông tin và bấm Duyệt / Từ chối | `super_admin` |
| **S-07** | Cài Đặt Dòng Họ & Master Data Chi Tộc (Clan Settings) | Đổi tên họ, chỉnh sửa danh mục Chi nhánh (Master Data), cấu hình từ điển xưng hô vùng miền | `super_admin` |
| **S-08** | Nhập Liệu Hàng Loạt (Bulk Excel Import) | Tải template mẫu, tải lên file Excel dữ liệu gia phả, xem trước kiểm tra lỗi logic và nạp hàng loạt | `super_admin` |
| **S-09** | Khay Thành Viên Chưa Nối Phả (Unlinked Members Shelf) | Quản lý danh sách các thành viên độc lập chưa rõ bố mẹ, hỗ trợ lọc tách biệt để không làm rối cây chính | Xem: Tất cả; Sửa: `branch_editor`, `super_admin` |
| **S-10** | Quản Lý & Phân Quyền Người Dùng (User Management & Roles) | Xem danh sách toàn bộ tài khoản Google đã đăng nhập, thay đổi cấp quyền (Role) và phân công Chi nhánh | `super_admin` |

---

## 2. LUỒNG ĐIỀU HƯỚNG (NAVIGATION FLOW)

```mermaid
flowchart TD
    S01["S-01: Cây Gia Phả (Trang Chủ)"]
    S02["S-02: Modal Chi Tiết / Sửa Bố Mẹ 1 Cấp"]
    S03["S-03: Tra Cứu Vai Vế (Kinship)"]
    S04["S-04: Lịch Giỗ 30 Ngày"]
    S05["S-05: Đăng Nhập & Claim Profile"]
    S06["S-06: Duyệt Claim Requests"]
    S07["S-07: Cài Đặt Dòng Họ & Master Data"]
    S08["S-08: Bulk Import Excel"]
    S09["S-09: Khay Thành Viên Chưa Nối Phả"]

    S01 -->|Click vào Node| S02
    S01 -->|Click menu Tra Cứu| S03
    S01 -->|Click menu Lịch Giỗ| S04
    S01 -->|Bấm Đăng Nhập / Nhận Node| S05
    S01 -->|Nút Lọc: Chưa nối phả| S09
    
    S02 -->|Click Ghost Node 🔗| S01
    S02 -->|Bấm Xem quan hệ với tôi| S03
    
    S09 -->|Click chọn thành viên| S02
    S02 -->|Sửa Bố/Mẹ thành công| S01
    
    S05 -->|Gửi yêu cầu thành công| S01
    
    S01 -->|Menu Quản Trị (Admin)| S06
    S06 --> S07
    S07 --> S08
    S06 --> S10["S-10: Quản Lý & Phân Quyền User"]
```

- **Luồng A — Khám phá Cây & Nhảy Ghost Node:** `S-01` $\rightarrow$ Click Node Chị A mở `S-02` $\rightarrow$ Thấy Ghost Node Anh B (liên kết phối ngẫu) $\rightarrow$ Click "Xem nhánh gốc" $\rightarrow$ Camera trên `S-01` tự động lướt mượt mà sang vị trí gốc của Anh B ở Chi 2.
- **Luồng B — Xác định quan hệ:** `S-01` $\rightarrow$ Chọn menu "Tra Cứu Vai Vế" $\rightarrow$ Chuyển `S-03` $\rightarrow$ Chọn Người 1 (Tôi), Chọn Người 2 (Ông C) $\rightarrow$ Bấm "Xác định quan hệ" $\rightarrow$ Hiển thị kết quả 2 chiều kèm chuỗi breadcrumbs huyết thống $\rightarrow$ Bấm "Xem trên cây" nhảy về `S-01`.
- **Luồng C — Đăng ký Nhận Node & Duyệt:** `S-01` $\rightarrow$ Bấm "Nhận diện vị trí gia phả" $\rightarrow$ Chuyển `S-05` $\rightarrow$ Đăng nhập Google $\rightarrow$ Chọn Node của mình $\rightarrow$ Nhập thông tin xác thực $\rightarrow$ Gửi yêu cầu $\rightarrow$ Super Admin nhận thông báo trên `S-06` $\rightarrow$ Bấm Duyệt (Approve) $\rightarrow$ Tài khoản của User kích hoạt quyền `claimed_member`.
- **Luồng D — Nhập liệu Excel Nhanh:** Admin vào `S-07` $\rightarrow$ Chuyển sang `S-08` $\rightarrow$ Tải template Excel $\rightarrow$ Kéo thả file đã điền lên $\rightarrow$ Xem bảng preview phát hiện lỗi $\rightarrow$ Bấm "Xác nhận Nhập dữ liệu" $\rightarrow$ Hệ thống sinh 1.000 node $\rightarrow$ Chuyển về `S-01` xem kết quả toàn cảnh.
- **Luồng E — Quản lý Node Độc lập & Nối cây tự nhiên:**
  - *Tạo độc lập:* Người nhập thêm thành viên mới nhưng để trống Bố/Mẹ. Thành viên được lưu an toàn vào DB mà không bắt buộc có liên kết.
  - *Lọc chống rối mắt:* Mặc định cây chính `S-01` chỉ hiển thị các nhánh nối từ Cụ Tổ. Ở thanh công cụ có nút filter: `[Chưa nối phả (X)]`. Bấm vào sẽ mở `S-09` để xem danh sách riêng.
  - *Nối cây tự nhiên:* Người dùng click vào người chưa nối phả $\rightarrow$ Mở Modal `S-02` $\rightarrow$ Chỉ cần chọn trường **Bố** hoặc **Mẹ** (hoặc chọn Vợ/Chồng) $\rightarrow$ Bấm **Lưu** $\rightarrow$ Hệ thống tự động gắn vào cây Gia Phả chính và biến mất khỏi danh sách chưa nối mà không cần thao tác phức tạp!

---

## 3. TRẠNG THÁI MÀN HÌNH (SCREEN STATES)

### 3.1. Màn hình S-01: Cây Gia Phả Tương Tác
- **Loading:** Hiển thị khung Skeleton đồ thị dạng cây mờ kèm thanh tiến trình tải nhẹ nhàng.
- **Empty:** Trường hợp dòng họ mới tinh chưa có ai $\rightarrow$ Hiện Banner trang trọng: *"Dòng họ chưa có dữ liệu. Vui lòng bấm vào đây để khởi tạo Cụ Tổ đầu tiên hoặc tải lên file Excel"*.
- **Success/Default:** 
  - Khung Canvas đồ thị hiển thị các Node thế hệ 1, 2, 3.
  - Các nhánh con có nút dấu `+` để bung tiếp các đời sau.
  - Thanh công cụ phía trên: Thanh tìm kiếm gõ tên (Spotlight Search), Dropdown chọn Chi nhánh, Nút Toggle xem Nhánh Nội / Toàn bộ Nội - Ngoại, Cụm nút Zoom In / Zoom Out / Reset View.
- **Spotlight Active:** Khi gõ tìm tên người $\rightarrow$ Màn hình tự làm mờ các node xung quanh, làm sáng (highlight) node được chọn và camera zoom cận cảnh vào người đó.

### 3.2. Màn hình S-03: Tra Cứu Vai Vế (Kinship Resolver)
- **Empty:** Hai ô nhập người trống kèm hướng dẫn trang trọng: *"Chọn 2 thành viên bất kỳ để xác định cách xưng hô chuẩn mực theo phong tục dòng tộc"*.
- **Calculating:** Hiệu ứng vẽ đường đi huyết thống kết nối giữa 2 người (100ms).
- **Success:**
  - Khối kết quả nổi bật 2 chiều: 
    - Chiều đi: **`A gọi B là: Bác Họ (Xưng Cháu)`**
    - Chiều về: **`B gọi A là: Cháu Họ (Xưng Bác)`**
  - **Sơ Đồ Cây Gia Phả Trực Quan (Mini Cây Chữ V Ngược):** 
    - Đỉnh chóp là Gốc Gần Nhất, rẽ xuống 2 cột nhánh (Nhánh Trưởng vs Nhánh Thứ).
    - Có cơ chế **Nén Tầng Trung Gian (Smart Folding)** khi khoảng cách $\ge 4$ đời (nén các đời giữa thành nút bấm `[Nén N thế hệ - Bấm mở rộng]`).
    - Nút liên kết: `[Xem trên Cây Gia Phả Lớn]` lướt camera trên `S-01` focus vào 2 node.
  - **Thẻ Diễn Giải Phong Tục Cấu Trúc Hóa:**
    - Nguyên tắc dòng họ: `Phong tục Miền Bắc: Tôn vai Nhánh Trưởng`.
    - Tục ngữ cổ phong ghi nhận: `"Bé bằng củ khoai, cứ vai Bác là gọi Anh"`.
    - Bảng đối sánh tương quan trực diện giữa 2 người.
- **No Relation (Không chung gốc):** Thông báo chuẩn mực: *"Hai người này không cùng huyết thống nội tộc trong cây gia phả (Dâu/Rể ngoại tộc hoặc thành viên chưa nối phả)"*.

### 3.3. Màn hình S-04: Lịch Giỗ 30 Ngày
- **Empty:** *"Trong 30 ngày tới không có ngày giỗ nào của dòng họ"*.
- **Success:** Danh sách phân nhóm theo từng ngày:
  - Header ngày: **`Ngày 15/09/2026 (Nhằm ngày 05/08 Âm lịch - Năm Bính Ngọ)`**
  - Danh sách người giỗ trong ngày:
    - Avatar, Họ tên, Danh vị / Đời thứ mấy, Chi nhánh.
    - Huy hiệu quan hệ (nếu user đã liên kết node): *"Bà nội của bạn"* / *"Cụ kỵ nhánh của bạn"*.
- **Push Notification Banner:** Nếu user chưa bật push $\rightarrow$ Hiện banner nổi bật: *"Bật thông báo để không bao giờ quên ngày giỗ của các cụ trong nhánh mình"* kèm nút `[Bật Thông Báo]`.

---

## 4. DESIGN SYSTEM CƠ BẢN (MODERN VIETNAMESE HERITAGE)

### 4.1. Triết Lý Tạo Hình: Kiến Trúc Mở (Open Architecture - Chống Lồng Hộp Box-in-Box)
- **Loại bỏ hộp lồng hộp:** Tuyệt đối không lồng 3–4 tầng bo tròn (hộp ngoài bọc hộp icon bọc viên thuốc tag). Sử dụng **Khoảng thở (Whitespace)** rộng rãi và **Đường kẻ chỉ siêu mảnh (Hairline border 1px - `border-slate-200/60`)** để phân định cấu trúc.
- **Biểu tượng nổi tự do (Floating Minimalist Icons):** Icon nét đơn thanh thoát (stroke 1.5–1.75px) đặt trực tiếp trên bề mặt, đi kèm hiệu ứng hover hoặc quầng sáng mờ rất nhẹ (subtle aura glow), không nhét vào các khối hộp màu vuông dày.
- **Bo góc kỷ luật (Disciplined Radius):** Sử dụng chuẩn `rounded-lg` (8px) cho nút bấm/icon badge và `rounded-xl` (12px) cho card/panel lớn, tránh bo tròn quá đà kiểu hoạt hình.

### 4.2. Bảng Màu Chủ Đạo (Color Palette - Ngọc Bích Cội Nguồn & Ánh Kim)
- **Primary (Ngọc Bích Khởi Sắc - Jade Emerald):** `#059669` (Emerald-600), `#10B981` (Emerald-500) — Biểu trưng cho sự sinh sôi nảy nở, cây đại thụ gia phả tươi tốt muôn đời.
- **Accent (Ánh Kim Rạng Rỡ - Warm Gold):** `#F59E0B` (Gold-500), `#D97706` (Gold-600) — Tôn nghiêm, quý phái, dùng cho huy hiệu vai vế và ngày giỗ quan trọng.
- **Neutral Background & Surface:**
  - Light Mode: Trắng sứ tinh khiết `#FFFFFF` kết hợp quầng sáng lan tỏa cực nhẹ (`radial-gradient` ngọc bích 7% opacity).
  - Dark Mode: `#090E1A` với quầng sáng 12% opacity.
- **Phân định Giới tính (Gender Colors):**
  - Nam giới (Male): Viền / Tag xanh dương thanh lịch `#2563EB` (Blue-600).
  - Nữ giới (Female): Viền / Tag hồng phấn trang nhã `#DB2777` (Pink-600).
- **Ghost Node 🔗 (Hôn nhân nội tộc):**
  - Viền nét đứt (Dashed border) `#94A3B8` (Slate-400), huy hiệu liên kết `#10B981` (Emerald-500) hoặc `#D97706` (Gold-600).
- **Trạng thái (Status):**
  - Đã mất (`deceased`): Ký hiệu thánh giá hoặc hoa cúc nhỏ `†`, tông màu trầm xám đen `#475569`.
  - Còn sống (`living`): Màu tươi tắn, tag xanh ngọc `#059669`.

### 4.3. Typography
- **Phông chữ chuẩn:** **Be Vietnam Pro** (nhúng trực tiếp từ `next/font/google`) — Tối ưu tuyệt đối cho tiếng Việt có dấu, nét chữ tròn trịa, thanh thoát và dễ đọc.
- **Cỡ chữ & Phân cấp:**
  - Tên Node trên cây: `14px - 16px` (Font-semibold), tương phản cao.
  - Tiêu đề Trang (H1): `36px - 60px` (Desktop) với gradient text, tracking-tight.
  - Thẻ thông tin di động: Tối thiểu `14px`, nút bấm cảm ứng cao tối thiểu `44px` theo chuẩn tiếp cận (WCAG).

### 4.4. Thành phần Giao diện Tái sử dụng (Reusable UI Components)
- `MemberNodeCard`: Card hiển thị từng cá nhân trên cây (Avatar, Tên, Năm sinh - Năm mất, Icon giới tính, Nút dấu `+`).
- `GhostNodeCard`: Card phản chiếu có viền nét đứt và icon 🔗.
- `OneLevelModal`: Modal form nhập liệu cam kết chỉ mở 1 tầng, hỗ trợ chuyển tab Lịch Âm / Dương.
- `KinshipBadge`: Huy hiệu hiển thị danh xưng xưng hô.
- `BranchFilterDropdown`: Dropdown chọn Chi nhánh lấy dữ liệu từ Master Data `clan_settings.branches`.

---

## 5. WIREFRAME (PHÁC THẢO BỐ CỤC DẠNG ASCII)

### 5.1. Màn hình S-01: Giao diện Cây Gia Phả (Trang Chủ)
```
+-----------------------------------------------------------------------------------+
|  [FAT LOGO] DÒNG HỌ PHẠM VĂN      [Tìm tên thành viên...]   [Lịch Giỗ] [Tôi là ai?]  |
+-----------------------------------------------------------------------------------+
|  [Bộ lọc Chi: Tất cả Chi ▼]  [Toggle: Nhánh Nội | Nội-Ngoại]      [+] [-] [Reset View]   |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                               +-------------------------+                         |
|                               |  Cụ Tổ Phạm Văn A       |                         |
|                               |  1890 – 1965 (75T)      |                         |
|                               |  [Chi: Ngành Cả]    [+] |                         |
|                               +------------+------------+                         |
|                                            |                                      |
|                     +----------------------+----------------------+               |
|                     |                                             |               |
|         +-----------+-----------+                     +-----------+-----------+   |
|         |  Ông Phạm Văn B1      |                     |  Ông Phạm Văn B2      |   |
|         |  Chi Trưởng           |                     |  Chi Hai              |   |
|         |  [+] [Mở rộng con 3]  |                     |  [+] [Mở rộng con 2]  |   |
|         +-----------+-----------+                     +-----------+-----------+   |
|                     |                                             |               |
|            (Nhánh con cháu...)                           (Nhánh con cháu...)      |
|                                                                                   |
+-----------------------------------------------------------------------------------+
| Hướng dẫn: Bấm giữ và kéo để di chuyển canvas, lăn chuột để phóng to/thu nhỏ.     |
+-----------------------------------------------------------------------------------+
```

### 5.2. Modal S-02: Form Nhập Liệu Thành Viên 1 Cấp (Không lồng Popup)
```
+--------------------------------------------------------------+
| THÊM THÀNH VIÊN MỚI (Con của Ông Phạm Văn B1)             [X] |
+--------------------------------------------------------------+
| Họ và tên (*):       [ Phạm Văn C                        ]   |
| Tên húy / Tự:        [ Trọng                             ]   |
| Giới tính:           (•) Nam     ( ) Nữ     ( ) Khác         |
| Trạng thái:          ( ) Còn sống     (•) Đã mất             |
+--------------------------------------------------------------+
| THÔNG TIN NGÀY MẤT & NGÀY GIỖ (ƯU TIÊN ÂM LỊCH):             |
| Chế độ nhập:         [•] Lịch Âm          [ ] Lịch Dương     |
| Ngày mất Âm lịch:    Ngày: [ 15 ]   Tháng: [ 08 ]  [ ] Nhuận |
| Năm Can Chi:         [ Ất Mão ▼ ] (Tùy chọn)                 |
| Năm mất Dương lịch:  [ 1975     ] (Tùy chọn ghi chú)         |
+--------------------------------------------------------------+
| Thông tin bổ sung:                                           |
| Vị trí an táng:      [ Nghĩa trang Cụm 1, Lô B           ]   |
| Ghi chú / Tiểu sử:   [ Cựu chiến binh thời kỳ chống Mỹ.. ]   |
+--------------------------------------------------------------+
|                [ Hủy Bỏ ]        [ Lưu Thành Viên ]          |
+--------------------------------------------------------------+
```

### 5.3. Màn hình S-03: Công Cụ Tra Cứu Vai Vế Xưng Hô (Kinship Resolver)
```
+-----------------------------------------------------------------------------------+
|  ← Quay lại Cây Gia Phả           CÔNG CỤ TRA CỨU VAI VẾ XƯNG HÔ                   |
+-----------------------------------------------------------------------------------+
|  Chọn Người thứ nhất (A):                 Chọn Người thứ hai (B):                 |
|  [ Tôi: Phạm Văn Nam (Đời 6)       ▼ ]    [ Bác: Phạm Văn Dực (Đời 5)        ▼ ]  |
|                                                                                   |
|                               [ ⇄ ĐỔI VAI XƯNG HÔ ]                               |
|                               [ XÁC ĐỊNH QUAN HỆ ]                                |
+-----------------------------------------------------------------------------------+
|  KẾT QUẢ XƯNG HÔ 2 CHIỀU:                                                         |
|    Chiều A gọi B: Bác Họ (Xưng Cháu)                                              |
|    Chiều B gọi A: Cháu Họ (Xưng Bác)                                              |
+-----------------------------------------------------------------------------------+
|  SƠ ĐỒ CÂY GIA PHẢ TRỰC QUAN (XUẤT PHÁT TỪ GỐC GẦN NHẤT):                         |
|                                                                                   |
|                       [TỔ TIÊN CHUNG: CỤ AN (ĐỜI 4) ]                             |
|                                 /             \                                   |
|                   (Nhánh Trưởng)               (Nhánh Thứ)                        |
|                               /                 \                                 |
|            [ Bác: Phạm Văn Dực (Đời 5) ]      [ Bố: Phạm Văn Bình (Đời 5) ]       |
|                         │                                │                        |
|                         │                     [ Bạn: Phạm Văn Nam (Đời 6) ]       |
|                         │                                │                        |
|                         └═══════[ CẦU NỐI XƯNG HÔ ]══════┘                        |
|                                                                                   |
|             [Xem vị trí 2 người trên Cây Gia Phả Tổng Thể]                        |
+-----------------------------------------------------------------------------------+
|  CĂN CỨ PHONG TỤC & ĐỐI SÁNH TƯƠNG QUAN:                                          |
|  • Nguyên tắc: Phong tục Miền Bắc (Tôn vai Nhánh Trưởng)                          |
|  • Tục ngữ: "Bé bằng củ khoai, cứ vai Bác là gọi Anh"                             |
|  • Đối sánh: Bác Dực thuộc con Cụ Cả (Nhánh Trưởng); Bố bạn thuộc con Cụ Ba.      |
+-----------------------------------------------------------------------------------+
```

### 5.4. Màn hình S-10: Quản Lý & Phân Quyền Người Dùng (Admin User Management)
```
+---------------------------------------------------------------------------------------+
|  ← Bảng Điều Khiển Admin           QUẢN LÝ TÀI KHOẢN & PHÂN QUYỀN                     |
+---------------------------------------------------------------------------------------+
|  [Tìm theo email, họ tên...]                     [Bộ lọc Quyền: Tất cả vai trò ▼]     |
+---------------------------------------------------------------------------------------+
|  Họ và tên       Email                  Node Đã Nhận     Vai Trò (Phân Quyền)         |
+---------------------------------------------------------------------------------------+
|  Giáp Phạm       giap.pt.90@gmail.com   (Chưa gắn node)  [Super Admin        ▼ ]      |
|  Nguyễn Tuấn     tuan.nguyen@gmail.com  Ông Tuấn (Đời 4) [ Trưởng Chi (Chi 2) ▼ ]     |
|  Trần Mai        mai.tran@gmail.com     Bà Mai (Đời 5)   [ Con Cháu          ▼ ]      |
|  Khách Xem       viewer.abc@gmail.com   (Chưa gắn node)  [ Khách xem (Viewer)▼ ]      |
+---------------------------------------------------------------------------------------+
|  Hướng dẫn: Super Admin chỉ cần bấm vào Dropdown Vai Trò để nâng quyền hoặc hạ         |
|  quyền tức thì cho bất kỳ thành viên nào trong dòng họ.                               |
+---------------------------------------------------------------------------------------+
```

### 5.5. Tiêu Chuẩn Phản Hồi Chuyển Màn & Trải Nghiệm Cây Gia Phả Quy Mô Lớn (1.500 Người)

#### A. Phản Hồi Chuyển Màn Toàn Diện:
- **Thanh Tiến Trình Đỉnh Trang (Top Progress Bar):** Chiều cao 3px, vệt sáng shimmer chạy ngang, đồng bộ màu theo theme token `--brand-primary`. Kích hoạt ngay trong 50ms sau khi bấm chuyển trang.
- **Phản Hồi Thị Giác Trên Navbar & Bottom Nav:** Nút/tab được bấm lập tức nảy nhẹ (scale bounce `active:scale-95`), viền phát sáng ngọc bích pulse xoay nhẹ báo hiệu hệ thống đã nhận thao tác.
- **Bộ 6 Màn Hình Loading Skeleton Chuẩn Hóa [R-UI.LOADING]:** Trang bị file `loading.tsx` chuẩn Next.js App Router cho cả 6 route (`/`, `/tree`, `/anniversaries`, `/kinship`, `/admin`, `/login-gate`), tích hợp component chuẩn hóa `SyncLoadingBadge` với spinner `Loader2` chống méo và duy nhất một thông điệp thống nhất: *"Đang tải dữ liệu..."*.

#### B. Trải Nghiệm Cây Gia Phả 1.500 Người:
- **Phân Tầng Theo Chi/Nhánh & Breadcrumbs:** Lọc nhanh từng Chi (Chi Trưởng, Chi 2...) và breadcrumb điều hướng `Gia tộc Phạm Văn > Chi 1 > Nhánh Cụ Chiến`.
- **Chế Độ Bán Kính Gia Đình 5 Đời:** Xem tập trung 5 đời quanh người được chọn ($\text{Ông bà} \rightarrow \text{Cha mẹ} \rightarrow \text{Bản thân} \rightarrow \text{Con} \rightarrow \text{Cháu}$). Các nhánh xa hơn gập gọn thành nút `[ Mở rộng 18 con cháu ]` bấm đến đâu bung đến đó.
- **Trải Nghiệm Khách & Người Chưa Liên Kết:** Mặc định hiển thị Cụ Tổ và các thế hệ khởi nguồn trang nghiêm (~15 người), các Chi đời sau gập gọn thành nút `[ Mở rộng Chi 1 ]`. Khung thông báo định danh: *"Chưa liên kết tài khoản với vị trí trong gia phả? [ Nhận Hồ Sơ Gia Tộc ] hoặc tra cứu theo danh tính người thân để định vị phả hệ 5 đời"*.
- **Cắt Tỉa Viewport (Virtualization) & LOD:** Bật `onlyRenderVisibleElements={true}` trong React Flow để DOM chỉ gánh các thẻ trong màn hình nhìn thấy, tiết kiệm 95% RAM; zoom out xa co thành thẻ mini (LOD).

### 5.6. Quy Chuẩn Thiết Kế Biên Tập Di Sản & Chống Pill Toàn Diện (Anti-Pill Editorial Standard)

Nhằm xóa bỏ hoàn toàn phong cách thiết kế nghiệp dư, đại trà kiểu "vibe coding" (bội thực viên thuốc, nhãn kẹo ngọt, emoji lộn xộn) và tôn vinh tinh thần tôn nghiêm, học thuật của một hệ thống Gia Phả Dòng Họ Việt Nam:

1. **Lệnh Cấm Lạm Dụng Viên Thuốc (`rounded-full`):**
   - **Danh sách Ngoại lệ Duy nhất (Whitelist):**
     * Avatar hình tròn: `w-X h-X rounded-full object-cover` hoặc avatar chữ cái viết tắt.
     * Đèn báo vi mô (Micro Dot Indicators): `w-1.5 h-1.5 rounded-full` (chấm xanh báo còn sống, chấm xám báo đã mất, chấm đỏ/vàng cảnh báo).
     * Nút gạt tròn (Toggle Switch Thumb) của công tắc switch bật/tắt vật lý.
   - **Cấm Tuyệt Đối:** CẤM bọc bất kỳ văn bản, nhãn phân loại (badges/tags/chips) hoặc nút bấm (buttons) nào trong class `rounded-full`.
2. **Chuẩn Phân Cấp Typography & Dấu Chấm Giữa `·`:**
   - Thay thế việc dán nhãn viên thuốc bằng việc phân cấp cỡ chữ, độ đậm (`font-bold`, `font-semibold`), màu mực (`text-slate-900`, `text-slate-500`) và dấu chấm giữa `·`.
   - Ví dụ: `Đời 11 · Ngành 1 · Chi 2` thay vì 3 viên thuốc dính chùm.
   - Số lượng đếm trong các tiêu đề/bộ lọc hiển thị thanh thoát dạng `(n)` hoặc `text-slate-400 font-mono text-xs`.
3. **Chuẩn Đèn Báo Vi Mô Trên Thẻ Cây (`MemberNode`):**
   - Xóa bỏ hoàn toàn nhãn chữ `Còn sống` / `Đã mất` ở góc trên thẻ.
   - Người còn sống: Chấm xanh lục bảo vi mô `w-1.5 h-1.5 rounded-full bg-emerald-500` (hoặc ẩn nếu đã mặc định).
   - Người đã mất: Hiển thị khoảng niên đại sinh - mất trang trọng `1920 – 1985` (hoặc `Sinh 1920 · Mất 1985`) kèm chấm xám nhạt `w-1.5 h-1.5 rounded-full bg-slate-400`.
4. **Chuẩn Nhãn Hình Học Mực Thước (`rounded-control`):**
   - Các danh vị bắt buộc (như `Cụ Tổ`, `Khuyết Danh`, `Trưởng Nam`, `Con Nuôi`, `Hôn Phối`, `GOD MODE`) sử dụng thẻ hình chữ nhật bo nhẹ 2px-4px (`rounded-control` / `rounded-sm`), viền mảnh mờ tinh tế `border border-slate-200/80 dark:border-slate-800`, font chữ `text-[10px] font-bold uppercase tracking-wider`.
5. **Chuẩn Bộ Lọc Phân Đoạn Không Icon & Xóa Sạch 100% Emoji Trên Toàn Hệ Thống:**
   - Trong các màn hình quản trị (`/admin/kinship`) và tra cứu (`/kinship`): **XÓA BỎ 100% ICON KHỎI BỘ LỌC VÀ TIÊU ĐỀ NHÓM**. Không thay thế emoji bằng các icon Lucide vô nghĩa gây hiểu sai lệch ngữ nghĩa họ hàng. Bộ lọc dùng văn bản thuần túy và số lượng `(n)` tinh gọn: `Tất Cả (36)`, `Trực Hệ (8)`, `Bên Nội (8)`... dàn phẳng phiu 1 hàng, triệt tiêu hoàn toàn thanh cuộn ngang (horizontal scrollbar).
   - Quét sạch 100% emoji rác trên toàn bộ hệ thống (`PersonalSettingsModal`, `MemberFormModal`, `ConnectGenealogyModal`, `MemberDetailDrawer`, `admin/profile`, `login-gate`...).
   - Chuyển đổi nút người dùng trên Navbar (`AuthButton`) và các thanh skeleton loading sang `rounded-control`, xóa sạch hoàn toàn các vết tích viên thuốc bọc text.



