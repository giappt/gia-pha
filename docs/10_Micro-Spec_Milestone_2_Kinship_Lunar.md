# ĐẶC TẢ KỸ THUẬT: MILESTONE 2 - LÕI THUẬT TOÁN PHẢ HỆ (KINSHIP ENGINE) & LỊCH ÂM VIỆT NAM

_Tài liệu này dùng để giới hạn Context Window. AI chỉ được phép đọc, suy luận và sinh code cho ĐÚNG các file được đề cập trong đây._

---

## 1. QUY TẮC NGHIÊM NGẶT (STRICT CONSTRAINTS)

- **Thư viện cho phép:**
  - TypeScript chuẩn, ES6 Modules.
  - Thuật toán thiên văn chuyển đổi Âm lịch Việt Nam chuẩn xác theo múi giờ UTC+7 (không dùng thư viện lịch âm Trung Quốc UTC+8).
  - Không cài thêm dependencies đồ họa nặng; giữ logic tính toán hoàn toàn tách biệt (Pure Functions) để chạy được cả ở Client, Server và CLI/Unit Test.
- **Quy tắc Kiến trúc cốt lõi (Theo AGENTS.md Rule 3):**
  - **Tách rời 2 tầng độc lập:**
    1. **Tầng 1 (Lõi đồ thị DAG):** Thuần toán học cây gia phả: Tìm Tổ tiên chung gần nhất (LCA), tính độ lệch thế hệ $\Delta G$, thứ bậc chi trưởng/thứ, và xuất chuỗi breadcrumbs huyết thống.
    2. **Tầng 2 (Từ điển xưng hô vùng miền):** Ánh xạ kết quả toán học sang danh xưng 2 chiều (Miền Bắc, Miền Trung, Miền Nam). Có thể cấu hình tùy biến.
- **Language & Naming:** Code, biến, types bằng Tiếng Anh. Tên file `kebab-case`. Component `PascalCase`. Giao diện và kết quả xưng hô hiển thị bằng Tiếng Việt chuẩn mực.

---

## 2. DATABASE & MODELS (Nếu có)

- **File:** `src/types/database.ts`, `src/types/kinship.ts`
- **Các trường dữ liệu tham gia tính toán từ bảng `members`:**
  - `id`: `UUID PRIMARY KEY`
  - `full_name`: `VARCHAR(255)`
  - `gender`: `'male' | 'female' | 'other'`
  - `father_id`: `UUID` (Nullable)
  - `mother_id`: `UUID` (Nullable)
  - `birth_order`: `INTEGER` (Thứ tự sinh trong gia đình: 1 là con cả, 2 là con thứ...)
  - `is_senior_branch`: `BOOLEAN` (Thuộc chi trưởng hay chi thứ)
  - `birth_date_solar`, `death_date_lunar_day`, `death_date_lunar_month`, `is_death_date_lunar_leap`
- **Data Models mới (`src/types/kinship.ts`):**
  ```ts
  export type KinshipRegion = 'north' | 'central' | 'south';

  export interface LcaResult {
    lcaNodeId: string | null;
    lcaNodeName: string | null;
    distanceA: number; // Số thế hệ từ A lên LCA
    distanceB: number; // Số thế hệ từ B lên LCA
    generationDelta: number; // distanceB - distanceA (> 0: A trên B; < 0: A dưới B; 0: cùng thế hệ)
    isSeniorBranchA: boolean; // Nhánh của A có phải trưởng so với B tại điểm rẽ từ LCA?
    pathA: Array<{ id: string; name: string; relation: string }>;
    pathB: Array<{ id: string; name: string; relation: string }>;
    relationshipType: 'same_person' | 'parent_child' | 'direct_ancestor' | 'sibling' | 'cousin' | 'in_law' | 'unrelated';
  }

  export interface KinshipResolution {
    termAtoB: string; // A gọi B là gì (VD: "Bác họ", "Chú họ", "Anh họ")
    termBtoA: string; // B gọi A là gì (VD: "Cháu họ", "Em họ")
    explanation: string; // Diễn giải phong tục (VD: "B là con bác trưởng, A là con chú thứ")
    region: KinshipRegion;
    breadcrumbs: string[]; // Chuỗi mắt xích
    generationDelta: number;
    relationshipType: RelationshipType;
    lcaName?: string | null;
    lcaNode?: KinshipPathNode | null;
    pathA: KinshipPathNode[]; // Nhánh thế hệ từ A lên LCA
    pathB: KinshipPathNode[]; // Nhánh thế hệ từ B lên LCA
  }
  ```

---

## 3. SƠ ĐỒ LUỒNG LOGIC (SEQUENCE DIAGRAM - MERMAID)

```mermaid
sequenceDiagram
    autonumber
    actor U as Người Dùng (Client)
    participant KView as Giao Diện Tra Cứu (/kinship)
    participant API as API Route (/api/kinship)
    participant LCA as Kinship Engine (lca-finder.ts)
    participant Dict as Regional Dictionary (regional-dictionaries.ts)
    participant DB as Supabase DB (members)

    U->>KView: Chọn Người A & Người B + Chọn Vùng Miền (Bắc/Trung/Nam)
    U->>KView: Bấm [Tra Cứu Vai Vế]
    KView->>API: GET /api/kinship?person1=UUID_A&person2=UUID_B&region=north
    API->>DB: Truy vấn dữ liệu phả hệ của dòng họ (Members & Spouses)
    DB-->>API: Trả về danh sách Node thành viên
    API->>LCA: findLowestCommonAncestor(nodeA, nodeB, allMembers)
    Note over LCA: 1. Truy vết cây gia phả lên tổ tiên<br/>2. Tìm điểm giao nhau đầu tiên (LCA)<br/>3. Tính khoảng cách thế hệ và nhánh Trưởng/Thứ
    LCA-->>API: Trả về LcaResult (Toán học đồ thị)
    API->>Dict: mapKinshipTerms(LcaResult, personA, personB, region)
    Note over Dict: Ánh xạ danh xưng 2 chiều theo từ điển vùng miền
    Dict-->>API: Trả về KinshipResolution (Xưng hô + Diễn giải)
    API-->>KView: Response JSON { success: true, data: KinshipResolution }
    KView-->>U: Hiển thị Thẻ Kết Quả Xưng Hô + Sơ Đồ Breadcrumbs Huyết Thống
```

