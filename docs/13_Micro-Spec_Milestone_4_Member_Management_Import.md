# ĐẶC TẢ KỸ THUẬT VI MÔ: MILESTONE 4 - QUẢN LÝ THÀNH VIÊN ĐA TẦNG, KHAY CHƯA NỐI, BULK EXCEL IMPORT & HÔN NHÂN NỘI TỘC

_Tài liệu này dùng để giới hạn Context Window. AI chỉ được phép đọc, suy luận và sinh code cho ĐÚNG các file được đề cập trong đây._

---

## 1. QUY TẮC NGHIÊM NGẶT (STRICT CONSTRAINTS)

- **Thư viện cho phép:** Next.js 14 App Router, React 18, TypeScript, TailwindCSS, Lucide Icons (`lucide-react`), `@xyflow/react`, `xlsx` (SheetJS) phục vụ đọc/ghi file Excel `.xlsx`.
- **Ràng buộc Kiến trúc Nghiệp vụ Gia Phả:**
  - **Single Record & Ghost Node Policy (`[R-SPEC]`):** Tuyệt đối không nhân bản bản ghi thành viên trong CSDL khi có hôn nhân nội tộc. Mỗi cá nhân chỉ có 1 ID duy nhất trong bảng `members`. Ghost Node 🔗 chỉ được sinh ra tại tầng trình diễn đồ thị (Presentation/Layout Layer) tại nhánh phối ngẫu.
  - **Lịch Giỗ Ưu Tiên Âm Lịch:** Các trường `death_lunar_day`, `death_lunar_month`, `death_lunar_is_leap`, `death_lunar_year_name` là dữ liệu công dân hạng nhất. Không bắt buộc phải có ngày/năm mất Dương lịch.
  - **Safe Delete Policy (Chính sách Xóa An toàn RESTRICT):** CẤM xóa cứng thành viên đang có con cháu (`childrenCount > 0`). Chỉ cho phép xóa trực tiếp Node Lá (không có con).
  - **Cycle Prevention (Chặn Chu trình Đồ thị):** CẤM gán cha/mẹ là chính mình hoặc con cháu của chính mình (`validateNoCycle`).
  - **Unlinked Definition (Khay Chưa Nối):** Tuyệt đối không nhốt nhầm Dâu/Rể ngoại tộc vào khay thành viên chưa nối. Dâu/Rể đã có liên kết qua `spouse_relations` với một thành viên đã nối trong cây thì được coi là đã nối phả.
  - **Database Persistence & Admin Client Contract:** Mọi server route mutation (`POST`, `PUT`, `DELETE` tại `/api/members`, `/api/spouse-relations`, `/api/admin/import`) bắt buộc phải sử dụng Supabase Admin Client (`SUPABASE_SERVICE_ROLE_KEY`) để ghi dữ liệu thực tế vào database, vượt qua rào cản RLS (Row Level Security). Tuyệt đối CẤM nuốt lỗi DB trong khối `try/catch` để giả lập offline thành công ảo.
  - **React Flow Node Dimension Contract:** Toàn bộ các object Node (`memberNode`, `ghostNode`) do `calculateTreeLayout` sinh ra bắt buộc phải khai báo tường minh kích thước `width: 200, height: 96` trực tiếp trên Node object để tránh hiện tượng React Flow đánh giá sai viewport và chặn render (màn hình đen rỗng).
  - **Internal Spouse Linking Contract (Không Nhân Bản Khi Ghép Nội Tộc):** Khi thêm phối ngẫu với tùy chọn `🔗 Dâu/Rể nội tộc` (`spouseOrigin === 'internal'`), hệ thống tuyệt đối KHÔNG ĐƯỢC gọi API tạo thành viên mới (`POST /api/members`). Chỉ được gọi API liên kết hôn phối (`POST /api/spouse-relations`) với ID của thành viên nội tộc đã chọn. Đảm bảo bảo toàn nguyên tắc duy nhất một bản ghi cá nhân trong dòng họ.
  - **Drawer Safe Delete Action Contract (Xóa Trực Tiếp Trên Cây Phả Hệ):** Cung cấp hành động `[🗑️ Xóa hồ sơ]` trực tiếp trên `MemberDetailDrawer` tuân thủ nghiêm ngặt chính sách Safe Delete RESTRICT. Node lá (không có con) được phép xóa sau hộp thoại xác nhận; Node đang có con cái bị vô hiệu hóa nút xóa kèm giải thích nguyên do.
  - **Import API Fail-Fast Contract (Cấm Nuốt Lỗi Database):** API `/api/admin/import` khi khởi tạo được `createAdminClient()` mà gặp lỗi thực thi câu lệnh SQL/Insert từ Supabase bắt buộc phải ném lỗi ngay (fail-fast) và trả về HTTP 500 kèm chi tiết lỗi, tuyệt đối CẤM nuốt lỗi trong khối `catch` để giả lập thành công ảo.
- **Ràng buộc UX / UI (Refined Modern Heritage Design System):**
  - **Popup 1 Cấp (S-02):** Tuyệt đối không lồng popup đè lên popup. Tìm kiếm cha mẹ, phối ngẫu bằng Combobox/Autocomplete ngay trong form.
  - **Crisp Architectural Geometry (Chống Bo Tròn Đại Trà):** Chuyển toàn bộ khung modal, ô nhập liệu, bảng biểu, thẻ thống kê (kể cả trên trang `/admin/import`) và các nút bấm sang chuẩn bo góc hình học thanh lịch `rounded-lg` (8px) hoặc `rounded-md` (6px). Tuyệt đối triệt tiêu các góc cong bong bóng hoạt hình `rounded-2xl`, `rounded-3xl`, `rounded-full` (chỉ giữ avatar tròn).
  - **Editorial Typography & Quiet Luxury Palette:** Sử dụng micro-headers chữ in hoa thanh mảnh (`text-[11px] font-bold tracking-widest text-slate-400 uppercase`) kết hợp đường kẻ Hairline 1px; loại bỏ các icon màu sắc sặc sỡ ở đầu tiêu đề phân khu; bảng màu trung tính trang trọng, nhã nhặn.
  - **Đồng Nhất Giới Tính 3 Tùy Chọn:** Toàn bộ form và cụm thêm nhanh con cái bắt buộc hỗ trợ đủ 3 giới tính: `[ ♂ Nam ]`, `[ ♀ Nữ ]`, `[ ⚪ Khác ]`.
  - **Total Ban on AI Browser Subagent (`[R-NO-BROWSER]`):** Mọi kiểm thử giao diện thuộc về User ở Mục 7.2 (Human UAT).
  - **Smooth Camera Tracking:** Khi thêm/sửa/nối phả, camera React Flow tự động lướt nhẹ nhàng (`setCenter`) tới vị trí node mục tiêu mà không giật màn hình hay reset về toạ độ gốc.
- **Ràng buộc Kiểm chứng (`[R-VERIFY]`):** Giữ nguyên toàn bộ tests hiện có pass 100%, bổ sung tests tự động mới cho validation đồ thị, node dimensions, safe delete trên drawer, internal spouse submit và admin import API trong thư mục `tests/`.

---

## 2. DATABASE & MODELS

### 2.1. File: `src/types/database.ts` & `src/types/tree.ts`
Mở rộng types phục vụ cho Form Thành viên, Quản lý Chưa Nối và Bulk Excel Import:

```typescript
// DTO phục vụ Form Nhập liệu Thành viên 1 Cấp
export interface MemberFormData {
  id?: string;
  full_name: string;
  alias_name?: string | null;
  gender: 'male' | 'female' | 'other';
  life_status: 'living' | 'deceased';
  father_id?: string | null;
  mother_id?: string | null;
  birth_year?: number | null;
  birth_date?: string | null;
  death_lunar_day?: number | null;
  death_lunar_month?: number | null;
  death_lunar_is_leap?: boolean;
  death_lunar_year_name?: string | null;
  death_year?: number | null;
  death_date?: string | null;
  birth_order?: number | null;
  is_senior?: boolean;
  is_adopted?: boolean;
  is_root?: boolean;
  burial_location?: string | null;
  notes?: string | null;
  // Trường liên kết phối ngẫu nhanh khi tạo mới
  spouse_id?: string | null;
  marriage_order?: number;
  marriage_status?: 'married' | 'divorced' | 'widowed' | 'remarried';
  // 🌟 BỔ SUNG (Brainstorm Tái giá / Lấy vợ): Tình trạng hôn nhân đặc biệt
  marital_status?: 'remarried' | 'divorced' | null;
  marital_event_year?: number | null;
  // 🌟 BỔ SUNG (UAT Brainstorm): Tạo phối ngẫu mới ngoài tộc tại chỗ (Inline Spouse Creation)
  new_spouse_name?: string | null;
  new_spouse_birth_year?: number | null;
  new_spouse_gender?: 'male' | 'female' | 'other';
  new_spouse_is_deceased?: boolean;
  // 🌟 BỔ SUNG (UAT Brainstorm): Danh sách con cái gán nối nhanh vào thành viên này
  child_ids_to_link?: string[];
}

// Cấu trúc một dòng dữ liệu đọc từ Excel (S-08)
export interface ExcelMemberRow {
  rowNumber: number;
  stt: number | string;
  fullName: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  lifeStatus: 'Còn sống' | 'Đã mất';
  fatherStt?: number | string | null;
  motherStt?: number | string | null;
  spouseStt?: number | string | null;
  birthYear?: number | null;
  deathLunarDay?: number | null;
  deathLunarMonth?: number | null;
  deathLunarIsLeap?: boolean;
  deathLunarYearName?: string | null;
  deathYear?: number | null;
  birthOrder?: number | null;
  isSenior?: boolean;
  isAdopted?: boolean;
  isRoot?: boolean;
  burialLocation?: string | null;
  notes?: string | null;
  // Trạng thái kiểm tra sau khi parse
  validationErrors: string[];
  validationWarnings: string[];
  isValid: boolean;
}

// Kết quả kiểm tra dữ liệu Excel toàn thể
export interface ExcelParseResult {
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  warningRowsCount: number;
  rows: ExcelMemberRow[];
  canImport: boolean;
}
```

---

## 3. SƠ ĐỒ LUỒNG LOGIC (SEQUENCE DIAGRAM - MERMAID)

### 3.1. Luồng Thêm/Sửa Thành Viên 1 Cấp & Phát Hiện Hôn Nhân Nội Tộc (S-02)

```mermaid
sequenceDiagram
    participant U as User (Admin / Member)
    participant M as MemberFormModal (S-02)
    participant V as GraphValidationLib (Client/Server)
    participant A as API (/api/members)
    participant DB as Supabase DB
    participant C as FamilyTreeCanvas

    U->>M: Mở modal thêm con / sửa hồ sơ
    M->>U: Hiển thị form (Ưu tiên lịch âm, chọn Mẹ từ danh sách vợ của Bố)
    U->>M: Chọn Phối ngẫu hoặc gán Cha/Mẹ
    M->>V: Kiểm tra chu trình (validateNoCycle) & Hôn nhân nội tộc (LCA)
    alt Phát hiện chu trình (Con làm cha mẹ)
        V-->>M: Lỗi: "Không thể gán con cháu làm cha mẹ!"
        M-->>U: Hiển thị cảnh báo đỏ, chặn lưu
    else Phát hiện Hôn nhân nội tộc
        V-->>M: Cảnh báo: "Hai người chung Cụ tổ X. Sẽ tự động gán Ghost Node 🔗"
        M-->>U: Hiển thị badge vàng Hôn nhân nội tộc thân thiện
    end
    U->>M: Bấm "Lưu thành viên"
    M->>A: POST / PUT /api/members (DTO)
    A->>DB: Ghi bản ghi duy nhất vào bảng members & spouse_relations
    DB-->>A: Bản ghi mới (với UUID)
    A-->>M: 200 OK + Updated Record
    M->>C: Callback onMemberMutated(updatedRecord)
    C->>C: Cập nhật optimistic state + calculateTreeLayout
    C->>U: Pan camera nhẹ nhàng tới vị trí node mới (setCenter)
```

### 3.2. Luồng Nối Phả Từ Khay Chưa Nối (`UnlinkedMembersDrawer`)

```mermaid
sequenceDiagram
    participant U as User
    participant D as UnlinkedMembersDrawer
    participant V as GraphValidationLib
    participant A as API (/api/members/[id]/relink)
    participant DB as Supabase DB
    participant C as FamilyTreeCanvas

    U->>D: Mở khay chưa nối (Badge trên Toolbar)
    D->>D: Lọc danh sách unlinked (loại trừ Dâu/Rể ngoại tộc)
    U->>D: Chọn thành viên X -> Bấm "Nối vào cây"
    D->>U: Hiển thị thanh Autocomplete tìm Bố/Mẹ
    U->>D: Chọn Cụ B làm Bố
    D->>V: Kiểm tra chu trình & tính toán cascade generation
    V-->>D: Hợp lệ (generation_level mới = B.generation_level + 1)
    U->>D: Xác nhận nối
    D->>A: POST /api/members/relink (memberId, parentId)
    A->>DB: Cập nhật father_id & đệ quy cập nhật generation_level cho con cháu
    DB-->>A: Thành công
    A-->>D: 200 OK
    D->>C: Cập nhật state Canvas
    C->>U: Node X biến mất khỏi khay, xuất hiện mượt mà trên cây chính
```

### 3.3. Luồng Bulk Excel Import & Topological Sort (S-08)

```mermaid
sequenceDiagram
    participant U as Admin
    participant P as ExcelImportPage (/admin/import)
    participant E as ExcelParserLib (xlsx)
    participant V as TopologicalSort & Validator
    participant A as API (/api/admin/import)
    participant DB as Supabase DB

    U->>P: Tải template mẫu Excel
    P-->>U: File gia-pha-template.xlsx
    U->>P: Kéo thả file Excel dữ liệu (500 dòng)
    P->>E: Đọc buffer bằng xlsx.read()
    E-->>P: Mảng JSON thô
    P->>V: Kiểm tra 2 tầng (Format validation + Topological Sort)
    alt Có lỗi cấu trúc (Trùng STT, Bố không tồn tại, Chu trình)
        V-->>P: Danh sách dòng lỗi (Đỏ) & dòng cảnh báo (Vàng)
        P-->>U: Hiển thị bảng Preview, vô hiệu hóa nút "Nhập dữ liệu"
    else Hợp lệ toàn phần
        V-->>P: Mảng đã sắp xếp Đời 1 -> Đời 2 -> Đời N
        P-->>U: Bảng Preview Xanh: "Sẵn sàng nhập 500 thành viên"
        U->>P: Bấm "Xác nhận nạp dữ liệu"
        P->>A: POST /api/admin/import (Batch chunks)
        A->>DB: Batch insert tuần tự theo thế hệ
        DB-->>A: Thành công
        A-->>P: 200 OK (500 bản ghi)
        P-->>U: Thông báo thành công -> Chuyển về màn hình Cây
    end
```

### 3.4. Luồng Thêm Phối Ngẫu Nội Tộc (Internal Spouse Link Flow - Zero Duplicate)

```mermaid
sequenceDiagram
    participant U as User (Admin / Member)
    participant D as MemberDetailDrawer
    participant M as MemberFormModal (defaultRole='spouse')
    participant V as KinshipEngine / LCA
    participant A as API (/api/spouse-relations)
    participant DB as Supabase DB
    participant C as FamilyTreeCanvas

    U->>D: Bấm "+ Thêm phối ngẫu" cho Nguyễn Văn Tuấn
    D->>M: Mở modal (targetPartner = Tuấn, defaultRole = 'spouse')
    U->>M: Chọn phân khúc "🔗 Ghép nội tộc", chọn Mai
    M->>V: findLowestCommonAncestor(Tuấn, Mai)
    V-->>M: Trả về Tổ tiên chung Cụ Khởi (is_consanguineous: true)
    M-->>U: Hiển thị badge Hổ phách: "Hôn nhân nội tộc - Cùng cụ tổ Khởi"
    U->>M: Bấm "Lưu phối ngẫu"
    Note over M,A: RẼ NHÁNH ĐẶC BIỆT: KHÔNG gọi POST /api/members!
    M->>A: POST /api/spouse-relations { member_a_id: Tuấn.id, member_b_id: Mai.id, marriage_order: 1 }
    A->>DB: INSERT INTO spouse_relations (tuấn_id, mai_id, 1, 'married')
    DB-->>A: 201 Created (SpouseRelationRecord)
    A-->>M: { success: true, relation, is_consanguineous: true }
    M->>C: onSaved(Mai, undefined, relation)
    C->>C: calculateTreeLayout (tạo GhostNode Mai 🔗 tại nhánh Tuấn)
    M->>U: Đóng modal, thông báo "Ghép phối ngẫu nội tộc thành công"
    C->>U: Ghost Node Mai 🔗 xuất hiện cạnh Tuấn với ký hiệu liên kết
```

### 3.5. Luồng Xóa An Toàn Trực Tiếp Từ Drawer Trên Cây (Safe Delete on Tree Flow)

```mermaid
sequenceDiagram
    participant U as User (Admin)
    participant D as MemberDetailDrawer
    participant V as SafeDeleteValidator (canDeleteMember)
    participant A as API (/api/members/[id])
    participant DB as Supabase DB
    participant C as FamilyTreeCanvas

    U->>D: Mở hồ sơ của Thành viên X
    D->>V: canDeleteMember(X.id, allMembers)
    alt X đang có con cháu (childrenCount > 0)
        V-->>D: { canDelete: false, reason: "Đang có con cháu" }
        D->>U: Nút [🗑️ Xóa hồ sơ] bị Disabled (hover hiển thị tooltip giải thích)
    else X là Node Lá (childrenCount == 0)
        V-->>D: { canDelete: true }
        D->>U: Nút [🗑️ Xóa hồ sơ] bật sáng (Màu đỏ Quiet Luxury)
        U->>D: Bấm [🗑️ Xóa hồ sơ]
        D->>U: Hiển thị Confirm Dialog: "Bạn có chắc chắn muốn xóa [Tên]?..."
        U->>D: Bấm "Xác nhận xóa"
        D->>A: DELETE /api/members/[X.id]
        A->>DB: DELETE FROM spouse_relations WHERE member_a_id = X or member_b_id = X
        A->>DB: DELETE FROM members WHERE id = X.id
        DB-->>A: Thành công
        A-->>D: 200 OK { success: true }
        D->>C: Callback onDeleteMember(X.id)
        D->>U: Đóng drawer, thông báo "Đã xóa thành viên thành công"
        C->>C: Cập nhật state, tính lại layout cây
        C->>U: Node X biến mất khỏi Canvas mượt mà
    end
```

---

## 4. BACKEND LOGIC / API

### 4.0. File: `src/lib/supabase/admin.ts` (Admin Client Bypassing RLS)
- Khởi tạo `createAdminClient()` bằng `@supabase/supabase-js` với `SUPABASE_SERVICE_ROLE_KEY` và `NEXT_PUBLIC_SUPABASE_URL`.
- Dùng độc quyền cho các Server API Route mutations (`POST`, `PUT`, `DELETE` trong `/api/members`, `/api/spouse-relations`, `/api/admin/import`).
- Đảm bảo các thao tác ghi dữ liệu thực tế vào CSDL không bị Row Level Security chặn lại. CẤM nuốt lỗi DB trong `catch`.

### 4.1. File: `src/app/api/members/route.ts` & `src/app/api/members/[id]/route.ts`
- **[POST] `/api/members`**: Tạo thành viên mới.
  - _Input Body:_ `MemberFormData`
  - _Luồng xử lý:_
    1. Kiểm tra session/quyền người dùng (`viewer` ở mock/dev cho phép; trên production yêu cầu `branch_editor` / `super_admin`).
    2. Kiểm tra chu trình: Nếu có `father_id` hoặc `mother_id`, kiểm tra xem có vi phạm logic đồ thị không.
    3. Tự động tính `generation_level`: Nếu có cha mẹ, `generation_level = parent.generation_level + 1`. Nếu là Cụ tổ `is_root: true`, `generation_level = 1`.
    4. Khởi tạo `adminClient = createAdminClient()` và thực hiện `INSERT` vào bảng `members`. Nếu thất bại, ném lỗi rõ ràng kèm HTTP 500 (không trả mock thành công ảo).
    5. Nếu có `spouse_id`: Insert quan hệ vào bảng `spouse_relations`. Tự động kiểm tra LCA nếu là nội tộc.
    6. Nếu có `new_spouse_name` (Inline Spouse Creation): Tạo tự động bản ghi thành viên mới cho phối ngẫu (với giới tính ngược chiều, họ tên, năm sinh) và tạo bản ghi tương ứng trong `spouse_relations`.
    7. Nếu có `child_ids_to_link`: Cập nhật `father_id` (nếu người tạo là Nam) hoặc `mother_id` (nếu người tạo là Nữ) cho tất cả các con được chỉ định.
  - _Output:_ `{ success: true, member: MemberRecord, newSpouse?: MemberRecord }` (HTTP 201).

- **[PUT] `/api/members/[id]`**: Cập nhật hồ sơ thành viên.
  - _Input Body:_ `Partial<MemberFormData>`
  - _Luồng xử lý:_
    1. Kiểm tra chu trình nếu thay đổi `father_id` hoặc `mother_id`. Cấm chọn chính mình hoặc con cháu làm cha mẹ.
    2. Nếu thay đổi cha mẹ: Đệ quy cập nhật lại `generation_level` cho toàn bộ nhánh con cháu bên dưới.
    3. Dùng `createAdminClient()` cập nhật bảng `members`.
    4. Nếu có `new_spouse_name`: Tạo bản ghi phối ngẫu mới và tạo quan hệ `spouse_relations`.
    5. Nếu có `child_ids_to_link`: Cập nhật quan hệ cha/mẹ cho các con tương ứng.
  - _Output:_ `{ success: true, member: MemberRecord }` (HTTP 200).

