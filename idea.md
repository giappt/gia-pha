# HỆ THỐNG QUẢN LÝ GIA PHẢ DÒNG HỌ (FAT - Family Tree)

## 1. MỤC TIÊU CỐT LÕI
- Xây dựng hệ thống phả hệ trực tuyến cho toàn bộ thành viên trong dòng họ tra cứu nguồn cội, cây gia phả, nhánh họ, và quan hệ thứ bậc xưng hô giữa các cá nhân.
- Tối ưu cho thiết bị di động (PWA) và Web, giao diện trực quan, thao tác đơn giản, phù hợp cho cả người lớn tuổi trong dòng họ.

---

## 2. KIẾN TRÚC KỸ THUẬT ĐÃ THỐNG NHẤT
- **Frontend / Fullstack:** Next.js 14+ (App Router), React, TypeScript, TailwindCSS, Lucide Icons, Shadcn UI / Radix Primitives.
- **Hiển thị Cây (Visualization):** Thư viện dựng đồ thị cây phả hệ (React Flow / family-chart / D3.js) hỗ trợ Pan, Zoom, Collapse/Expand từng nhánh.
- **CSDL & Backend Services:** **Supabase**
  - **PostgreSQL Database:** Tận dụng `WITH RECURSIVE` để truy vấn đệ quy cây gia phả, tổ tiên, con cháu; ràng buộc khóa ngoại (Foreign Keys) bảo đảm tính toàn vẹn 100%.
  - **Supabase Auth:** Đăng nhập Google OAuth tiện lợi.
  - **Supabase Storage:** Lưu trữ Avatar (chuẩn S3-compatible, hỗ trợ di dời linh hoạt sang AWS S3/Cloudflare R2 sau này).
- **Hạ tầng & Vận hành:**
  - Triển khai trên **Vercel** (Serverless hosting).
  - **Vercel Cron:** Lập lịch tự động chạy ngầm mỗi sáng quét danh sách ngày giỗ âm/dương để gửi thông báo.
  - **PWA & Web Push API:** Cài đặt ứng dụng lên màn hình chính điện thoại, nhận thông báo đẩy không cần qua App Store.

---

## 3. CÁC TÍNH NĂNG CHÍNH & PHẠM VI MVP ĐÃ ĐÓNG BĂNG

### 3.1. Quản lý Cây Gia phả (Family Tree View)
- Hiển thị cây từ Cụ tổ (hoặc cho phép chọn Node gốc để xem từng Chi/Nhánh riêng biệt).
- **Cơ chế tải và hiển thị cho họ lớn (> 1.000 người):**
  - Mặc định chỉ mở 3-4 đời đầu để tránh quá tải thị giác ("rừng cây").
  - Các nhánh có nút `+` để mở rộng / thu gọn (Expand / Collapse).
  - Tìm kiếm nhanh thành viên theo tên $\rightarrow$ Tự động pan/zoom tới đúng node trên cây.
- **Bộ lọc Nội - Ngoại (Patrilineal vs Maternal Toggle):**
  - Bật/tắt hiển thị nhánh ngoại (con gái, dâu, rể, con của con gái).
  - Mặc định ưu tiên hiển thị nhánh nội tộc để cây gọn gàng.
- **Node thành viên:**
  - Hiển thị Avatar (ảnh đại diện Nam/Nữ mặc định nếu chưa up), Họ tên, Năm sinh - Năm mất (nếu có).
  - Nút thêm thông tin (+): Thêm Vợ/Chồng hoặc thêm Con.
  - **Quy tắc Popup 1 cấp:** Chỉ cho phép mở popup tạo trực tiếp con/vợ của node hiện tại; tuyệt đối không mở lồng popup cấp con của con để tránh vỡ giao diện trên mobile.