---

## 4. BACKEND LOGIC / API

### 4.1. Thư viện Toán học Đồ thị (`src/lib/kinship-engine/lca-finder.ts`)
- **Hàm `findLowestCommonAncestor(personAId: string, personBId: string, membersMap: Map<string, Member>): LcaResult`**:
  - Xây dựng bảng quan hệ phả hệ ngược (từ con lên cha mẹ).
  - Tìm tập hợp tổ tiên của A kèm khoảng cách thế hệ: `Map<ancestorId, distance>`.
  - Duyệt cây tổ tiên của B: tìm tổ tiên chung có tổng khoảng cách ngắn nhất $\rightarrow$ **LCA**.
  - Tính $\Delta G = \text{distanceB} - \text{distanceA}$.
  - Xác định thứ tự nhánh: So sánh `birth_order` của con cháu trực hệ đầu tiên dưới LCA.
  - Xử lý các quan hệ trực hệ: Cha - Con, Ông - Cháu, Cụ - Chắt.

### 4.2. Bộ Từ Điển Xưng Hô Vùng Miền (`src/lib/kinship-engine/regional-dictionaries.ts`)
- **Hàm `resolveKinshipTerms(lca: LcaResult, a: Member, b: Member, region: KinshipRegion): KinshipResolution`**:
  - **Trường hợp $\Delta G = 0$ (Cùng thế hệ):**
    - Anh/Em ruột (Cùng cha mẹ): So sánh ngày sinh hoặc `birth_order`.
    - Con chú con bác:
      - *Miền Bắc:* Chi trưởng luôn là Anh/Chị (dù ít tuổi hơn). *"Bé bằng củ khoai, cứ vai Bác là gọi Bác/Anh"*.
      - *Miền Nam:* Xưng Anh/Em theo tuổi thực tế, gọi kèm vai họ (Anh Họ, Em Họ).
  - **Trường hợp $\Delta G = 1$ (A trên B 1 đời):**
    - A là anh của cha B $\rightarrow$ A là **Bác**, B là **Cháu**.
    - A là em trai của cha B $\rightarrow$ A là **Chú**, B là **Cháu**.
    - A là em gái của cha B $\rightarrow$ A là **Cô**, B là **Cháu**.
    - A thuộc nhánh thứ nhưng là vai trên $\rightarrow$ Ghi rõ căn cứ chi họ.
  - **Trường hợp $\Delta G = 2$ (A trên B 2 đời):** Ông họ / Bà họ $\leftrightarrow$ Cháu.
  - **Trường hợp $\Delta G \ge 3$:** Cụ họ, Kỵ họ $\leftrightarrow$ Chắt, Chút.
  - **Dâu / Rể (Spouse):** Xưng hô theo vai của người phối ngẫu (Thím, Mợ, Dượng, Thím họ...).

### 4.3. Bộ Chuyển Đổi Âm - Dương & Can Chi (`src/lib/lunar/vietnamese-lunar.ts`)
- **Hàm `solarToLunar(day: number, month: number, year: number): { lunarDay: number; lunarMonth: number; lunarYear: number; isLeap: boolean }`**:
  - Thuật toán thiên văn học mặt trời - mặt trăng chuẩn xác cho kinh tuyến $105^\circ\text{E}$ (Múi giờ Hà Nội UTC+7).
- **Hàm `lunarToSolar(lunarDay: number, lunarMonth: number, lunarYear: number, isLeap: boolean): { day: number; month: number; year: number }`**.
- **Hàm `getYearCanChi(year: number): string`**:
  - Can: Giáp, Ất, Bính, Đinh, Mậu, Kỷ, Canh, Tân, Nhâm, Quý.
  - Chi: Tý, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi.
  - Ví dụ: 1990 $\rightarrow$ Canh Ngọ; 2024 $\rightarrow$ Giáp Thìn; 2026 $\rightarrow$ Bính Ngọ.
- **Hàm `calculateNextAnniversary(lunarDay: number, lunarMonth: number, isLeap: boolean, targetSolarYear: number)`**:
  - Quy đổi ngày giỗ âm lịch hằng năm sang ngày dương lịch tương ứng của năm hiện tại.

### 4.4. API Route (`src/app/api/kinship/route.ts`)
- **[GET] `/api/kinship?p1={UUID}&p2={UUID}&region={north|central|south}`**:
  - Validate UUID 2 người không được trùng nhau.
  - Lấy danh sách thành viên trong dòng họ từ Supabase (hoặc cache).
  - Trả về JSON:
    ```json
    {
      "success": true,
      "data": {
        "termAtoB": "Bác họ",
        "termBtoA": "Cháu họ",
        "explanation": "B là con bác trưởng (nhánh anh), A là con chú thứ (nhánh em).",
        "generationDelta": 0,
        "relationshipType": "cousin",
        "breadcrumbs": ["Nguyễn Văn A", "Bố: Nguyễn Văn C", "Cụ Tổ: Nguyễn Văn Tổ", "Bác: Nguyễn Văn D", "Nguyễn Văn B"]
      }
    }
    ```

