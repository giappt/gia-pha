# THIẾT KẾ GIAO DIỆN & LUỒNG (UI/UX FLOW & SCREEN MAP)

_Dự án: FAT (Family Tree - Hệ Thống Quản Lý Gia Phả Dòng Họ)_

> **Lệnh dành cho AI (UX/Product Designer):** Tài liệu này thiết kế Ở MỨC BẢN VẼ, KHÔNG sinh code. Mọi nhãn/đối tượng phải dùng đúng "Thuật ngữ Chuẩn" trong `docs/02_Project-Glossary.md`. Mỗi màn hình phải gắn với Vai trò được phép truy cập (theo `docs/01_Architecture-Blueprint.md`).

---

## 1. KIỂM KÊ MÀN HÌNH (SCREEN INVENTORY)

| **Mã** | **Tên màn hình** | **Mục đích** | **Vai trò được truy cập** |
|---|---|---|---|
| **S-01** | Cây Phả Hệ Tương Tác (Family Tree View) | Màn hình chính xem cây gia phả, pan/zoom, spotlight tìm kiếm, lọc Chi nhánh và toggle Nội/Ngoại | Tất cả (`viewer`, `claimed_member`, `branch_editor`, `super_admin`) |
| **S-02** | Thẻ Chi Tiết & Modal Form 1 Cấp (Member Modal) | Xem thông tin cá nhân, tiểu sử, ngày giỗ, mộ phần; mở popup thêm vợ/chồng hoặc con trực tiếp 1 cấp | Xem: Tất cả; Sửa/Thêm: `branch_editor`, `super_admin` |
| **S-03** | Tra Cứu Vai Vế Xưng Hô (Kinship Resolver View) | Chọn 2 người để hệ thống tự động suy luận vai vế xưng hô 2 chiều kèm sơ đồ huyết thống | Tất cả (`viewer`, `claimed_member`, `branch_editor`, `super_admin`) |
| **S-04** | Lịch Giỗ 30 Ngày & Đăng Ký Push (Anniversaries View) | Xem danh sách các ngày giỗ sắp tới xếp theo âm lịch; nút bấm kích hoạt nhận Web Push Notification | Tất cả (`viewer`, `claimed_member`, `branch_editor`, `super_admin`) |
| **S-05** | Đăng Nhập & Phiếu Nhận Node (Auth & Claim Profile) | Đăng nhập Google OAuth và gửi phiếu xác nhận "Đây là tôi trên cây phả hệ" | Chưa đăng nhập (`viewer`) |
| **S-06** | Hàng Đợi Duyệt Claim (Claim Review Queue) | Xem danh sách phiếu xin nhận node, đối soát thông tin và bấm Duyệt / Từ chối | `super_admin` |
| **S-07** | Cài Đặt Dòng Họ & Master Data Chi Tộc (Clan Settings) | Đổi tên họ, chỉnh sửa danh mục Chi nhánh (Master Data), cấu hình từ điển xưng hô vùng miền | `super_admin` |
| **S-08** | Nhập Liệu Hàng Loạt (Bulk Excel Import) | Tải template mẫu, tải lên file Excel dữ liệu gia phả, xem trước kiểm tra lỗi logic và nạp hàng loạt | `super_admin` |
| **S-09** | Khay Thành Viên Chưa Nối Phả (Unlinked Members Shelf) | Quản lý danh sách các thành viên độc lập chưa rõ bố mẹ, hỗ trợ lọc tách biệt để không làm rối cây chính | Xem: Tất cả; Sửa: `branch_editor`, `super_admin` |
| **S-10** | Quản Lý & Phân Quyền Người Dùng (User Management & Roles) | Xem danh sách toàn bộ tài khoản Google đã đăng nhập, thay đổi cấp quyền (Role) và phân công Chi nhánh | `super_admin` |

---

## 2. LUỒNG ĐIỀU HƯỚNG (NAVIGATION FLOW)

