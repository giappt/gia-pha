# BẢN THIẾT KẾ KỸ THUẬT & CHIA MILESTONE (THE SKELETON)

_Dự án: FAT (Family Tree - Hệ Thống Quản Lý Gia Phả Dòng Họ)_

> **Lệnh dành cho AI / Trợ lý Lập trình:** Tài liệu này đóng vai trò là "Luật Kỹ Thuật" (Technical Constraints). Khi sinh code ở các bước sau, bạn PHẢI tuân thủ 100% Tech Stack, Cấu trúc thư mục và Quy ước đặt tên được định nghĩa tại đây. Không tự ý thêm thư viện ngoài hoặc đổi chuẩn code.

---

## 1. TECH STACK CHÍNH THỨC

- **Ngôn ngữ Lập trình:** TypeScript (Strict Mode enabled).
- **Frontend Framework:** Next.js 14+ (App Router, Server Components & Client Components), React 18+.
- **CSS & UI Framework:** 
  - TailwindCSS (Styling).
  - Lucide Icons (`lucide-react`).
  - Shadcn UI / Radix UI Primitives (Dialog, Dropdown, Tabs, Switch, Tooltip, Toast).
- **Thư viện Vẽ Đồ thị Cây Phả hệ (Tree Visualization):**
  - `@xyflow/react` (React Flow v12) — Hỗ trợ Pan, Zoom, Custom Nodes (`MemberNode`, `GhostNode`), Minimap, Drag & Drop, 60 FPS Virtualization.
  - `dagre` / `d3-hierarchy` (Hỗ trợ thuật toán tự động sắp xếp tọa độ cây phân tầng không bị đè node).
- **Quản lý Trạng thái Toàn cục (State Management):**
  - `zustand` (Store nhẹ, tách biệt `useAuthStore`, `useTreeConfigStore`, `useClanSettingsStore`).
- **Backend Services & Database (BaaS):**
  - **Supabase** (PostgreSQL 15+ với Recursive CTE `WITH RECURSIVE`).
  - `@supabase/supabase-js` và `@supabase/ssr` (Quản lý Cookie session an toàn trên Next.js App Router).
  - Supabase Auth (Google OAuth 2.0).
  - Supabase Storage (Bucket `avatars` công khai hỗ trợ CDN, chuẩn S3-compatible).
- **PWA & Push Notification:**
  - `@serwist/next` (hoặc `next-pwa`) — Cấu hình Service Worker, Web App Manifest để cài app lên Home Screen điện thoại.
  - `web-push` — Thư viện gửi Push Notification qua chuẩn VAPID keys.
- **Tiện ích Xử lý Lịch Âm & Nhập liệu:**
  - Thuật toán Âm lịch Việt Nam chuẩn xác theo múi giờ UTC+7 (dựa trên thuật toán Hồ Ngọc Đức / `lunar-javascript`).
  - `xlsx` (SheetJS) — Đọc và xuất file Excel cho tính năng Bulk Import.
- **Hạ tầng & Vận hành (Deployment):**
  - **Vercel** (Serverless Hosting, Edge Network).
  - **Vercel Cron Jobs** (`vercel.json`) — Chạy định kỳ lúc 7:00 AM mỗi ngày kích hoạt API quét ngày giỗ.

---

## 2. QUY ƯỚC ĐẶT TÊN & STYLE GUIDE (NAMING CONVENTIONS)

- **Tên Biến & Hàm (Variables / Functions):** `camelCase` (VD: `findLowestCommonAncestor`, `calculateKinship`, `formatLunarDate`).
- **Tên Component React:** `PascalCase` (VD: `FamilyTreeView.tsx`, `MemberModal.tsx`, `GhostNodeCard.tsx`).
- **Tên File Tiện ích & Hooks (Non-component):** `kebab-case` (VD: `kinship-engine.ts`, `lunar-converter.ts`, `use-tree-data.ts`).
- **Hằng số (Constants):** `UPPER_SNAKE_CASE` (VD: `DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh'`, `MAX_TREE_DEPTH = 15`).
- **Tên Bảng & Cột CSDL (PostgreSQL):** `snake_case` (VD: `death_lunar_day`, `is_senior_branch`, `father_id`).
- **Ngôn ngữ Code:** Tên biến, tên hàm, types và interfaces viết hoàn toàn bằng **Tiếng Anh**. Comment giải thích logic và giao tiếp với User bằng **Tiếng Việt**.

---