---

## 5. FRONTEND UI & LOGIC (MÀN HÌNH S-03 TRA CỨU VAI VẾ)

- **File:** `src/app/kinship/page.tsx`
- **State cần quản lý:**
  - `selectedPersonA: Member | null`
  - `selectedPersonB: Member | null`
  - `selectedRegion: KinshipRegion`
  - `result: KinshipResolution | null`
  - `isLoading: boolean`
  - `searchTermA: string`, `searchTermB: string`
  - `isExpandedMiddleGenerations: boolean` (Trạng thái mở rộng nén thế hệ trung gian khi $\ge 4$ đời)
- **Luồng xử lý UI:**
  1. Người dùng vào trang `/kinship`.
  2. Hai hộp chọn thành viên độc lập (Người hỏi & Người được hỏi) có thanh tìm kiếm tên gõ tức thì.
  3. Có thể bấm nút **[Đổi vai ⇄]** để đảo ngược vị trí A $\leftrightarrow$ B (kèm tự động tính lại).
  4. Lựa chọn radio vùng miền (Bắc / Trung / Nam).
  5. Bấm **[Xác Định Vai Vế Xưng Hô]** $\rightarrow$ Gọi API `/api/kinship`.
  6. Hiển thị thẻ kết quả nổi bật:
     - Khung xưng hô 2 chiều lớn: *"A gọi B là: **Bác Họ**"* & *"B gọi A là: **Cháu Họ**"*.
     - Huy hiệu thế hệ: *"Cùng thế hệ"* hoặc *"Cách nhau N thế hệ"*.
     - **Sơ đồ Cây Phả Hệ Mini Chữ V Ngược (Inverted-V Kinship Tree):**
       - Bắt đầu từ **Tổ tiên chung gần nhất (LCA)** (không lấy thừa từ Root).
       - Phân làm 2 cột nhánh (Nhánh Trưởng vs Nhánh Thứ) với đường line cong SVG bezier mềm mại.
       - Tích hợp cơ chế **Nén Tầng Trung Gian (Smart Folding)**: Nếu khoảng cách $\ge 4$ đời, mặc định nén các thế hệ giữa thành nút `[🔽 Nén N thế hệ - Bấm để mở rộng]`.
       - Thanh Cầu nối quan hệ dưới chân nối giữa A và B kèm nút bấm `[🔍 Xem trên Cây Phả Hệ Tổng]`.
     - **Thẻ Diễn Giải Phong Tục Cấu Trúc Hóa:**
       - Huy hiệu phong tục vùng miền (VD: `Phong tục Miền Bắc: Tôn vai Nhánh Trưởng`).
       - Lời răn / Tục ngữ cổ phong (VD: *"Bé bằng củ khoai, cứ vai Bác là gọi Anh"*).
       - Bảng đối sánh trực diện (Người A: Chi Trưởng, Sinh 1955 $\leftrightarrow$ Người B: Chi Thứ, Sinh 1952).

### 5.1. Kiến Trúc Zero-Latency Hybrid Resolver & Live Reactivity (Nâng Cấp)
- **Vấn đề đã nhận diện (Root Cause):** Việc gửi toàn bộ thao tác tính toán qua network `fetch('/api/kinship')` bị chặn bởi `supabase.auth.getUser()` trong `src/middleware.ts`, gây nghẽn 15–35 giây khiến UI bị đóng băng hoàn toàn.
- **Giải pháp Zero-Latency In-Memory:**
  - Vì `findLowestCommonAncestor` và `resolveKinshipTerms` là các **Pure Functions**, trang `/kinship` sẽ tính toán trực tiếp in-memory trên client (tốc độ 0ms), biến giao diện thành **Live Reactive**:
    1. Đổi Người A hoặc Người B trên `<select>` $\rightarrow$ Tự động tính lại Cây Chữ V ngay tức thì.
    2. Đổi Tab Vùng Miền (Bắc / Trung / Nam) $\rightarrow$ Hoán chuyển danh xưng và thẻ phong tục tức thì 0ms.
    3. Bấm các nút Kịch bản mẫu $\rightarrow$ Tự động xóa chuỗi tìm kiếm (`setSearchA('')`, `setSearchB('')`) để dropdown không bị ẩn option, đồng thời hiển thị Cây Chữ V ngay 0ms.
    4. Nút [Xác Định Vai Vế Xưng Hô] vẫn được giữ nguyên để phục vụ người dùng thích thao tác thủ công.
  - **Tối ưu Middleware:** Thêm đường dẫn `api/kinship` vào danh sách loại trừ trong `src/middleware.ts` để các truy vấn API công khai không bị nghẽn mạng bởi Supabase Auth.

### 5.2. Tinh Chỉnh Giao Diện & Trải Nghiệm Người Dùng (UX Refinements Theo UAT)
- **5.2.1. Hệ Thống Đường Nối Phả Hệ Vuông Góc 90 Độ (Orthogonal Square Connectors):**
  - Loại bỏ hoàn toàn SVG đường cong nét đứt (`strokeDasharray`, `bezier`) bị lệch tâm card.
  - Thay bằng hệ thống đường nối vuông góc 90 độ nét liền `solid` (`bg-emerald-600` / `border-emerald-600`):
    - Trục đứng từ tâm đáy LCA đi xuống.
    - Trục ngang rẽ 90 độ từ tâm 25% (Cột A) sang tâm 75% (Cột B).
    - Trục rẽ xuống đâm thẳng 90 độ vào đỉnh card của Cột A và Cột B.
    - Đảm bảo 100% thẳng hàng, sắc nét và tương thích hoàn hảo với Responsive Grid.