### 3.2. Chiến lược Thu thập & Nhập liệu 3 Tầng (3-Tier Ingestion)
1. **Tầng 1 (Bulk Import Excel):** Cung cấp template Excel chuẩn (*Mã, Họ tên, Giới tính, Năm sinh, Năm mất, Mã Bố, Mã Mẹ, Mã Hôn phối*). Admin upload file, hệ thống validate logic và sinh cây 1.000 người trong vài giây.
2. **Tầng 2 (Phân quyền Trưởng Chi):** Cụ tổ / Super Admin phân quyền cho các Trưởng Chi tự quản lý và nhập liệu con cháu chi mình.
3. **Tầng 3 (Nhập thủ công trực quan):** Popup đơn giản trên từng node để thêm/sửa lẻ thành viên.

### 3.3. Giải pháp Hôn nhân Nội tộc / Người trong họ lấy nhau (Ghost Node 🔗)
- **Dữ liệu duy nhất:** Cả A và B chỉ có 1 ID duy nhất trong CSDL (không duplicate dữ liệu).
- **Node phản chiếu (Ghost Node):** Xuất hiện tại nhánh hôn phối với viền nét đứt và icon 🔗. Click vào sẽ xem thông tin nguồn gốc và có nút nhảy camera về vị trí thật.
- Con cái nối theo nhánh Bố (phụ hệ), nhánh Mẹ có ghi chú liên kết.

### 3.4. Bộ Phân Giải Vai Vế & Xưng Hô (Kinship Resolver Engine)
- **Tầng 1 (Lõi thuật toán Đồ thị):** Tìm cụ tổ chung gần nhất (LCA), tính khoảng cách thế hệ, phân định nhánh con Cả hay con Thứ.
- **Tầng 2 (Bộ Từ điển Xưng hô Cấu hình được):**
  - Các bộ preset chuẩn: Miền Bắc, Miền Trung, Miền Nam.
  - Cho phép Admin tùy biến danh xưng theo tập tục dòng họ (lưu JSON trong DB).
  - Hiển thị kết quả xưng hô 2 chiều (A gọi B là gì, B gọi A là gì) kèm sơ đồ đường đi huyết thống.

### 3.5. Quản lý Ngày Giỗ & Thông báo (Anniversaries & Notifications)
- Nhập ngày mất theo Lịch Âm (mặc định) hoặc Lịch Dương. Hỗ trợ trường hợp chỉ nhớ năm.
- **Trang Lịch Giỗ 30 ngày:** Công khai cho mọi người truy cập xem ngày giỗ sắp tới.
- **Push Notification Cá nhân hóa:** Web Push thông báo ngày giỗ nhánh trực hệ cho thành viên đã claim node.

### 3.6. Bảo mật & Quyền riêng tư (Privacy Guard)
1. **Living Person Privacy Guard:** Khách vãng lai chỉ thấy Họ tên và Năm sinh của người còn sống. Thông tin nhạy cảm (SĐT, địa chỉ, ngày sinh nhật) bị che giấu, chỉ hiển thị cho thành viên đã đăng nhập và được duyệt.
2. **Phân quyền 4 cấp:**
   - Khách (Viewer): Chỉ xem cây, tra cứu vai vế, xem lịch giỗ 30 ngày.
   - Thành viên (Claimed Member): Có thể gửi góp ý, xin sửa thông tin node của mình.
   - Quản trị Chi (Branch Editor): Sửa con cháu trong nhánh mình.
   - Quản trị Tối cao (Super Admin): Toàn quyền quản trị hệ thống.

---

## 4. TÍNH NĂNG GÁC LẠI CHO PHASE 2 (KHO Ý TƯỞNG BACKLOG)
- **Vị trí Mộ phần Tổ tiên (GPS Google Maps):** Chỉ đường con cháu đi tảo mộ.
- **Văn khấn Cúng giỗ Mẫu:** Gợi ý bài văn khấn chuẩn theo từng lễ giỗ.
- **Quản lý Quỹ Dòng Họ & Bảng Vàng Khuyến Học:** Quản lý thu chi và vinh danh học tập.
