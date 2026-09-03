# TEMPLATE_CHIẾN LƯỢC KIỂM THỬ (TEST / QA STRATEGY)

_Dự án: [TÊN_DỰ_ÁN]_

> **Lệnh dành cho AI (Tech Lead):** Dựa trên `04_Thiet-ke-Giao-dien` và `05_Thiet-ke-Ky-thuat`, chốt cách kiểm thử cho dự án. KHÔNG sinh code sản phẩm; có thể nêu ví dụ khung test. Tiêu chí nghiệm thu chi tiết của từng tính năng nằm trong `09_Dac-ta-Vi-mo`.

## 1. PHẠM VI & TẦNG KIỂM THỬ (TEST LEVELS)

|**Tầng**|**Phạm vi**|**Công cụ**|**Ai viết / Khi nào**|
|---|---|---|---|
|Unit|Hàm/logic thuần|[VD: Jest, Vitest]|Dev, cùng lúc code|
|Integration|API + DB|[VD: Supertest]|Dev, cuối mỗi Milestone|
|E2E|Luồng người dùng|[VD: Playwright, Cypress]|Trước go-live|

## 2. TIÊU CHÍ COVERAGE & "DONE"

- **Mục tiêu coverage:** [VD: ≥ 70% cho thư mục services/controllers]
- **Bắt buộc có test cho:** [VD: mọi API public, mọi hàm xử lý tiền/quyền]
- **Một Milestone coi là "test xong" khi:** [VD: toàn bộ Acceptance Criteria trong Micro-Spec pass]

## 3. QUY ƯỚC TEST

- **Đặt tên file:** [VD: `*.test.js` cạnh file nguồn / trong `__tests__`]
- **Cấu trúc test:** [VD: Arrange - Act - Assert; mỗi test độc lập, có thể chạy riêng]
- **Dữ liệu test:** [VD: dùng factory/fixture; reset DB test giữa các lần chạy]

## 4. MÔI TRƯỜNG & DỮ LIỆU TEST

- **DB test:** [VD: SQLite in-memory / Postgres container riêng]
- **Mock dịch vụ ngoài:** [VD: mock cổng thanh toán, email]
- **Lệnh chạy test:** [VD: `npm test`, `npm run test:e2e`]

## 5. KIỂM THỬ THỦ CÔNG (MANUAL QA CHECKLIST)

_(Cho phần khó tự động hoá — UI/UX, tương thích)_

- [ ] [VD: Kiểm tra responsive trên mobile/desktop]
- [ ] [VD: Kiểm tra các trạng thái Loading/Empty/Error của màn hình chính]
- [ ] [VD: Kiểm tra luồng đăng nhập/đăng xuất]