- **5.2.2. Xử Lý Quan Hệ Trực Hệ (Bố - Con, Mẹ - Con, Ông - Cháu, Cụ - Chắt):**
  - Khi một người là tổ tiên của người kia (`distanceA === 0` hoặc `distanceB === 0`), hệ thống tự động chuyển từ Cây Chữ V sang **Sơ Đồ Dòng Trực Hệ Dọc (Vertical Direct Lineage)**.
- **5.2.3. Tinh Gọn Giao Diện:** Loại bỏ hoàn toàn khối `#cultural-customs-card`.
- **5.2.4. Đồng Bộ Vùng Miền:** Tự động nạp cấu hình vùng miền của dòng họ từ `/api/clan-settings` (`clan_settings.default_kinship_region`).
- **5.2.5. Tinh Giản Trục Nối Trực Hệ Dọc & Triệt Tiêu Ghi Chú Thừa (Minimalist Lineage & Zero-Clutter Connectors):**
  - **Loại bỏ viên thuốc text trên đường nối thế hệ:** Giữa các node trên trục trực hệ dọc, thẻ node đã có sẵn badge `Đời N` ở góc phải. Do đó, xóa bỏ hoàn toàn thẻ `span` chêm giữa đường kẻ (`Đời 1 : Đời 2`, `Đời 2 : Đời 3`...).
  - **Loại bỏ nhãn `Quan hệ Cha/Mẹ → Con`:** Không chèn chữ vào đường nối. Thay vào đó, toàn bộ các node trực hệ dọc chỉ được kết nối bởi **trục đứng nét liền thuần túy** (`w-0.5 h-6 bg-emerald-600`), tạo cảm giác liền mạch, thanh thoát và đạt độ thẩm mỹ cao nhất.
  - **Tập trung thông tin:** Các thông tin danh xưng 2 chiều ở banner và dữ liệu trên từng thẻ node là hoàn chỉnh và đầy đủ, không chèn thêm bất kỳ ghi chú phụ nào trên các nhánh nối.

### 5.3. Quản Lý & Tùy Biến Từ Điển Xưng Hô Dòng Họ Toàn Diện (Comprehensive Kinship Dictionary)
- **5.3.1. Danh Mục 6 Nhóm Thân Tộc Toàn Diện (32 Mối Quan Hệ Cốt Lõi):**
  - Mở rộng toàn diện hệ thống xưng hô họ tộc Việt Nam, bao quát trọn vẹn cả bên Nội, bên Ngoại, quan hệ Huyết thống và Hôn phối (Dâu / Rể):
    1. **Nhóm I - Trực Hệ (Nội & Ngoại):** Cha - Con (`parent_father`), Mẹ - Con (`parent_mother`), Ông nội - Cháu (`grandparent_paternal_male`), Bà nội - Cháu (`grandparent_paternal_female`), Ông ngoại - Cháu ngoại (`grandparent_maternal_male`), Bà ngoại - Cháu ngoại (`grandparent_maternal_female`), Bậc Cụ (`great_grandparent`), Kỵ tổ / Cụ tổ họ (`ancestor_4plus`).
    2. **Nhóm II - Cùng Thế Hệ & Dâu/Rể:** Anh ruột (`sibling_brother`), Chị ruột (`sibling_sister`), Anh/Chị họ Chi Trưởng (`cousin_senior`), Em họ Chi Thứ (`cousin_junior`), Chị dâu (`sister_in_law`), Anh rể (`brother_in_law`), Em dâu (`younger_sister_in_law`), Em rể (`younger_brother_in_law`).
    3. **Nhóm III - Bác / Chú / Cô (Bên Nội & Phu Thê):** Bác trai (`uncle_paternal_senior`), Vợ Bác trai - Bác dâu (`aunt_paternal_senior_wife`), Bác gái (`aunt_paternal_senior`), Chồng Bác gái - Bác rể (`uncle_paternal_senior_husband`), Chú (`uncle_paternal_junior`), Vợ Chú - Thím (`aunt_paternal_junior_wife`), Cô (`aunt_paternal_junior`), Chồng Cô - Chú dượng / Dượng (`uncle_paternal_junior_husband`).
    4. **Nhóm IV - Bác / Cậu / Dì (Bên Ngoại & Phu Thê):** Bác trai ngoại (`uncle_maternal_senior`), Vợ Bác trai ngoại - Bác dâu ngoại (`aunt_maternal_senior_wife`), Cậu (`uncle_maternal_junior`), Vợ Cậu - Mợ (`aunt_maternal_junior_wife`), Dì (`aunt_maternal_junior`), Chồng Dì - Dượng (`uncle_maternal_junior_husband`).
    5. **Nhóm V - Dâu / Rể Thế Hệ Con & Cháu:** Con dâu (`daughter_in_law`), Con rể (`son_in_law`), Cháu dâu (`grand_daughter_in_law`), Cháu rể (`grand_son_in_law`).
    6. **Nhóm VI - Bậc Họ Hàng Lệch Đời:** Ông họ (`grandparent_collateral_male`), Bà họ (`grandparent_collateral_female`).
- **5.3.2. Bộ Lọc Phân Nhóm Nhanh & Ô Tìm Kiếm (Group Filter Chips & Quick Search):**
  - Màn hình `/admin/settings` trang bị thanh chọn tab nhóm (All, Trực hệ, Cùng đời, Bác/Chú/Cô Nội, Cậu/Dì Ngoại, Dâu/Rể Con Cháu, Họ hàng) và ô tìm kiếm tức thì.
  - Mỗi hàng cho phép Admin gõ sửa trực tiếp 2 ô input: `Bề trên gọi Bề dưới (A → B)` và `Bề dưới gọi Bề trên (B → A)`.
  - Có nút **"Khôi phục chuẩn [Tên Vùng Miền]"** nạp lại mẫu 32 quan hệ của vùng miền đó.