- **[DELETE] `/api/members/[id]`**: Xóa thành viên (Tuân thủ Safe Delete Policy).
  - _Luồng xử lý:_
    1. Kiểm tra xem thành viên có con cái không (`childrenCount = count(members where father_id = id or mother_id = id)`).
    2. Nếu `childrenCount > 0`: **Từ chối xóa**, trả về HTTP 400 kèm thông báo: `"Không thể xóa thành viên đang có con cháu. Vui lòng chuyển giao con cháu hoặc gán ẩn danh!"`.
    3. Nếu là Node Lá (`childrenCount == 0`): Dùng `createAdminClient()` xóa các bản ghi liên quan trong `spouse_relations`, sau đó xóa bản ghi trong `members`.
  - _Output:_ `{ success: true, message: "Đã xóa thành viên thành công" }` (HTTP 200).

### 4.2. File: `src/app/api/spouse-relations/route.ts`
- **[POST] `/api/spouse-relations`**: Tạo quan hệ hôn phối.
  - _Input Body:_ `{ member_a_id: string, member_b_id: string, marriage_order?: number, marriage_status?: string }`
  - _Luồng xử lý:_
    1. Kiểm tra `member_a_id <> member_b_id`.
    2. Kiểm tra trùng lặp cặp đôi (bất kể thứ tự A-B hay B-A).
    3. Gọi hàm `findLowestCommonAncestor(member_a_id, member_b_id)` từ Kinship Engine:
       - Nếu tìm thấy tổ tiên chung: Trả về cờ `is_consanguineous: true` kèm thông tin tổ tiên chung để frontend hiển thị cờ Ghost Node 🔗.
    4. Dùng `createAdminClient()` insert vào bảng `spouse_relations`.
  - _Output:_ `{ success: true, relation: SpouseRelationRecord, is_consanguineous: boolean, common_ancestor?: any }` (HTTP 201).

### 4.3. File: `src/app/api/admin/import/route.ts`
- **[POST] `/api/admin/import`**: Nạp hàng loạt dữ liệu thành viên từ Excel đã qua kiểm tra.
  - _Input Body:_ `{ rows: ExcelMemberRow[], mode: 'clean' | 'append' }`
  - _Luồng xử lý:_
    1. Kiểm tra quyền `super_admin`.
    2. Nếu `mode === 'clean'`: Xóa dữ liệu cũ (chỉ khi có xác nhận rõ ràng từ admin).
    3. Dùng `createAdminClient()` nạp theo từng thế hệ (Generation Chunks) để đảm bảo không vi phạm Foreign Key constraints:
       - Chunk 1: Các Cụ tổ đời 1 (không có father_id/mother_id).
       - Chunk 2: Đời 2 (cha mẹ là đời 1).
       - ... Chunk N: Đời N.
    4. Nạp bảng `spouse_relations` dựa trên ánh xạ STT $\rightarrow$ UUID thật.
    5. **Chính Sách Fail-Fast Chống Nuốt Lỗi Database:**
       - Khi `adminClient` có sẵn và gọi lệnh insert: nếu Supabase trả về `{ error }`, API **BẮT BUỘC PHẢI ném lỗi ngay** (`throw new Error(error.message)`) và trả về HTTP 500 `{ success: false, error: error.message }`.
       - Tuyệt đối CẤM khối `catch` nuốt lỗi để trả về `{ success: true, importedCount: rows.length }` (thành công ảo). Phải đảm bảo tính liêm chính của dữ liệu CSDL.
  - _Output:_ `{ success: true, importedCount: number, message: "Nhập dữ liệu thành công" }` (HTTP 200).

### 4.5. File: `src/app/api/members/reorder/route.ts` (Batch Reorder Children API)
- **Mục tiêu:** Cập nhật đồng loạt thứ tự sinh `birth_order: 1..N` cho toàn bộ đàn con của một người cha/mẹ trong một giao dịch duy nhất, dọn sạch xung đột trùng lặp số thứ tự sinh.
- **Method:** `POST`
- **Request Body:**
  ```typescript
  interface ReorderChildrenRequest {
    parentId: string; // ID của cha hoặc mẹ
    orderedChildIds: string[]; // Mảng ID các con đã được sắp xếp từ con thứ 1 đến con thứ N
  }
  ```
- **Xử lý:**
  1. Kiểm tra xác thực Admin Client (`createAdminClient()`).
  2. Validate `parentId` và mảng `orderedChildIds` (tối thiểu 1 phần tử).
  3. Cập nhật `birth_order = index + 1` cho từng `childId` trong mảng qua Supabase.
  4. Trả về HTTP 200 kèm danh sách các con với `birth_order` mới.

---

### 4.6. Centralized Permission Engine & Server-Side Security Gates (`src/lib/auth/permissions.ts`)
- **Mục tiêu:** Xây dựng ma trận phân quyền tập trung (Single Source of Truth) định nghĩa tường minh thẩm quyền của 4 vai trò (`viewer`, `claimed_member`, `branch_editor`, `super_admin`), ngăn chặn triệt để tình trạng Viewer có thể thêm/sửa/xóa thành viên hoặc gọi API ghi dữ liệu.
- **Ma Trận Phân Quyền (`ROLE_PERMISSIONS`):**
  ```typescript
  export type PermissionAction =
    | 'tree:view'
    | 'tree:edit_member'
    | 'tree:delete_member'
    | 'tree:manage_unlinked'
    | 'tree:reorder_children'
    | 'tree:toggle_node_lock'
    | 'excel:import'
    | 'admin:access'
    | 'users:manage'
    | 'clan:settings';

  export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
    viewer: ['tree:view'],
    claimed_member: ['tree:view'],
    branch_editor: [
      'tree:view',
      'tree:edit_member',
      'tree:delete_member',
      'tree:manage_unlinked',
      'tree:reorder_children',
      'tree:toggle_node_lock',
    ],
    super_admin: [
      'tree:view',
      'tree:edit_member',
      'tree:delete_member',
      'tree:manage_unlinked',
      'tree:reorder_children',
      'tree:toggle_node_lock',
      'excel:import',
      'admin:access',
      'users:manage',
      'clan:settings',
    ],
  };
  ```
- **Hàm Pure Functions Kiểm Tra Quyền (`src/lib/auth/permissions.ts`):**
  - `hasPermission(role: UserRole | undefined | null, action: PermissionAction): boolean`: Kiểm tra quyền hành động cụ thể.
  - `canManageTree(role: UserRole | undefined | null): boolean`: Kiểm tra xem người dùng có quyền quản trị cây phả hệ hay không (`role === 'super_admin' || role === 'branch_editor'`).
- **Server Guard Helper (`verifyServerRole`):**
  - Trích xuất `user_role` từ Supabase Auth session hoặc `fat_dev_user` cookie (đảm bảo tương thích mượt mà giữa môi trường Production và Development/Test).
  - Trả về `null` nếu hợp lệ, hoặc trả về `NextResponse.json({ success: false, error: 'Bạn không có quyền thực hiện thao tác này' }, { status: 403 })` nếu không đủ quyền.
- **Áp dụng Security Gates trên 100% Mutation API Routes:**
  1. `POST /api/members`: Yêu cầu `canManageTree(role) === true`. Nếu là `viewer` / `claimed_member` / chưa đăng nhập $\rightarrow$ HTTP 403 Forbidden.
  2. `PUT /api/members/[id]`: Yêu cầu `canManageTree(role) === true` $\rightarrow$ HTTP 403 Forbidden.
  3. `DELETE /api/members/[id]`: Yêu cầu `canManageTree(role) === true` $\rightarrow$ HTTP 403 Forbidden.
  4. `POST /api/spouse-relations`: Yêu cầu `canManageTree(role) === true` $\rightarrow$ HTTP 403 Forbidden.
  5. `POST /api/members/reorder`: Yêu cầu `canManageTree(role) === true` $\rightarrow$ HTTP 403 Forbidden.
  6. `POST /api/admin/import`: Yêu cầu `role === 'super_admin'` $\rightarrow$ HTTP 403 Forbidden.
  *(Lưu ý: Môi trường test tự động `NODE_ENV === 'test'` cho phép header `x-bypass-role` hoặc cookie giả lập để các test cases cũ tiếp tục thực thi không bị gián đoạn).*

---

### 4.4. Ingestion Pipeline: Bộ Chuyển Đổi Phả Hệ Cổ Truyền (Legacy Word/Markdown to 19-Column Excel Converter)
- **Mục tiêu:** Chuyển đổi dữ liệu phả hệ thô dạng văn bản/bảng Word (`GIA PHẢ HỌ PHẠM VĂN.docx` / `GIA_PHA_HO_PHAM_VAN.md` với ~1.100 nhân khẩu, 14 thế hệ) sang file Excel chuẩn hóa 19 cột tương thích 100% với `parseExcelFamilyTree()`.
- **Nguyên Tắc Bảo Vệ Tính Nguyên Bản Của Quan Hệ Cha Con (Lineage Integrity Principle):**
  1. **Tuyệt đối cấm AI tự ý suy đoán quan hệ Cha - Con (Anti-Hallucination Guard):**
     - Từ Đời 5 $\rightarrow$ Đời 14 (khi dòng họ phân nhánh thành 2 Ngành - 7 Chi), cột `STT Bố` và `STT Mẹ` bắt buộc **PHẢI ĐỂ TRỐNG (`null`)**.
     - Không tự động gán bất kỳ giả định cha con nào nếu không có bằng chứng lịch sử rõ ràng. Dữ liệu này dành cho con cháu/ban trị sự điền tay theo sổ phả gốc.
  2. **Tự động hóa 100% Cụm Hôn Phối Hạt Nhân (Nuclear Spouse Pairing):**
     - Trong bảng phả hệ cổ truyền, các dòng `Vợ cả: ...`, `Vợ hai: ...`, `Vợ: ...` nằm ngay sau chồng được tự động nhận diện giới tính Nữ, tự động gán `STT Vợ/Chồng` trỏ về STT của người chồng, và người chồng tự động trỏ về vợ (hỗ trợ đa thê).
     - Đối với con gái họ Phạm, dòng `Chồng: ...` nằm ngay sau được tự động nhận diện giới tính Nam và gán `STT Vợ/Chồng`.
  3. **Bóc tách Tự động Ngày Giỗ Âm Lịch & Tuổi Thọ (Regex Date Parser):**
     - Bóc tách các dạng chuỗi `DD / MM`, `DD – MM Thọ XX`, `DD- MM-YYYY Thọ XX` thành 2 giá trị số nguyên: `Ngày mất (Âm)` và `Tháng mất (Âm)`.
  4. **Liên kết Truyền Đơn Trực Hệ Khởi Nguyên (Đời 1 $\rightarrow$ Đời 4):**
     - Tự động điền `STT Bố` cho 4 đời đầu đã được người dùng xác thực: Cụ Tổ Phạm Văn Chiến (Cụ Tổ = 'Đ') $\rightarrow$ Cụ Phạm Văn Đồng $\rightarrow$ Cụ Phạm Kim Chức $\rightarrow$ Cụ Phạm Khắc Tường (ngăn ngừa triệt để lỗi tự trỏ self-loop).
  5. **Đánh dấu Node Lá (Leaf Node Recognition):**
     - Các trường hợp ghi chú `"Không con chết sớm"`, `"Chết không con"`, `"Không vợ con"`, `"Đi tu – chết sớm"` được bảo toàn trong cột `Ghi chú / Tiểu sử` để người nhập liệu nhận biết không cần tìm hậu duệ cho các cụ này.

---

## 5. FRONTEND UI & LOGIC

### 5.1. File: `src/components/modals/MemberFormModal.tsx`
- **Props:**
  - `isOpen: boolean`, `onClose: () => void`, `initialData?: Partial<MemberRecord> | null`
  - `mode: 'create' | 'edit'`, `defaultRole?: 'child' | 'spouse' | 'root'`
  - `parentMember?: MemberRecord | null`, `currentSpouse?: MemberRecord | null`
  - `allMembers: MemberRecord[]`, `allSpouses: SpouseRelationRecord[]`
  - `onSaved: (member: MemberRecord, newSpouse?: MemberRecord) => void`
- **Đặc điểm kiến trúc Form Phẳng Tinh Tế (Refined Modern Heritage Architecture):**
  - **Triệt tiêu Góc Bo Quá Đà (Crisp Architectural Radii - Chống Đại Trà Bubbly):**
    - Chuyển toàn bộ khung viền modal, input, select và buttons từ các góc bo cong quá đà (`rounded-2xl`, `rounded-3xl`, `rounded-full`) sang chuẩn bo góc hình học thanh lịch `rounded-lg` (8px) hoặc `rounded-md` (6px).
    - Giữ trọn vẹn nét trang nghiêm, bền vững của phả ký gia tộc, chấm dứt cảm giác hoạt hình bong bóng của các template phổ thông.
  - **Typography Phong Cách Biên Niên Sử (Editorial Micro-Headers):**
    - Thay thế các icon màu sắc lộn xộn (`👤`, `♡`, `👥`, `⏱`, `📅`) bằng các nhãn micro-headers chữ in hoa thanh mảnh: `text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase`.
    - Phân tách các phân khu chức năng bằng **đường kẻ Hairline siêu mảnh 1px** (`border-t border-slate-100 dark:border-slate-800/80 pt-5 mt-5`).
  - **Khung 3 Tầng Bảo Vệ Viewport:**
    - **Header Cố Định (Fixed Header):** Tiêu đề ngữ cảnh (Thêm con/Thêm phối ngẫu/Chỉnh sửa) + nút đóng (Esc).
    - **Body Cuộn Mượt (Scrollable Body):** `max-h-[85vh] overflow-y-auto` với **Thanh cuộn siêu mảnh (Sleek 5px Scrollbar)** `scrollbar-thin`, bo tròn, không lấn chiếm diện tích.
    - **Sticky Footer Cố Định:** Nút `[Hủy bỏ]` và `[Lưu hồ sơ]` luôn nổi 100% thời gian ở chân modal, không bao giờ bị trôi mất khi cuộn.
  - **Đồng Nhất Hệ Thống Component Toàn Form (Design System Unification):**
    - **Đầy Đủ 3 Giới Tính Cho Cả Thành Viên Chính & Thêm Con Nhanh:** Bắt buộc hỗ trợ đủ 3 nút `[ ♂ Nam ] [ ♀ Nữ ] [ ⚪ Khác ]` cho cả Mục 1 (thành viên chính) và Mục 4 (cụm thêm nhanh con cái). Nút bấm chuyển sang chuẩn hình học `rounded-lg` thanh lịch với tông màu nhã nhặn (Quiet Luxury), độ tương phản cao trong cả Light Mode & Dark Mode.
    - **Thanh Trượt Segmented Control Cho Phối Ngẫu:** Dùng thanh trượt 3 phân đoạn đồng bộ `rounded-lg`: `[ Chưa ghép / Độc thân ] [ + Thêm Vợ/Chồng ngoài họ ] [ Ghép nội tộc ]`.
  - **Khắc Phục Triệt Để Lỗi Rớt Dòng "Con thứ mấy":**
    - Tách bố cục thành 2 hàng độc lập, rộng rãi:
      - **Hàng 1 (Thứ tự sinh):** Ô input số thứ tự sinh `[ 1 ]` kết hợp nhãn giải nghĩa rõ ràng `(Con thứ mấy trong gia đình cha mẹ)` đặt trên 1 hàng thoáng đãng, không bị bóp nghẽn trong cột nhỏ.
      - **Hàng 2 (Đặc điểm nhận diện):** Các tag chọn trực quan `[ Con trưởng ]` `[ Con nuôi ]`.
  - **Loại Bỏ Checkbox "Cụ Tổ (Gốc)" Khỏi Form Thông Thường:**
    - Tuyệt đối không hiển thị checkbox "Cụ Tổ (Gốc)" trong form thêm/sửa con cháu hàng ngày. Cụ Tổ chỉ có 1 vị trí khởi nguồn duy nhất của dòng họ, cờ `is_root` chỉ được gán ngầm tự động bởi hệ thống (`defaultRole === 'root'`).
  - **Chuẩn Hóa Thuần Việt Phân Khu 4: "4. Con cái":**
    - Đổi tên từ "4. HẬU DUỆ" thành "4. Con cái" cho gần gũi, tự nhiên và đúng chuẩn văn phong phả ký Việt Nam.
    - Xem danh sách con hiện có (kèm số thứ tự sinh, huy hiệu con trưởng).
    - Hỗ trợ thêm nhanh con mới hoặc liên kết con từ danh sách mồ côi (`child_ids_to_link`).
  - **Dynamic Disclosure Ngày Mất & Giỗ Chạp Âm Lịch:**
    - Mặc định chọn `(•) Còn sống`: Khối ngày mất Âm lịch được ẩn hoàn toàn $\rightarrow$ Form cực kỳ ngắn gọn (~450px), **hoàn toàn không cần cuộn** đối với 80% trường hợp nhập trẻ mới sinh hoặc dâu rể!
    - Khi chọn `( ) Đã mất †`: Khối trường Ngày mất (Âm) 1-30, Tháng mất (Âm) 1-12, Tháng nhuận, Năm Can Chi, Năm mất Dương và Mộ phần mở rộng mượt mà.
  - **Xử Lý Submit Ghép Phối Ngẫu Nội Tộc (`spouseOrigin === 'internal'` - Bảo Toàn Single Record Policy):**
    - Khi `defaultRole === 'spouse'` và người dùng chọn `spouseOrigin === 'internal'`:
      - Bắt buộc phải chọn thành viên nội tộc `internalSpouseId`.
      - **TUYỆT ĐỐI KHÔNG GỌI** `POST /api/members` (để tránh tạo ra bản ghi trùng lặp vi phạm nguyên tắc Thực thể Duy nhất `[R-SPEC]`).
      - Thay vào đó, gọi trực tiếp API liên kết hôn phối:
        `POST /api/spouse-relations` với payload:
        ```json
        {
          "member_a_id": targetPartner.id,
          "member_b_id": internalSpouseId,
          "marriage_order": spouseOrder,
          "marriage_status": "married"
        }
        ```
      - Khi nhận phản hồi thành công $\rightarrow$ gọi callback `onSaved(internalMember, undefined, newRelation)` để Canvas cập nhật và tự động tính toán sinh Ghost Node 🔗 tại nhánh của `targetPartner`.
      - Đóng modal và hiển thị Toast thông báo thành công: `"Đã kết nối phối ngẫu nội tộc thành công"`.
  - Phím tắt: `Escape` để đóng, `Ctrl+Enter` để Lưu nhanh.

### 5.2. File: `src/components/tree/UnlinkedMembersDrawer.tsx`
- **Props:**
  - `isOpen: boolean`, `onClose: () => void`
  - `members: MemberRecord[]`, `spouses: SpouseRelationRecord[]`
  - `onRelinkMember: (memberId: string, parentId: string) => Promise<void>`
  - `onDeleteMember: (memberId: string) => Promise<void>`
- **Đặc điểm thiết kế:**
  - Slide-over drawer bên phải màn hình (`w-96`), tiêu đề *"Khay Thành Viên Chưa Nối Phả"*.
  - Bộ lọc thông minh: Tự động loại trừ Dâu/Rể ngoại tộc đã có liên kết qua `spouse_relations`.
  - Danh sách thẻ thành viên mồ côi: Hiển thị Tên, Giới tính, Năm sinh, Trạng thái.
  - Nút hành động trên từng thẻ: `[🔗 Nối vào cây]`, `[🗑️ Xóa]`.
  - Hộp thoại Nối phả nhúng tại chỗ: Bấm "Nối vào cây" $\rightarrow$ Mở thanh tìm kiếm Autocomplete chọn Cha/Mẹ $\rightarrow$ Hiển thị xác nhận $\rightarrow$ Hoàn tất.

### 5.3. File: `src/app/admin/import/page.tsx` (Màn hình S-08)
- **Cấu trúc màn hình:**
  - Header: Tiêu đề *"Nhập Liệu Gia Phả Hàng Loạt (Bulk Excel Import)"*, nút `[📥 Tải Template Excel Mẫu]`.
  - Vùng Kéo-Thả (Dropzone): Hỗ trợ file `.xlsx` và `.csv`.
  - Bảng Thống kê & Preview:
    - 3 thẻ chỉ số: Tổng số dòng, Hợp lệ (Xanh lá), Cần chỉnh sửa (Đỏ/Vàng).
    - Bảng dữ liệu: Các dòng lỗi được tô màu đỏ nổi bật kèm thông báo lỗi cụ thể ở cột "Trạng thái kiểm tra".
  - Nút Hành động: `[Hủy bỏ]`, `[Xác nhận Nhập dữ liệu]` (Chỉ bật khi không có lỗi đỏ chặn).
- **Chuẩn Hóa Hình Học Crisp Architectural Geometry (Chống Bo Tròn Đại Trà):**
  - Chuyển đổi toàn bộ các thẻ card thống kê (`rounded-2xl` $\rightarrow$ `rounded-lg`), vùng kéo thả Dropzone (`rounded-2xl` $\rightarrow$ `rounded-lg border-2 border-dashed`), bảng dữ liệu preview (`rounded-2xl` $\rightarrow$ `rounded-lg`), các hộp alert hướng dẫn (`rounded-2xl` $\rightarrow$ `rounded-lg`) sang chuẩn bo góc hình học 8px (`rounded-lg`) hoặc 6px (`rounded-md`).
  - Nút tải template mẫu, nút hủy và nút xác nhận nhập nạp đồng bộ `rounded-lg`.
  - Đảm bảo tính thẩm mỹ trang nghiêm, thanh lịch (Quiet Luxury) thống nhất với toàn bộ hệ thống.

