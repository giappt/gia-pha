# ĐẶC TẢ KỸ THUẬT: MILESTONE 9 - CLAN DESIGN PROFILES & MODERN VIETNAMESE HERITAGE ANNIVERSARY BLOC

> **Trạng thái:** DỰ THẢO CHỜ DUYỆT (Draft - Ready for Review)  
> **Tài liệu tham chiếu:**  
> - `docs/01_Architecture-Blueprint.md`  
> - `docs/03_DB-Schema.md`  
> - `docs/14_Micro-Spec_Milestone_5_Anniversaries_WebPush_Cron.md`  
> - `docs/16_Micro-Spec_Milestone_7_Admin_Portal_Reorganization.md`  
> - `.agents/handoff/thiet-ke-lai-giao-dien-lich-gio.md`  
> - `.agents/brain/lessons_learned.md`

_Tài liệu này dùng để giới hạn Context Window. AI chỉ được phép đọc, suy luận và sinh code cho ĐÚNG các file được đề cập trong đây._

---

## 1. QUY TẮC NGHIÊM NGẶT (STRICT CONSTRAINTS)

- **Thư viện cho phép:** Không cài thêm thư viện UI bên ngoài. Sử dụng chuẩn hiện có: Next.js 14+ (App Router), React 18, TailwindCSS, Lucide Icons, `cookies()` của Next.js Server Components.
- **Tính Bất Biến Kiến Trúc [R-SPEC.INVARIANT]:**
  - **Layout Shell:** Màn hình Quản trị Giao diện `/admin/theme` bắt buộc sử dụng chuẩn `AdminShell` (Sidebar 256px + Fluid Content), không dùng container đóng hộp `max-w-5xl` ngoài cùng gây co thắt bố cục.
  - **Navigation Model:** Bổ sung menu item độc lập `/admin/theme` ("Giao Diện & Profile") trên `AdminSidebar.tsx`. Tuyệt đối không dùng Tab ngang `activeTab` gây co giật layout.
  - **Geometry & Tokens (Anti-Pill & Anti-Bubble):** Tuân thủ hình học mực thước (`rounded-xl` 12px cho card, `rounded-lg`/`rounded-md` cho controls và nút bấm, typography phân cấp bằng dấu chấm giữa `·`). Tuyệt đối CẤM lạm dụng `rounded-2xl` (16px) gây cảm giác bồng bềnh, bong bóng trẻ con thiếu trang nghiêm cho trang dòng họ.
  - **Unified RBAC:** Phân quyền lưu cấu hình giới hạn nghiêm ngặt cho `super_admin`.
- **Nguyên Tắc Bảo Toàn Thương Hiệu (Brand Sovereignty Rule):**
  - Profile giao diện chỉ thay đổi **Phong cách Bố cục & Trình bày (Presentation / Layout Style)**, KHÔNG ĐƯỢC làm đổi màu nhận diện chủ đạo của thương hiệu dòng họ.
  - Màu chủ đạo của toàn hệ thống (Logo, Tên Dòng Họ `{clanName}`, Navbar, Nút hành động chính) **BẮT BUỘC PHẢI LÀ XANH LỤC BẢO (`emerald-600` / gradient `from-emerald-700 via-emerald-600 to-teal-600`)**.
  - Việc đổi màu toàn bộ chủ đề cho sự kiện lễ hội/chào mừng phải là một phân hệ tính năng riêng sau này, không được gộp vào đây.
- **Đồng Bộ Trục Gióng (Grid Alignment):**
  - Thẻ Spotlight Lịch Giỗ trang chủ bắt buộc dùng `max-w-3xl` (thay vì `max-w-xl` 576px) để gióng thẳng hàng tuyệt đối với Khung Hero và Banner PWA, xóa bỏ hoàn toàn lỗi "thắt eo" bố cục.
- **Zero-FOUC (Chống nháy giao diện khi tải trang):** Phân giải profile giao diện hiệu lực (`effectiveProfile`) trên Server Component (`src/app/layout.tsx`), gắn `data-theme-profile` trực tiếp lên thẻ `<html>` trong HTML response ban đầu, kết hợp đệm cookie `fat_theme_config_cache` (maxAge 300s) và `fat_dev_theme_config`.

---

## 2. DATABASE & MODELS