- **5.3.3. Lưu Trữ DB & Đồng Bộ Hóa Động Với Kinship Engine:**
  - Lưu cấu hình 32 quan hệ vào `clan_settings.custom_kinship_dictionary` (`JSONB`).
  - Lõi `resolveKinshipTerms` tự động nạp cấu hình tùy biến của gia tộc.

---

## 6. XỬ LÝ LỖI & NGOẠI LỆ (ERROR HANDLING & EDGE CASES)

1. **Thành viên chưa nối phả (`parent_id` = null & không có con cái):**
   - API trả về `relationshipType = 'unrelated'`, `termAtoB` = `"Người ngoài dòng tộc"`.
   - UI hiển thị Warning Box màu vàng: *"Hai thành viên này chưa tìm thấy mối liên kết phả hệ hoặc thuộc các nhánh chưa kết nối."*
2. **Chọn trùng Người A và Người B:**
   - Dropdown tự động hiển thị lỗi cảnh báo: *"Vui lòng chọn 2 thành viên khác nhau để tra cứu vai vế."* Nút tính toán bị vô hiệu hóa (`disabled`).
3. **Mạng chậm hoặc lỗi kết nối Supabase:**
   - Fallback sang dữ liệu Local Cache / Mock Data dự phòng, hiển thị Toast cảnh báo nhẹ ở góc màn hình mà không chặn trải nghiệm người dùng.

---

## 7. MA TRẬN TEST CASES & TIÊU CHÍ NGHIỆM THU (TEST SPECIFICATION)

### 7.1. Ma Trận Test Cases (Given - When - Then)

