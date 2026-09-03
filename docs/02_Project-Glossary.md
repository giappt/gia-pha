# BẢNG CHỈ MỤC TỪ VỰNG DỰ ÁN (UBIQUITOUS LANGUAGE)

_Dự án: FAT (Family Tree - Hệ Thống Quản Lý Gia Phả Dòng Họ)_

> **LỆNH DÀNH CHO AI (CHUYÊN GIA DỮ LIỆU):** Tài liệu này CHỈ chứa danh sách các thuật ngữ CHUẨN MỰC, KHÔNG chứa cấu trúc Database (Schema). Khi sinh code, đặt tên biến, hoặc viết tài liệu, BẮT BUỘC phải sử dụng từ khóa trong cột "Thuật ngữ Chuẩn". Tuyệt đối không dùng các từ trong cột "Cấm/Tránh dùng". Hãy chốt tên gọi thống nhất cho Thực thể, Trạng thái và Hành động.

---

## 1. THỰC THỂ CỐT LÕI (CORE ENTITIES)

| **Thuật ngữ Chuẩn (Standard)** | **Ý nghĩa / Định nghĩa** | **Các từ Cấm/Tránh dùng** |
|---|---|---|
| **User** | Tài khoản người dùng đã đăng ký/đăng nhập qua Google OAuth | Account, Client, Customer, Profile |
| **Member** | Một cá nhân/thành viên cụ thể trong phả hệ dòng họ (1 thực thể duy nhất trong CSDL) | Person, Individual, People, Human, NodeRecord |
| **GhostNode** | Node phản chiếu trên giao diện hiển thị tại vị trí phối ngẫu của cuộc hôn nhân nội tộc (có ký hiệu 🔗), trỏ về Member gốc | ShadowNode, VirtualNode, ProxyMember, CloneNode, DummyNode |
| **ParentChildRelation** | Quan hệ huyết thống trực tiếp giữa cha/mẹ và con ruột | ParentLink, LineageLink, BloodRelation, ChildEdge |
| **SpouseRelation** | Quan hệ hôn nhân hợp pháp hoặc phong tục giữa hai thành viên | Marriage, Wedding, Partner, CoupleLink |
| **ClanBranch** | Nhánh hoặc Chi phái trong dòng họ (Được định nghĩa trong Master Data `clan_settings.branches`, suy luận tự động qua đồ thị cây con từ cụ đầu chi) | Subtree, Fork, Sect, Department |
| **ClaimRequest** | Phiếu yêu cầu của một User để xin liên kết tài khoản của mình với một Member Node trên cây | LinkRequest, NodeClaim, BindRequest, UserLink |
| **PushSubscription** | Thông tin đăng ký thiết bị nhận thông báo đẩy Web Push API theo chuẩn VAPID | DeviceToken, PushToken, NotiSub, WebPushRegistration |
| **KinshipRule** | Quy tắc ánh xạ logic quan hệ huyết thống đồ thị sang danh xưng xưng hô vùng miền | AddressRule, TitleMap, CallDict, KinshipMapping |
| **DeathAnniversary** | Sự kiện ngày giỗ của thành viên đã mất, mặc định tính theo Âm lịch Việt Nam | DeathDate, DeathMemorial, GioEvent, AnniversaryDate |

---

## 2. TRẠNG THÁI VÀ VÒNG ĐỜI (STATES & LIFECYCLES)

### 2.1. Trạng thái Sống/Mất của Thành viên (`life_status`):
- `living`: Thành viên còn sống. Thông tin nhạy cảm được bảo vệ bởi Living Person Privacy Guard.
- `deceased`: Thành viên đã qua đời. Bắt buộc có ngày mất (Âm lịch hoặc Dương lịch) để tính ngày giỗ.

### 2.2. Trạng thái Phiếu Yêu Cầu Nhận Node (`claim_status`):
- `pending`: Phiếu yêu cầu vừa được User gửi lên, đang nằm trong hàng đợi chờ Quản trị viên duyệt.
- `approved`: Phiếu đã được phê duyệt, `userId` chính thức được liên kết với `memberId`.
- `rejected`: Phiếu bị từ chối do không đúng người hoặc sai thông tin xác minh.

### 2.3. Vai trò và Phân quyền Người Dùng (`user_role`):
- `viewer`: Khách vãng lai hoặc thành viên chưa đăng nhập / chưa liên kết node (Chỉ xem cây, tra cứu vai vế, xem lịch giỗ công khai).
- `claimed_member`: Thành viên dòng họ đã liên kết tài khoản với Node (Được xem thông tin chi tiết nội bộ, nhận push thông báo ngày giỗ nhánh mình, gửi góp ý chỉnh sửa).
- `branch_editor`: Quản trị viên Chi/Nhánh (Có quyền thêm, sửa, xóa con cháu thuộc phạm vi chi nhánh được ủy quyền).
- `super_admin`: Quản trị viên tối cao (Toàn quyền quản lý cây gia phả, duyệt ClaimRequest, cấu hình từ điển xưng hô dòng họ, phân quyền Editor).

---

## 3. THAO TÁC / HÀNH ĐỘNG (ACTIONS / EVENTS)