### 2.1. Migration DDL
- **File:** `supabase/migrations/20260930000000_add_theme_config.sql`
- **DDL:**
  ```sql
  -- Bổ sung cột theme_config vào bảng clan_settings
  ALTER TABLE public.clan_settings
  ADD COLUMN IF NOT EXISTS theme_config JSONB NOT NULL 
  DEFAULT '{"active_profile": "classic", "apply_scope": "all", "allowed_user_ids": []}'::jsonb;
  ```

### 2.2. TypeScript Definitions
- **File:** `src/types/database.ts`
- **Schema Fields:**
  ```typescript
  export type DesignProfileId = 'classic' | 'heritage';

  export type ThemeApplyScope = 'all' | 'admin_only' | 'custom_users';

  export interface ClanThemeConfig {
    active_profile: DesignProfileId;
    apply_scope: ThemeApplyScope;
    allowed_user_ids: string[];
  }
  ```
- **Cập nhật interface `ClanSettings`:**
  ```typescript
  export interface ClanSettings {
    // ... các trường hiện có ...
    theme_config?: ClanThemeConfig;
  }
  ```
- **File:** `src/types/anniversary.ts`
  ```typescript
  export interface AnniversaryMemberItem {
    // ... các trường hiện có ...
    branch_name?: string | null; // Tên chi lá trực tiếp, VD: "Chi 2"
    branch_path?: string | null; // Đường dẫn phân cấp đầy đủ, VD: "Ngành 1 · Chi 2"
  }

  export interface AnniversaryOptions {
    // ... các trường hiện có ...
    branches?: BranchNode[];
    spouseRelations?: SpouseRelationRecord[];
  }
  ```

---

## 3. SƠ ĐỒ LUỒNG LOGIC (SEQUENCE DIAGRAM - MERMAID)

### 3.1. Luồng Cập Nhật Theme Profile Trong Quản Trị
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Super Admin
    participant UI as Admin Theme UI (/admin/theme)
    participant API as Route /api/clan-settings
    participant DB as Postgres (clan_settings)
    participant CK as Browser Cookies

    Admin->>UI: Chọn Profile ('heritage') & Scope ('admin_only' / 'all' / 'custom_users')
    Admin->>UI: Bấm "Lưu Cấu Hình Giao Diện"
    UI->>API: PATCH /api/clan-settings { theme_config }
    API->>API: Xác thực quyền Super Admin (Auth / Dev User)
    API->>DB: UPDATE clan_settings SET theme_config = ... (Service Role Bypass RLS)
    API->>CK: Set cookie fat_theme_config_cache & fat_dev_theme_config
    API-->>UI: Response JSON { success: true, data: { theme_config } }
    UI-->>Admin: Hiển thị Toast thông báo thành công & Tải lại xem hiệu lực
```

### 3.2. Luồng Phân Giải Theme Hiệu Lực Không Gây Nháy (Zero-FOUC SSR)
```mermaid
sequenceDiagram
    autonumber
    actor User as Con Cháu / Khách / Admin
    participant Server as RootLayout (Server Component)
    participant Engine as admin-engine (resolveEffectiveThemeProfile)
    participant Page as Home / Anniversaries Page

    User->>Server: Truy cập Website (GET / hoặc /anniversaries)
    Server->>Server: Đọc session user (User ID, User Role) & Impersonated Role
    Server->>Server: Đọc theme_config từ cookie cache (hoặc DB clan_settings)
    Server->>Engine: resolveEffectiveThemeProfile(theme_config, currentUser)
    Engine-->>Server: Trả về effectiveProfile ('classic' | 'heritage')
    Server->>Server: Gắn data-theme-profile={effectiveProfile} vào <html lang="vi">
    Server->>Page: Truyền effectiveProfile xuống các Widget Lịch Giỗ
    Page->>Page: Render Thẻ Classic (nếu 'classic') HOẶC Thẻ Bloc Lịch (nếu 'heritage')
    Server-->>User: Trả về trọn vẹn HTML đã áp style đồng bộ (0% FOUC)