| Test ID | Tên Kịch Bản | Loại Test | Given (Tiền điều kiện) | When (Hành động) | Then (Kết quả kỳ vọng) | Phân Loại |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC01** | LCA của Anh Em Ruột | Unit Test | Hải (Chi 1, con Bình) & Tuấn (Chi 1, con Bình) | Chạy `findLowestCommonAncestor(Hải, Tuấn)` | LCA trả về là `Nguyễn Văn Bình` (Đời 2), khoảng cách $d_A=1, d_B=1$ | Happy Path |
| **TC02** | Xưng Hô Con Chú Con Bác (Miền Bắc) | Unit Test | Hùng (Chi 2, 1945) & Hải (Chi 1, 1938) | Chạy `resolveKinshipTerms(Hùng, Hải, 'north')` | Hùng gọi Hải là `Anh` (dù Hải trẻ hơn nếu có), Hải gọi Hùng là `Em` (do Chi 1 là Chi Trưởng) | Happy Path |
| **TC03** | Xưng Hô Chú Cháu Lệch Đời | Unit Test | Cường (Đời 2, em Bình) & Hải (Đời 3, con Bình) | Chạy `resolveKinshipTerms(Cường, Hải, 'north')` | Cường gọi Hải là `Cháu`, Hải gọi Cường là `Chú` | Happy Path |
| **TC04** | Quy Đổi Ngày Âm Lịch Việt Nam | Unit Test | Ngày Dương lịch 19/02/2026 | Chạy `convertSolarToLunar(19, 2, 2026, 7)` | Trả về Ngày Âm: `03/01/2026`, Năm: `Bính Ngọ` | Happy Path |
| **TC05** | API Route Trả Về Đúng Cấu Trúc | Integration | Hệ thống có dữ liệu gia phả mẫu | Gửi `GET /api/kinship?personA=hai&personB=hung&region=north` | Status 200, JSON chứa `lca`, `pathA`, `pathB`, `termAtoB`, `termBtoA` | Happy Path |
| **TC06** | Ngoại Lệ: Thành Viên Không Nối Phả | Unit / API | Chọn 1 người cô lập (không cha mẹ, không con) | Chạy thuật toán LCA | Trả về `lca = null`, `relationshipType = 'unrelated'` | Error Handling |
| **TC07** | Đảo Vai (A ↔ B) | UI / E2E | Đang hiển thị kết quả A gọi B | Bấm nút [Đổi vai] | Đảo ngược kết quả B gọi A lên đầu ngay lập tức | Happy Path |
| **TC08** | Cây Chữ V Ngược Xuất Phát Từ LCA | UI / E2E | Chọn 2 người cùng ông nội (Đời 3) trong cây 7 đời | Bấm [Xác Định Vai Vế Xưng Hô] | Đỉnh cây hiển thị đúng Ông nội (LCA), KHÔNG hiển thị thừa các đời 2, 1 (Root) | Happy Path |
| **TC09** | Nén Tầng Trung Gian (Smart Folding) | UI / E2E | Chọn 2 người cách nhau $\ge 4$ đời (Đời 1 và Đời 6) | Bấm [Xác Định Vai Vế] $\rightarrow$ Bấm nút [🔽 Nén N thế hệ] | Ban đầu nén gọn các tầng giữa; bấm vào bung mở rộng mượt mà | Happy Path |
| **TC10** | Thẻ Diễn Giải Phong Tục Cấu Trúc Hóa | UI / E2E | Tra cứu Dũng (Chi Trưởng) và Hùng (Chi Thứ) | Quan sát khối Diễn giải phong tục | Hiển thị đủ 3 khối: Huy hiệu vùng miền, Tục ngữ cổ phong, Bảng đối sánh trực diện | UI / Visual |
| **TC11** | Phả Hệ Đa Thê & Con Nuôi | Unit Test | Dữ liệu mẫu mở rộng 25–30 người có vợ cả/hai, con nuôi | Chạy `findLowestCommonAncestor` & `resolveKinshipTerms` | Xác định đúng quan hệ con cùng cha khác mẹ và xưng hô cho con nuôi | Happy Path |
| **TC12** | Live Reactivity Khi Đổi Dropdown | UI / E2E | Đang ở trang `/kinship` | Chọn thành viên khác trên dropdown A hoặc B | Cây Chữ V và thẻ xưng hô cập nhật tức thì 0ms không cần bấm nút phụ | Happy Path |
| **TC13** | Live Reactivity Khi Đổi Vùng Miền | UI / E2E | Đang hiển thị quan hệ giữa Hùng và Hải | Bấm chuyển sang tab "Miền Nam (Trọng Tuổi)" | Danh xưng đổi tức thì thành "Anh" / "Em" theo tuổi đời 0ms | Happy Path |
| **TC14** | Auto-Clean Search Khi Chọn Mẫu | UI / E2E | Ô tìm kiếm A đang có từ khóa "abc" | Bấm nút kịch bản mẫu `👑 Cây Chữ V (Hải & Minh)` | Ô tìm kiếm tự động xóa sạch, dropdown hiển thị đúng tên, Cây Chữ V hiển thị tức thì | Happy Path |
| **TC15** | Nhánh Cây Vuông Góc 90 Độ Nét Liền | UI / E2E | Chọn 2 người phân nhánh (Hải & Minh) | Quan sát sơ đồ Cây Chữ V | Đường nối là nét liền (`solid`), rẽ vuông góc 90 độ, căn thẳng hàng 100% khớp tâm card | UI / Visual |
| **TC16** | Quan Hệ Trực Hệ Hiển Thị Cột Dọc | UI / E2E | Chọn Cụ Khởi Tổ và Cụ Bình Chi 1 (Bố - Con) | Quan sát sơ đồ quan hệ | Hiển thị Sơ đồ Dòng Trực Hệ Dọc, không có phân 2 cột chữ V, không lặp LCA, không còn dòng "(Trực hệ từ LCA)" | Happy Path |
| **TC17** | Loại Bỏ Khối Phong Tục Rườm Rà | UI / E2E | Trang `/kinship` có kết quả tra cứu | Kiểm tra DOM phía dưới sơ đồ cây | Khối `#cultural-customs-card` đã bị loại bỏ hoàn toàn | UI / Visual |
| **TC18** | Đồng Bộ Vùng Miền Tự Động Từ Setting | UI / E2E | Cài đặt dòng họ đang là Miền Bắc | Truy cập `/kinship` | Tự động áp dụng quy ước Miền Bắc, không yêu cầu chọn tay | Happy Path |
| **TC19** | Loại Bỏ Khối Xưng Hô Theo Ngữ Cảnh | UI / E2E | Trang `/kinship` có kết quả tra cứu | Kiểm tra DOM phía dưới banner xưng hô | Khối `#contextual-addressing-card` hoàn toàn bị xóa bỏ | UI / Visual |
| **TC20** | Loại Bỏ Nhãn Tiền Bối / Hậu Bối | UI / E2E | Tra cứu quan hệ trực hệ (Cường & Hùng) | Quan sát thẻ trên `#direct-lineage-tree` | Không còn chữ "Bậc Tiền Bối" / "Bậc Hậu Bối", chỉ hiển thị "Đời thứ N" | UI / Visual |
| **TC21** | Triệt Tiêu Badge "Bản Thân" Ở Cả 2 Nhánh Con | UI / E2E | Tra cứu Cây Chữ V (Hùng & Hải) | Quan sát thẻ đích của 2 cột nhánh con | Không còn chữ "Bản thân" ở cả 2 bên; các thế hệ trung gian vẫn giữ badge "Bố", "Ông" | UI / Visual |
| **TC22** | Trục Nối Trực Hệ Dọc Thuần Túy & Không Chèn Nhãn | UI / Visual | Tra cứu quan hệ trực hệ (Khởi & An hoặc Hải & Minh) | Quan sát trục nối giữa các node trên `#direct-lineage-tree` | Giữa các node chỉ có 1 trục nét liền dọc duy nhất, không còn bất kỳ viên thuốc text `Đời X : Đời Y` hay `Quan hệ Cha/Mẹ → Con` | UI / Visual |
| **TC23** | Xem Danh Sách Từ Điển Theo Vùng Miền Tại Settings | UI / Visual | Admin truy cập `/admin/settings` | Chọn vùng miền (Bắc / Trung / Nam) | Bảng từ điển hiển thị đầy đủ 4 nhóm quan hệ với danh xưng tương ứng của miền đó | Happy Path |
| **TC24** | Chỉnh Sửa Trực Tiếp & Lưu Từ Điển Xưng Hô Tùy Chỉnh | Integration / UI | Admin đang ở bảng từ điển tại `/admin/settings` | Sửa danh xưng quan hệ Bố thành "Thầy" (hoặc "Cha"), bấm "Lưu Thay Đổi" | Dữ liệu được gửi lên `PATCH /api/clan-settings`, lưu vào `custom_kinship_dictionary` thành công | Happy Path |
| **TC25** | Áp Dụng Từ Điển Tùy Biến Vào Trang Tra Cứu Kinship | Integration / UI | Dòng họ đã lưu tùy biến quan hệ Cha thành "Cha" | Người dùng truy cập `/kinship` và tra cứu quan hệ Cha - Con (Hải & Minh) | Danh xưng hiển thị chuẩn xác là "Cha" thay vì danh xưng mặc định ban đầu | Happy Path |
| **TC26** | Master Presets 32 Mối Quan Hệ Thân Tộc Cốt Lõi | Unit Test | Gọi `getRegionalPresetDictionary(region)` cho Bắc, Trung, Nam | Kiểm tra danh mục trả về | Đạt đủ 32 quan hệ, chứa đầy đủ Cậu, Mợ, Dì, Dượng, Thím, Bác dâu, Bác rể, Chị dâu, Anh rể, Con dâu, Con rể | Happy Path |
| **TC27** | Lọc Phân Nhóm & Tìm Kiếm Trên Bảng Cài Đặt | UI / Visual | Admin truy cập `/admin/settings` | Chọn chip lọc nhóm (VD: Cậu/Dì Ngoại) hoặc gõ ô tìm kiếm "Thím" | Bảng từ điển lọc chính xác các quan hệ tương ứng tức thì 0ms | Happy Path |
| **TC28** | Lưu & Áp Dụng Danh Xưng Thím / Mợ / Dượng / Dâu / Rể | Integration / UI | Sửa quan hệ Vợ chú thành "Thím ruột" hoặc Cậu thành "Cậu quý" | Bấm "Lưu Thay Đổi" | Lưu thành công và áp dụng đúng vào Kinship Engine | Happy Path |