### 5.4. Cập nhật các Component hiện có:
- `src/lib/tree-layout/genealogy-layout.ts`:
  - Khai báo tường minh `width: NODE_WIDTH (200)` và `height: NODE_HEIGHT (96)` trực tiếp trên 100% object Node (`memberNode` & `ghostNode`).
- `src/components/tree/FamilyTreeCanvas.tsx`:
  - Bỏ cờ `onlyRenderVisibleElements={true}` hoặc cấu hình chuẩn xác bounding box; thiết lập `fitView` padding chuẩn xác để toàn bộ cây phả hệ xuất hiện tức thì, triệt tiêu 100% hiện tượng màn hình đen rỗng.
  - Lắp ráp `MemberFormModal` và `UnlinkedMembersDrawer`.
  - Xử lý callback mutation: Cập nhật state nội bộ và lia camera mượt mà tới node mới.
  - Xử lý callback `onDeleteMember`: Cập nhật state nội bộ loại bỏ member và các quan hệ hôn phối, tính lại layout cây và đóng Drawer.
- `src/components/tree/MemberDetailDrawer.tsx`:
  - Thêm nút `[✏️ Sửa hồ sơ]` ở Header/Footer action bar.
  - Thêm nút `[➕ Thêm con]` ở tab "Vợ Chồng & Con Cái".
  - Thêm nút `[💍 Thêm Vợ/Chồng]` ở tab "Vợ Chồng & Con Cái".
  - **Bổ sung Nút `[🗑️ Xóa hồ sơ]` Trên Action Bar:**
    - Tích hợp kiểm tra an toàn qua hàm `canDeleteMember(member.id, allMembers)` từ `graph-validation.ts`.
    - Nếu `childrenCount > 0`: Nút `[🗑️ Xóa hồ sơ]` bị vô hiệu hóa (disabled) kèm tooltip giải thích: *"Không thể xóa thành viên đang có con cháu (Chính sách Safe Delete RESTRICT). Cần chuyển giao hoặc gỡ bỏ con cháu trước."*
    - Nếu là Node Lá (`childrenCount === 0`): Nút `[🗑️ Xóa hồ sơ]` bật sáng với tông màu đỏ trang nhã (`text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30`).
    - Khi bấm: Mở Confirm Dialog xác nhận: *"Bạn có chắc chắn muốn xóa thành viên [Họ Tên]? Thao tác này sẽ xóa hồ sơ và các liên kết hôn phối liên quan khỏi gia phả."*
    - Khi người dùng xác nhận: Gọi API `DELETE /api/members/[id]`, kích hoạt callback `onDeleteMember(member.id)`, đóng Drawer và hiển thị thông báo thành công.
- `src/components/tree/TreeToolbar.tsx`:
  - Bổ sung nút Badge `[🔗 Chưa nối: X]` hiển thị số lượng unlinked members khi $X > 0$.
  - Bổ sung nút `[➕ Thêm thành viên]` trên thanh công cụ.

### 5.5. Kiến Trúc Cách Ly Build (`next.config.mjs`) & Bộ 3 Cơ Chế Camera Bất Khả Lạc:
- `next.config.mjs`:
  - Khởi tạo cấu hình hỗ trợ `distDir: process.env.NEXT_DIST_DIR || '.next'`.
  - Giúp cách ly hoàn toàn thư mục build kiểm chứng (`.next-build/`) khỏi thư mục dev server (`.next/`), ngăn chặn 100% nguy cơ lệnh verify build làm gián đoạn dev server và sinh lỗi HTTP 404 cho client chunks.
- `src/components/tree/FamilyTreeCanvas.tsx`:
  - Bổ sung `defaultViewport={{ x: -600, y: 40, zoom: 0.55 }}` trực tiếp trên `<ReactFlow>`: Ngay từ frame 0ms đầu tiên, camera đã nhìn thẳng vào trung tâm cụm Cụ Khởi và các Chi nhánh, triệt tiêu khả năng camera kẹt ở khoảng tối `(0, 0)`.
  - Tích hợp hook chuẩn `useNodesInitialized()` từ `@xyflow/react`: Khi `nodesInitialized === true`, tự động gọi `fitView({ padding: 0.25, duration: 400 })` để co giãn toàn bộ cây vừa vặn với kích thước màn hình người dùng.
  - Tự động gọi `fitView` khi đổi `currentDataset` hoặc đổi Gốc `focusRootId`.

### 5.6. Đồng Bộ Hóa Theme & Kiến Trúc Chống Sụp Đổ Viewport & Flex Sticky Footer (Theme & Viewport Resilience Architecture):
- `src/app/globals.css`:
  - Khai báo chuẩn `html { height: 100%; }` và `body { min-height: 100%; }`. Điều này đảm bảo `html` làm mốc tham chiếu chiều cao gốc, trong khi `body` không bị khóa cứng ở 100vh mà có thể co giãn tự nhiên theo chiều cao của các trang có nội dung dài (như `/kinship`).
  - Đồng bộ hoàn toàn CSS thuần với cấu hình Tailwind `darkMode: ['class']`.
  - Loại bỏ hoàn toàn `@media (prefers-color-scheme: dark)` tự ý ép `body` sang nền đen `#090e1a` khi OS bật Dark Mode mà thẻ `<html>` chưa có class `.dark`.
  - Định nghĩa tường minh: `:root` đại diện cho Light Mode chuẩn di sản (nền sáng di sản `#f8fafc`, chữ slate-900), `.dark` đại diện cho Dark Mode (nền tối `#090e1a`, chữ slate-50).
- `src/app/layout.tsx`:
  - Bổ sung class `h-full` trên thẻ `<html>`. Thẻ `<body>` giữ `antialiased min-h-screen flex flex-col font-sans` (loại bỏ `h-full` gây khóa cứng chiều cao).
  - Thẻ `<main>` có `flex-1 flex flex-col min-h-0 relative` (loại bỏ `h-full`).
  - `<AppFooter />` đóng vai trò Flex Sticky Footer:
    - Trên các trang nội dung ngắn (như `/`): `<main>` với `flex-1` căng ra để đẩy `<AppFooter />` xuống sát đáy màn hình.
    - Trên các trang nội dung cuộn dài (như `/kinship` 7 đời trực hệ): `<main>` tự do giãn nở theo chiều dài nội dung và đẩy `<AppFooter />` xuống sau cùng (sau Đời 7), triệt tiêu hoàn toàn lỗi footer nằm lơ lửng cắt ngang nội dung.
    - Tách biệt layout Canvas: Khi ở route `/tree`, `<AppFooter />` tự động ẩn (`if (pathname === '/tree') return null;`) để không chiếm 60px chiều cao gây lệch viewport canvas.
- `src/hooks/use-theme.ts` & `src/components/theme/ThemeToggle.tsx`:
  - Xây dựng custom hook `useAppTheme()` sử dụng `MutationObserver` lắng nghe thuộc tính `class` trên thẻ `document.documentElement`.
  - Cung cấp reactive state `{ theme, isDark, toggleTheme }`. Khi người dùng bấm nút Đổi Theme trên Navbar, class `.dark` được bật/tắt trên `<html>` và toàn bộ các component lắng nghe (kể cả Canvas) đều re-render tức thì 0ms.
- `src/app/tree/page.tsx` & `src/components/tree/FamilyTreeCanvas.tsx`:
  - Container của `TreePage` có class `relative w-full h-full flex-1 overflow-hidden flex flex-col`.
  - Container của `FamilyTreeCanvas`: Neo chiều cao trực tiếp `style={{ width: '100%', height: 'calc(100vh - 4rem)' }}` kết hợp `min-h-[500px] flex-1 flex flex-col relative overflow-hidden`.
  - `<ReactFlow>` nhận prop động `colorMode={isDark ? 'dark' : 'light'}` thông qua `useAppTheme()`, **xóa bỏ triệt để `colorMode="system"`**.
  - Khi website ở chế độ Sáng: `colorMode="light"`, canvas có nền sáng ngọc bích `bg-slate-100/70`, toàn bộ thẻ `MemberNode` mang nền trắng sứ `bg-white/95`.
  - Khi website ở chế độ Tối: `colorMode="dark"`, canvas có nền đen sâu `dark:bg-slate-950`, toàn bộ thẻ chuyển sang xanh đen `dark:bg-slate-900/95`. Đồng bộ 100% với Navbar và Toolbar.

### 5.7. Kiểm Thực Nghiệp Vụ Con Cái, Thứ Tự Sinh, Con Trưởng, Chuẩn Hóa Danh Xưng & Tuổi Tác (Child Validation & Identity Polish):
- **Tự động gợi ý & Dọn trùng thứ tự sinh (`birth_order`)**:
  - Khi mở form thêm con cho cha/mẹ, hệ thống tự động tính `birth_order = max(existing_orders) + 1` thay vì gán cứng 1.
  - Nếu người dùng chủ động gõ một số thứ tự $K$ đã thuộc về một người con khác trong cùng gia đình, hệ thống hiển thị ghi chú: `"Thứ tự #K hiện đang thuộc về [Tên]. Khi lưu, thứ tự của [Tên] sẽ được xóa bỏ để nhường cho người này."`
  - Ở tầng API & Client: Tự động xóa `birth_order = null` của người cũ để tránh xung đột và giúp thao tác nhập liệu đơn giản, không bị chặn cứng.
- **Kiểm soát Con Trưởng duy nhất (`is_senior`) & Cảnh báo chuyển giao**:
  - Trong cùng một gia đình, chỉ có duy nhất 1 người con mang cờ `is_senior = true`.
  - Khi người dùng tích chọn `⭐ Con trưởng`, nếu gia đình đã có con trưởng (ví dụ Nguyễn Văn A), hệ thống hiển thị hộp thoại xác nhận:
    `"Gia đình hiện đã có con trưởng là [Nguyễn Văn A]. Bạn có chắc chắn muốn chuyển danh hiệu con trưởng sang cho [Người này] không?"`
  - Nếu bấm Đồng ý: Gán `is_senior = true` cho người mới và tự động hạ cờ `is_senior = false` cho Nguyễn Văn A.
- **Kiểm thực chặn cứng nghịch lý năm sinh (`birth_year`)**:
  - Chặn cứng (Error): Năm sinh của con không được nhỏ hơn hoặc bằng năm sinh của Cha hoặc Mẹ (`child.birth_year <= parent.birth_year`). Ném lỗi form rõ ràng và chặn lưu.
  - Cảnh báo mềm (Warning): Nếu khoảng cách tuổi cha mẹ và con $< 15$ tuổi, hiển thị cảnh báo màu vàng: `Khoảng cách tuổi giữa cha mẹ và con quá gần. Vui lòng kiểm tra lại.`
  - Khi sửa năm sinh của Bố/Mẹ, cũng kiểm tra chặn sửa năm sinh bố mẹ lớn hơn hoặc bằng năm sinh con cái hiện có.
- **Chuẩn hoá toàn diện xưng hô thuần Việt tập trung (`src/constants/kinship-terms.ts`)**:
  - Đưa toàn bộ định danh xưng hô và thông báo rỗng vào file hằng số duy nhất `KINSHIP_TERMS` (Single Source of Truth), cấm hardcode chuỗi rải rác:
    - `PARENTS: 'Bố mẹ'`
    - `FATHER: 'Bố'`, `FATHER_FULL: 'Bố ruột'`
    - `MOTHER: 'Mẹ'`, `MOTHER_FULL: 'Mẹ ruột'`
    - `SIBLINGS: 'Anh em'`, `SIBLINGS_FULL: 'Anh em ruột'`
    - `CHILDREN: 'Con cái'`
    - `EMPTY_CHILDREN: 'Chưa có thông tin con cái'`
  - Đồng bộ trên toàn bộ Header Drawer, Modal Form, Thông báo validation và trạng thái rỗng.
- **Hiển thị song song Tuổi Dương & Tuổi Mụ kèm Tooltip giải thích chi tiết**:
  - Tại mục Con cái trên `MemberDetailDrawer`, module `calculateMemberAge` tính toán song song:
    - **Tuổi Dương**: `Năm hiện tại - Năm sinh` (Ví dụ: `28 tuổi`).
    - **Tuổi Mụ (Truyền thống)**: `Tuổi Dương + 1` (Ví dụ: `29 mụ`).
    - **Hiển thị trên UI**: `SN 1998 (28 tuổi · 29 mụ) ℹ️`.
    - **Tooltip chi tiết (HTML title / hover)**:
      ```text
      • Tuổi Dương: 28 tuổi (tính theo năm 2026 - 1998)
      • Tuổi Mụ: 29 tuổi (theo phong tục truyền thống = tuổi dương + 1)
      ```
    - Người đã mất: `(1920 - 1995 · Thọ 75 tuổi, mụ 76)`.
    - Chưa rõ năm sinh: `Chưa rõ năm sinh`.

### 5.8. Chuyên Biệt Hóa Form Theo Ngữ Cảnh (Contextual Form Specialization):
- **Ngữ cảnh Thêm Phối Ngẫu (`defaultRole === 'spouse'`, `targetPartner = currentSpouse`)**:
  - **Cố định Đối tác Hôn phối**: Khóa cứng người phối ngẫu (Ví dụ: `Nguyễn Văn Tuấn [🔒]`), cấm chọn lại chồng khác, ẩn tab độc thân và tab tạo phối ngẫu cho phối ngẫu.
  - **Thứ bậc Hôn phối (`marriage_order`)**: Hệ thống đếm số vợ hiện có của đối tác và tự động gợi ý thứ bậc tiếp theo (`Vợ hai #2` nếu đã có 1 vợ); cung cấp selector trực quan: `[ 🌸 Vợ cả (#1) ]`, `[ 🌸 Vợ hai (#2) ]`, `[ 🌸 Vợ ba (#3) ]`.
  - **Ẩn Khối Thân tộc khi là Dâu/Rể Ngoại tộc**: Khi chọn "Ngoại tộc" (mặc định), ẩn hoàn toàn Khối 2: Bố mẹ & Thứ bậc gia đình (không hỏi Cha ruột, Mẹ ruột, Thứ tự sinh, Con trưởng). Đồng thời ẩn Khối Con cái để giữ form tinh gọn ~350px.
  - **Chỉ hiện thân tộc khi chọn "Nội tộc"**: Chọn người đã có trong dòng họ và tự động kiểm tra cận huyết qua LCA.
- **Ngữ cảnh Thêm Con Cái (`defaultRole === 'child'`)**:
  - **Cố định Bố**: Khóa cứng Bố ruột (Ví dụ: `Nguyễn Văn Tuấn [🔒]`).
  - **Lựa chọn Mẹ ruột**:
    - Nếu Bố chỉ có 1 vợ: Khóa cứng Mẹ là người vợ đó.
    - Nếu Bố có $\ge 2$ vợ: Cho phép chọn Mẹ ruột trong danh sách vợ của Bố.
  - **Cố định cả Bố và Mẹ khi mở từ cụm con của người vợ cụ thể**: Bấm "+ Thêm con" từ nhóm con của bà vợ nào thì cả Bố và Mẹ của đứa con mới đều được KHÓA CỨNG [🔒].
  - **Ẩn Khối Phối ngẫu**: Con mới sinh mặc định độc thân, ẩn khối 3.

### 5.9. Tối Ưu Hóa Khối Hôn Phối, Chọn Mẹ Khi Thêm Con & Modal Sắp Xếp Đàn Con Kéo Thả:
- **Khối 3: Hôn phối (`MemberFormModal.tsx`):**
  - Khi mở form chỉnh sửa một thành viên, truy vấn tất cả các mối quan hệ phối ngẫu từ `allSpouses`.
  - **Nếu đã có vợ/chồng:** Render khu vực "Phối ngẫu hiện tại" dạng thẻ phẳng trang trọng (`🌸 Bà Cả: [Tên]`, `🌸 Bà Hai: [Tên]`) kèm nút `[Gỡ/Xóa]`. Không tự ý kích hoạt tab ghép người nội tộc.
  - **Nút `[+ Thêm Vợ]` / `[+ Thêm Chồng]`:** Đặt nút rõ ràng, bấm vào mới mở ra 2 tùy chọn: *Thêm vợ ngoài tộc* hoặc *Ghép người trong tộc*.
  - **Nếu chưa có phối ngẫu:** Hiển thị nhãn *Chưa có thông tin phối ngẫu (Độc thân)* kèm nút `[+ Thêm Vợ/Chồng]`.
- **Khối 4: Chọn Mẹ khi thêm con nhanh (`MemberFormModal.tsx`):**
  - **Chồng có 1 vợ:** Trường chọn Mẹ tự động gán mặc định (default) là người vợ đó (`selectedMotherId = wife.id`), có checkbox/tùy chọn click để chuyển sang *Chưa rõ mẹ*.
  - **Chồng có $\ge 2$ vợ (Đa thê):** Bắt buộc hiển thị dropdown hoặc radio chọn Mẹ ruột trong danh sách các bà vợ (Bà cả / Bà hai / Chưa rõ mẹ).
  - **Chưa có vợ:** Mặc định *Chưa rõ mẹ*.
  - **Lưu CSDL:** Khi submit form, gửi `mother_id: child.motherId || null` lên API `POST /api/members` (loại bỏ triệt để việc hardcode `null`).
- **Thẻ Node Canvas (`MemberNode.tsx`):**
  - Chân thẻ bên phải hiển thị `{childCount} người con` trở thành nút bấm tương tác (có icon `⇅`).
  - Click vào mở nhanh `ReorderChildrenModal`. Dùng `e.stopPropagation()` để không kích hoạt mở `MemberDetailDrawer`.
- **Component Mới: `ReorderChildrenModal.tsx`:**
  - Tiêu đề: *Sắp xếp thứ tự đàn con của [Tên Cha/Mẹ] (X người con)*.
  - Danh sách đàn con với tay nắm `GripVertical` hỗ trợ HTML5 Drag & Drop native + nút `▲` `▼` cho thiết bị cảm ứng.
  - Nút *Lưu thứ tự* $\rightarrow$ gọi API `POST /api/members/reorder` $\rightarrow$ cây tự động re-layout từ trái sang phải theo `birth_order` mới.

### 5.10. Frontend Read-Only Tree Mode & UI Action Guards (Bảo Vệ Giao Diện Cây Theo Vai Trò):
- **Trang Cây Phả Hệ (`src/app/tree/page.tsx`):**
  - Trích xuất session và role người dùng từ Supabase Server Client / Cookies:
    ```typescript
    const userRole = profile?.user_role || devUser?.user_role || 'viewer';
    const canManageTree = userRole === 'super_admin' || userRole === 'branch_editor';
    ```
  - Truyền `userRole={userRole}` và `canManageTree={canManageTree}` xuống `FamilyTreeCanvas`.
- **Bàn Vẽ Cây Phả Hệ (`src/components/tree/FamilyTreeCanvas.tsx`):**
  - Tiếp nhận props `userRole` và `canManageTree`.
  - Chỉ truyền các handler `onOpenAddMemberModal` và `onOpenUnlinkedDrawer` xuống `TreeToolbar` khi `canManageTree === true`.
  - Truyền prop `canManageTree` vào `MemberDetailDrawer`.
- **Thanh Công Cụ Cây (`src/components/tree/TreeToolbar.tsx`):**
  - **Nút "+ Thêm người" (`UserPlus`):** Tự động ẩn 100% khi `!canManageTree` (hoặc `!onOpenAddMemberModal`).
  - **Nút "Chưa nối: X" (`Link2`):** Tự động ẩn 100% khi `!canManageTree` (hoặc `!onOpenUnlinkedDrawer`).
  - **Chức năng "Khóa vị trí thẻ" (`onToggleLock`):**
    - Khi `canManageTree === false` (Viewer / Claimed Member): Khóa cố định ở trạng thái `isLocked = true` (chế độ xem an toàn, chỉ Pan/Zoom), không hiển thị nút mở khóa kéo xê dịch node để tránh làm xáo trộn hiển thị trên màn hình người dùng.
    - Khi `canManageTree === true` (Admin / Branch Editor): Hiển thị đầy đủ công tắc mở khóa kéo thả node tự do.
- **Drawer Chi Tiết Thành Viên (`src/components/tree/MemberDetailDrawer.tsx`):**
  - Nhận prop `canManageTree?: boolean` (mặc định `false`).
  - **Nút "Sửa hồ sơ" (`Edit3`):** Ẩn 100% khi `!canManageTree`.
  - **Nút "Xóa hồ sơ" (`Trash2`):** Ẩn 100% khi `!canManageTree`.
  - **Chế độ Read-Only cho Viewer:** Drawer chỉ hiển thị các chức năng tra cứu thuần túy: `[ 🧭 Đặt làm Gốc ]`, `[ 👥 Tra cứu xưng hô ]`, `[ ✕ Đóng ]`.
- **Thẻ Thành Viên Trên Cây (`src/components/tree/MemberNode.tsx`):**
  - Badge `{childCount} người con`: Khi click, chỉ kích hoạt sự kiện mở modal sắp xếp thứ tự nếu người dùng có quyền quản trị cây; đối với Viewer, nhấp chuột không mở modal chỉnh sửa.

### 5.11. Gỡ Bỏ Khối "Nguồn Dữ Liệu Kiểm Thử" Khỏi TreeToolbar & Cố Định Dữ Liệu CSDL Sống:
- **Thanh Công Cụ Cây (`src/components/tree/TreeToolbar.tsx`):**
  - Gỡ bỏ hoàn toàn khối `Nguồn dữ liệu kiểm thử` (chứa các nút chuyển đổi dữ liệu giả lập Clan 28, Đa thê Cụ Chiến, Clan 1.500) khỏi menu popover `[ ⚙ Tùy chọn ▾ ]`.
  - Dọn dẹp import biểu tượng `Users` khỏi `TreeToolbar` (nếu không còn sử dụng trong toolbar).
  - Giữ lại các chức năng nghiệp vụ thiết thực: `Khóa vị trí thẻ`, `Hiển thị Rể nội tộc` và `Lối tắt Nhập liệu Excel`.