```

---

## 4. BACKEND LOGIC / API

### 4.1. Lõi Phân Giải Theme Engine (`src/lib/admin/admin-engine.ts`)
- **Hằng số mặc định:**
  ```typescript
  export const DEFAULT_THEME_CONFIG: ClanThemeConfig = {
    active_profile: 'classic',
    apply_scope: 'all',
    allowed_user_ids: [],
  };
  ```
- **Hàm phân giải an toàn (fallback khi dữ liệu khuyết thiếu):**
  ```typescript
  export function resolveThemeConfig(config?: Partial<ClanThemeConfig> | null): ClanThemeConfig {
    if (!config || typeof config !== 'object') {
      return { ...DEFAULT_THEME_CONFIG };
    }
    return {
      active_profile: config.active_profile === 'heritage' ? 'heritage' : 'classic',
      apply_scope:
        config.apply_scope === 'admin_only' || config.apply_scope === 'custom_users'
          ? config.apply_scope
          : 'all',
      allowed_user_ids: Array.isArray(config.allowed_user_ids)
        ? config.allowed_user_ids.filter((id): id is string => typeof id === 'string')
        : [],
    };
  }
  ```
- **Hàm tính toán Theme Profile hiệu lực (`resolveEffectiveThemeProfile`):**
  ```typescript
  export function resolveEffectiveThemeProfile(
    config?: Partial<ClanThemeConfig> | null,
    currentUser?: { id?: string; role?: UserRole; isSuperAdmin?: boolean } | null
  ): DesignProfileId {
    const resolved = resolveThemeConfig(config);
    if (resolved.active_profile === 'classic') {
      return 'classic';
    }

    // Nếu active_profile là 'heritage':
    if (resolved.apply_scope === 'all') {
      return 'heritage';
    }

    if (resolved.apply_scope === 'admin_only') {
      return currentUser?.isSuperAdmin ? 'heritage' : 'classic';
    }

    if (resolved.apply_scope === 'custom_users') {
      if (currentUser?.isSuperAdmin) return 'heritage';
      if (currentUser?.id && resolved.allowed_user_ids.includes(currentUser.id)) {
        return 'heritage';
      }
      return 'classic';
    }

    return 'classic';
  }
  ```

### 4.2. API Route `src/app/api/clan-settings/route.ts`
- **GET:**
  - Bổ sung `theme_config` vào đối tượng `data` trả về. Đọc ưu tiên từ cookie dev `fat_dev_theme_config` hoặc `clan_settings.theme_config`, fallback `DEFAULT_THEME_CONFIG`.
- **PATCH:**
  - Kiểm tra quyền Super Admin (nếu không phải $\rightarrow$ 403 Forbidden).
  - Đọc `body.theme_config`. Nếu có, chuẩn hóa qua `resolveThemeConfig(body.theme_config)`.
  - Cập nhật vào DB Postgres bằng `createAdminClient()` (Service Role) để bypass RLS.
  - Ghi đè cookie `fat_dev_theme_config` (maxAge 30 ngày) và `fat_theme_config_cache` (maxAge 300s, path `/`, sameSite `lax`).
  - Trả về payload cập nhật thành công.

---

## 5. FRONTEND UI & LOGIC

### 5.1. Màn Hình Quản Trị Giao Diện (`src/app/admin/theme/page.tsx`)
- **Route:** `/admin/theme`
- **Tích hợp Shell:** Nằm trọn vẹn trong `AdminShell` thông qua Sidebar.
- **State quản lý:**
  - `config`: `ClanThemeConfig` (lưu cấu hình hiện tại).
  - `userList`: Danh sách người dùng hệ thống (`UserProfile[]`) để phục vụ whitelist khi chọn `custom_users`.
  - `isSaving`, `statusMessage`, `previewProfile`: Hỗ trợ live preview trực quan.
- **Giao diện lựa chọn:**
  - **Khối 1 — Lựa Chọn Profile:** Hai thẻ lớn đối chiếu trực tiếp:
    1. *Classic Minimalist:* Tông ngọc lục bảo thanh thoát, phong cách thẻ trắng hiện đại.
    2. *Modern Vietnamese Heritage:* Tông Đỏ son tươi kết hợp Vàng hoàng kim, viền hairline sắc nét, Lịch Bloc truyền thống.
  - **Khối 2 — Phạm Vi Áp Dụng (Rollout Scope):** 3 tùy chọn trực quan:
    1. `Toàn bộ người dùng & khách vãng lai (All)`: Triển khai toàn diện.
    2. `Chỉ Quản trị viên (Admin Only)`: Chế độ Canary kiểm thử an toàn trên dữ liệu thật.
    3. `Chỉ định thành viên (Custom Whitelist)`: Chọn thêm các tài khoản con cháu cụ thể.
  - **Khối 3 — Live Preview:** Trực quan hóa ngay trên trang một thẻ Lịch Giỗ mẫu theo phong cách được chọn.
  - **Nút Lưu & Phản Hồi:** Nút "Lưu Cấu Hình Giao Diện" kèm spinner và toast thông báo thành công.

### 5.2. Cập Nhật Menu Admin Sidebar (`src/components/admin/AdminSidebar.tsx`)
- Thêm mục vào nhóm **"VẬN HÀNH & HỆ THỐNG"**:
  ```typescript
  {
    href: '/admin/theme',
    label: 'Giao Diện & Profile',
    icon: Palette, // từ lucide-react
  }
  ```

### 5.3. Tiêm Cấu Hình Zero-FOUC Tại RootLayout (`src/app/layout.tsx`)
- Đọc `theme_config` từ cookie cache hoặc DB.
- Tính toán `effectiveProfile = resolveEffectiveThemeProfile(themeConfig, currentUser)`.
- Đặt thuộc tính trên thẻ HTML:
  ```tsx
  <html lang="vi" data-theme-profile={effectiveProfile} className={`h-full ${beVietnamPro.variable}`} suppressHydrationWarning>
  ```
- Điều chỉnh lớp selection:
  ```tsx
  <body className={`antialiased min-h-screen flex flex-col font-sans ${
    effectiveProfile === 'heritage'
      ? 'selection:bg-red-100 selection:text-red-950 dark:selection:bg-red-950/80 dark:selection:text-amber-200'
      : 'selection:bg-emerald-100 selection:text-emerald-900'
  }`}>
  ```

### 5.4. Định Nghĩa Design Tokens Toàn Cục & Cục Bộ (`src/app/globals.css`)
- **Tôn trọng Brand Identity:** Tuyệt đối không ghi đè màu chủ đạo toàn hệ thống sang màu đỏ. Màu nhận diện thương hiệu dòng họ (H1, Logo, Header, Navbar, CTA chính) vẫn giữ nguyên tông Xanh Lục Bảo `emerald-600`.
- Biến CSS và token khi `[data-theme-profile="heritage"]` phục vụ chuẩn hóa Phương Án A (Clean Lunar Red):
  - `--heritage-bloc-today`: Tông đỏ son (`#dc2626` / `#b91c1c`) cho đỉnh bloc ngày lễ/ngày giỗ hôm nay.
  - `--heritage-bloc-tomorrow`: Tông vàng hoàng kim (`#f59e0b` / `#fbbf24`) cho ngày mai giỗ.
  - `--heritage-bloc-future`: Tông Xanh Ngọc Lục Bảo Trầm (`#065f46` / `bg-emerald-800 text-white`) cho đỉnh bloc các ngày tương lai, thay thế hoàn toàn màu xám than thô cứng, tạo sự kết nối bền chặt với nhận diện cội nguồn dòng họ.
  - `--heritage-lunar-red`: Sắc đỏ son truyền thống (`#dc2626`) cho con số ngày âm lịch trên nền trắng sứ tờ lịch.

