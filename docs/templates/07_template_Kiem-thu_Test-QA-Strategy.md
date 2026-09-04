# TEMPLATE_CHIẾN LƯỢC KIỂM THỬ (TEST / QA STRATEGY)

_Dự án: [TÊN_DỰ_ÁN]_

> **Lệnh dành cho AI (Tech Lead):** Dựa trên `04_Thiet-ke-Giao-dien` và `05_Thiet-ke-Ky-thuat`, chốt cách kiểm thử cho dự án. KHÔNG sinh code sản phẩm; có thể nêu ví dụ khung test. Tiêu chí nghiệm thu chi tiết của từng tính năng nằm trong `09_Dac-ta-Vi-mo`.
>
> 🔴 **Tài liệu này KHÔNG được phép chỉ là văn bản.** `/doc-qa` bắt buộc phải dựng hạ tầng test chạy được thật (runner + script + thư mục test + 1 smoke test đã chạy xanh) rồi mới điền Mục 6 dưới đây. Một chiến lược QA đẹp trên giấy mà `Test_Dir` không tồn tại chính là nguyên nhân đã khiến agent phải mở trình duyệt mò mẫm để tìm bằng chứng.

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
- **Lệnh chạy test:** khai báo tại **Mục 6 `[VERIFY_COMMANDS]`** bên dưới — đó là nguồn chân lý duy nhất. Không ghi lặp lệnh ở đây.

## 5. KIỂM THỬ THỦ CÔNG (MANUAL QA CHECKLIST)

_(Cho phần khó tự động hoá — UI/UX, tương thích. Đây là phần dành cho **Human UAT**; AI không được tự nghiệm thu bằng browser_subagent.)_

- [ ] [VD: Kiểm tra responsive trên mobile/desktop]
- [ ] [VD: Kiểm tra các trạng thái Loading/Empty/Error của màn hình chính]
- [ ] [VD: Kiểm tra luồng đăng nhập/đăng xuất]

---

## 6. HỢP ĐỒNG LỆNH KIỂM CHỨNG (`[VERIFY_COMMANDS]`) — BẮT BUỘC

_(Đây là output quan trọng nhất của Bước 7. Chỉ điền bằng **lệnh đã thực sự chạy được**, không phải lệnh phỏng đoán. Khối này được ghi vào `.agents/AGENTS.md` và là thứ `/feature-code` + `/feature-fix` đọc để biết phải chạy gì.)_

```yaml
[VERIFY_COMMANDS]
Typecheck: ""
Build:     ""
Test:      ""
Test_Dir:  ""
Dev_URL:   ""
Known_Failing_Baseline: ""   # vd: "none" | "14 fail trên Windows do path separator, pass trên Linux"
```

- **Bằng chứng đã dựng xong hạ tầng:** [Dán trích đoạn log terminal của lần chạy lệnh `Test` thành công đầu tiên]
- **Ý nghĩa `Known_Failing_Baseline`:** tiêu chuẩn đạt của Tầng 2 là *0 failure MỚI so với baseline này*, không phải "PASS 100%". Ghi baseline trung thực ngay từ đầu để về sau không ai bị ép phải nói dối hoặc đi đuổi lỗi môi trường không liên quan.
- 🔴 **Thẩm quyền ghi baseline — chỉ 2 cửa:** (1) `/doc-qa`, (2) User xác nhận rõ ràng qua chat. `/feature-code` và `/feature-fix` **chỉ được ĐỌC**, cấm ghi dù chỉ một con số, bất kể lý do. Chi tiết tại `[R-VERIFY.CMD]` trong `.agents/AGENTS.md`.