- **Bàn Vẽ Cây Phả Hệ (`src/components/tree/FamilyTreeCanvas.tsx`):**
  - Mặc định và cố định hiển thị nguồn dữ liệu sống thực tế (`liveMembers`) lấy từ Supabase DB. Không còn cung cấp nút bấm UI để người dùng chuyển đổi sang các dataset giả lập ngoài màn hình cây.

### 5.12. Đồng Bộ Nhận Diện Biểu Tượng "Xưng Hô" (Kinship Icon Transition: Compass → Users):
- **Triết lý Thiết Kế & Nhận Diện Thị Giác:**
  - Tính năng "Xưng hô" bản chất là phân định quan hệ vai vế danh xưng giữa 2 người/con cháu trong gia tộc họ hàng. Biểu tượng hai người (`<Users />` từ `lucide-react`) mang tính nhân văn và gần gũi hơn rất nhiều so với biểu tượng la bàn (`<Compass />`).
  - Nút "Tra cứu xưng hô" trong Drawer chi tiết (`MemberDetailDrawer`) đã sử dụng icon `Users` từ trước. Việc chuyển đổi icon tính năng "Xưng hô" trên toàn hệ thống sang `Users` tạo ra sự đồng bộ và nhất quán thị giác 100%.
- **Các Vị Trí Cập Nhật Biểu Tượng `Users` Thay Thế Cho `Compass`:**
  - **Desktop Header Navbar (`src/components/navbar/Navbar.tsx`):** Mục liên kết `Xưng hô` (`/kinship`) hiển thị `<Users className="w-4 h-4 text-emerald-600" />`.
  - **Mobile Bottom Navigation (`src/components/navigation/MobileBottomNav.tsx`):** Tab `Xưng hô` (`/kinship`) trong danh sách `NAV_ITEMS` sử dụng `icon: Users`.
  - **Trang Tra Cứu Quan Hệ (`src/app/kinship/page.tsx`):** Badge hero đầu trang `ĐỒ THỊ PHẢ HỆ VIỆT NAM` hiển thị `<Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />`.
  - **Trang Cấu Hình Tính Năng Admin (`src/app/admin/features/page.tsx`):** Mục `enable_kinship_lookup` ("Công Cụ Tra Cứu Vai Vế Xưng Hô") đồng bộ icon `Users`.

---

## 6. XỬ LÝ LỖI & NGOẠI LỆ (ERROR HANDLING & EDGE CASES)

- **Edge Case 1: Nhầm lẫn Dâu/Rể ngoại tộc thành thành viên chưa nối:**
  - _Xử lý:_ Bộ lọc `getUnlinkedMembers` kiểm tra chéo với danh sách `spouse_relations`. Nếu thành viên đã kết hôn với một người trong cây thì bỏ qua, không hiển thị trong khay mồ côi.
- **Edge Case 2: Vòng lặp cha - con trực tiếp hoặc gián tiếp (Cycle):**
  - _Xử lý:_ Hàm `isDescendantOf(candidateParentId, memberId)` duyệt cây con cháu. Nếu phát hiện vi phạm, báo lỗi ngay lập tức: *"Không thể chọn con cháu làm cha mẹ"*.
- **Edge Case 3: Xóa thành viên đang có con cái:**
  - _Xử lý:_ Chặn xóa cứng theo chính sách Safe Delete RESTRICT, trả về lỗi HTTP 400 kèm hướng dẫn chuyển giao quyền cha mẹ hoặc đặt ẩn danh.
- **Edge Case 4: Lịch âm không rõ năm Dương lịch:**
  - _Xử lý:_ Cho phép lưu mà không cần `death_year` hoặc `death_date`. Thuật toán lịch giỗ Milestone 5 chỉ căn cứ trên `death_lunar_day` và `death_lunar_month`.
- **Edge Case 5: File Excel có STT cha mẹ không tồn tại hoặc đảo lộn thứ tự:**
  - _Xử lý:_ Thuật toán Topological Sort phát hiện và đánh dấu đỏ dòng lỗi: `"Mã cha/mẹ [X] không tồn tại trong file"`, khóa nút Xác nhận nhập dữ liệu.
- **Edge Case 6: Mất dấu vị trí khi lưu trên Canvas (UX Jitter):**
  - _Xử lý:_ Sau khi mutate state, tính lại layout và tự động gọi `setCenter(newNode.x, newNode.y)` để camera focus đúng vị trí thành viên mới.
- **Edge Case 7: Xung đột tài nguyên `.next/` giữa Dev Server và Verify Build:**
  - _Xử lý:_ Cấu hình `next.config.mjs` đọc `process.env.NEXT_DIST_DIR`. Khi chạy kiểm chứng build, sử dụng `NEXT_DIST_DIR=.next-build`, bảo toàn tuyệt đối 100% dev chunks trong `.next/`.
- **Edge Case 8: Tọa độ Node gốc quá lớn ($X = 1.845$) lệch khỏi viewport mặc định:**
  - _Xử lý:_ Đặt `defaultViewport` sơ bộ tại trung tâm đồ thị kết hợp `useNodesInitialized` gọi `fitView`, đảm bảo cây luôn hiển thị chính giữa màn hình dù người dùng dùng màn hình độ phân giải nào.
- **Edge Case 9: Xung đột Dark/Light Theme do prefers-color-scheme (Nửa Sáng Nửa Tối):**
  - _Xử lý:_ Xóa bỏ `@media (prefers-color-scheme: dark)` trong `globals.css`, chỉ kích hoạt Dark Mode khi có class `.dark` của Tailwind. Toàn bộ nền, text, card và header luôn đồng bộ 100%.
- **Edge Case 10: Sụp đổ chiều cao Flexbox Container làm React Flow không render:**
  - _Xử lý:_ Bổ sung `min-h-0 relative flex-1` trên `<main>` và `h-[calc(100vh-4rem)] min-h-[500px]` trên trang `/tree`, ẩn footer website tại trang canvas để đảm bảo React Flow luôn nhận đúng kích thước tính toán > 0px.
- **Edge Case 11: Trùng thứ tự sinh (birth_order) giữa các con cùng cha mẹ:**
  - _Xử lý:_ Tự động gỡ bỏ thứ tự của người con cũ (`birth_order = null`) khi người mới nhận số thứ tự đó, giúp việc nhập liệu đơn giản, không bị chặn.
- **Edge Case 12: Đăng ký nhiều con trưởng trong cùng một gia đình:**
  - _Xử lý:_ Bật modal xác nhận chuyển giao con trưởng; nếu đồng ý, tự động hạ cờ `is_senior = false` của người cũ, bảo toàn nguyên tắc duy nhất 1 con trưởng.
- **Edge Case 13: Con cái có năm sinh nhỏ hơn hoặc bằng năm sinh cha mẹ:**
  - _Xử lý:_ Validate chặn cứng form và API (HTTP 400), ném thông báo lỗi chỉ đích danh năm sinh cha/mẹ, không cho lưu dữ liệu phi lý.
- **Edge Case 14: Sửa năm sinh cha mẹ lớn hơn hoặc bằng năm sinh của con cái hiện có:**
  - _Xử lý:_ Chặn lưu và hiển thị thông báo xung đột với người con cụ thể.
- **Edge Case 15: Con cái chưa rõ năm sinh trong khi cha mẹ có năm sinh:**
  - _Xử lý:_ Cho phép lưu bình thường, chỉ áp dụng validation khi cả 2 bên đều có năm sinh.
- **Edge Case 16: React Flow colorMode="system" gây xung đột theme (Nửa sáng nửa tối):**
  - _Xử lý:_ React Flow tự ý đọc `window.matchMedia('(prefers-color-scheme: dark)')` và gắn class `.dark` vào chính canvas, làm lan truyền class `.dark` sang các node con trong khi Navbar và website ở Light Mode. Thay thế triệt để bằng `colorMode={isDark ? 'dark' : 'light'}` thông qua hook reactive `useAppTheme()`.
- **Edge Case 17: Footer lơ lửng cắt ngang nội dung dài trên trang /kinship:**
  - _Xử lý:_ Do `globals.css` ép `html, body { height: 100% }` và `<main>` có `h-full`, `body` bị kẹp cứng ở 100vh khiến footer nằm chết tại mốc Y ≈ 740px. Chuyển `body` sang `min-height: 100%` và loại bỏ `h-full` trên `<main>` để footer tự do trôi xuống đáy sau toàn bộ nội dung.
- **Edge Case 18: Thêm phối ngẫu nội tộc bị sinh bản ghi trùng lặp (Duplicate Member):**
  - _Xử lý:_ Trong `MemberFormModal.tsx`, khi `spouseOrigin === 'internal'`, tách biệt hoàn toàn khỏi luồng tạo thành viên mới (`POST /api/members`). Form chỉ thực thi gọi `POST /api/spouse-relations` để liên kết hai thành viên nội tộc đã tồn tại, bảo đảm nguyên tắc Thực thể Duy nhất `[R-SPEC]`.
- **Edge Case 19: Xóa thành viên từ Drawer trên cây chính khi thành viên có con cái:**
  - _Xử lý:_ Trong `MemberDetailDrawer.tsx`, tích hợp kiểm tra `canDeleteMember(member.id, allMembers)`: Nếu `childrenCount > 0`, vô hiệu hóa nút xóa (disabled) và hiển thị giải thích vi phạm chính sách Safe Delete RESTRICT. Chỉ cho phép xóa khi là Node Lá (0 con), đồng thời hiển thị hộp thoại xác nhận trước khi gọi `DELETE /api/members/[id]`.
- **Edge Case 20: Import Excel nuốt lỗi Database trả về thành công ảo:**
  - _Xử lý:_ Trong `src/app/api/admin/import/route.ts`, loại bỏ triệt để cơ chế nuốt lỗi fallback giả lập khi `createAdminClient()` đã được khởi tạo. Mọi lỗi thao tác insert từ Supabase đều phải ném lỗi ngay (fail-fast) và trả về HTTP 500 kèm thông điệp lỗi cụ thể, bảo toàn tính liêm chính của CSDL.
- **Edge Case 21: Thành viên Tái giá (Nữ) hoặc Đã lấy vợ khác (Nam):**
  - _Xử lý:_ CSDL lưu `marital_status: 'remarried'` và `marital_event_year`. Form `MemberFormModal` tự động hiển thị nhãn `Tái giá` (với Nữ) hoặc `Đã lấy vợ` (với Nam) trên hàng phẳng (Flat & Inline, không lồng box). Thẻ Node `MemberNode` đặt nhãn tại chân thẻ bên trái thay thế chữ fallback "Huyết tộc", giữ nguyên 100% dòng năm sinh - mất ở Body và cố định sinh tử ở Header.
- **Edge Case 22: Thành viên Ly hôn:**
  - _Xử lý:_ CSDL lưu `marital_status: 'divorced'`. Chân thẻ `MemberNode` hiển thị nhãn `Ly hôn`.
- **Edge Case 23: Triệt tiêu chữ fallback "Huyết tộc" và từ ngữ thừa thãi ("Thành viên", "Dâu họ"):**
  - _Xử lý:_ Khi thành viên chưa được phân Chi nhánh trong CSDL, chân thẻ để trống hoàn toàn (rỗng `""`), không fallback thành chữ `"Huyết tộc"`. Xóa bỏ hoàn toàn chữ `"Dâu họ"`, `"Thành viên"` vô nghĩa. Thẻ người phối ngẫu để trống chân thẻ bên phải, không nhân đôi số lượng con cái.
- **Edge Case 24: Cố định vị trí Y của Tên trên thẻ Node bất kể có hay không có năm sinh/mất:**
  - _Xử lý:_ Trong `MemberNode.tsx`, container text được cố định chiều cao `h-8` (32px), khớp tuyệt đối với kích thước avatar 32x32px. Dòng 2 chứa năm sinh - năm mất được gán chiều cao cố định `h-[14px] leading-[14px]`. Khi thẻ không có năm sinh, năm mất và chi nhánh (như `Nguyễn Thị Kim`), dòng 2 render ký tự rỗng không vỡ `\u00A0`. Nhờ đó dòng 1 (Tên) luôn luôn neo ở cùng tọa độ Y trên 100% thẻ phả đồ, triệt tiêu hiện tượng so le lệch hàng.
- **Edge Case 25: Viền thẻ người đã mất phân định theo giới tính & Xóa sạch ký tự thập `†`:**
  - _Xử lý:_ Trong `MemberNode.tsx`, `borderColor` ưu tiên ánh xạ theo giới tính (`isMale ? blue : pink`) cho 100% thành viên bất kể sinh hay tử, giúp cây phả hệ phân biệt rõ Nam/Nữ trực quan. Khối avatar bên trong giữ nền xám trang trọng cho người đã khuất. Toàn bộ các nơi hiển thị nhãn sinh tử (`MemberNode`, `MemberFormModal`, `age-utils`) xóa bỏ hoàn toàn ký tự dấu thập `†`, thay thế bằng chữ `Đã mất` chuẩn thuần phong mỹ tục dòng họ.
- **Edge Case 26: Avatar Initials trích xuất từ Tên chính sạch không dính ngoặc:**
  - _Xử lý:_ Trong `src/lib/tree-layout/avatar-utils.ts`, hàm `getMemberInitials` thực hiện tiền xử lý lọc sạch toàn bộ nội dung nằm trong ngoặc tròn `(...)` hoặc ngoặc vuông `[...]` trước khi split từ. Với `Phạm Văn Uyên (Nuôi)`, chuỗi sạch là `Phạm Văn Uyên`, hệ thống lấy chữ cái đầu của Tên đệm (`Văn` $\rightarrow$ V) và Tên chính (`Uyên` $\rightarrow$ U) $\rightarrow$ sinh ra Initials chuẩn xác là **VU** (thay vì `U(`).
- **Edge Case 27: Tách bạch triệt để Tên chính và Tên húy / Bí danh:**
  - _Xử lý:_ Trong Form nhập liệu `MemberFormModal.tsx`, khi mở chế độ sửa hoặc khi người dùng nhập chuỗi có chứa ngoặc đơn `(...)`, hệ thống tự động bóc tách phần trong ngoặc vào ô `Tên húy / Tên tự / Bí danh` và làm sạch ô `Họ và Tên (*)` chỉ chứa tên chính. Khi submit form và khi import Excel, `full_name` lưu tên chính sạch, `alias_name` lưu tên húy. Trong `MemberDetailDrawer.tsx` và `MemberNode.tsx`, tiêu đề hiển thị tên chính sạch, triệt tiêu hiện tượng hiển thị lặp `(Nuôi)` ở 2 nơi.
- **Edge Case 28: Đổi nhãn tiền tố `Tự:` thành `Tức:`:**
  - _Xử lý:_ Trong `MemberDetailDrawer.tsx` và các tooltip liên quan, đổi tiền tố hiển thị tên húy/tên gọi ở nhà từ `Tự:` thành `Tức: <span ...>{alias_name}</span>`.
- **Edge Case 29: Khối Hôn phối trong Form Modal hiển thị phối ngẫu hiện tại trước:**
  - _Xử lý:_ Khi mở form chỉnh sửa thành viên đã có vợ/chồng, hệ thống không tự ý kích hoạt tab ghép người nội tộc `spouseMode = 'existing'`. Thay vào đó, khối Hôn phối hiển thị danh sách phối ngẫu hiện tại dạng thẻ phẳng trang trọng (Bà cả, Bà hai...) kèm nút `[Gỡ/Xóa]`. Bổ sung nút `[+ Thêm Vợ]` (hoặc `[+ Thêm Chồng]`) độc lập, khi người dùng chủ động bấm mới hiện các tùy chọn thêm ngoài họ hoặc ghép nội tộc.
- **Edge Case 30: Chọn Mẹ thông minh khi thêm con (Default 1 vợ, Bắt buộc khi Đa thê):**
  - _Xử lý:_ Khi thêm con nhanh trong form của người cha: Nếu cha có 1 vợ, hệ thống tự động gán mặc định (default) mẹ là người vợ đó (kèm tùy chọn gỡ default để về *Chưa rõ mẹ*). Nếu cha có từ 2 vợ trở lên, hệ thống bắt buộc hiển thị dropdown danh sách các bà vợ để chọn đúng mẹ ruột. Khi submit form, API `POST /api/members` lưu chuẩn xác `mother_id`, chấm dứt hoàn toàn việc hardcode `null`.
- **Edge Case 31: Kéo thả sắp xếp thứ tự đàn con (Reorder Children via Drag & Drop):**
  - _Xử lý:_ Tại thẻ `MemberNode`, badge `X người con` trở thành nút bấm tương tác (có icon `⇅`). Khi click, mở `ReorderChildrenModal` hiển thị danh sách đàn con với tay nắm kéo thả `GripVertical` (HTML5 Drag & Drop native) và cặp nút `▲`/`▼`. Sau khi sắp xếp và bấm Lưu, hệ thống gọi `POST /api/members/reorder` cập nhật đồng loạt `birth_order: 1..N`, cây gia phả tự động render lại các nhánh con từ trái sang phải theo thứ tự mới.
- **Edge Case 32: Dọn trùng thứ tự sinh hàng loạt bằng Batch Reorder:**
  - _Xử lý:_ Với các trường hợp dữ liệu cũ hoặc import Excel có nhiều con cùng mang `birth_order = 1` (hoặc null), API `POST /api/members/reorder` cập nhật mảng ID theo thứ tự gán lại tuần tự `1, 2, 3... N`, triệt tiêu hoàn toàn xung đột trùng số thứ tự sinh.
- **Edge Case 33: Tuân thủ Quy tắc Bất biến React Hooks (Zero Hook After Return Guard):**
  - _Xử lý:_ Trong `MemberFormModal.tsx`, toàn bộ các hooks (`useState`, `useMemo`, `useEffect`) bắt buộc phải được khai báo ở đầu component trước câu lệnh kiểm tra điều kiện đóng/mở `if (!isOpen) return null;`. Điều kiện `!isOpen` được đặt bên trong callback của effect, triệt tiêu 100% rủi ro chênh lệch số lượng hooks giữa lần render đóng và lần render mở (`Rendered more hooks than during the previous render`).
- **Edge Case 34: Chuẩn hóa danh xưng hôn phối đơn (Vợ vs Vợ cả):**
  - _Xử lý:_ Khi thành viên chỉ có 1 người phối ngẫu (`spouses.length === 1`), danh xưng hiển thị chuẩn mực là "Vợ" (`KINSHIP_TERMS.WIFE_DEFAULT`) hoặc "Chồng" (`KINSHIP_TERMS.HUSBAND_DEFAULT`), loại bỏ hoàn toàn chữ "Vợ cả" hay "Bà cả". Danh vị thứ bậc ("Vợ cả (Bà cả)", "Vợ hai (Bà hai)") CHỈ được kích hoạt khi gia đình có từ 2 phối ngẫu trở lên (`spouses.length >= 2`).
- **Edge Case 35: Đồng bộ sự kiện Reorder toàn cục & Tự động khử trùng số thứ tự đàn con:**
  - _Xử lý:_ Khi lưu thứ tự đàn con từ `ReorderChildrenModal`, phát sự kiện toàn cục `fat:members-reordered` để `FamilyTreeCanvas` cập nhật `liveMembers`, lan truyền sang `MemberDetailDrawer` và `MemberFormModal`. Đồng thời, nếu danh sách con trong CSDL có nhiều người bị trùng số thứ tự cũ (ví dụ nhiều con cùng mang `birth_order = 1`), giao diện Drawer và Modal tự động phân giải thứ tự hiển thị tuần tự `1, 2, 3... N` (`cIdx + 1` hoặc `birth_order` sạch) thay vì hiển thị một hàng toàn số 1.
- **Edge Case 36: Neo cao độ Avatar & Dòng tên cố định bất biến (Fixed Baseline Anchor) & Dọn sạch ký tự thô:**
  - _Căn nguyên:_ Container thẻ cha `w-[200px] h-[96px]` dùng `flex flex-col justify-between`. Khi chân thẻ (Footer) không có nội dung, chiều cao chân thẻ sụp đổ khiến `justify-between` chia đều khoảng trống thừa đẩy cụm [Avatar + Tên] bị tụt xuống dưới. Ngoài ra, việc đặt nhầm chuỗi escape Unicode `\u00A0` dạng văn bản thô trong thẻ JSX `<span>\u00A0</span>` khiến React render thẳng chữ `\u00A0` lên màn hình.
  - _Xử lý:_
    1. Loại bỏ hoàn toàn class `justify-between` khỏi container thẻ cha, chuyển sang `flex flex-col` tuần tự.
    2. Header cố định chiều cao `h-[18px] shrink-0`.
    3. Body (Avatar + Tên) luôn cách Header một khoảng cách cố định `mt-1.5 shrink-0`. Khi đó, đỉnh Y của Avatar của 100% thẻ trên toàn phả đồ luôn được neo cứng tại tọa độ bất biến: $Y = 10\text{px (padding)} + 18\text{px (header)} + 6\text{px (margin)} = \mathbf{34\text{px}}$.
    4. Footer được đẩy xuống đáy bằng `mt-auto` và cố định chiều cao `h-[18px] shrink-0`. Loại bỏ hoàn toàn các thẻ placeholder thừa thãi mang text thô `\u00A0`, bảo đảm đường hairline `border-t` luôn nằm phẳng phiu ở đáy mọi thẻ card và giao diện sạch bóng 100%.