### 5.5. Đưa Thiết Kế Lịch Giỗ Bloc Vào Production (Quy Chuẩn Tinh Chỉnh Thẩm Mỹ & Cấu Hình Ngành/Chi)
- **Chuẩn Hóa Phương Án A (Sắc Đỏ Son Trên Nền Trắng Sứ Đồng Nhất):**
  - **Triệt tiêu dải chân vàng kem ngà:** Bỏ hoàn toàn dải nền `bg-amber-100` ở Desktop Timeline. Tất cả các vị trí hiển thị ngày âm (Home Spotlight, Desktop Timeline, Mobile Timeline) quy về một chuẩn duy nhất:
    * **Con số ngày âm:** Luôn mang màu **ĐỎ SON TRUYỀN THỐNG (`text-red-600 dark:text-red-400 font-black`)** nổi bật trên nền trắng sứ của tờ lịch.
    * **Chữ ngữ cảnh ngày/tháng/năm âm:** Luôn mang màu **Xám chì thanh lịch (`text-slate-600 dark:text-slate-400 font-medium`)**.
- **Tách Component & Chuẩn Hóa Bố Cục:**
  - `src/components/anniversaries/AnniversaryBlocCard.tsx` (Thẻ Spotlight Lịch Giỗ Trang Chủ):
    - **Trục Gióng (Grid Alignment):** Tăng từ `max-w-xl` (576px) lên `max-w-3xl` (768px) để gióng thẳng hàng tuyệt đối với Khung Hero và Banner PWA, xóa bỏ triệt để lỗi "thắt eo" bố cục.
    - **Hình học Anti-Bubble:** Hạ góc bo từ `rounded-2xl` (16px) xuống `rounded-xl` (12px) cho khung ngoài, `rounded-lg` cho khối con bên trong.
    - **Nút CTA Chính:** Mang màu Xanh Lục Bảo chuẩn `bg-emerald-600 hover:bg-emerald-700 text-white font-medium` ở cả Desktop và Mobile.
    - **Bố Cục Âm Lịch Thẻ Home Tối Ưu Hóa Riêng Biệt Cho PC và Mobile:**
      * *Phiên bản Desktop (PC - md+):* Bố cục **Lệch Trái 2 Dòng (Left-Aligned 2-Row Split)** trong cột 185px. Số ngày âm đỏ to (`text-3xl font-black text-red-600`) căn trái cao 2 dòng; kề bên phải gồm 2 dòng: dòng trên là `tháng {lunar_month} âm lịch` (`text-xs font-bold text-slate-800`), dòng dưới là `Năm {lunar_year_name}` (`text-[11px] font-medium text-slate-500`). Toàn bộ cụm căn giữa trong lòng cột 185px.
      * *Phiên bản Mobile (< md):* Bố cục **Dàn Ngang 2 Mép (`justify-between`)** tận dụng bề ngang màn hình điện thoại: mép trái là `19 tháng {lunar_month} âm lịch` (số 19 đỏ son to `text-2xl`, tháng kề bên cùng baseline), mép phải là `Năm {lunar_year_name}` (`text-right text-[11px]`), đồng bộ 100% với ảnh chụp thiết kế.
    - **Hiển Thị Ngành & Chi:** Tại dòng thông tin phụ, tích hợp Ngành/Chi cạnh Thế hệ theo chuẩn Anti-Pill Typography: `Đời thứ {generation} · {branch_path || branch_name} · Hưởng thọ {age}t`.
  - `src/components/anniversaries/AnniversaryBlocTimeline.tsx` (Danh Sách Ngày Giỗ Trang `/anniversaries`):
    - **Hình học Anti-Bubble:** Giảm góc bo thẻ từ `rounded-2xl` về `rounded-xl`.
    - **Đỉnh Khối Ngày (Bloc Header):** 
      * Hôm nay: Đỏ son `bg-red-600 text-white`.
      * Ngày mai: Vàng hoàng kim `bg-amber-400 text-slate-950 font-black`.
      * Các ngày tương lai: **Xanh Ngọc Lục Bảo Trầm (`bg-emerald-800 text-white dark:bg-emerald-900`)** thay thế màu xám than.
    - **Đồng Nhất Nền Trắng Sứ Ngày Âm:** Đổi dải chân PC thành nền trắng sứ với số ngày âm màu đỏ son: `<span className="text-red-600 font-black">{day}/{month}</span> <span className="text-slate-600 font-medium">Âm Lịch</span>`.
    - **Dọn Sạch Header PC:** Loại bỏ chữ `| Năm Bính Ngọ` lơ lửng.
    - **Hiển Thị Ngành & Chi:** Hiển thị `Đời {generation} · {branch_path || branch_name} · Hưởng thọ {age}t` trên cả PC và Mobile.
  - `src/app/page.tsx`:
    - Khôi phục màu H1 tiêu đề dòng họ `{clanName}` và nhãn Eyebrow về gradient Xanh Lục Bảo chuẩn (`bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600`), bảo toàn 100% Brand Sovereignty.
    - Nạp `branches` và `spouseRelations` từ CSDL truyền vào `getUpcomingAnniversaries`.
  - `src/app/anniversaries/page.tsx`:
    - Nạp `branches` và `spouseRelations` từ CSDL truyền vào `getUpcomingAnniversaries`.