### 7.2. Danh Sách Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] **AC1:** Thuật toán `findLowestCommonAncestor` tìm chính xác Tổ tiên chung gần nhất và khoảng cách thế hệ giữa 2 người bất kỳ trên đồ thị phả hệ.
- [x] **AC2:** Bộ từ điển xưng hô `resolveKinshipTerms` ánh xạ đúng danh xưng 2 chiều cho anh em ruột, con chú con bác, chú-cháu, ông-cháu theo 3 miền Bắc/Trung/Nam.
- [x] **AC3:** Bộ chuyển đổi `vietnamese-lunar.ts` quy đổi chính xác Âm - Dương theo múi giờ UTC+7 và xuất đúng tên Năm Can Chi (Thập Can + Thập Nhị Chi).
- [x] **AC4:** API `GET /api/kinship` trả về dữ liệu cấu trúc chuẩn, có breadcrumbs đường đi huyết thống và lý giải phong tục.
- [x] **AC5:** Giao diện `/kinship` cho phép tìm kiếm, chọn 2 thành viên, đổi vai A $\leftrightarrow$ B và xem kết quả trực quan mượt mà.
- [x] **AC6:** Bộ Unit Test (`tests/kinship.test.ts` & `tests/lunar.test.ts`) đạt tỷ lệ Pass 100%.
- [x] **AC7:** Sơ đồ Cây Phả Hệ Mini Chữ V Ngược (Inverted-V Kinship Tree) hiển thị trực quan bắt đầu từ LCA, phân 2 cột nhánh (Trưởng vs Thứ), có đường nối và thanh cầu nối xưng hô ở chân.
- [x] **AC8:** Cơ chế Smart Folding tự động nén thế hệ trung gian khi khoảng cách $\ge 4$ đời, hỗ trợ toggle mở rộng/thu gọn mượt mà.
- [x] **AC9:** Thẻ Diễn Giải Phong Tục cấu trúc hóa thay thế đoạn văn bản cũ.
- [x] **AC10:** Mở rộng bộ dữ liệu mẫu `MOCK_CLAN_MEMBERS` lên 25–30 người bao phủ đa chi, vợ cả/vợ hai, con nuôi, 6-7 đời và hôn nhân nội tộc.
- [x] **AC11:** Zero-Latency In-Memory Calculation: Trang `/kinship` tính toán quan hệ huyết thống và Cây Chữ V trực tiếp in-memory 0ms, không bị đóng băng khi mạng chậm.
- [x] **AC12:** Live Reactive UI: Tự động tính toán và cập nhật kết quả tức thì khi thay đổi dropdown Người A/B hoặc tab Vùng miền mà không bắt buộc phải bấm nút phụ.
- [x] **AC13:** Kịch bản mẫu tự động xóa bộ lọc tìm kiếm và bung kết quả Cây Chữ V ngay lập tức 0ms.
- [x] **AC14:** Sơ đồ nhánh cây Chữ V sử dụng hệ thống đường nối vuông góc 90 độ nét liền `solid`, căn thẳng tắp và khớp chính xác tâm các card cột nhánh mà không bị cong lệch.
- [x] **AC15:** Quan hệ Trực Hệ (Cha - Con, Ông - Cháu) hiển thị trên Sơ đồ Dòng Trực Hệ Dọc 1 trục thẳng đứng, loại bỏ hoàn toàn sự lặp lại của LCA và nhãn máy móc `(Trực hệ từ LCA)`.
- [x] **AC16:** Khối `#cultural-customs-card` rườm rà được xóa bỏ hoàn toàn, giao diện `/kinship` gọn gàng, thanh thoát.
- [x] **AC17:** Trang `/kinship` tự động đồng bộ quy ước vùng miền mặc định từ Cài đặt Dòng họ (`default_kinship_region`).
- [x] **AC19:** Khối `#contextual-addressing-card` ("Cách Xưng Hô Theo Ngữ Cảnh") hoàn toàn bị loại bỏ khỏi DOM và mã nguồn giao diện `/kinship`.
- [x] **AC20:** Sơ đồ Dòng Trực Hệ Dọc hiển thị số đời `Đời ${generationNumber}`, loại bỏ vĩnh viễn các nhãn thừa "Bậc Tiền Bối" và "Bậc Hậu Bối".
- [x] **AC21:** Cây Chữ V triệt tiêu hoàn toàn badge "Bản thân" tại thẻ của Người A và Người B; chỉ giữ lại badge quan hệ tổ tiên cho các bậc trung gian ("Bố", "Ông nội"...).
- [x] **AC22:** Sơ đồ Dòng Trực Hệ Dọc `#direct-lineage-tree` sử dụng trục nối đứng nét liền thuần túy giữa các node, loại bỏ triệt để mọi viên thuốc text thế hệ (`Đời X : Đời Y`) hoặc quan hệ (`Quan hệ Cha/Mẹ → Con`) chen giữa đường nối.
- [x] **AC23:** Màn hình `/admin/settings` hiển thị bảng danh sách các mối quan hệ chi tiết theo 4 nhóm họ tộc (Trực hệ, Cùng thế hệ, Bác/Chú/Cô, Bậc Ông/Bà họ) cho từng vùng miền.
- [x] **AC24:** Cho phép chỉnh sửa trực tiếp (Inline Edit) danh xưng 2 chiều của từng mối quan hệ và lưu vào trường `custom_kinship_dictionary` của `clan_settings`.
- [x] **AC25:** Trang `/kinship` và hàm `resolveKinshipTerms` tự động ưu tiên nạp và áp dụng từ điển xưng hô tùy biến đã lưu của dòng họ.
- [x] **AC26:** Mở rộng bộ từ điển danh xưng chuẩn lên 32 mối quan hệ thân tộc toàn diện bao gồm đầy đủ bên Nội, bên Ngoại, Bác dâu, Bác rể, Thím, Cậu, Mợ, Dì, Dượng và Dâu / Rể các thế hệ.
- [x] **AC27:** Màn hình `/admin/settings` bổ sung thanh chip lọc phân nhóm (Tabs/Filter Chips) và ô tìm kiếm nhanh giúp quản trị viên tra cứu và chỉnh sửa tức thì trong danh mục 32 quan hệ.
- [x] **AC28:** Tích hợp đầy đủ các quy ước Dâu / Rể / Thím / Mợ / Dượng vào `custom_kinship_dictionary` và đồng bộ với lõi Kinship Engine.