- **Edge Case 37: Cơ chế Gỡ con khỏi cha mẹ (Unlink Child) & Đồng bộ đổi Cha Mẹ theo cặp Hôn phối (Cascading Parent Coupling):**
  - _Bối cảnh & Căn nguyên:_ Khi nhập liệu hoặc import file Excel, một người con có thể bị gán nhầm vào một người cha/mẹ khác. Ở giao diện cũ, thẻ con trong mục "4. CON CÁI" của người cha chỉ là khối `div` thụ động không có nút hành động gỡ; đồng thời ở mục "2. BỐ MẸ & THỨ BẬC GIA ĐÌNH", dropdown Cha ruột và Mẹ ruột bị ẩn khi ở chế độ chỉnh sửa (`mode === 'edit'`) do điều kiện `{defaultRole !== 'child'}`. Ngoài ra, nếu người dùng đổi Cha sang người khác, việc không đồng bộ Mẹ theo cặp hôn phối có thể dẫn đến việc đứa con có Cha A và Mẹ B không phải vợ chồng của nhau, làm vỡ logic hạ nhánh con trên cây phả hệ.
  - _Xử lý:_
    1. **Thao tác trực tiếp tại Hồ sơ Cha/Mẹ (Section 4. CON CÁI):**
       - Mỗi thẻ con trong `existingChildren` có thêm nút "Gỡ con (Hủy liên kết)" (icon `UserMinus` / `Unlink`). Khi bấm, con được đưa vào danh sách chờ gỡ (`stagedUnlinkChildIds`) và thẻ con chuyển sang trạng thái gạch mờ kèm badge đỏ `[Sẽ gỡ khi Lưu]` và nút `[Hoàn tác]`.
       - Khi bấm "Cập nhật hồ sơ", gửi mảng `child_ids_to_unlink` lên API `PUT /api/members/[id]`. API tự động gỡ `father_id: null` (nếu cha đang sửa là nam) hoặc `mother_id: null` (nếu mẹ đang sửa là nữ), đưa đứa con về khay "Chưa nối phả" an toàn mà không làm mất thông tin thành viên.
       - Thêm nút "Sửa hồ sơ con" (icon `Pencil`) trên thẻ con để mở modal chỉnh sửa trực tiếp đứa con đó.
    2. **Mở khóa chọn lại Cha Mẹ tại Hồ sơ Người Con (Section 2. BỐ MẸ & THỨ BẬC GIA ĐÌNH):**
       - Sửa điều kiện hiển thị thành `{(mode === 'edit' || defaultRole !== 'child') && (...)` để luôn mở khóa dropdown Cha ruột và Mẹ ruột trong `mode === 'edit'`.
    3. **Cơ chế Cascading Auto-Sync & Coupled Marriage Filter (Đồng bộ theo cặp hôn phối):**
       - Khi người dùng đổi Cha ruột sang một người cha mới:
         - Nếu người cha mới chỉ có 1 vợ: Hệ thống tự động điền Mẹ ruột là người vợ duy nhất đó (1-click auto sync).
         - Nếu người cha mới có nhiều vợ (đa thê): Hệ thống reset `motherId = ''` và dropdown Mẹ ruột chỉ lọc ra các bà vợ của người cha mới kèm ghi chú hướng dẫn chọn con là của Bà cả hay Bà hai.
         - Nếu người cha mới chưa có vợ: Hệ thống reset `motherId = ''` (`-- Chưa rõ / Khuyết mẹ --`).
       - Dropdown Mẹ ruột chỉ cho phép chọn các bà vợ hợp pháp của người Cha đã chọn (hoặc khuyết mẹ). Tuyệt đối không thể chọn người phụ nữ không phải vợ của người cha.
       - Nếu chọn Cha là `-- Chưa rõ / Không có --`: Dropdown Mẹ mở rộng hiển thị danh sách phụ nữ trong họ/dâu họ. Khi chọn Mẹ, nếu mẹ đã có chồng trên phả đồ, hệ thống tự động gợi ý điền người chồng đó vào ô Cha.
    4. **Rào chắn kiểm chứng trước khi lưu (Spouse Integrity Guard):**
       - Nếu người dùng chọn cả Cha và Mẹ mà giữa họ không tồn tại quan hệ hôn phối trong `spouse_relations`: Nút Lưu bị chặn lại kèm cảnh báo lỗi đỏ: *"Người cha và người mẹ được chọn không phải là vợ chồng trong gia phả. Vui lòng kiểm tra lại."*
- **Edge Case 39: Cơ chế Nối Phả Thông Minh Trong Khay Chưa Nối Phả (Smart Pairing & Stepchild Relink in Unlinked Drawer):**
  - _Bối cảnh & Căn nguyên:_
    1. Trong `UnlinkedMembersDrawer.tsx`, khi người dùng bấm "Nối vào cây" cho một thành viên mồ côi (chưa nối phả), giao diện chỉ cung cấp 1 ô input tìm kiếm và chỉ cho chọn DUY NHẤT 1 người (chọn Cha hoặc chọn Mẹ) rồi bấm `[Xác nhận nối phả]`.
    2. Drawer hoàn toàn thiếu cơ chế đề xuất hoặc xác nhận người phối ngẫu còn lại. Khi người dùng bấm nối cho con, hệ thống chỉ gửi 1 ID duy nhất (`father_id` hoặc `mother_id`), để trống người còn lại (`null`).
    3. Hậu quả trực quan nghiêm trọng ngoài Cây phả hệ: Khi người dùng nối cháu `Phạm Hải Nam` vào Cụ Bẩy (nam) thì cháu Nam nhận `father_id: Bẩy, mother_id: null` (hiểu là con riêng của Bố, vẽ dây xanh lá từ Bố); còn khi nối cháu `Phạm Hà Phương` vào Bà Hiền (nữ) thì cháu Phương nhận `mother_id: Hiền, father_id: null` (hiểu là con riêng của Mẹ, vẽ dây tím nét đứt từ Mẹ). Hai đứa trẻ cùng một gia đình nhưng ngoài Cây phả hệ lại bị vẽ thành 2 đứa con riêng đơn lẻ của 2 người khác nhau.
  - _Xử lý chuẩn mực:_
    1. **Tự động đề xuất người phối ngẫu khi có 1 vợ/chồng (Auto-Suggestion with Opt-Out):**
       - Khi người dùng chọn một người Cha (nam) có duy nhất 1 người vợ: Hệ thống tự động hiển thị thẻ/checkbox đề xuất: `☑ Đồng thời nhận Mẹ: [Tên Mẹ] (Vợ của [Tên Cha])`. Mặc định được CHECKED sẵn. Khi bấm Xác nhận, gửi đồng thời cả `{ father_id, mother_id }` để con hạ nhánh chính thức từ giữa cặp vợ chồng.
       - Cho phép **BỎ TICK (Opt-Out)**: Nếu người dùng chủ động bỏ tick, hiển thị thông báo hổ phách: `⚠️ Lưu làm con riêng của Bố [Tên Cha] (Chưa rõ mẹ)`. Khi bấm Xác nhận, gửi `{ father_id, mother_id: null }`.
    2. **Bắt buộc lựa chọn khi người được chọn có $\ge 2$ vợ (Đa thê):**
       - Nếu người Cha có từ 2 vợ trở lên: Hệ thống không tự gán bừa, mà hiển thị danh sách Radio Buttons:
         - `( ) [Tên Vợ 1] (Bà cả)`
         - `( ) [Tên Vợ 2] (Bà hai)`
         - `(•) Không chọn mẹ (Lưu làm con riêng của Bố [Tên Cha])`
       - Người dùng chọn bà nào thì con sẽ nhận Mẹ là bà đó; nếu chọn "Không chọn mẹ" thì con là con riêng của Bố.
    3. **Tương tự đối xứng khi chọn người Mẹ (nữ):**
       - Nếu Mẹ có 1 chồng: Tự động đề xuất chọn Bố (mặc định checked, cho phép bỏ tick nếu là con riêng của Mẹ).
       - Nếu Mẹ có $\ge 2$ chồng (tái giá): Cho chọn người chồng hoặc không chọn.
       - Nếu Mẹ độc thân: Lưu làm con riêng của Mẹ.
    4. **Nâng cấp `onRelinkMember` API & Handler:**
       - Nâng cấp `onRelinkMember(memberId, { father_id, mother_id })` để gửi đầy đủ cả cặp phụ mẫu lên `PUT /api/members/[id]`. Canvas và CSDL cập nhật đồng bộ cả 2 trường ngay tức thì.
- **Edge Case 40: Thống Nhất Phong Cách Radio Phẳng & Xóa Bỏ Box-in-Box Trong Khay Chưa Nối (Unified Flat Radio Group & Zero Box-in-Box):**
  - _Bối cảnh & Căn nguyên:_
    1. Trong `UnlinkedMembersDrawer.tsx`, khi relink thành viên, hệ thống dùng 2 phong cách tương tác khác nhau: 1 vợ dùng Checkbox (`☑ Đồng thời nhận Mẹ...`), còn $\ge 2$ vợ (đa thê) lại dùng Radio List (`🔘 Bà cả...`). Bản chất cả hai trường hợp đều là lựa chọn loại trừ lẫn nhau (Mutually Exclusive: hoặc nhận phối ngẫu A, hoặc nhận B, hoặc lưu con riêng). Việc dùng 2 phong cách gây đứt gãy mô hình tư duy của người dùng.
    2. Lỗi kiến trúc Box-in-Box (lồng hộp): Thẻ thành viên vốn đã là một hộp viền vàng (`p-3.5 rounded-xl border border-amber-400 bg-amber-50/40`), bên trong lại bọc thêm một thẻ viền xanh lá hoặc viền vàng con (`p-2.5 rounded-lg border border-emerald-200 bg-emerald-50...`). Trong ngăn kéo Drawer có chiều ngang hẹp (`max-w-md`), việc lồng hộp khiến giao diện bị chật chội, tù túng và rối mắt, vi phạm nguyên lý Flat & Seamless UX.
  - _Xử lý chuẩn mực:_
    1. **Thống nhất 100% sang Radio Button:** Dù là 1 vợ hay $\ge 2$ vợ, giao diện dùng DUY NHẤT một danh sách Radio Button:
       - Danh sách người phối ngẫu (1 vợ hoặc các bà vợ): Mỗi option có Radio button amber, nhãn danh xưng và tên đậm, kèm dòng giải thích xanh ngọc nhẹ `✓ Con chung của cả hai người (hạ nhánh chính giữa cặp vợ chồng)`. Mặc định chọn vợ đầu tiên.
       - Option cuối cùng luôn là: `🔘 Không chọn mẹ (Lưu làm con riêng của Bố [Tên])` kèm dòng giải thích hổ phách `⚠️ Lưu làm con riêng của Bố (hạ nhánh trực tiếp từ Bố)`.
       - Nếu độc thân: Dòng text mờ trang nhã (không bọc box): `ℹ Người này chưa có bạn đời trong phả hệ → Sẽ lưu làm con riêng.`
    2. **Zero Box-in-Box:** Bỏ 100% các container viền lồng hộp (`border border-emerald-200 bg-emerald-50` hay `border border-amber-200 bg-amber-50`). Khối lựa chọn phối ngẫu nằm phẳng, phân cách với danh sách cha mẹ bằng đường kẻ ngang mỏng `border-t border-amber-200/60 pt-2.5 mt-2` và tiêu đề nhỏ thanh lịch `text-[11px] font-semibold text-slate-700`.
- **Edge Case 41: Chặn Thao Tác Trái Thẩm Quyền & Rào Chắn Mã Lỗi HTTP 403 Forbidden (RBAC Server Gate):**
  - _Bối cảnh:_ Người dùng có role `viewer` (hoặc `claimed_member`) có thể cố tình gửi lệnh HTTP qua Postman/Curl hoặc lợi dụng các lỗ hổng UI cũ để gọi các route mutation (`POST /api/members`, `PUT /api/members/[id]`, `DELETE /api/members/[id]`, `POST /api/admin/import`).
  - _Xử lý chuẩn mực:_
    1. Server Guard `verifyServerRole` kiểm tra quyền trước khi thực thi bất kỳ logic nghiệp vụ nào.
    2. Nếu không đủ quyền, lập tức chặn đứng (fail-fast) và trả về response chuẩn:
       `HTTP 403 Forbidden`: `{ success: false, error: 'Bạn không có quyền thực hiện thao tác này' }`.
    3. Không rò rỉ stack trace hay cấu trúc database ra bên ngoài khi từ chối truy cập.

---

## 7. MA TRẬN TEST CASES & TIÊU CHÍ NGHIỆM THU (TEST SPECIFICATION)

### 7.1. Bảng Kịch Bản Kiểm Thử Tự Động (Automated Test Suite trong `tests/`)