- **Tích hợp có điều kiện:**
  - Tại `src/app/page.tsx`: Kiểm tra `effectiveProfile === 'heritage'` $\rightarrow$ render `AnniversaryBlocCard`; ngược lại render Classic Spotlight nguyên bản.
  - Tại `src/app/anniversaries/page.tsx`: Kiểm tra `effectiveProfile === 'heritage'` $\rightarrow$ render `AnniversaryBlocTimeline`; ngược lại render Classic Timeline nguyên bản.

---

## 6. XỬ LÝ LỖI & NGOẠI LỆ (ERROR HANDLING & EDGE CASES)

- **Edge Case 1 (Người dùng chưa đăng nhập khi scope là `admin_only` hoặc `custom_users`):**  
  Server tự động phân giải về `classic`. Khách vãng lai và con cháu không thấy xáo trộn giao diện.
- **Edge Case 2 (Chế độ đóng vai Role Impersonation):**  
  Khi Super Admin dùng `RoleImpersonationBanner` đóng vai thành `guest` hoặc `viewer`, nếu scope đang là `admin_only`, `resolveEffectiveThemeProfile` sẽ phản hồi đúng theo vai đang đóng (nhận `classic`), giúp Admin kiểm thử chính xác góc nhìn của con cháu.
- **Edge Case 3 (Lỗi CSDL hoặc rớt mạng khi PATCH):**  
  API có timeout 1500ms, ghi đệm cookie `fat_dev_theme_config` để môi trường offline/dev vẫn lưu mượt mà không crash.