```mermaid
flowchart TD
    S01["S-01: Cây Phả Hệ (Trang Chủ)"]
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

- **Luồng A — Khám phá Cây & Nhảy Ghost Node:** `S-01` $\rightarrow$ Click Node Chị A mở `S-02` $\rightarrow$ Thấy Ghost Node Anh B (🔗) $\rightarrow$ Click "Xem nhánh gốc" $\rightarrow$ Camera trên `S-01` tự động lướt mượt mà sang vị trí gốc của Anh B ở Chi 2.
- **Luồng B — Xác định Vai vế Xưng hô:** `S-01` $\rightarrow$ Chọn menu "Hỏi xưng hô" $\rightarrow$ Chuyển `S-03` $\rightarrow$ Chọn Người 1 (Tôi), Chọn Người 2 (Ông C) $\rightarrow$ Bấm "Xác định vai vế" $\rightarrow$ Hiển thị kết quả 2 chiều kèm chuỗi breadcrumbs huyết thống $\rightarrow$ Bấm "Xem trên cây" nhảy về `S-01`.
- **Luồng C — Đăng ký Nhận Node & Duyệt:** `S-01` $\rightarrow$ Bấm "Tôi là ai trên cây?" $\rightarrow$ Chuyển `S-05` $\rightarrow$ Đăng nhập Google $\rightarrow$ Chọn Node mình $\rightarrow$ Nhập ghi chú xác thực $\rightarrow$ Gửi $\rightarrow$ Super Admin nhận thông báo trên `S-06` $\rightarrow$ Bấm Duyệt (Approve) $\rightarrow$ Tài khoản của User kích hoạt quyền `claimed_member`.
- **Luồng D — Nhập liệu Excel Nhanh:** Admin vào `S-07` $\rightarrow$ Chuyển sang `S-08` $\rightarrow$ Tải template Excel $\rightarrow$ Kéo thả file đã điền lên $\rightarrow$ Xem bảng preview phát hiện lỗi $\rightarrow$ Bấm "Xác nhận Nhập dữ liệu" $\rightarrow$ Hệ thống sinh 1.000 node $\rightarrow$ Chuyển về `S-01` xem kết quả toàn cảnh.
- **Luồng E — Quản lý Node Độc lập & Nối cây tự nhiên:**
  - *Tạo độc lập:* Người nhập thêm thành viên mới nhưng để trống Bố/Mẹ. Thành viên được lưu an toàn vào DB mà không bắt buộc có liên kết.
  - *Lọc chống rối mắt:* Mặc định cây chính `S-01` chỉ hiển thị các nhánh nối từ Cụ Tổ. Ở thanh công cụ có nút filter: `[📦 Chưa nối phả (X)]`. Bấm vào sẽ mở `S-09` để xem danh sách riêng.
  - *Nối cây tự nhiên:* Người dùng click vào người chưa nối phả $\rightarrow$ Mở Modal `S-02` $\rightarrow$ Chỉ cần chọn trường **Bố** hoặc **Mẹ** (hoặc chọn Vợ/Chồng) $\rightarrow$ Bấm **Lưu** $\rightarrow$ Hệ thống tự động gắn vào cây phả hệ chính và biến mất khỏi danh sách chưa nối mà không cần thao tác phức tạp!

---

## 3. TRẠNG THÁI MÀN HÌNH (SCREEN STATES)

### 3.1. Màn hình S-01: Cây Phả Hệ Tương Tác
- **Loading:** Hiển thị khung Skeleton đồ thị dạng cây mờ kèm thanh tiến trình tải nhẹ nhàng.
- **Empty:** Trường hợp dòng họ mới tinh chưa có ai $\rightarrow$ Hiện Banner trang trọng: *"Dòng họ chưa có dữ liệu. Vui lòng bấm vào đây để khởi tạo Cụ Tổ đầu tiên hoặc tải lên file Excel"*.
- **Success/Default:** 
  - Khung Canvas đồ thị hiển thị các Node thế hệ 1, 2, 3.
  - Các nhánh con có nút dấu `+` để bung tiếp các đời sau.
  - Thanh công cụ phía trên: Thanh tìm kiếm gõ tên (Spotlight Search), Dropdown chọn Chi nhánh, Nút Toggle xem Nhánh Nội / Toàn bộ Nội - Ngoại, Cụm nút Zoom In / Zoom Out / Reset View.
- **Spotlight Active:** Khi gõ tìm tên người $\rightarrow$ Màn hình tự làm mờ các node xung quanh, làm sáng (highlight) node được chọn và camera zoom cận cảnh vào người đó.

### 3.2. Màn hình S-03: Tra Cứu Vai Vế (Kinship Resolver)
- **Empty:** Hai ô nhập người trống kèm hình minh họa ấm cúng: *"Chọn 2 thành viên bất kỳ để biết cách xưng hô chuẩn mực theo phong tục dòng họ"*.
- **Calculating:** Hiệu ứng vẽ đường đi huyết thống kết nối giữa 2 người (100ms).
- **Success:**
  - Khối kết quả nổi bật 2 chiều: 
    - Chiều đi: **`A gọi B là: Bác họ (Xưng Cháu)`**
    - Chiều về: **`B gọi A là: Cháu họ (Xưng Bác)`**
  - **Sơ đồ Cây Phả Hệ Mini Chữ V Ngược (Inverted-V Kinship Tree):** 
    - Đỉnh chóp là Tổ tiên chung gần nhất (LCA), rẽ xuống 2 cột nhánh (Nhánh Trưởng vs Nhánh Thứ).
    - Có cơ chế **Nén Tầng Trung Gian (Smart Folding)** khi khoảng cách $\ge 4$ đời (nén các đời giữa thành nút bấm `[🔽 Nén N thế hệ - Bấm mở rộng]`).
    - Nút liên kết: `[🔍 Xem trên Cây Phả Hệ Lớn]` lướt camera trên `S-01` focus vào 2 node.
  - **Thẻ Diễn Giải Phong Tục Cấu Trúc Hóa:**
    - Huy hiệu nguyên tắc dòng họ (`Phong tục Miền Bắc: Tôn vai Nhánh Trưởng`).
    - Câu đối / tục ngữ cổ phong (`"Bé bằng củ khoai, cứ vai Bác là gọi Anh"`).
    - Bảng đối sánh tương quan trực diện giữa 2 người.
- **No Relation (Không chung gốc):** Thông báo lịch sự: *"Hai người này không cùng huyết thống nội tộc trong cây gia phả (Dâu/Rể ngoại tộc hoặc thành viên chưa nối phả)"*.

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

### 5.1. Màn hình S-01: Giao diện Cây Phả Hệ (Trang Chủ)
```
+-----------------------------------------------------------------------------------+
|  [FAT LOGO] DÒNG HỌ NGUYỄN VĂN    [🔍 Tìm tên thành viên...]    [Lịch Giỗ]  [Tôi là ai?]  |
+-----------------------------------------------------------------------------------+
|  [Bộ lọc Chi: Tất cả Chi ▼]  [Toggle: Nhánh Nội | Nội-Ngoại]      [+] [-] [Reset View]   |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                               +-------------------------+                         |
|                               |  👨 Cụ Tổ Nguyễn Văn A  |                         |
|                               |  † 1890 - 1965 (75T)    |                         |
|                               |  [Chi: Ngành Cả]    [+] |                         |
|                               +------------+------------+                         |
|                                            |                                      |
|                     +----------------------+----------------------+               |
|                     |                                             |               |
|         +-----------+-----------+                     +-----------+-----------+   |
|         |  👨 Ông Nguyễn Văn B1 |                     |  👨 Ông Nguyễn Văn B2 |   |
|         |  Chi Trưởng           |                     |  Chi Hai              |   |
|         |  [+] [Bung con 3]     |                     |  [+] [Bung con 2]     |   |
|         +-----------+-----------+                     +-----------+-----------+   |
|                     |                                             |               |
|            (Nhánh con cháu...)                           (Nhánh con cháu...)      |
|                                                                                   |
+-----------------------------------------------------------------------------------+
| 💡 Mẹo: Bấm giữ và kéo để di chuyển cây, lăn chuột để phóng to/thu nhỏ.            |
+-----------------------------------------------------------------------------------+
```

### 5.2. Modal S-02: Form Nhập Liệu Thành Viên 1 Cấp (Không lồng Popup)
```
+--------------------------------------------------------------+
| THÊM THÀNH VIÊN MỚI (Con của Ông Nguyễn Văn B1)           [X] |
+--------------------------------------------------------------+
| Họ và tên (*):       [ Nguyễn Văn C                      ]   |
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
|  ← Quay lại Cây phả hệ           CÔNG CỤ TRA CỨU VAI VẾ XƯNG HÔ                   |
+-----------------------------------------------------------------------------------+
|  Chọn Người thứ nhất (A):                 Chọn Người thứ hai (B):                 |
|  [ 🔍 Tôi: Nguyễn Văn Nam (Đời 6)  ▼ ]    [ 🔍 Bác: Nguyễn Văn Dực (Đời 5)   ▼ ]  |
|                                                                                   |
|                               [ ⇄ ĐỔI VAI XƯNG HÔ ]                               |
|                               [ XÁC ĐỊNH VAI VẾ ]                                 |
+-----------------------------------------------------------------------------------+
|  KẾT QUẢ XƯNG HÔ 2 CHIỀU:                                                         |
|    👉 Bạn gọi Bác Dực là:  👑 BÁC HỌ (Xưng Cháu)                                  |
|    👈 Bác Dực gọi bạn là:  🌱 CHÁU HỌ (Xưng Bác)                                  |
+-----------------------------------------------------------------------------------+
|  SƠ ĐỒ CÂY PHẢ HỆ MINI (INVERTED-V KINSHIP TREE - XUẤT PHÁT TỪ LCA):              |
|                                                                                   |
|                       [ 👑 TỔ TIÊN CHUNG: CỤ AN (ĐỜI 4) ]                         |
|                                 /             \                                   |
|                   (Nhánh Trưởng)               (Nhánh Thứ)                        |
|                               /                 \                                 |
|            [ Bác: Nguyễn Văn Dực (Đời 5) ]    [ Bố: Nguyễn Văn Bình (Đời 5) ]     |
|                         │                                │                        |
|                         │                     [ Bạn: Nguyễn Văn Nam (Đời 6) ]     |
|                         │                                │                        |
|                         └═══════[ CẦU NỐI XƯNG HÔ ]══════┘                        |
|                                                                                   |
|             [🔍 Xem vị trí 2 người trên Cây Phả Hệ Tổng Thể]                      |
+-----------------------------------------------------------------------------------+
|  📜 CĂN CỨ PHONG TỤC & ĐỐI SÁNH TƯƠNG QUAN:                                       |
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
|  [🔍 Tìm theo email, họ tên...]                 [Bộ lọc Quyền: Tất cả vai trò ▼]     |
+---------------------------------------------------------------------------------------+
|  Họ và tên       Email                  Node Đã Nhận     Vai Trò (Phân Quyền)         |
+---------------------------------------------------------------------------------------+
|  👨 Giáp Phạm     giap.pt.90@gmail.com   (Chưa gắn node)  [ 👑 Super Admin        ▼ ]  |
|  👨 Nguyễn Tuấn   tuan.nguyen@gmail.com  Ông Tuấn (Đời 4) [ 📝 Trưởng Chi (Chi 2) ▼ ]  |
|  👩 Trần Mai      mai.tran@gmail.com     Bà Mai (Đời 5)   [ 👤 Con cháu họ        ▼ ]  |
|  👤 Khách Xem     viewer.abc@gmail.com   (Chưa gắn node)  [ 👁️ Khách xem (Viewer) ▼ ]  |
+---------------------------------------------------------------------------------------+
|  💡 Hướng dẫn: Super Admin chỉ cần bấm vào Dropdown Vai Trò để nâng quyền hoặc hạ     |
|  quyền tức thì cho bất kỳ thành viên nào trong dòng họ.                                |
+---------------------------------------------------------------------------------------+
```

