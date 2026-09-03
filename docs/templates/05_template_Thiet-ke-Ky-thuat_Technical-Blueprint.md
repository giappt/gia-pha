# TEMPLATE_BẢN THIẾT KẾ KỸ THUẬT & CHIA MILESTONE (THE SKELETON)

_Dự án: [TÊN_DỰ_ÁN]_

> **Lệnh dành cho AI / Trợ lý Lập trình:** Tài liệu này đóng vai trò là "Luật Kỹ Thuật" (Technical Constraints). Khi sinh code ở các bước sau, bạn PHẢI tuân thủ 100% Tech Stack, Cấu trúc thư mục và Quy ước đặt tên được định nghĩa tại đây. Không tự ý thêm thư viện ngoài hoặc đổi chuẩn code.

## 1. TECH STACK CHÍNH THỨC

- **Frontend:** [Ví dụ: React 18, Vite, TailwindCSS, Zustand]
- **Backend:** [Ví dụ: Node.js, Express, Socket.io]
- **Database / Caching:** [Ví dụ: MongoDB, Redis]
- **Third-party Services:** [Ví dụ: AWS S3, Resend gửi mail]

## 2. QUY ƯỚC ĐẶT TÊN & STYLE GUIDE (NAMING CONVENTIONS)

_(Ép AI viết code nhất quán, sạch sẽ)_

- **Tên Biến & Hàm (Variables/Functions):** `camelCase` (VD: `getUserInfo`, `totalPrice`)
- **Tên Component (React/Vue...):** `PascalCase` (VD: `UserProfile.jsx`, `ButtonPrimary.tsx`)
- **Tên File (Non-component):** `kebab-case` (VD: `auth-controller.js`, `user-model.ts`)
- **Hằng số (Constants):** `UPPER_SNAKE_CASE` (VD: `MAX_UPLOAD_SIZE`)
- **Ngôn ngữ Code/Comment:** [VD: Tên biến tiếng Anh, Comment chú thích tiếng Việt]

## 3. CẤU TRÚC THƯ MỤC DỰ KIẾN (FOLDER STRUCTURE)

_(Dùng tree format để mô tả chi tiết đến cấp độ thư mục và file cấu hình)_

```
project_root/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── ...
```

## 4. KẾ HOẠCH MILESTONE (TUYẾN TÍNH)

_(Quy tắc: Milestone N phải chạy hoàn hảo mới làm Milestone N+1)_

- **MILESTONE 1: [Tên Milestone - VD: Nền tảng Auth & Setup]**
    - Mục tiêu: [Xây dựng xong DB schema và API Login/Register]
    - Thư mục/File chịu ảnh hưởng: `models/User.js`, `controllers/auth.js`...
- **MILESTONE 2: [Tên Milestone - VD: Lõi Socket & Chat]**
    - Mục tiêu: [Đảm bảo kết nối real-time và gửi text cơ bản]
    - Thư mục/File chịu ảnh hưởng: ...
- **MILESTONE 3: [Tên Milestone - VD: UI & Tích hợp]**
    - Mục tiêu: [Ráp UI Tailwind vào logic API]
    - Thư mục/File chịu ảnh hưởng: ...

## 5. SCRIPTS CÀI ĐẶT MÔI TRƯỜNG (HUMAN ACTION)

_(AI liệt kê các lệnh Bash để Kỹ sư copy paste chạy thử)_

```bash
# Lệnh tạo thư mục và cài thư viện backend
...
# Lệnh tạo thư mục và cài thư viện frontend
...
```