- **Edge Case 4 (Cookie bị hỏng hoặc payload rỗng):**  
  Hàm `resolveThemeConfig` luôn bọc an toàn, trả về fallback `DEFAULT_THEME_CONFIG` (`classic`, scope `all`).

---

## 7. MA TRẬN TEST CASES & TIÊU CHÍ NGHIỆM THU (TEST SPECIFICATION)

### 7.1. Bảng Kịch Bản Kiểm Thử Tự Động (Automated Test Suite trong `tests/theme-profile-engine.test.ts` & `tests/anniversary-engine.test.ts`)

| ID | Tên Kịch Bản | File Test | Tiền điều kiện (Given) | Thao tác kích hoạt (When) | Kết quả kỳ vọng (Then) | Phân loại | Trạng thái |
|---|---|---|---|---|---|---|---|
| **TC_UT_THEME_01** | Khởi tạo cấu hình mặc định an toàn | `tests/theme-profile-engine.test.ts` | Config đầu vào là `undefined`, `null` hoặc `{}` | Gọi `resolveThemeConfig(input)` | Trả về `active_profile: 'classic'`, `apply_scope: 'all'`, `allowed_user_ids: []` | Happy Path | - [x] PASS |
| **TC_UT_THEME_02** | Phân giải profile khi scope là 'all' | `tests/theme-profile-engine.test.ts` | `active_profile: 'heritage'`, `apply_scope: 'all'` | Gọi `resolveEffectiveThemeProfile` với Guest, Viewer, Member, Admin | 100% các role đều nhận kết quả `'heritage'` | Happy Path | - [x] PASS |
| **TC_UT_THEME_03** | Phân giải khi scope là 'admin_only' | `tests/theme-profile-engine.test.ts` | `active_profile: 'heritage'`, `apply_scope: 'admin_only'` | Gọi với `isSuperAdmin: true` vs `isSuperAdmin: false` | Admin nhận `'heritage'`; Guest/Member nhận `'classic'` | Phân Quyền | - [x] PASS |
| **TC_UT_THEME_04** | Phân giải khi scope là 'custom_users' | `tests/theme-profile-engine.test.ts` | `allowed_user_ids: ['user-123']`, `apply_scope: 'custom_users'` | Gọi với User `user-123` vs User `user-999` | `user-123` nhận `'heritage'`; `user-999` nhận `'classic'` | Whitelist | - [x] PASS |
| **TC_UT_THEME_05** | Tương thích Role Impersonation | `tests/theme-profile-engine.test.ts` | Scope `admin_only`, Admin đóng vai `guest` | Tính `effectiveRole` rồi gọi `resolveEffectiveThemeProfile` | Trả về `'classic'` (khớp với góc nhìn của vai đóng) | Edge Case | - [x] PASS |
| **TC_INT_THEME_01** | API GET /api/clan-settings trả về theme_config | `tests/theme-profile-engine.test.ts` | Mock DB / Cookie mang `theme_config` | Gửi request `GET /api/clan-settings` | Response 200, payload `data.theme_config` chứa đầy đủ 3 trường | API Contract | - [x] PASS |
| **TC_INT_THEME_02** | API PATCH /api/clan-settings từ chối khi không phải Super Admin | `tests/theme-profile-engine.test.ts` | Session người dùng là `viewer` hoặc `null` | Gửi `PATCH /api/clan-settings` với `theme_config` | Response 403 Forbidden | Bảo Mật | - [x] PASS |
| **TC_INT_THEME_03** | API PATCH /api/clan-settings cập nhật thành công cho Super Admin | `tests/theme-profile-engine.test.ts` | Session Super Admin hợp lệ | Gửi `PATCH /api/clan-settings` với cấu hình `heritage` | Response 200, `success: true`, cập nhật cấu hình mới | API Contract | - [x] PASS |
| **TC_UT_ANNIV_BRANCH_01** | Phân giải chính xác Ngành & Chi cho người giỗ | `tests/anniversary-engine.test.ts` | Danh sách thành viên kèm cấu hình `branches` phân cấp (Ngành 1 > Chi 2) | Gọi `getUpcomingAnniversaries(members, { branches })` | Thành viên thuộc Chi 2 có `branch_name === 'Chi 2'` và `branch_path === 'Ngành 1 · Chi 2'` | Ngành/Chi | - [x] PASS |
| **TC_UT_ANNIV_BRANCH_02** | Xử lý an toàn khi không thuộc nhánh hoặc không có cấu hình | `tests/anniversary-engine.test.ts` | `branches` rỗng hoặc cụ Thủy tổ đời 1 | Gọi `getUpcomingAnniversaries(members, { branches: [] })` | Thành viên có `branch_name === null` và `branch_path === null`, không gây crash | Edge Case | - [x] PASS |