## 3. CẤU TRÚC THƯ MỤC DỰ KIẾN (FOLDER STRUCTURE)

```
fat/
├── .agents/                        # Bộ não, workflows và luật lệ AI Agent
├── docs/                           # Tài liệu đặc tả SDLC (01 đến 08)
├── supabase/
│   └── migrations/                 # Các file SQL Migration DDL
│       └── 20260903000000_init_schema.sql
├── public/
│   ├── icons/                      # Icon PWA các kích cỡ (192, 512, maskable)
│   ├── images/                     # Ảnh avatar mặc định nam/nữ, logo họ
│   ├── manifest.json               # Web App Manifest cho PWA
│   └── sw.js                       # Service Worker xử lý Push Notification
├── src/
│   ├── app/                        # Next.js 14+ App Router
│   │   ├── layout.tsx              # Root Layout (Fonts, Theme Provider, Toast)
│   │   ├── page.tsx                # Trang chủ (S-01: Family Tree Canvas)
│   │   ├── anniversaries/          # Trang Lịch Giỗ 30 Ngày (S-04)
│   │   │   └── page.tsx
│   │   ├── kinship/                # Trang Tra Cứu Vai Vế (S-03)
│   │   │   └── page.tsx
│   │   ├── claim/                  # Trang Đăng nhập & Nhận Node (S-05)
│   │   │   └── page.tsx
│   │   ├── admin/                  # Khu vực Quản trị viên
│   │   │   ├── layout.tsx          # Layout kiểm tra Role Admin
│   │   │   ├── claims/page.tsx     # Duyệt Claim Requests (S-06)
│   │   │   ├── settings/page.tsx   # Cài đặt dòng họ & Master Data Chi (S-07)
│   │   │   ├── import/page.tsx     # Bulk Excel Import (S-08)
│   │   │   └── users/page.tsx      # Quản lý & Phân quyền User (S-10)
│   │   └── api/                    # Route Handlers (Serverless APIs)
│   │       ├── tree/route.ts       # API lấy dữ liệu đồ thị cây đệ quy
│   │       ├── members/route.ts    # CRUD thành viên
│   │       ├── users/route.ts      # API lấy danh sách & cập nhật role user
│   │       ├── kinship/route.ts    # API tính vai vế xưng hô
│   │       ├── anniversaries/route.ts # API danh sách ngày giỗ
│   │       ├── claim/route.ts      # API gửi & duyệt yêu cầu claim
│   │       ├── push/subscribe/route.ts # API lưu push subscription
│   │       └── cron/anniversary/route.ts # Endpoint kích hoạt bởi Vercel Cron
│   ├── components/                 # React UI Components
│   │   ├── tree/                   # Khối vẽ cây đồ thị
│   │   │   ├── TreeCanvas.tsx
│   │   │   ├── MemberNode.tsx
│   │   │   ├── GhostNode.tsx
│   │   │   ├── TreeControls.tsx
│   │   │   └── UnlinkedDrawer.tsx  # Khay thành viên chưa nối phả (S-09)
│   │   ├── modals/                 # Các cửa sổ tương tác
│   │   │   ├── MemberDetailModal.tsx
│   │   │   ├── MemberFormModal.tsx # Form tạo/sửa 1 cấp
│   │   │   └── ClaimRequestModal.tsx
│   │   ├── kinship/                # Giao diện tra cứu vai vế
│   │   │   ├── KinshipSelector.tsx
│   │   │   └── KinshipResultCard.tsx
│   │   └── ui/                     # Shadcn UI primitives (Button, Dialog...)
│   ├── lib/                        # Thư viện logic lõi
│   │   ├── supabase/               # Khởi tạo Supabase client & server client
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── kinship-engine/         # Thuật toán tìm LCA & Tra từ điển
│   │   │   ├── lca-finder.ts
│   │   │   └── regional-dictionaries.ts
│   │   ├── lunar/                  # Bộ quy đổi Âm - Dương & Can Chi
│   │   │   └── vietnamese-lunar.ts
│   │   ├── excel/                  # Parser & Validator file Excel
│   │   │   └── excel-importer.ts
│   │   └── push/                   # Tiện ích gửi Web Push
│   │       └── web-push-sender.ts
│   ├── stores/                     # Zustand Stores
│   │   ├── auth-store.ts
│   │   ├── tree-store.ts
│   │   └── settings-store.ts
│   └── types/                      # TypeScript Interfaces & Types
│       ├── database.ts             # Schema types sinh tự động từ Supabase
│       ├── kinship.ts
│       └── member.ts
├── vercel.json                     # Cấu hình Cron Jobs & Headers Vercel
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. KẾ HOẠCH MILESTONES (TUYẾN TÍNH)

_(Nguyên tắc: Milestone N phải nghiệm thu hoàn hảo 100% 0 lỗi mới chuyển sang Milestone N+1)_

### MILESTONE 1: Nền tảng Dự án, CSDL Supabase & Đăng nhập Google Auth
- **Mục tiêu:** Khởi tạo base Next.js 14 App Router, chạy migration SQL lên Supabase, tích hợp Supabase Auth (Google OAuth 2.0), lưu session an toàn và phân quyền `viewer` / `super_admin`.
- **Thư mục/File:** `src/lib/supabase/`, `src/app/(auth)/`, `src/types/database.ts`.

### MILESTONE 2: Lõi Thuật Toán Gia Phả (Kinship Engine & Lịch Âm)
- **Mục tiêu:** Xây dựng unit test độc lập cho thuật toán tìm tổ tiên chung gần nhất (LCA), tính độ lệch thế hệ, ánh xạ từ điển xưng hô vùng miền (`kinship-engine.ts`) và bộ chuyển đổi Âm - Dương / Năm Can Chi (`vietnamese-lunar.ts`).
- **Thư mục/File:** `src/lib/kinship-engine/`, `src/lib/lunar/`, các file unit test `tests/`.

### MILESTONE 3: Màn hình Cây Phả Hệ Tương Tác & Ghost Node 🔗 Canvas
- **Mục tiêu:** Dựng cây đồ thị trực quan bằng React Flow (`@xyflow/react`), hỗ trợ Pan/Zoom, hiển thị `MemberNode` (Nam/Nữ) và `GhostNode` (🔗 viền nét đứt khi kết hôn nội tộc), tính năng tìm kiếm Spotlight và Toggle xem Nhánh Nội / Toàn bộ.
- **Thư mục/File:** `src/components/tree/`, `src/app/page.tsx`, `src/app/api/tree/route.ts`.

### MILESTONE 4: Quản lý Thành Viên Đa Tầng (Popup 1 Cấp, Excel Import & Node Chưa Nối)
- **Mục tiêu:** Form thêm/sửa thành viên giới hạn đúng 1 cấp, ưu tiên nhập Ngày mất Âm lịch; tính năng import hàng trăm người từ file Excel; khay quản lý các thành viên chưa nối phả (`UnlinkedDrawer.tsx`) và cơ chế tự động nối cây khi sửa Bố/Mẹ.
- **Thư mục/File:** `src/components/modals/`, `src/lib/excel/`, `src/app/admin/import/`.

### MILESTONE 5: Lịch Giỗ 30 Ngày, Vercel Cron & PWA Web Push Notification
- **Mục tiêu:** Trang Lịch giỗ 30 ngày sắp tới; cấu hình Web App Manifest (PWA); thiết lập Vercel Cron quét tự động 7:00 AM mỗi sáng gửi Web Push Notification cho con cháu nhánh trực hệ đã liên kết tài khoản.
- **Thư mục/File:** `src/app/anniversaries/`, `src/app/api/cron/`, `src/lib/push/`, `vercel.json`, `public/manifest.json`.

---

## 5. SCRIPTS CÀI ĐẶT MÔI TRƯỜNG (HUMAN ACTION)

Các lệnh chuẩn bị để khởi tạo dự án Next.js và cài đặt toàn bộ dependencies đã chốt:

```bash
# 1. Khởi tạo dự án Next.js 14 với TypeScript và TailwindCSS
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

# 2. Cài đặt các thư viện BaaS & Xác thực
npm install @supabase/supabase-js @supabase/ssr

# 3. Cài đặt thư viện Đồ thị Cây & Icon & Quản lý State
npm install @xyflow/react lucide-react zustand dagre
npm install --save-dev @types/dagre

# 4. Cài đặt các thành phần UI Radix / Shadcn Primitives
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-switch @radix-ui/react-tooltip @radix-ui/react-slot class-variance-authority clsx tailwind-merge

# 5. Cài đặt thư viện Lịch Âm, Đọc Excel & Web Push
npm install xlsx web-push
npm install --save-dev @types/web-push

# 6. Cài đặt thư viện PWA (Progressive Web App)
npm install @serwist/next
```