- [x] **TC_UT01** (Chặn vòng lặp cha-con trực tiếp): `tests/graph-validation.test.ts` — PASS (1.80ms). Ném `CycleDetectedError` khi gán con làm cha hoặc gán chính mình làm cha.
- [x] **TC_UT02** (Chặn vòng lặp gián tiếp 3 đời): `tests/graph-validation.test.ts` — PASS (0.31ms). `isDescendantOf` phát hiện chắt là hậu duệ của cụ tổ, chặn gán chắt làm cha cụ.
- [x] **TC_UT03** (Lọc thành viên chưa nối loại trừ Dâu/Rể): `tests/graph-validation.test.ts` — PASS (0.40ms). Dâu ngoại tộc Lê Thị Hoa và Cụ tổ không bị nhốt vào khay chưa nối; chỉ bắt đúng người mồ côi.
- [x] **TC_UT04** (Đệ quy cập nhật thế hệ khi nối phả): `tests/graph-validation.test.ts` — PASS (0.45ms). Nối nhánh X-Y-Z vào Đời 3 tự động cập nhật đệ quy thế hệ lên 4, 5, 6.
- [x] **TC_UT05** (Chính sách xóa an toàn RESTRICT): `tests/graph-validation.test.ts` — PASS (0.31ms). Chặn xóa thành viên đang có con (`canDelete: false`), chỉ cho phép xóa Node Lá.
- [x] **TC_UT06** (Phát hiện hôn nhân nội tộc qua LCA): `tests/graph-validation.test.ts` — PASS (3.32ms). Phát hiện chính xác Tuấn và Mai có chung Cụ Tổ Khởi, trả về `isConsanguineous: true`.
- [x] **TC_XLS01** (Parse file Excel mẫu hợp lệ): `tests/excel-parser.test.ts` — PASS (26.66ms). Tạo template, đọc buffer, parse đủ 4 dòng, `canImport: true`, 0 lỗi.
- [x] **TC_XLS02** (Sắp xếp Topological Sort theo thế hệ): `tests/excel-parser.test.ts` — PASS (0.43ms). Đưa Cụ Tổ lên đầu, Con ở giữa, Cháu ở cuối bất kể thứ tự dòng trong file.
- [x] **TC_XLS03** (Phát hiện lỗi STT cha mẹ không tồn tại): `tests/excel-parser.test.ts` — PASS (0.51ms). Bắt lỗi thiếu họ tên, mã cha mẹ không tồn tại, ngày âm lịch > 30.
- [x] **TC_XLS04** (Phát hiện chu trình phụ thuộc trong Excel): `tests/excel-parser.test.ts` — PASS (0.44ms). Phát hiện vòng lặp kín giữa dòng 1 và dòng 2, khóa quyền import.
- [x] **TC_INT01** (API Contract tạo thành viên mới): `tests/member-api.test.ts` — PASS (6.32ms). `POST /api/members` trả về HTTP 201 và tự động gán thế hệ = thế hệ cha + 1.
- [x] **TC_INT02** (API Contract từ chối xóa người có con): `tests/member-api.test.ts` — PASS (0.96ms). `DELETE /api/members/[id]` từ chối xóa Cụ Khởi (HTTP 400).
- [x] **TC_INT03** (API Contract tạo hôn phối nội tộc): `tests/member-api.test.ts` — PASS (2.10ms). `POST /api/spouse-relations` tạo cặp họ hàng Phong & Nga thành công, trả về cờ nội tộc `is_consanguineous: true`.
- [x] **TC_INT04** (API Contract Bulk Import): `tests/member-api.test.ts` — PASS (1.46ms). `POST /api/admin/import` nạp batch dữ liệu thành công (HTTP 200).
- [x] **TC_INT05** (API tạo thành viên kèm inline phối ngẫu mới ngoài họ): `tests/member-api.test.ts` — PASS (1.24ms). `POST /api/members` với `new_spouse_name` tự động tạo cả thành viên chính, phối ngẫu mới và bản ghi `spouse_relations`.
- [x] **TC_INT06** (API gán con cái từ danh sách chưa nối): `tests/member-api.test.ts` — PASS (1.81ms). `POST /api/members` hoặc `PUT /api/members/[id]` với `child_ids_to_link` tự động cập nhật quan hệ cha/mẹ cho các con.
- [x] **TC_UT_NODE_DIM01** (Khai báo kích thước Node tường minh chống lỗi viewport): `tests/tree-layout.test.ts` — PASS (0.49ms). 100% object Node (`memberNode` & `ghostNode`) trả về từ `calculateTreeLayout` có `width === 200` và `height === 96`.
- [x] **TC_INT07** (API Server Mutation sử dụng Supabase Admin Client): `tests/member-api.test.ts` — PASS (5.07ms). Thao tác `createAdminClient` khởi tạo đúng Service Role Client và API Server Mutation chấp nhận mutation qua admin client thành công, không bị RLS chặn hoặc nuốt lỗi.
- [x] **TC_UT_VIEWPORT_01** (Kiểm tra Camera Config & Default Viewport trong FamilyTreeCanvas): `tests/tree-layout.test.ts` — PASS (0.32ms). Tọa độ đồ thị Clan 28 phù hợp với dải `defaultViewport` và `calculateTreeLayout` cung cấp đủ dữ liệu bounding box.
- [x] **TC_UT_DISTDIR_01** (Kiểm tra Cách Ly Build `next.config.mjs`): `tests/member-api.test.ts` — PASS (1.55ms). Module `next.config.mjs` xử lý chuẩn xác `distDir` theo biến môi trường `NEXT_DIST_DIR` (fallback `.next`).
- [x] **TC_UT_THEME_01** (Kiểm tra Đồng Bộ Hóa Theme Globals & Tailwind Contract): `tests/theme-and-layout.test.ts` — PASS (0.68ms). Xác nhận `globals.css` không còn chứa `@media (prefers-color-scheme: dark)` tự ý ép màu body và có selector `.dark` phân định rõ ràng.
- [x] **TC_UT_CANVAS_CONTAINER_01** (Kiểm tra Cấu Trúc Viewport Container của Canvas): `tests/theme-and-layout.test.ts` — PASS (0.32ms). Xác nhận `TreePage` và `FamilyTreeCanvas` có khai báo definite height chống sụp đổ Flexbox container.
- [x] **TC_UT_CANVAS_HEIGHT_ANCHOR_01** (Kiểm tra Neo Chiều Cao Trực Tiếp Của Canvas & html/body 100%): `tests/theme-and-layout.test.ts` — PASS (0.34ms). Xác nhận `FamilyTreeCanvas.tsx` có khai báo trực tiếp neo chiều cao `style={{ width: '100%', height: 'calc(100vh - 4rem)' }}` và `globals.css` có rule `html, body { height: 100% }`.
- [x] **TC_UT_AGE_01** (Chặn con sinh trước hoặc cùng năm với Bố/Mẹ): `tests/graph-validation.test.ts` — PASS (0.50ms). Hàm `validateParentChildAge` ném lỗi khi con sinh năm $\le$ năm sinh bố/mẹ.
- [x] **TC_UT_SENIOR_01** (Phát hiện và giải quyết xung đột Con Trưởng): `tests/graph-validation.test.ts` — PASS (0.28ms). Kiểm tra hàm `resolveSeniorConflict` chỉ giữ lại duy nhất 1 con trưởng trong gia đình.
- [x] **TC_UT_AGE_CALC_01** (Tính toán song song Tuổi Dương & Tuổi Mụ kèm Tooltip): `tests/age-utils.test.ts` — PASS (1.20ms). Hàm `calculateMemberAge` trả về chính xác tuổi dương, tuổi mụ và nội dung tooltip giải thích công thức.
- [x] **TC_INT_ORDER_01** (API dọn trùng thứ tự sinh birth_order): `tests/member-api.test.ts` — PASS (1.40ms). `POST /api/members` với `birth_order` trùng người cũ tự động gỡ `birth_order` của người cũ về null.
- [x] **TC_INT_SENIOR_01** (API tự động hạ cờ Con Trưởng cũ khi có Con Trưởng mới): `tests/member-api.test.ts` — PASS (1.76ms). `POST /api/members` với `is_senior = true` tự động hạ cờ `is_senior = false` của anh em ruột.
- [x] **TC_INT_SPOUSE_ORDER_01** (API lưu đúng thứ bậc hôn phối marriage_order): `tests/member-api.test.ts` — PASS (2.01ms). `POST /api/members` với `spouse_id` và `marriage_order = 2` lưu đúng bản ghi `spouse_relations` là Vợ hai.
- [x] **TC_INT_AGE_01** (API từ chối lưu con có năm sinh <= năm sinh bố mẹ): `tests/member-api.test.ts` — PASS (0.81ms). `POST /api/members` từ chối khi năm sinh con $\le$ năm sinh bố/mẹ (HTTP 400).
- [x] **TC_UT_THEME_SYNC_01** (Hook useAppTheme phản ứng reactive với class .dark trên <html>): `tests/theme-and-layout.test.ts` — PASS (0.23ms). Kiểm tra hook cập nhật trạng thái `isDark` và `theme` khi `document.documentElement` thay đổi class `dark`.
- [x] **TC_UT_CANVAS_COLORMODE_01** (FamilyTreeCanvas đồng bộ colorMode với theme ứng dụng): `tests/theme-and-layout.test.ts` — PASS (0.24ms). Xác nhận `FamilyTreeCanvas.tsx` sử dụng reactive `colorMode` thay vì gán cứng `colorMode="system"`.
- [x] **TC_UT_STICKY_FOOTER_FLOW_01** (Kiểm tra Flex Sticky Footer và giải phóng h-full khỏi main): `tests/theme-and-layout.test.ts` — PASS (0.28ms). Xác nhận `layout.tsx` không gán `h-full` trên `<main>`, `globals.css` khai báo `body { min-height: 100% }`, bảo đảm footer không bị kẹp lơ lửng trên trang nội dung dài.
- [x] **TC_INT_INTERNAL_SPOUSE_SUBMIT** (Form thêm phối ngẫu nội tộc gọi API quan hệ hôn phối, không tạo duplicate member): `tests/member-api.test.ts` — PASS (2.05ms). Khi `spouseOrigin === 'internal'`, submit gọi `POST /api/spouse-relations` thay vì `POST /api/members`, không tạo thêm member trùng lặp.
- [x] **TC_UT_DRAWER_SAFE_DELETE_STATUS** (Xác định khả năng xóa an toàn của node trên MemberDetailDrawer): `tests/graph-validation.test.ts` — PASS (0.35ms). Hàm `canDeleteMember` xác định đúng node có con không thể xóa (`canDelete: false`) và node lá có thể xóa (`canDelete: true`).
- [x] **TC_UT_IMPORT_PAGE_GEOMETRY** (Trang /admin/import tuân thủ Crisp Architectural Geometry): `tests/theme-and-layout.test.ts` — PASS (1.95ms). Xác nhận trang import không còn class `rounded-2xl` hay `rounded-3xl`, toàn bộ thẻ card, dropzone, table preview dùng `rounded-lg` / `rounded-md`.
- [x] **TC_INT_IMPORT_DB_ERROR_PROPAGATION** (API /api/admin/import ném lỗi HTTP 500 khi Supabase insert thất bại): `tests/member-api.test.ts` — PASS (0.78ms). Khi thao tác DB bị lỗi, API không nuốt lỗi mà trả về HTTP 500 kèm chi tiết lỗi.
- [x] **TC_UT_MARITAL_01** (Kiểm chứng chỉ hỗ trợ 3 giá trị `remarried`, `divorced`, `null` & nhãn Tái giá): `tests/marital-status.test.ts` — PASS (3.72ms). Thẻ Node con dâu tái giá nạp đúng `maritalStatus="remarried"`, nhãn hiển thị "Tái giá" và loại bỏ fallback "Huyết tộc".
- [x] **TC_UT_MARITAL_02** (Kiểm chứng tự động ánh xạ nhãn theo giới tính): `tests/marital-status.test.ts` — PASS (0.59ms). Nữ `remarried` $\rightarrow$ "Tái giá", Nam `remarried` $\rightarrow$ "Đã lấy vợ", `divorced` $\rightarrow$ "Ly hôn".
- [x] **TC_UT_MARITAL_03** (Kiểm chứng thẻ Node dọn sạch chữ Huyết tộc & Dâu họ): `tests/marital-status.test.ts` — PASS (1.29ms). Thẻ thành viên chưa có chi để trống chân thẻ, không hiện "Huyết tộc"; chân thẻ hiển thị đúng "Tái giá" / "Đã lấy vợ"; chân thẻ bên phải người phối ngẫu để trống số con.
- [x] **TC_UT_MARITAL_04** (Kiểm chứng bóc tách tự động Nguyễn Thị Kim và Tạ Duy Hưng mang trạng thái `remarried`): `tests/marital-status.test.ts` — PASS (38.28ms). Parser tự động nhận diện từ khóa `tái giá`, `lấy vợ`, `ly hôn` để gán `maritalStatus` và năm biến cố.
- [x] **TC_UT_MARITAL_05** (Bảo toàn kích thước chuẩn 200x96px cho 100% node): `tests/marital-status.test.ts` — PASS (1.14ms). 100% các node mang tình trạng hôn nhân đặc biệt bảo toàn kích thước chuẩn 200 x 96 px.
- [x] **TC_UT_AVATAR_NAME_WITH_PARENTHESES** (Avatar Initials lọc sạch ngoặc đơn/kép và tên húy): `tests/avatar-utils.test.ts` & `tests/ui-normalization-and-identity.test.ts` — PASS (1.10ms). Kiểm tra `getMemberInitials('Phạm Văn Uyên (Nuôi)') === 'VU'`, `getMemberInitials('Phạm Văn Cường (Cường Nhỏ)') === 'VC'`, `getMemberInitials('(Nuôi)') === 'NU'`.
- [x] **TC_UT_NODE_NAME_Y_ANCHOR_RESERVE** (Thẻ Node bảo đảm chiều cao cố định 32px và slot 14px cho dòng 2): `tests/ui-normalization-and-identity.test.ts` — PASS (0.46ms). Container text trong `MemberNode.tsx` có chiều cao 32px và dòng 2 có slot 14px với fallback `\u00A0`.
- [x] **TC_UT_DECEASED_GENDER_BORDER_COLOR** (Thẻ người đã mất giữ viền theo giới tính và không còn ký tự thập †): `tests/ui-normalization-and-identity.test.ts` — PASS (0.31ms). Thẻ người đã mất nam giới mang viền xanh (`border-blue-...`), nữ giới mang viền hồng (`border-pink-...`), badge hiển thị `Đã mất` không chứa `†`.
- [x] **TC_UT_ALIAS_NAME_SEPARATION_CLEANSE** (Tự động làm sạch tên chính và bóc tách Tên húy/Bí danh): `tests/ui-normalization-and-identity.test.ts` — PASS (0.76ms). Chuỗi `Phạm Văn Uyên (Nuôi)` được tách thành `full_name = 'Phạm Văn Uyên'` và `alias_name = 'Nuôi'`.
- [x] **TC_UT_DRAWER_TUC_LABEL** (MemberDetailDrawer hiển thị nhãn Tức: thay vì Tự:): `tests/ui-normalization-and-identity.test.ts` — PASS (0.33ms). Drawer render nhãn `Tức:` kèm `alias_name` và tiêu đề không bị lặp tên húy.
- [x] **TC_UT_AGE_UTILS_NO_DAGGER** (Hàm calculateMemberAge không còn trả về ký tự †): `tests/ui-normalization-and-identity.test.ts` & `tests/age-utils.test.ts` — PASS (0.23ms). `calculateMemberAge(1920, null, 'deceased')` trả về nhãn `SN 1920 (Đã mất)` không chứa `†`.
- [x] **TC_UT_REORDER_01** (API /api/members/reorder cập nhật đồng loạt birth_order 1..N): `tests/member-reorder.test.ts` — PASS (1.85ms). Given đàn con 8 người bị trùng `birth_order = 1`, When gọi batch reorder với mảng 8 ID đảo ngược, Then toàn bộ 8 con nhận `birth_order: 1..8` theo đúng thứ tự mảng, không bị xung đột gán null.
- [x] **TC_UT_MOTHER_SELECT_01** (Logic chọn mẹ khi cha có 1 vợ vs đa thê): `tests/mother-selection.test.ts` — PASS (0.42ms). Given người cha có 1 vợ thì hàm helper/form trả về `defaultMotherId` là người vợ đó; Given người cha có 2 vợ thì danh sách mẹ trả về đủ 2 người và cờ `requiresSelection = true`.
- [x] **TC_INT_QUICK_CHILD_MOTHER_01** (API tạo con nhanh lưu kèm mother_id chuẩn xác): `tests/mother-selection.test.ts` — PASS (0.65ms). Khi submit form với staged quick child có `motherId`, API `POST /api/members` lưu bản ghi có `mother_id !== null` và `father_id !== null`.
- [x] **TC_UT_SPOUSE_DISPLAY_INIT_01** (Khởi tạo form thành viên đã có vợ không bị ép vào tab nội tộc): `tests/ui-normalization-and-identity.test.ts` — PASS (0.76ms). Form edit thành viên có vợ khởi tạo với danh sách phối ngẫu hiện có và `spouseMode === 'none'`, không tự động chọn tab 'existing'; thẻ Node tích hợp nút dispatch reorder.
- [x] **TC_UT_ZERO_HOOK_AFTER_RETURN_GUARD** (MemberFormModal tuân thủ 100% React Rules of Hooks): `tests/ui-normalization-and-identity.test.ts` — PASS (1.62ms). Given mã nguồn `src/components/modals/MemberFormModal.tsx`, When phân tích vị trí các lệnh hooks và câu lệnh early return `if (!isOpen) return null;`, Then 100% khai báo hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`) phải nằm TRƯỚC câu lệnh early return, không có bất kỳ hook nào nằm sau.
- [x] **TC_UT_SINGLE_SPOUSE_LABEL_01** (Thành viên 1 vợ chỉ hiển thị danh xưng "Vợ", không hiển thị "Vợ cả/Bà cả"): `tests/ui-normalization-and-identity.test.ts` — PASS (0.95ms). Given thành viên có 1 người vợ trong spouse relations, When kiểm tra nhãn hiển thị tại MemberDetailDrawer và MemberFormModal, Then nhãn là "Vợ", không chứa "Vợ cả" hay "Bà cả"; Given thành viên có 2 vợ, Then hiển thị phân định "Vợ cả (Bà cả)" và "Vợ hai (Bà hai)".
- [x] **TC_UT_CHILDREN_DUPLICATE_ORDER_FALLBACK_01** (Tự động khử trùng số thứ tự đàn con khi hiển thị): `tests/ui-normalization-and-identity.test.ts` — PASS (1.09ms). Given đàn con 7 người có 6 người đầu cùng mang `birth_order = 1`, When render danh sách con trong Drawer và Modal, Then số thứ tự hiển thị trong badge tròn tự động phân giải tuần tự thành `1, 2, 3, 4, 5, 6, 7`, không còn hiện tượng toàn số 1.
- [x] **TC_INT_REORDER_EVENT_SYNC_01** (Sự kiện fat:members-reordered đồng bộ liveMembers trên Canvas): `tests/member-reorder.test.ts` — PASS (1.20ms). Khi gọi lưu thứ tự từ ReorderChildrenModal, component phát CustomEvent `fat:members-reordered` mang payload `{ parentId, updatedChildren }` và Canvas cập nhật `liveMembers` đồng bộ tức thì.
- [x] **TC_UT_NODE_AVATAR_BASELINE_ANCHOR_01** (Thẻ Node neo cứng vị trí Y của Avatar và Tên bằng mt-auto và fixed geometry, loại bỏ justify-between): `tests/ui-normalization-and-identity.test.ts` — PASS (0.38ms). Given mã nguồn `src/components/tree/MemberNode.tsx`, When kiểm tra class của container thẻ cha và các phần tử con, Then container thẻ cha không còn sử dụng `justify-between`, phần tử Body sử dụng khoảng cách cố định từ Header, và Footer sử dụng `mt-auto` với chiều cao cố định `h-[18px]` hoặc `min-h-[18px]` để triệt tiêu hoàn toàn hiện tượng tụt Avatar khi chân thẻ rỗng.
- [x] **TC_UT_NO_RAW_UNICODE_IN_JSX_01** (Loại bỏ hoàn toàn ký tự thô \\u00A0 trong JSX của thẻ Node): `tests/ui-normalization-and-identity.test.ts` — PASS (0.38ms). Given mã nguồn `src/components/tree/MemberNode.tsx`, When kiểm tra toàn bộ JSX footer và children, Then không còn thẻ nào chứa chuỗi văn bản thô `\\u00A0` ngoài biểu thức JS hợp lệ, bảo đảm chân thẻ không in rác text lên giao diện người dùng.
- [x] **TC_INT_UNLINK_CHILD_01** (API /api/members/[id] hỗ trợ child_ids_to_unlink): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (10.64ms). Given thành viên cha đang có 2 con, When gọi `PUT /api/members/[id]` với `child_ids_to_unlink: [child1.id]`, Then `child1.father_id` được cập nhật thành `null`, đưa con về khay chưa nối phả và `child2` vẫn giữ nguyên quan hệ.
- [x] **TC_UT_PARENT_CASCADING_SELECT_01** (Logic Cascading Dropdown tự động đồng bộ Mẹ theo Cha): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (1.32ms). Given người cha mới có 1 vợ, When đổi Cha sang người đó, Then hàm phân giải/handler tự động gán Mẹ là người vợ đó; Given người cha mới có 2 vợ, Then Mẹ được reset và danh sách mẹ khả dụng chỉ chứa 2 người vợ đó.
- [x] **TC_UT_SPOUSE_INTEGRITY_GUARD_01** (Rào chắn chặn lưu nếu Bố và Mẹ không phải vợ chồng): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (0.29ms). Given người dùng chọn Bố A và Mẹ B nhưng B không nằm trong danh sách phối ngẫu của A, When thực hiện kiểm tra tính hợp lệ (validateParentCoupling), Then trả về `isValid: false` kèm thông báo lỗi rõ ràng.
- [x] **TC_UT_EDIT_MODE_PARENTS_UNLOCKED_01** (Mục Bố Mẹ luôn mở khóa dropdown trong mode edit): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (0.59ms). Given mã nguồn `src/components/modals/MemberFormModal.tsx`, When kiểm tra điều kiện render của Khối 2 Bố Mẹ & Thứ bậc gia đình, Then điều kiện cho phép hiển thị trong `mode === 'edit'` bất kể `defaultRole`.
- [x] **TC_UT_PARENT_OPTOUT_SINGLE_PARENT_01** (Logic Opt-out cho phép lưu con riêng của Cha hoặc Mẹ): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (0.35ms). Given người cha có 1 vợ, When người dùng bấm bỏ chọn Mẹ (`motherId = ''`), Then state Mẹ giữ nguyên rỗng, không bị auto-sync điền lại và payload submit chứa `father_id !== null`, `mother_id === null`.
- [x] **TC_UT_PARENT_PAIRING_CONFIRMATION_01** (Phân giải trạng thái Cặp Phụ Mẫu): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (0.42ms). Hàm phân giải trạng thái cặp phụ mẫu: Đủ cha mẹ hợp pháp $\rightarrow$ `status: 'valid_couple'`; Chỉ có cha (hoặc mẹ) $\rightarrow$ `status: 'single_parent'`; Cha mẹ không phải vợ chồng $\rightarrow$ `status: 'invalid_couple'`.
- [x] **TC_INT_GENDER_AWARE_RELINK_01** (Nối phả nhận diện giới tính không gán nhầm cột): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (1.85ms). Khi gọi nối phả vào người Nam $\rightarrow$ cập nhật `father_id`; khi gọi nối phả vào người Nữ $\rightarrow$ cập nhật `mother_id`, không gán ID người nữ vào `father_id`.
- [x] **TC_UT_UNLINKED_DRAWER_SPOUSE_CONTEXT_01** (Danh sách cha mẹ trong Khay Chưa Nối hiển thị kèm ngữ cảnh phối ngẫu): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (0.39ms). Given danh sách ứng viên cha mẹ trong Drawer, Then mỗi ứng viên hiển thị kèm thông tin bạn đời (ví dụ: `Nguyễn Thị Thuý Hiền (Vợ của Phạm Văn Bẩy)`) để người dùng không bị nhầm lẫn người trùng tên.
- [x] **TC_UT_DRAWER_SMART_PAIRING_SINGLE_SPOUSE_01** (Khay Chưa Nối tự động đề xuất người còn lại khi có 1 vợ/chồng & hỗ trợ Opt-out con riêng): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (0.35ms). Given người cha có 1 vợ trong Drawer, When chọn người cha đó, Then hệ thống tự động đề xuất mẹ và mặc định checked (payload gồm cả cha và mẹ); When người dùng bỏ tick, Then payload chỉ chứa cha và mother_id là null (con riêng).
- [x] **TC_UT_DRAWER_SMART_PAIRING_MULTI_SPOUSE_01** (Khay Chưa Nối hiển thị danh sách chọn mẹ khi người cha có đa thê): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (0.30ms). Given người cha có 2 vợ (Chiến có Mơ & Liễu), When chọn người cha đó trong Drawer, Then hệ thống hiển thị danh sách các bà vợ và tùy chọn con riêng, không tự động gán cứng bất kỳ ai.
- [x] **TC_INT_DRAWER_RELINK_FULL_PAYLOAD_01** (onRelinkMember truyền payload cả cha lẫn mẹ lên API): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (1.62ms). Given thành viên chưa nối phả, When gọi relink với payload `{ father_id, mother_id }`, Then API cập nhật đồng thời cả hai trường và con hạ nhánh chính thức từ cặp vợ chồng.
- [x] **TC_UT_DRAWER_UNIFIED_FLAT_RADIO_01** (Thống nhất lựa chọn phối ngẫu qua Radio phẳng cho cả 1 vợ và nhiều vợ): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (0.32ms). Given hàm `resolveRelinkPayload`, When người dùng chọn phối ngẫu (dù 1 vợ hay nhiều vợ) qua Radio, Then trả về `{ father_id, mother_id }` đầy đủ; When chọn option không phối ngẫu (con riêng), Then trả về `mother_id: null` (hoặc `father_id: null`).
- [x] **TC_UT_DRAWER_ZERO_BOX_IN_BOX_GUARD_01** (Rào chắn kiểm tra cấu trúc mã nguồn không box-in-box): `tests/child-unlink-and-parent-reassignment.test.ts` — PASS (1.89ms). Quét source code `UnlinkedMembersDrawer.tsx` bảo đảm không còn container lồng hộp `border-emerald-200` / `border-amber-200` trong khối relink, và 100% lựa chọn phối ngẫu sử dụng `type="radio"`.
- [x] **TC_UT_RBAC_PERMISSIONS_MATRIX** (Ma trận quyền ROLE_PERMISSIONS cho 4 vai trò): `tests/rbac-permissions.test.ts` — PASS (0.52ms). Given 4 role (`viewer`, `claimed_member`, `branch_editor`, `super_admin`), When kiểm tra ma trận `ROLE_PERMISSIONS`, Then `viewer` chỉ có quyền xem ('tree:view'); `claimed_member` chỉ có quyền xem; `branch_editor` có quyền sửa/xóa và quản lý chưa nối; `super_admin` có toàn quyền bao gồm `excel:import` và `admin:access`.
- [x] **TC_UT_API_MEMBERS_REJECTS_VIEWER** (POST /api/members trả về HTTP 403 khi role là viewer): `tests/rbac-permissions.test.ts` — PASS (1.82ms). Given request tạo thành viên mới từ tài khoản role `viewer` (hoặc không có session), When gọi `POST /api/members`, Then API từ chối với status `403 Forbidden` và payload `{ success: false, error: 'Bạn không có quyền thực hiện thao tác này' }`.
- [x] **TC_UT_API_MEMBERS_UPDATE_REJECTS_VIEWER** (PUT /api/members/[id] trả về HTTP 403 khi role là viewer): `tests/rbac-permissions.test.ts` — PASS (1.25ms). Given request cập nhật thông tin thành viên từ tài khoản role `viewer`, When gọi `PUT /api/members/[id]`, Then API trả về `403 Forbidden`.
- [x] **TC_UT_API_MEMBERS_DELETE_REJECTS_VIEWER** (DELETE /api/members/[id] trả về HTTP 403 khi role là viewer): `tests/rbac-permissions.test.ts` — PASS (1.10ms). Given request xóa thành viên từ tài khoản role `viewer`, When gọi `DELETE /api/members/[id]`, Then API trả về `403 Forbidden`.
- [x] **TC_UT_API_IMPORT_REQUIRES_SUPER_ADMIN** (POST /api/admin/import chỉ cho phép super_admin): `tests/rbac-permissions.test.ts` — PASS (1.45ms). Given request nhập Excel từ tài khoản `viewer` hoặc `branch_editor`, When gọi `POST /api/admin/import`, Then API từ chối với status `403 Forbidden`; Given request từ `super_admin`, Then API tiếp nhận xử lý bình thường.
- [x] **TC_UT_TREE_PAGE_PASSES_USER_ROLE** (Trang /tree trích xuất role và truyền canManageTree xuống Canvas): `tests/rbac-permissions.test.ts` — PASS (0.48ms). Quét file `src/app/tree/page.tsx`, đảm bảo Server Component đọc session/cookie người dùng và truyền prop `canManageTree` xuống `FamilyTreeCanvas`.
- [x] **TC_UT_TOOLBAR_HIDES_ADD_AND_UNLINKED_FOR_VIEWER** (TreeToolbar ẩn nút Thêm người và Khay chưa nối khi canManageTree = false): `tests/rbac-permissions.test.ts` — PASS (0.42ms). Quét file `src/components/tree/TreeToolbar.tsx`, đảm bảo nút `UserPlus` ("Thêm người") và nút `Link2` ("Chưa nối: X") được bảo vệ bởi điều kiện `canManageTree` và tự động ẩn hoàn toàn đối với Viewer.
- [x] **TC_UT_DRAWER_HIDES_EDIT_DELETE_FOR_VIEWER** (MemberDetailDrawer ẩn nút Sửa và Xóa hồ sơ khi canManageTree = false): `tests/rbac-permissions.test.ts` — PASS (0.40ms). Quét file `src/components/tree/MemberDetailDrawer.tsx`, đảm bảo nút `Edit3` ("Sửa hồ sơ") và nút `Trash2` ("Xóa hồ sơ") nhận prop `canManageTree` và tự động ẩn khi người dùng là Viewer.
- [x] **TC_UT_TOOLBAR_NO_MOCK_DATASET** (TreeToolbar loại bỏ hoàn toàn khối Nguồn dữ liệu kiểm thử): `tests/theme-and-layout.test.ts` — PASS (0.33ms). Quét mã nguồn `TreeToolbar.tsx`, đảm bảo không còn chuỗi "Nguồn dữ liệu kiểm thử" và không còn render các nút chuyển đổi dataset mock (`clan28`, `polygamy`, `clan1500`).
- [x] **TC_UT_NAVBAR_KINSHIP_ICON_USERS** (Desktop Navbar sử dụng icon Users cho mục Xưng hô): `tests/theme-and-layout.test.ts` — PASS (0.17ms). Quét mã nguồn `Navbar.tsx`, đảm bảo liên kết `/kinship` ("Xưng hô") import và render icon `Users`, không còn dùng `Compass`.
- [x] **TC_UT_MOBILE_NAV_KINSHIP_ICON_USERS** (Mobile Bottom Nav sử dụng icon Users cho tab Xưng hô): `tests/theme-and-layout.test.ts` — PASS (0.16ms). Quét mã nguồn `MobileBottomNav.tsx`, đảm bảo item `/kinship` trong `NAV_ITEMS` có thuộc tính `icon: Users`, không còn dùng `Compass`.
- [x] **TC_UT_KINSHIP_HERO_ICON_USERS** (Trang /kinship sử dụng icon Users trên hero badge): `tests/theme-and-layout.test.ts` — PASS (1.16ms). Quét mã nguồn `src/app/kinship/page.tsx`, đảm bảo badge hero đầu trang render icon `Users`, không còn dùng `Compass`.

### 7.2. Danh Sách Tiêu Chí Nghiệm Thu Thị Giác (Human Visual UAT Matrix)

- [ ] **UAT_01 (Thêm Con 1 Cấp):** Mở `MemberDetailDrawer` của một người cha có 2 vợ $\rightarrow$ Bấm nút "Thêm con" $\rightarrow$ Modal `MemberFormModal` mở lên 1 cấp, Bố được điền sẵn, Dropdown Mẹ ruột hiển thị đúng 2 người vợ $\rightarrow$ Điền ngày mất Âm lịch (15/08) $\rightarrow$ Bấm Lưu $\rightarrow$ Node con xuất hiện trên Canvas, camera lướt nhẹ nhàng tới vị trí con mới.
- [ ] **UAT_02 (Cảnh Báo Hôn Nhân Nội Tộc):** Thêm quan hệ vợ chồng giữa 2 người có chung Cụ tổ $\rightarrow$ Modal hiển thị huy hiệu màu hổ phách "Hôn nhân nội tộc" kèm thông tin Tổ tiên chung $\rightarrow$ Canvas hiển thị Ghost Node 🔗 nét đứt tại nhánh phối ngẫu.
- [ ] **UAT_03 (Khay Chưa Nối & Nối Phả):** Tạo 1 thành viên mồ côi $\rightarrow$ Badge trên `TreeToolbar` hiển thị `🔗 Chưa nối: 1` $\rightarrow$ Mở `UnlinkedMembersDrawer` $\rightarrow$ Thấy đúng thành viên đó (không chứa Dâu/Rể ngoại tộc) $\rightarrow$ Bấm "Nối vào cây", tìm Bố $\rightarrow$ Nối thành công, node xuất hiện trên cây chính và biến mất khỏi khay.
- [ ] **UAT_04 (Bulk Excel Import Preview):** Truy cập `/admin/import` $\rightarrow$ Tải file template mẫu $\rightarrow$ Kéo thả file Excel test $\rightarrow$ Bảng Preview hiển thị các dòng lỗi (màu đỏ) và dòng hợp lệ (màu xanh) $\rightarrow$ Nút "Xác nhận nhập" tự động mở khóa khi dữ liệu chuẩn.
- [ ] **UAT_05 (Console Sạch):** Mở Developer Console trên trình duyệt trong suốt quá trình thao tác $\rightarrow$ 0 lỗi đỏ (Uncaught Error), 0 cảnh báo Hydration mismatch.
- [ ] **UAT_06 (Form Phẳng Flat Seamless - Xóa Bỏ Box-in-Box):** Toàn bộ form dùng nền phẳng trắng sứ, phân tách các phân khu bằng đường hairline siêu mảnh 1px (`border-t border-slate-100 dark:border-slate-800`), xóa bỏ hoàn toàn cảm giác hộp lồng hộp bí bách. Fixed Header và Sticky Footer luôn cố định khi cuộn `max-h-[85vh]`.
- [ ] **UAT_07 (Khắc Phục Rớt Dòng "Thứ Tự Sinh"):** Ô input thứ tự sinh `[ 1 ]` và dòng chú thích `(Con thứ mấy trong gia đình cha mẹ)` nằm trên 1 hàng thông thoáng, rộng rãi, tuyệt đối không bị rớt dòng chữ. Hàng dưới là các tag chọn `[ Con trưởng ]` `[ Con nuôi ]`.
- [ ] **UAT_08 (Ẩn Tuyệt Đối Checkbox Cụ Tổ Khỏi Form Thông Thường):** Giao diện thêm/sửa con cháu không xuất hiện checkbox "Cụ Tổ (Gốc)", ngăn chặn hoàn toàn rủi ro người dùng vô tình tạo ra Cụ Tổ thứ hai trong cây.
- [ ] **UAT_09 (Đồng Nhất Component Toàn Diện):**
  - Giới tính dùng chung chuẩn Pill Button `[ ♂ Nam ] [ ♀ Nữ ] [ ⚪ Khác ]` cho cả thông tin thành viên chính lẫn khi thêm con nhanh (không dùng radio button tròn cổ điển).
  - Phối ngẫu dùng thanh trượt Segmented Control 3 phân đoạn: `[ Độc thân ] [ + Thêm Vợ/Chồng ngoài họ ] [ Ghép nội tộc ]`.
  - Phân khu con cái mang tên chuẩn thuần Việt: "4. Con cái".
- [ ] **UAT_10 (Dynamic Disclosure Giỗ Chạp):** Mặc định chọn `Còn sống`, khối ngày mất Âm lịch ẩn gọn (chiều cao form ~450px, không cần cuộn trên màn hình phổ thông); khi chọn `Đã mất †`, khối Âm lịch mở ra mượt mà.
- [ ] **UAT_11 (Tạo Vợ/Chồng Ngoài Họ Tại Chỗ):** Chọn tab Segmented "+ Thêm Vợ/Chồng ngoài họ", điền tên và năm sinh, lưu thành công và tự động tạo node phối ngẫu bên cạnh trên Canvas.
- [ ] **UAT_12 (Xem & Thêm Nhanh Con Cái):** Danh sách con hiện có hiển thị rõ ràng; form thêm con nhanh dạng inline phẳng, nhập họ tên + năm sinh + pill giới tính và lưu kèm hồ sơ.
- [ ] **UAT_13 (Hiển Thị Cây Phả Hệ Tức Thì - Zero Black Screen):** Truy cập `http://localhost:3000/tree` $\rightarrow$ Toàn bộ 28 node phả hệ xuất hiện rõ nét, căn giữa màn hình, các đường kết nối con cái và phối ngẫu hiển thị đầy đủ, không còn hiện tượng màn hình đen rỗng.
- [ ] **UAT_14 (Thẩm Mỹ Refined Modern Heritage - Góc Bo Hình Học):** Mở `MemberFormModal` $\rightarrow$ Form có các góc bo sắc sảo `rounded-lg` (8px), không còn cảm giác bồng bềnh/bubbly bo tròn quá mức; các tiêu đề phân khu là nhãn Editorial thanh mảnh, không icon màu mè lộn xộn.
- [ ] **UAT_15 (Giới Tính Con Đầy Đủ 3 Tùy Chọn):** Nhấp `[+ Thêm nhanh con mới]` $\rightarrow$ Xuất hiện đủ 3 nút chọn giới tính: `[ ♂ Nam ]`, `[ ♀ Nữ ]`, `[ ⚪ Khác ]`.
- [ ] **UAT_16 (Lưu Dữ Liệu Thực Tế Vào DB & F5 Bền Vững):** Tạo thành viên mới hoặc sửa thành viên $\rightarrow$ Bấm Lưu $\rightarrow$ Tải lại trang (F5) $\rightarrow$ Dữ liệu thành viên mới vẫn tồn tại trên cây và trong CSDL, không bị reset về sample data.
- [ ] **UAT_17 (Camera Tự Động Căn Giữa & 0ms Black Screen):** Truy cập `/tree` $\rightarrow$ Toàn bộ 28 node (30 thẻ) xuất hiện ngay lập tức ở giữa màn hình mà không cần pan/zoom thủ công; không có hiện tượng camera kẹt ở khoảng tối `(0, 0)`.
- [ ] **UAT_18 (Cách Ly Build & Dev Server Không Bị Gián Đoạn):** Khi lệnh build kiểm chứng chạy với `NEXT_DIST_DIR=.next-build` $\rightarrow$ Trình duyệt F5 tải lại trang `/tree` vẫn nhận HTTP 200 cho 100% file JS/CSS, không còn lỗi 404.
- [ ] **UAT_19 (Đồng Bộ Theme Toàn Trang & Zero Nửa Sáng Nửa Tối):** Truy cập trang chủ `/` và trang cây `/tree` ở cả môi trường OS Dark Mode lẫn Light Mode $\rightarrow$ Giao diện đồng nhất 100%: hoặc toàn bộ sáng (Light), hoặc bấm nút Đổi Theme trên Navbar để chuyển sang toàn bộ tối (Dark); không còn hiện tượng Card trắng lơ lửng trên nền đen kịt.
- [ ] **UAT_20 (Canvas Tree Viewport Cố Định & Không Bị Footer Đè):** Truy cập `/tree` $\rightarrow$ Khung vẽ hiển thị trọn vẹn 100% viewport, lưới chấm (dots background) và cụm zoom controls ở góc dưới bên phải hiển thị rõ ràng, không bị đẩy tràn xuống dưới hay bị footer che khuất.
- [ ] **UAT_21 (Hiển Thị 30 Nodes Phả Hệ Ngay Lập Tức & Cụm Controls Góc Phải):** Truy cập `http://localhost:3000/tree` $\rightarrow$ 30 nodes (28 thành viên + phối ngẫu) xuất hiện đầy đủ ở trung tâm màn hình, cụm controls zoom (+ / - / fit view) hiển thị rõ ràng tại góc dưới bên phải, không còn màn hình trắng rỗng.
- [ ] **UAT_22 (Tự Động Gợi Ý & Dọn Trùng Thứ Tự Sinh):** Bấm "Thêm con" $\rightarrow$ Ô Thứ tự sinh tự điền số tiếp theo (ví dụ 4 nếu đã có 3 con) $\rightarrow$ Đổi thành số 1 $\rightarrow$ Hiển thị ghi chú dọn trùng $\rightarrow$ Bấm Lưu $\rightarrow$ Người mới mang số 1, người cũ nhường số thành công.
- [ ] **UAT_23 (Hộp Thoại Xác Nhận Chuyển Giao Con Trưởng):** Gia đình đã có con trưởng Nguyễn Văn A $\rightarrow$ Thêm hoặc sửa con B và tích `⭐ Con trưởng` $\rightarrow$ Xuất hiện popup xác nhận hỏi có muốn chuyển danh hiệu con trưởng từ A sang B không $\rightarrow$ Đồng ý $\rightarrow$ B trở thành Con Trưởng duy nhất, A trở thành con thứ.
- [ ] **UAT_24 (Validate Chặn Cứng Năm Sinh Con vs Bố Mẹ):** Bố sinh 1990 $\rightarrow$ Thêm con với năm sinh 1978 hoặc 1990 $\rightarrow$ Form báo lỗi đỏ: "Năm sinh của con không thể trước hoặc bằng năm sinh của Bố", nút Lưu bị chặn.
- [ ] **UAT_25 (Chuẩn Hóa Danh Xưng Thuần Việt Thân Thuộc Qua Hằng Số KINSHIP_TERMS):** Kiểm tra `MemberDetailDrawer` và `MemberFormModal` $\rightarrow$ Toàn bộ nhãn xưng hô dùng chung hằng số từ `src/constants/kinship-terms.ts`: "Bố mẹ", "Anh em ruột", "Con cái", không còn chữ "Phụ mẫu", "Huynh đệ", "Hậu duệ".
- [ ] **UAT_26 (Hiển Thị Song Song Tuổi Dương & Tuổi Mụ Kèm Tooltip):** Mở `MemberDetailDrawer` của Nguyễn Văn Tuấn $\rightarrow$ Danh sách con hiển thị rõ: `Nguyên Văn A (Trưởng) • SN 1998 (28 tuổi · 29 mụ) ℹ️`; khi hover chuột vào biểu tượng ℹ️ hiển thị tooltip giải thích công thức tính tuổi rõ ràng.
- [ ] **UAT_27 (Thêm Phối Ngẫu Cố Định & Chọn Vợ Cả/Hai):** Bấm "+ Thêm phối ngẫu cho Tuấn" $\rightarrow$ Chồng cố định là Tuấn 🔒, tự động gợi ý Vợ hai (#2), khối Bố Mẹ ngoại tộc tự động ẩn gọn gàng, form không cần cuộn.
- [ ] **UAT_28 (Thêm Con Khóa Cứng Bố Mẹ):** Bấm "+ Thêm con" từ cụm con của người vợ cụ thể trong Drawer $\rightarrow$ Bố và Mẹ đều được khóa cứng [🔒], không thể sửa nhầm.
- [ ] **UAT_29 (Đồng Bộ Theme Toàn Diện - Triệt Tiêu Nửa Sáng Nửa Tối):** Mở `/tree` khi ở Light Mode $\rightarrow$ Navbar, Toolbar, Canvas (`bg-slate-100/70`) và toàn bộ Thẻ thành viên (`bg-white/95`) đều hiển thị Sáng (trắng/xám nhạt), không có nền đen. Bấm nút Đổi Theme trên Navbar $\rightarrow$ Toàn bộ Navbar, Toolbar, Canvas (`dark:bg-slate-950`) và Thẻ (`dark:bg-slate-900/95`) đồng loạt chuyển sang Tối tức thì 0ms.
- [ ] **UAT_30 (Footer Tự Do Trôi Đáy Trang - Triệt Tiêu Vệt Mờ Cắt Ngang):** Mở `/kinship`, cuộn dọc từ Đời 1 đến Đời 7 $\rightarrow$ Không có footer chắn ngang Đời 4. Footer xuất hiện trang nhã ở đáy trang sau toàn bộ 7 đời.
- [ ] **UAT_31 (Canvas /tree Giữ Vững 100% Viewport Không Scrollbar):** Truy cập `/tree` $\rightarrow$ Canvas chiếm trọn vẹn màn hình, không xuất hiện thanh cuộn ngoài, cụm controls zoom góc phải hiển thị rõ ràng, footer tự ẩn.
- [ ] **UAT_32 (Thêm Dâu Nội Tộc Không Nhân Bản):** Mở Drawer của Tuấn $\rightarrow$ Bấm "+ Thêm phối ngẫu" $\rightarrow$ Chọn tab "🔗 Ghép nội tộc" $\rightarrow$ Chọn Mai $\rightarrow$ Bấm Lưu $\rightarrow$ Hệ thống gọi `POST /api/spouse-relations` thành công, CSDL không sinh thêm Mai thứ 2, Canvas hiển thị Ghost Node 🔗 cạnh Tuấn trỏ về Mai gốc.
- [ ] **UAT_33 (Nút Xóa Node Lá Trên Drawer & Safe Delete Guard):** Mở Drawer của một con út (chưa có con) $\rightarrow$ Nút `[🗑️ Xóa hồ sơ]` màu đỏ bật sáng $\rightarrow$ Bấm nút $\rightarrow$ Popup Confirm mở ra $\rightarrow$ Xác nhận $\rightarrow$ Node biến mất khỏi cây và CSDL. Mở Drawer của người đã có con $\rightarrow$ Nút Xóa bị mờ (disabled) với tooltip giải thích chính sách Safe Delete.
- [ ] **UAT_34 (Thẩm Mỹ Hình Học Trang Import):** Truy cập `/admin/import` $\rightarrow$ Toàn bộ thẻ card thống kê, vùng Dropzone kéo thả, bảng preview dữ liệu và alert hướng dẫn đều có bo góc thanh lịch `rounded-lg` (8px), triệt tiêu hoàn toàn góc bo tròn bong bóng `rounded-2xl`.
- [ ] **UAT_35 (Form Thiết Lập Phẳng & Tự Đổi Nhãn Theo Giới Tính):** Mở `MemberFormModal`, chọn Nam $\rightarrow$ hiện nút `Đã lấy vợ`, chọn Nữ $\rightarrow$ hiện nút `Tái giá`; bấm vào hiện ô `Năm: [    ]` ngay trên hàng phẳng, không lồng box.
- [ ] **UAT_36 (Thẻ Node Trên Cây Sạch Sẽ & Không Có Huyết Tộc/Dâu Họ):** Xem thẻ cây của người tái giá/lấy vợ $\rightarrow$ Footer bên trái hiện `Tái giá` / `Đã lấy vợ`; người bình thường chưa phân chi để trống hoàn toàn; thẻ dâu/rể không có chữ "Huyết tộc" hay "Thành viên"; số con chỉ hiện bên người chồng.
- [ ] **UAT_37 (Drawer Chi Tiết Phẳng & Đúng Ngữ Cảnh Hôn Phối):** Mở Drawer của người có vợ tái giá $\rightarrow$ Danh sách Hôn phối hiển thị `• 🌸 Bà cả: Nguyễn Thị Kim — Tái giá (2024)` phẳng, thoáng mắt, không lồng box; mở Drawer của người tái giá hiển thị dòng thông tin gia đạo.
- [ ] **UAT_38 (Cố Định Tọa Độ Y Tên Trên Thẻ Node):** So sánh trực quan thẻ `Nguyễn Thị Kim` (không có năm sinh/mất) và `Phạm Văn Cường` $\rightarrow$ Vị trí dòng Tên thẳng hàng tắp theo phương ngang, không bị lệch hay thụt dòng.
- [ ] **UAT_39 (Màu Viền Giới Tính Người Đã Mất & Không Có Ký Tự †):** Kiểm tra thẻ Cụ Phạm Văn Cường (Đã mất, Nam) mang viền xanh nam tính, thẻ nữ đã mất mang viền hồng. Avatar icon bên trong mang màu xám trang trọng. Badge hiển thị chữ `Đã mất` sạch sẽ, không có dấu thập `†`.
- [ ] **UAT_40 (Avatar Cụ Uyên Hiển Thị Đúng VU):** Trên cây phả hệ và trên Drawer, thẻ của Cụ Phạm Văn Uyên hiển thị avatar chữ cái đại diện là **VU** (thay vì `U(` trước đây).
- [ ] **UAT_41 (Không Lặp Tên Húy Trên Drawer & Đổi Nhãn Tức):** Mở Drawer Cụ Phạm Văn Uyên $\rightarrow$ Tiêu đề hiển thị `Phạm Văn Uyên`, bên dưới hiển thị `Tức: Nuôi` (không bị lặp lại chữ Nuôi trên tiêu đề).
- [ ] **UAT_42 (Form Tự Động Bóc Tách Họ Tên và Tên Húy):** Bấm sửa Cụ Phạm Văn Uyên $\rightarrow$ Ô `Họ và Tên (*)` hiển thị `Phạm Văn Uyên`, ô `Tên húy / Tên tự / Bí danh` hiển thị `Nuôi`. Nhãn trạng thái sinh tử hiển thị `Đã mất` (không có dấu thập `†`).
- [ ] **UAT_43 (Nút Sắp Xếp Đàn Con Trên Thẻ Node & Khởi Động Modal):** Bấm vào badge `{childCount} người con` trên thẻ node ngoài Canvas $\rightarrow$ Mở ngay `ReorderChildrenModal` hiển thị đủ danh sách các con kèm avatar, năm sinh và số thứ tự.
- [ ] **UAT_44 (Kéo Thả Sắp Xếp & Cây Đảo Nhánh Tức Thì):** Trong `ReorderChildrenModal`, kéo thả con út lên đầu danh sách (hoặc bấm nút `▲`) $\rightarrow$ Bấm Lưu $\rightarrow$ Cây phả hệ tự động bố trí lại, nhánh con vừa đổi xuất hiện ở vị trí đầu tiên bên trái.
- [ ] **UAT_45 (Khối Hôn Phối Hiển Thị Vợ Hiện Tại & Nút Thêm Vợ):** Mở form sửa Cụ Phạm Văn Uyên $\rightarrow$ Khối Hôn phối hiển thị rõ thẻ `🌸 Bà Cả: Nguyễn Thị Chăm` kèm nút `+ Thêm Vợ`, không còn bị ép vào tab chọn người nội tộc.
- [ ] **UAT_46 (Thêm Con Chọn Mẹ Thông Minh):** Trong form sửa người cha có 1 vợ, bấm "+ Thêm nhanh con mới" $\rightarrow$ Mẹ tự động được chọn là vợ đó; trong form sửa người cha có 2 vợ $\rightarrow$ xuất hiện dropdown cho phép chọn con là của Bà cả hay Bà hai.
- [ ] **UAT_47 (Mở Modal Thêm/Sửa Không Còn Màn Hình Đỏ Rules of Hooks):** Bấm sửa bất kỳ thành viên nào trên Canvas hoặc bấm "Thêm con" từ Drawer khi đang ở trang `/tree` $\rightarrow$ Modal mở ra ngay lập tức, console sạch sẽ 0 lỗi đỏ, không còn crash "Rendered more hooks than during the previous render".
- [ ] **UAT_48 (Danh Xưng Vợ Chuẩn Gia Đạo Khi Có 1 Vợ):** Mở form sửa hoặc Drawer của Cụ Phạm Văn Uyên (người có 1 vợ Nguyễn Thị Chăm) $\rightarrow$ Danh xưng hiển thị trang trọng là "Vợ" (không có chữ "Vợ cả" hay "Bà cả"). Mở người có 2 vợ (như Cụ Chiến hoặc Cụ Lim) $\rightarrow$ Mới hiển thị "Vợ cả (Bà cả)" và "Vợ hai (Bà hai)".
- [ ] **UAT_49 (Số Thứ Tự Đàn Con Hiển Thị Tuần Tự 1..N Trên Toàn Bộ Giao Diện):** Mở Drawer và Form của Cụ Phạm Văn Uyên $\rightarrow$ Huy hiệu tròn của 7 người con hiển thị số thứ tự tuần tự từ 1 đến 7 (1, 2, 3, 4, 5, 6, 7), không còn hiện tượng 6 người con đầu đều mang số 1.
- [ ] **UAT_50 (Đồng Nhất Cao Độ Hàng Ngang Avatar Giữa Các Thẻ Cạnh Nhau):** Mở `/tree`, quan sát hàng ngang đàn con Đời 12 của Cụ Phạm Văn Uyên (`Phạm Văn Nắng`, `Phạm Thị Chỉ`, `Tạ Duy Hưng`, `Phạm Văn Khương`, `Chu Thị Hà`) $\rightarrow$ Toàn bộ các Avatar tròn 32x32px (`VN`, `TC`, `DH`, `VK`, `TH`) nằm thẳng tắp trên cùng một đường gióng ngang chuẩn xác từng pixel; thẻ của người vợ (`Chu Thị Hà`) và người chưa có con (`Phạm Văn Nắng`) không còn bị tụt thấp hơn thẻ của người chồng (`Phạm Văn Khương`).
- [ ] **UAT_51 (Dọn Sạch 100% Ký Tự Thô \\u00A0 Khỏi Chân Thẻ):** Mở `/tree`, quan sát chân thẻ của các thành viên không có con hoặc không có ghi chú (`Phạm Văn Nắng`, `Phạm Thị Chỉ`, `Tạ Duy Hưng`, `Chu Thị Hà`) $\rightarrow$ Góc dưới bên phải chân thẻ hoàn toàn sạch sẽ, phẳng phiu, không còn bất kỳ chữ `\u00A0` nào xuất hiện.
- [ ] **UAT_52 (Gỡ con trực tiếp từ hồ sơ Người Cha):** Mở form sửa Cụ Phạm Văn Tráng $\rightarrow$ Ở mục 4. CON CÁI, bấm nút "Gỡ con" tại thẻ `Phạm Hà Phương` $\rightarrow$ Thẻ chuyển trạng thái gạch mờ kèm badge "Sẽ gỡ khi Lưu" $\rightarrow$ Bấm Cập nhật $\rightarrow$ Thẻ con biến mất khỏi nhánh ông Tráng và xuất hiện an toàn trong khay Chưa nối phả.
- [ ] **UAT_53 (Đổi Bố tự động đồng bộ Mẹ theo cặp hôn phối):** Mở form sửa `Phạm Hà Phương` $\rightarrow$ Ở mục 2. BỐ MẸ, dropdown Bố và Mẹ hiển thị đầy đủ $\rightarrow$ Đổi Bố từ `Phạm Văn Tráng` sang `Phạm Văn Khương` $\rightarrow$ Mẹ tự động chuyển thành `Chu Thị Hà` $\rightarrow$ Bấm Cập nhật $\rightarrow$ Nhánh con trên Canvas tự động chuyển sang hạ nhánh dưới gia đình ông Khương.
- [ ] **UAT_54 (Chặn lưu khi Bố và Mẹ không phải vợ chồng):** Thử chọn Bố và Mẹ của 2 gia đình khác nhau không có quan hệ hôn phối $\rightarrow$ Dropdown Mẹ chỉ lọc các bà vợ của Bố, hoặc nếu có xung đột thì hệ thống cảnh báo đỏ và chặn lưu an toàn.
- [ ] **UAT_55 (Opt-out Bỏ chọn Mẹ & Xác nhận Con riêng):** Mở form sửa con $\rightarrow$ Chọn Bố có 1 vợ $\rightarrow$ Mẹ tự động điền $\rightarrow$ Bấm nút `[✕ Bỏ chọn Mẹ / Con riêng]` $\rightarrow$ Thẻ xác nhận chuyển sang trạng thái `⚠️ Con riêng của Bố / Chưa rõ Mẹ` màu hổ phách $\rightarrow$ Bấm Lưu $\rightarrow$ Cây phả hệ hạ nhánh con riêng trực tiếp từ thẻ người Bố.
- [ ] **UAT_56 (Ngữ cảnh Gia đình trong Khay Chưa Nối):** Mở Khay Chưa Nối (`🔗 Chưa nối: X`) $\rightarrow$ Bấm `Nối vào cây` $\rightarrow$ Danh sách tìm kiếm cha mẹ hiển thị rõ ràng thông tin bạn đời: `Phạm Văn Tráng (Chồng bà Phạm Thị Thuý)` và `Phạm Văn Bẩy (Chồng bà Nguyễn Thị Thuý Hiền)` $\rightarrow$ Người dùng không bao giờ bị nhầm lẫn người trùng tên.
- [ ] **UAT_57 (Nối Phả Chuẩn Giới Tính):** Trong Khay Chưa Nối, chọn nối con vào một người Mẹ (nữ giới) $\rightarrow$ CSDL lưu đúng cột `mother_id`, tuyệt đối không gán nhầm vào cột `father_id`.
- [ ] **UAT_58 (Nối Phả Thông Minh Trong Khay Chưa Nối - Cặp 1 Vợ Chồng):** Mở Khay Chưa Nối $\rightarrow$ Bấm "Nối vào cây" cho cháu Phương/Nam $\rightarrow$ Chọn Cụ `Phạm Văn Bẩy` $\rightarrow$ Thấy hộp đề xuất `☑ Đồng thời nhận Mẹ: Nguyễn Thị Thuý Hiền (Vợ của Phạm Văn Bẩy)` đã được tick sẵn $\rightarrow$ Bấm Xác nhận nối $\rightarrow$ Trên Canvas, con hạ nhánh chính giữa cặp vợ chồng Cụ Bẩy - Bà Hiền (triệt tiêu hoàn toàn đường nối đơn lẻ 1 xanh 1 tím).
- [ ] **UAT_59 (Bỏ Tick Để Lưu Con Riêng Trong Khay Chưa Nối):** Mở Khay Chưa Nối $\rightarrow$ Chọn Bố $\rightarrow$ Bỏ tick hộp đề xuất Mẹ $\rightarrow$ Thấy cảnh báo màu vàng `⚠️ Lưu làm con riêng của Bố` $\rightarrow$ Bấm Xác nhận $\rightarrow$ Con nối thành con riêng của Bố.
- [ ] **UAT_60 (Nối Phả Khi Người Cha Có Nhiều Vợ):** Trong Khay Chưa Nối, chọn Cụ `Phạm Văn Chiến` $\rightarrow$ Xuất hiện danh sách radio: `Bà cả Hoàng Thị Mơ`, `Bà hai Đào Thị Liễu`, `Không chọn mẹ (Con riêng)` $\rightarrow$ Chọn Bà hai Liễu $\rightarrow$ Con nhận đúng mẹ Liễu và bố Chiến.
- [ ] **UAT_61 (Trải Nghiệm Flat Radio Phẳng Khi Nối Phả 1 Vợ - Zero Box-in-Box):** Mở Khay Chưa Nối $\rightarrow$ Bấm Nối vào cây $\rightarrow$ Chọn Cụ `Phạm Văn Bẩy` $\rightarrow$ Giao diện phẳng hoàn toàn, không có bất kỳ hộp xanh/vàng lồng bên trong. Danh sách hiển thị Radio: `🔘 Mẹ: Nguyễn Thị Thuý Hiền (Vợ của Phạm Văn Bẩy)` (được chọn sẵn kèm dòng giải thích xanh ngọc) và `⚪ Không chọn mẹ (Lưu làm con riêng của Bố)`. Chọn Không chọn mẹ $\rightarrow$ Trở thành con riêng của Bố.
- [ ] **UAT_62 (Trải Nghiệm Flat Radio Phẳng Khi Nối Phả Đa Thê):** Trong Khay Chưa Nối, chọn Cụ `Phạm Văn Chiến` $\rightarrow$ Hiển thị danh sách Radio phẳng cùng phong cách với trường hợp 1 vợ: `🔘 Bà cả: Hoàng Thị Mơ`, `⚪ Bà hai: Đào Thị Liễu`, `⚪ Không chọn mẹ`. Thao tác chuyển đổi nhẹ nhàng, thanh thoát, không có viền hộp đè lên nhau.
- [ ] **UAT_63 (Viewer Read-Only Tree - Zero Edit Buttons):** Đăng nhập tài khoản Viewer (`Khách Xem`, ví dụ `drive move`) $\rightarrow$ Truy cập `/tree` $\rightarrow$ Thanh công cụ không có nút `+ Thêm người`, không có nút `Chưa nối: X`. Mở Drawer chi tiết của bất kỳ ai: không có nút `Sửa hồ sơ`, không có nút `Xóa hồ sơ`. Giao diện thuần túy tra cứu, thanh lịch và bảo mật.
- [ ] **UAT_64 (Super Admin Full Control Tree):** Đăng nhập tài khoản Super Admin $\rightarrow$ Truy cập `/tree` $\rightarrow$ Xuất hiện đầy đủ nút `+ Thêm người` màu xanh, nút `Chưa nối: X` (nếu có người chưa nối). Mở Drawer chi tiết: có đầy đủ nút `Sửa hồ sơ` và `Xóa hồ sơ`.
- [ ] **UAT_65 (Khóa Vị Trí Thẻ Khóa Chặt Cho Viewer):** Với tài khoản Viewer $\rightarrow$ Menu Popover `⚙ Tùy chọn` trên thanh công cụ Cây hiển thị trạng thái `Khóa vị trí thẻ: Đang khóa` và không cho phép bật mở kéo xê dịch node tự do (hoặc ẩn nút mở khóa), tránh xáo trộn hiển thị phả đồ.
- [ ] **UAT_66 (Rào Chắn Server Trả Về HTTP 403 Cho Thao Tác Trái Quyền):** Dùng tài khoản Viewer gửi request tạo thành viên lên `POST /api/members` hoặc xóa thành viên lên `DELETE /api/members/[id]` $\rightarrow$ Nhận phản hồi `HTTP 403 Forbidden` kèm thông báo *"Bạn không có quyền thực hiện thao tác này"*.
- [ ] **UAT_67 (Menu Tùy Chọn Cây Phả Hệ Gọn Gàng - Không Còn Dữ Liệu Kiểm Thử):** Mở menu `[ ⚙ Tùy chọn ▾ ]` trên thanh công cụ Cây Phả Hệ (`/tree`) $\rightarrow$ Khối "Nguồn dữ liệu kiểm thử" đã biến mất hoàn toàn. Menu chỉ còn các mục thiết thực: Khóa vị trí thẻ, Hiển thị Rể nội tộc và Lối tắt Nhập liệu Excel.
- [ ] **UAT_68 (Navbar Desktop Hiển Thị Icon Users Cho Xưng Hô):** Quan sát thanh điều hướng trên cùng (Desktop Header) $\rightarrow$ Mục "Xưng hô" hiển thị icon 2 người (`Users`) màu xanh ngọc thanh lịch, hover và click chuyển hướng `/kinship` mượt mà.
- [ ] **UAT_69 (Mobile Bottom Nav Hiển Thị Icon Users Cho Xưng Hô):** Thu nhỏ màn hình xuống kích thước điện thoại (mobile viewport) $\rightarrow$ Tab "Xưng hô" trên thanh điều hướng đáy hiển thị icon 2 người (`Users`), highlight đúng khi truy cập `/kinship`.
- [ ] **UAT_70 (Trang Tra Cứu Xưng Hô & Admin Features Đồng Bộ Icon Users):** Truy cập `http://localhost:3000/kinship` và `http://localhost:3000/admin/features` $\rightarrow$ Toàn bộ các biểu tượng đại diện cho công cụ xưng hô đều sử dụng icon `Users` đồng nhất.

---

## 8. BẢO VỆ CHỐNG THOÁI LUI (REGRESSION GUARD CHECKLIST)

- [x] **RG01 (Build & Typecheck Clean):** Chạy lệnh `npm run typecheck` và `npm run build` — 0 lỗi, production build hoàn tất 17/17 pages.
- [x] **RG02 (Automated Test Regression):** Chạy lệnh `npm test` — Toàn bộ 78/78 tests PASS 100%, 0 failure mới so với baseline.
- [ ] **RG03 (Hiển thị Cây Toàn cảnh & Đa Dữ Liệu):** Bộ dữ liệu Clan 28, Polygamy Cụ Chiến và Clan 1.500 nodes render mượt mà 60 FPS, không vỡ layout, không màn hình đen.
- [ ] **RG04 (Drawer Chi tiết Thân tộc):** `MemberDetailDrawer` (Milestone 3.2) vẫn mở nhanh, chuyển đổi người thân và hiển thị đầy đủ 4 tabs.
- [ ] **RG05 (Tra cứu Vai vế /kinship):** Trang tra cứu xưng hô `/kinship` và thuật toán LCA hoạt động chính xác tuyệt đối.
- [ ] **RG06 (Bảo Toàn Logic Khay Chưa Nối & Safe Delete):** Khay chưa nối không nhốt nhầm dâu rể, xóa thành viên có con vẫn bị chặn RESTRICT chuẩn xác.
- [x] **RG07 (Cách Ly Build & Bảo Vệ Chunks Dev):** Chạy build với `NEXT_DIST_DIR=.next-build` hoàn tất thành công 17/17 pages, không ghi đè vào thư mục `.next/`, 100% chunks của dev server trả về HTTP 200.
- [x] **RG08 (Camera Auto-FitView Đa Bộ Dữ Liệu):** Chuyển đổi qua lại giữa Clan 28, Đa thê Cụ Chiến và Clan 1.500 nodes $\rightarrow$ Camera tự động căn giữa mượt mà cho từng bộ dữ liệu qua `useNodesInitialized` và `defaultViewport`.
- [ ] **RG09 (Theme Consistency Across Routes):** Kiểm tra chuyển đổi qua lại giữa `/`, `/tree`, `/kinship`, `/anniversaries`, `/admin` $\rightarrow$ Theme được bảo toàn đồng bộ, không giật màn hình (FOUC).
- [ ] **RG10 (Canvas Interactive Responsiveness):** Thao tác pan chuột, zoom chuột và phím Spacebar trên Canvas vẫn mượt mà 60 FPS.
- [x] **RG11 (Đảm bảo 78 tests tự động hiện có tiếp tục pass):** Chạy `npm test` không gây hồi quy cho bất kỳ suite nào trước đó (78/78 pass).
- [ ] **RG12 (Thao tác Thêm/Sửa Thành Viên Trên Canvas Bền Vững):** Thao tác thêm con, thêm phối ngẫu và sửa hồ sơ phản ánh tức thì trên Canvas và lưu DB chuẩn xác.
- [ ] **RG13 (Theme Switching Consistency):** Chuyển đổi qua lại giữa các route `/tree`, `/kinship`, `/`, `/admin/import` $\rightarrow$ Theme được bảo toàn, không giật FOUC, không lệch pha giữa Navbar và Canvas.
- [ ] **RG14 (Canvas Viewport Resilience):** Canvas `/tree` vẫn render 100% chiều cao màn hình, fitView hoạt động chuẩn xác, không bị sụp đổ chiều cao về 0px.
- [ ] **RG15 (Bảo Toàn 78 Tests Cũ):** Toàn bộ 78 automated test cases trước đó tiếp tục PASS 100% khi chạy `npm test`.
- [ ] **RG16 (Khay Chưa Nối Không Bị Ảnh Hưởng Bởi Safe Delete Trên Drawer):** Chức năng xóa trong `UnlinkedMembersDrawer` vẫn hoạt động độc lập và chính xác, không bị xung đột với nút xóa trên `MemberDetailDrawer`.
- [x] **RG17 (Bảo Toàn 136 Tests Hiện Tại & Mở Rộng 141 Tests):** Chạy `npm test` đạt 141/141 tests PASS 100%, 0 regression so với Known_Failing_Baseline (none).
- [x] **RG18 (Kích Thước Thẻ Node 200x96px Bất Biến):** Thẻ Node cây giữ nguyên kích thước chuẩn `w-[200px] h-[96px]`, không tràn viền sau khi thêm nhãn Tái giá / Đã lấy vợ tại chân thẻ (`TC_UT_MARITAL_05` pass).
- [x] **RG19 (Bảo Toàn 141 Tests Hiện Tại & Mở Rộng 148 Tests):** Toàn bộ 148/148 automated test cases PASS 100% khi chạy `npm test`.
- [x] **RG20 (Kích Thước Thẻ Node 200x96px Bất Biến):** Thẻ Node cây giữ nguyên kích thước chuẩn `w-[200px] h-[96px]`, không tràn viền sau khi cố định dòng tên và dòng 2 slot.
- [x] **RG21 (Bảo Toàn 148 Tests Hiện Tại & Mở Rộng 155 Tests):** Toàn bộ 155/155 test cases PASS 100%, 0 regression so với baseline khi chạy `npm test`.
- [x] **RG22 (Bảo Toàn Logic Phân Nhóm Đàn Con Đa Thê):** Hàm `groupChildrenByMother` và cấu trúc phả đồ phân nhánh chính xác khi con được lưu kèm `mother_id` (`tests/mother-selection.test.ts` & `tests/genealogy-tree-layout.test.ts` pass).
- [x] **RG23 (Bảo Toàn 155 Tests Hiện Tại & Mở Rộng 156 Tests):** Toàn bộ 156/156 test cases PASS 100%, 0 regression so với baseline khi chạy `npm test`.
- [x] **RG24 (Bảo Toàn 156 Tests Hiện Tại & Mở Rộng 159 Tests):** Toàn bộ 159/159 test cases PASS 100%, 0 regression so với baseline khi chạy `npm test`.
- [x] **RG25 (Bảo Toàn Kích Thước Thẻ 200x96px & Mở Rộng 160 Tests):** Thẻ Node cây bảo toàn kích thước chuẩn `w-[200px] h-[96px]`, toàn bộ 160/160 test cases PASS 100%, 0 regression so với baseline khi chạy `npm test`.
- [x] **RG26 (Bảo Toàn 160 Tests Hiện Tại & Mở Rộng 161 Tests):** Toàn bộ 160 automated test cases cũ tiếp tục PASS 100%, test suite mở rộng lên 161 tests PASS 100%.
- [x] **RG27 (Bảo Toàn 161 Tests Hiện Tại & Mở Rộng 165 Tests):** Toàn bộ 161 automated test cases cũ tiếp tục PASS 100%, test suite mở rộng lên 165 tests PASS 100%.
- [x] **RG28 (Bảo Toàn 165 Tests Hiện Tại & Mở Rộng 169 Tests):** Toàn bộ 165 automated test cases cũ tiếp tục PASS 100%, test suite mở rộng lên 169 tests PASS 100%.
- [x] **RG29 (Bảo Toàn 169 Tests Hiện Tại & Mở Rộng 172 Tests):** Toàn bộ 169 automated test cases cũ tiếp tục PASS 100%, test suite mở rộng lên 172 tests PASS 100%.
- [x] **RG30 (Bảo Toàn 172 Tests Hiện Tại & Mở Rộng 174 Tests):** Toàn bộ 172 automated test cases cũ tiếp tục PASS 100%, test suite mở rộng lên 174 tests PASS 100% khi chạy `npm test`.
- [x] **RG31 (Bảo Toàn 246 Tests Hiện Tại & Mở Rộng 254 Tests):** Toàn bộ 246 automated test cases hiện có tiếp tục PASS 100%, bộ test suite mở rộng lên 254/254 tests PASS 100%, 0 regression (`npm test`).
- [x] **RG32 (Bảo Toàn Các Tùy Chọn Còn Lại Trên TreeToolbar):** Các tính năng Khóa vị trí thẻ, Hiển thị Rể nội tộc và liên kết Nhập Excel vẫn hoạt động trơn tru 100%.
- [x] **RG33 (Bảo Toàn Điều Hướng & Tra Cứu Quan Hệ Xưng Hô):** Route `/kinship` và thuật toán tra cứu xưng hô 2 chiều không bị ảnh hưởng, hoạt động chính xác 100%.
- [x] **RG34 (Bảo Toàn 254 Tests Hiện Tại & Mở Rộng 258 Tests):** Toàn bộ 254 automated test cases hiện có tiếp tục PASS 100%, bộ test suite mở rộng lên 258/258 tests PASS 100%, 0 regression (`npm test`).

---

## 9. LỆNH THI CÔNG (Dành cho AI /feature-code)

> "AI ơi, hãy đọc kỹ đặc tả `docs/13_Micro-Spec_Milestone_4_Member_Management_Import.md` này. Dựa CHÍNH XÁC vào các mô tả ranh giới ở trên, hãy thi công toàn bộ mã nguồn hoàn chỉnh kèm các file test trong `tests/`. Thực thi Vòng Lặp Kiểm Chứng Bằng Code Thật bằng đúng các lệnh khai báo tại `[VERIFY_COMMANDS]` (Typecheck/Build → Automated Test Suite → Human UAT), và chỉ được tick `[x]` cho Mục 7.1 khi terminal log cho thấy test phủ AC đó đã pass và không có failure mới so với baseline."