### 7.2. Danh Sách Tiêu Chí Nghiệm Thu Thị Giác (Human Visual UAT Matrix)

- [ ] **UAT_01 (Trang Quản Trị Giao Diện):** Mở `/admin/theme` trên trình duyệt → Hiển thị đầy đủ trong AdminShell, có 2 thẻ đối chiếu Profile, bộ chọn 3 mức Scope và khung Live Preview.
- [ ] **UAT_02 (Nghiệm Thu Scope Admin-Only):** Admin chọn Profile "Modern Vietnamese Heritage", Scope "Chỉ áp dụng cho Admin", bấm Lưu.  
  - Admin vào Trang Chủ và `/anniversaries`: Thấy giao diện Lịch Bloc truyền thống màu Đỏ son và Vàng hoàng kim.  
  - Mở Tab Ẩn danh (Incognito / Guest): Vẫn thấy giao diện Classic xanh ngọc lục bảo nguyên bản.
- [ ] **UAT_03 (Nghiệm Thu Scope All Toàn Dòng Họ):** Admin đổi Scope sang "Toàn bộ người dùng & khách vãng lai", bấm Lưu → Tải lại Tab Ẩn danh: Lập tức chuyển sang giao diện Lịch Bloc Heritage.
- [ ] **UAT_04 (Nghiệm Thu Scope Custom Users):** Admin chọn Scope "Chỉ định thành viên", tick chọn 1 tài khoản con cháu cụ thể → Đăng nhập tài khoản đó thấy giao diện mới; tài khoản khác vẫn thấy giao diện Classic.
- [ ] **UAT_05 (Nghiệm Thu Mobile Lịch Bloc):** Mở `/anniversaries` trên mobile: Icon lịch bloc 58px chạm 2 mép, 3 dòng header (countdown, ngày âm, số người giỗ), tên cụ chiếm trọn bề ngang không bị cắt, nút `[🌿 Xem Cây]` neo dứt khoát góc dưới bên phải.
- [ ] **UAT_06 (Console Sạch):** Mở Developer Console trên cả PC và Mobile → 0 lỗi đỏ, 0 cảnh báo Hydration mismatch.
- [ ] **UAT_07 (Bảo Toàn Nhận Diện Thương Hiệu H1):** Tiêu đề H1 "DÒNG HỌ PHẠM VĂN" và nhãn Eyebrow trên trang chủ luôn là màu Xanh Lục Bảo Gradient (`from-emerald-700 via-emerald-600 to-teal-600`), không bị đổi màu sang đỏ/cam khi bật profile Heritage.
- [ ] **UAT_08 (Trục Gióng & Anti-Bubble Thẻ Spotlight Trang Chủ):** Thẻ Lịch Giỗ Spotlight có chiều rộng `max-w-3xl` gióng thẳng hàng tuyệt đối với Khung Hero Card và Banner PWA; các góc bo dùng chuẩn `rounded-xl`; nút CTA chính mang màu Xanh Lục Bảo `bg-emerald-600 hover:bg-emerald-700` thay cho nút đen.
- [ ] **UAT_10 (Đồng Nhất Màu Sắc Ngày Âm Phương Án A):** 100% các màn hình (Home Spotlight, Desktop Timeline, Mobile Timeline) hiển thị số ngày âm bằng **MÀU ĐỎ SON (`text-red-600`) trên nền TRẮNG SỨ**, chữ ngữ cảnh màu Xám chì. Không còn dải chân vàng kem ngà gây phân mảnh màu.
- [ ] **UAT_11 (Bố Cục Âm Lịch Thẻ Home PC vs Mobile):**
  - PC: Số ngày âm to đỏ (`text-3xl font-black`) căn trái cao 2 dòng, bên phải gồm tháng ở trên và năm ở dưới trong cột 185px.
  - Mobile: Dàn ngang 2 mép (`justify-between`), bên trái là `19 tháng 8 âm lịch`, bên phải là `Năm Bính Ngọ` đúng 100% như ảnh chụp.
