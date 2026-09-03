---
description: "[Bước 8.5/12] Tổng hợp và tự động sinh ra/cập nhật file README.md dựa trên tài liệu kiến trúc."
---

# LỆNH: /doc-readme

**Mục tiêu:** Đóng vai trò là "View Layer", tự động đọc các file thiết kế (Single Source of Truth) để sinh ra hoặc cập nhật `README.md` tại thư mục gốc của dự án. Lệnh này có thể chạy bất kỳ lúc nào để rà soát sự đồng bộ.

1. **[ĐỌC TÀI LIỆU - INGESTION]:** 
   - Đọc file `docs/01_Architecture-Blueprint.md` để lấy Tên dự án, Tầm nhìn, và High-level architecture.
   - Đọc file `docs/05_Technical-Blueprint.md` để trích xuất Tech Stack cốt lõi.
   - Đọc file `docs/08_Deployment-Environments.md` để bóc tách luồng Cài đặt, Biến môi trường (`.env`), và cách chạy.
   - Nếu dự án đã có `README.md`, đọc nó để không làm mất các thông tin cấu hình tùy chỉnh (nếu có).

2. **[ÁP DỤNG TEMPLATE]:**
   - Mở và bám sát tuyệt đối vào định dạng của `docs/templates/00_template_README.md`.
   - Cấm tự ý bỏ bớt mục nào trong Template.

3. **[TIẾN HÀNH TỔNG HỢP]:**
   - Viết ra nội dung README thật trau chuốt, bóng bẩy. 
   - Đảm bảo các Badges công nghệ được tạo đúng cú pháp của `shields.io`.
   - Danh sách "Hệ thống tài liệu (SDLC)" phải được map đúng với các file thực tế trong thư mục `docs/`.

4. **[GHI FILE & BÁO CÁO]:**
   - Sử dụng tool `write_to_file` hoặc `multi_replace_file_content` để ghi đè/tạo mới `README.md` ở thư mục gốc.
   - Báo cáo với người dùng: "Đã rà soát và cập nhật README.md thành công lên phiên bản mới nhất."