| **Tên Hành Động (Action)** | **Mô tả (Description)** | **Từ khóa Cấm dùng** |
|---|---|---|
| **ClaimMemberNode** | User gửi yêu cầu xin gắn tài khoản của mình vào một Member cụ thể trên cây | LinkNode, BindMember, AttachProfile, ConnectMe |
| **ApproveClaimRequest** | Quản trị viên chấp thuận yêu cầu liên kết của User | AcceptClaim, ConfirmLink, GrantNode, VerifyClaim |
| **RejectClaimRequest** | Quản trị viên từ chối yêu cầu liên kết của User | DenyClaim, DeclineLink, CancelRequest |
| **CalculateKinship** | Thuật toán xác định quan hệ phả hệ và cách xưng hô 2 chiều giữa 2 Member bất kỳ | FindRelation, GetTitle, SolveKinship, CheckAddress |
| **FindLowestCommonAncestor (FindLCA)** | Thuật toán đồ thị tìm cụ tổ chung gần nhất giữa 2 nhánh thành viên | GetCommonRoot, FindAncestor, SearchLCA, TraceRoot |
| **BulkImportMembers** | Quá trình tải lên file Excel/CSV, validate tính toàn vẹn và nạp hàng loạt thành viên | UploadExcel, ImportData, BatchInsert, ReadSpreadsheet |
| **SendDeathAnniversaryPush** | Tiến trình Vercel Cron quét và gửi Web Push thông báo ngày giỗ đến con cháu trực hệ | NotifyGio, AlertDeath, BroadcastAnniversary, PingMemorial |
| **ToggleLineageFilter** | Chuyển đổi qua lại giữa chế độ chỉ xem Nhánh Nội (Patrilineal) và Toàn bộ Nội - Ngoại | SwitchLineage, FilterTree, ToggleFamily, ChangeView |

---

## 4. QUY ƯỚC ĐẶT TÊN BIẾN ID (ID CONVENTIONS)

- **ID Người dùng hiện tại trong Session:** Luôn dùng `currentUserId` (Tuyệt đối CẤM: `myId`, `loginId`, `selfId`).
- **ID Thành viên Gia phả:** Luôn dùng `memberId` (Tuyệt đối CẤM: `personId`, `nodeId`, `individualId`).
- **ID Người Bố (Father):** Luôn dùng `fatherId` (Tuyệt đối CẤM: `dadId`, `parentFatherId`, `baId`).
- **ID Người Mẹ (Mother):** Luôn dùng `motherId` (Tuyệt đối CẤM: `momId`, `parentMotherId`, `meId`).
- **ID Người Phối ngẫu (Spouse):** Luôn dùng `spouseId` (Tuyệt đối CẤM: `partnerId`, `wifeId`, `husbandId`).
- **ID Cụ Tổ / Gốc Nhánh (Tree Root):** Luôn dùng `rootMemberId` (Tuyệt đối CẤM: `startNodeId`, `treeRootId`, `ancestorId`).
- **Mã Nhánh Chi Tộc:** Luôn dùng `branchCode` (Tuyệt đối CẤM: `subTreeId`, `chiId`, `branchId`).

---

## 5. QUY TẮC NGHIỆP VỤ (BUSINESS RULES / CORE LOGIC)

- **Quy tắc 1 (Chính sách Thực thể Duy nhất - Single Entity Policy):**
  Mỗi con người thực tế tuyệt đối chỉ có DUY NHẤT 1 bản ghi `memberId` trong CSDL. Khi xảy ra hôn nhân nội tộc, bắt buộc tạo `SpouseRelation` giữa 2 `memberId` có sẵn; CẤM TUYỆT ĐỐI việc tạo thêm một Member trùng lặp để phục vụ việc vẽ cây.
- **Quy tắc 2 (Bản chất Bất biến của Ghost Node):**
  `GhostNode` chỉ là một thực thể hình ảnh trên Frontend (UI Projection). Nó KHÔNG được lưu thành bảng riêng trong CSDL mà chỉ là một cờ đánh dấu (`isGhost: true, referenceMemberId: memberId`) khi Backend serialize dữ liệu đồ thị sang định dạng hiển thị.
- **Quy tắc 3 (Giới hạn Độ sâu Form 1 Cấp):**
  Mọi thao tác tạo mới thành viên qua nút bấm (+) trên giao diện chỉ được phép mở Modal Form ở độ sâu đúng 1 cấp (One-level deep). CẤM TUYỆT ĐỐI hành vi mở Popup lồng trong Popup (Nested Modals).
- **Quy tắc 4 (Ưu tiên Lịch Âm cho Ngày Giỗ):**
  Mặc định các trường `death_lunar_day` và `death_lunar_month` là căn cứ tối thượng để tính ngày giỗ hằng năm. Thuật toán quy đổi Âm - Dương bắt buộc cố định theo múi giờ Việt Nam (UTC+7).
- **Quy tắc 5 (Lá chắn Quyền riêng tư - Privacy Guard):**
  Đối với người dùng có vai trò `viewer`, API tuyệt đối KHÔNG trả về các trường thông tin cá nhân nhạy cảm (`phone`, `address`, `notes`, `exact_birth_date`) nếu bản ghi thành viên đó có `life_status = 'living'`.