---

## 8. BẢO VỆ CHỐNG THOÁI LUI (REGRESSION GUARD CHECKLIST)

- [x] **RG01 (Trang Chủ & Header):** Thanh điều hướng Navbar liên kết tới `/kinship` hoạt động chuẩn xác, giữ nguyên giao diện Modern Heritage.
- [x] **RG02 (Auth & Dev Bypass):** Cơ chế Dev Bypass và phiên đăng nhập Super Admin hoạt động bình thường, không bị ảnh hưởng bởi tính năng mới.
- [x] **RG03 (Build & Typecheck):** `npm run typecheck` (`tsc --noEmit`) và `npm run build` tiếp tục đạt 100% 0 lỗi.
- [x] **RG04 (Đảo vai A ↔ B trên Cây Chữ V):** Khi bấm nút hoán đổi vai xưng hô ⇄, vị trí 2 cột nhánh và thanh cầu nối quan hệ đảo ngược mượt mà, không vỡ layout.
- [x] **RG05 (Responsive Mobile):** Sơ đồ cây co giãn linh hoạt hoặc chuyển sang Split Timeline trên màn hình nhỏ (< 640px) không bị tràn ngang.
- [x] **RG06 (Bypass Middleware cho API Kinship):** Route API `/api/kinship` được loại trừ khỏi kiểm tra auth của `middleware.ts`, phản hồi nhanh < 100ms.
- [x] **RG07 (Kịch bản mẫu & Đổi vai):** Các nút kịch bản mẫu và nút Đổi vai A ↔ B hoạt động trơn tru với cả Sơ đồ Chữ V và Sơ đồ Trực Hệ Dọc mới.
- [x] **RG08 (Không lỗi Compile/Runtime):** Không phát sinh lỗi runtime, hydration mismatch hoặc xung đột cache build `.next/`.
- [x] **RG09 (Toàn vẹn sơ đồ phả hệ):** Cả 2 sơ đồ (Trực hệ dọc & Chữ V) giữ nguyên các đường nối vuông góc nét liền sắc nét, thẳng tâm card.
- [x] **RG10 (Live Reactivity & Không lỗi Console):** Thao tác đổi dropdown hoặc click đổi vai diễn ra tức thì 0ms, browser console sạch 100% không lỗi.
- [x] **RG11 (Toàn vẹn trục trực hệ và cây chữ V):** Cả Sơ đồ Trực hệ dọc và Cây Chữ V hiển thị mạch lạc, không vỡ layout và không phát sinh lỗi console runtime.
- [x] **RG12 (Toàn vẹn Cài đặt Dòng họ & Tra cứu Vai vế):** Đổi tên dòng họ, lưu từ điển tùy biến, và tra cứu vai vế đồng bộ trơn tru, không lỗi TypeScript/build.
- [x] **RG13 (Toàn vẹn 16 quan hệ ban đầu & Hệ thống lọc mới):** Giữ vững các kết quả kiểm thử hiện có của TC01–TC25, không vỡ layout và đạt 0 lỗi build.

---

## 9. LỆNH THI CÔNG (Dành cho AI /feature-code)

> "AI ơi, hãy đọc kỹ đặc tả `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md` này. Dựa CHÍNH XÁC vào các mô tả ranh giới ở trên, hãy thi công toàn bộ mã nguồn lõi thuật toán Kinship Engine, Lịch Âm, API Route và trang Tra Cứu Vai Vế `/kinship`. Thực thi Vòng lặp Kiểm thử 3 Tầng (Build, Unit Test, Browser Test) và chỉ được tick `[x]` khi có bằng chứng test Pass 100%."