- [ ] **UAT_12 (Header Tháng Tương Lai Xanh Ngọc Lục Bảo Trầm):** Header các ngày tương lai (Tháng 10) mang màu **Xanh Ngọc Lục Bảo Trầm (`bg-emerald-800 text-white`)**, tạo sự kết nối với màu chủ đạo dòng họ và nhường trọn spotlight cho ngày Hôm Nay Giỗ (Đỏ son).
- [ ] **UAT_13 (Hiển Thị Cấu Hình Ngành & Chi):** Thẻ người giỗ hiển thị thông tin Ngành/Chi (nếu có trong cấu hình) cạnh Thế hệ, ví dụ: `Đời 12 · Chi 2 · Hưởng thọ 46t`.

---

## 8. BẢO VỆ CHỐNG THOÁI LUI (REGRESSION GUARD CHECKLIST)

- [x] **RG01 (Build & Typecheck Clean):** Chạy `npm run typecheck` và `npm run build` — 0 lỗi biên dịch.
- [x] **RG02 (Automated Test Suite Regression):** Chạy `npm test` — Toàn bộ 417 test cases PASS 100% (0 failures mới so với baseline).
- [x] **RG03 (Bảo Toàn Giao Diện Classic):** Khi profile cấu hình là `classic`, giao diện Trang Chủ và Trang Lịch Giỗ giữ nguyên 100% hành vi, màu sắc và cấu trúc DOM hiện có.
- [x] **RG04 (Toàn Vẹn Cài Đặt Dòng Họ):** Các trường khác trong `clan_settings` (`clan_name`, `branches`, `branch_tiers`, `custom_kinship_dictionary`, `feature_flags`) tiếp tục hoạt động trơn tru, không bị ghi đè hay mất mát khi PATCH `theme_config`.

---

## 9. LỆNH THI CÔNG (Dành cho AI /feature-code)

> "AI ơi, hãy đọc kỹ đặc tả `docs/18_Micro-Spec_Milestone_9_Design_Profiles_And_Anniversary_Bloc.md` này. Dựa CHÍNH XÁC vào các mô tả ranh giới ở trên, hãy thi công toàn bộ mã nguồn hoàn chỉnh kèm file test trong `tests/`. Thực thi Vòng Lặp Kiểm Chứng Bằng Code Thật bằng đúng các lệnh khai báo tại `[VERIFY_COMMANDS]` (Typecheck/Build → Automated Test Suite → Human UAT), và chỉ được tick `[x]` cho Mục 7.1 khi terminal log cho thấy test phủ AC đó đã pass và không có failure mới so với baseline."
