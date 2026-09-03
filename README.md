# 📖 FAT (Family Tree Management System)

![Next.js](https://img.shields.io/badge/Next.js%2014-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React Flow](https://img.shields.io/badge/React%20Flow-FF0072?style=for-the-badge&logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)

**FAT (Family Tree)** là nền tảng quản lý và số hóa phả hệ dòng họ trực tuyến đa nền tảng (Web & PWA Mobile), được thiết kế tối ưu cho văn hóa truyền thống Việt Nam. Hệ thống giúp toàn bộ con cháu trong dòng họ tra cứu nguồn cội, hình dung trực quan cây gia phả nhiều thế hệ, phân định vai vế xưng hô chính xác theo phong tục vùng miền (Bắc / Trung / Nam), và tự động nhắc nhở ngày giỗ theo Âm lịch.

---

## 🌟 Kiến trúc Hệ thống (System Architecture)

- **Frontend & Visualization:** Next.js 14+ (App Router), TypeScript, TailwindCSS, Shadcn UI / Radix Primitives, và `@xyflow/react` (React Flow v12) hỗ trợ tương tác đồ thị cây mượt mà 60 FPS, thu gọn/mở rộng phân tầng, và hiển thị **Ghost Node 🔗** cho hôn nhân nội tộc.
- **Lõi Nghiệp Vụ (Kinship & Lunar Engine):** Thuật toán tìm tổ tiên chung gần nhất (LCA) kết hợp bộ từ điển xưng hô cấu hình được; bộ quy đổi Âm - Dương chuẩn xác theo múi giờ Việt Nam (UTC+7).
- **Backend & Database:** Next.js Serverless Route Handlers kết nối **Supabase PostgreSQL** tận dụng truy vấn đệ quy `WITH RECURSIVE`, Row Level Security (RLS) bảo vệ dữ liệu cá nhân của người còn sống (Living Person Privacy Guard).
- **Vận hành & Tự động hóa:** Vercel Hosting + **Vercel Cron** tự động quét ngày giỗ lúc 7:00 AM mỗi sáng để gửi **Web Push Notification** đến thiết bị con cháu nhánh trực hệ.

---

## 📂 Hệ thống Tài liệu (SDLC - Documentation Map)

Dự án tuân thủ nghiêm ngặt quy trình phát triển phần mềm có tài liệu (SDLC). Toàn bộ triết lý thiết kế, quy tắc nghiệp vụ và cơ sở dữ liệu đã được lưu trữ đầy đủ tại thư mục `docs/`:

- 🏗️ [`docs/01_Architecture-Blueprint.md`](file:///d:/pj/other/fat/docs/01_Architecture-Blueprint.md): Tầm nhìn, 5 luồng hành trình người dùng và kiến trúc tổng thể.
- 📖 [`docs/02_Project-Glossary.md`](file:///d:/pj/other/fat/docs/02_Project-Glossary.md): Bảng chỉ mục từ vựng chuẩn mực (Ubiquitous Language) và quy tắc nghiệp vụ.
- 🗄️ [`docs/03_DB-Schema.md`](file:///d:/pj/other/fat/docs/03_DB-Schema.md): Lược đồ CSDL PostgreSQL chi tiết, ERD Mermaid và chuẩn API Contract.
- 🎨 [`docs/04_UI-UX-Flow.md`](file:///d:/pj/other/fat/docs/04_UI-UX-Flow.md): Kiểm kê 9 màn hình, luồng điều hướng, Wireframe ASCII và khay thành viên chưa nối phả.
- ⚙️ [`docs/05_Technical-Blueprint.md`](file:///d:/pj/other/fat/docs/05_Technical-Blueprint.md): Quyết định Tech Stack, cấu trúc thư mục và kế hoạch 5 Milestones.
- 🛡️ [`docs/06_Security-Threat-Model.md`](file:///d:/pj/other/fat/docs/06_Security-Threat-Model.md): Ma trận đe dọa, kiểm soát quyền riêng tư PII và bảo mật Cron.
- 🧪 [`docs/07_Test-QA-Strategy.md`](file:///d:/pj/other/fat/docs/07_Test-QA-Strategy.md): Chiến lược kiểm thử 3 tầng, Fixture test và tiêu chuẩn Definition of Done.
- 🚀 [`docs/08_Deployment-Environments.md`](file:///d:/pj/other/fat/docs/08_Deployment-Environments.md): Cấu hình Vercel, Supabase, biến môi trường và Vercel Cron.

---

## 🚀 Hướng dẫn Cài đặt (Quick Start)

### Yêu cầu Hệ thống (Prerequisites)
- **Node.js:** Phiên bản 18.17.0 trở lên (khuyên dùng Node 20 LTS).
- **Trình quản lý gói:** `npm` (hoặc `pnpm`).
- **Tài khoản Supabase:** Miễn phí tại [supabase.com](https://supabase.com).
- **Tài khoản Vercel:** Miễn phí tại [vercel.com](https://vercel.com).

### Thiết lập Biến Môi trường (Environment Variables)
Sao chép file mẫu và điền thông tin kết nối từ Supabase Dashboard:

```bash
cp .env.example .env.local
```

Cấu hình các biến trong `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
CRON_SECRET="your-cron-secret-token"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key"
VAPID_PRIVATE_KEY="your-vapid-private-key"
VAPID_SUBJECT="mailto:admin@dongho.vn"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Khởi tạo Cơ Sở Dữ Liệu
Vào **Supabase Dashboard $\rightarrow$ SQL Editor**, chạy toàn bộ mã nguồn trong file:
📄 [`supabase/migrations/20260903000000_init_schema.sql`](file:///d:/pj/other/fat/supabase/migrations/20260903000000_init_schema.sql)

### Chạy Dự Án Ở Máy Local (Run Locally)
```bash
# 1. Cài đặt các thư viện
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000).
