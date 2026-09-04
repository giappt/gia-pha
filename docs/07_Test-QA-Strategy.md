# CHIẾN LƯỢC KIỂM THỬ (TEST / QA STRATEGY)

_Dự án: FAT (Family Tree - Hệ Thống Quản Lý Gia Phả Dòng Họ)_

> **Lệnh dành cho AI (Tech Lead):** Dựa trên `docs/04_UI-UX-Flow.md`, `docs/05_Technical-Blueprint.md` và tuân thủ **Vòng lặp Kiểm chứng 3 Tầng (3-Tier Verification Loop)** trong `.agents/AGENTS.md`. Tài liệu này chốt phương pháp kiểm thử toàn diện cho dự án.

---

## 1. PHẠM VI & TẦNG KIỂM THỬ (TEST LEVELS)

Hệ thống áp dụng mô hình kim tự tháp kiểm thử 3 tầng kết hợp với công cụ kiểm chứng trình duyệt:

| **Tầng** | **Phạm vi kiểm thử** | **Công cụ** | **Người phụ trách / Thời điểm** |
|---|---|---|---|
| **Unit Test** | Lõi thuật toán độc lập: Tìm LCA, Tính vai vế xưng hô vùng miền, Quy đổi Lịch Âm - Dương, Parser & Validator file Excel, Thuật toán phát hiện chu trình (Cycle Detection), Thuật toán dàn trang cây. | **Node Test Runner / tsx** (`npm test`) | AI / Dev viết đồng thời khi code từng module ở `src/lib/` |
| **Integration Test** | Các Route Handlers (`/api/*`) tương tác với CSDL Supabase: Đệ quy cây gia phả, Phân quyền RLS, Lá chắn Privacy Guard, Duyệt Claim Request, Endpoint Cron Job. | **Node Test Runner / tsx** | AI / Dev thực hiện cho từng endpoint API |
| **Visual & UI UAT** | Luồng người dùng & giao diện thị giác: Pan/Zoom cây phả hệ, Tìm kiếm Spotlight, Click Ghost Node 🔗 nhảy camera, Modal nhập liệu, Theme, Responsive. | **Trình duyệt thật của User** | User tự mở trình duyệt nghiệm thu trực quan (Human UAT). Loại bỏ hoàn toàn browser_subagent |

---

## 2. TIÊU CHÍ COVERAGE & ĐỊNH NGHĨA "DONE" (DEFINITION OF DONE)

### 2.1. Mục tiêu Độ Phủ Mã Nguồn (Code Coverage):
- **$\ge 85\%$** đối với toàn bộ các thư viện tính toán lõi:
  - `src/lib/kinship-engine/` (Thuật toán tìm LCA và ánh xạ từ điển xưng hô).
  - `src/lib/lunar/` (Thuật toán chuyển đổi ngày âm lịch và tính Can Chi).
  - `src/lib/excel/` (Đọc và kiểm tra tính toàn vẹn của file Excel).
- **100%** đối với các hàm kiểm tra bảo mật:
  - Hàm phát hiện vòng lặp phả hệ nghịch lý (`detectCycle`).
  - Bộ lọc che giấu thông tin người còn sống (`filterLivingPersonPrivacy`).
  - Middleware kiểm tra mã bảo mật Cron (`CRON_SECRET`).

### 2.2. Tiêu chuẩn Hoàn Thành (Definition of Done - DoD):
Theo đúng **Nguyên tắc Code-First Verification Loop** trong `.agents/AGENTS.md`:
1. **Tầng 1 (Compile & Build):** `next build` và kiểm tra kiểu TypeScript (`npm run typecheck`) đạt sạch sẽ **100% 0 lỗi, 0 warning**.
2. **Tầng 2 (Thực thi Test Cases Tự động):** Toàn bộ Unit Test và Integration Test liên quan đến tính năng trong `tests/` phải báo **PASS 100%**. Có bằng chứng thực nghiệm là output log từ terminal.
3. **Tầng 3 (Human UAT):** Bàn giao URL cho User tự mở trình duyệt nghiệm thu thị giác theo ý thích. Loại bỏ hoàn toàn sự phụ thuộc vào `browser_subagent`.
> 🚫 **Cấm Tick [x] bằng niềm tin:** Chỉ khi Tầng 1 và Tầng 2 PASS 100% bằng code thật mới được phép tick `- [x] AC` cho các test case tự động trong Micro-Spec.

---

## 3. QUY ƯỚC VIẾT TEST (TEST CONVENTIONS)

- **Vị trí và Đặt tên file:** 
  - Unit test đặt trong thư mục `tests/unit/` (VD: `tests/unit/kinship-engine.test.ts`, `tests/unit/vietnamese-lunar.test.ts`).
  - Integration test đặt trong `tests/integration/` (VD: `tests/integration/api-tree.test.ts`).
- **Cấu trúc Test chuẩn (AAA Pattern):**
  - **Arrange:** Chuẩn bị fixture dữ liệu (dựng cây phả hệ mẫu 3 đời trong bộ nhớ).
  - **Act:** Thực thi hàm cần kiểm tra (gọi hàm `calculateKinship(personA, personB)`).
  - **Assert:** Khẳng định kết quả mong đợi (`expect(result.addressTitleAtoB).toBe('Bác họ')`).
- **Tính Độc Lập:** Mỗi test case phải hoàn toàn độc lập, không phụ thuộc vào thứ tự chạy hoặc trạng thái của test case trước đó.

---

## 4. MÔI TRƯỜNG & BỘ DỮ LIỆU TEST MẪU (TEST FIXTURES)

### 4.1. Bộ Dữ Liệu Test Mẫu (Seed Tree Fixture):
Để kiểm thử trọn vẹn mọi trường hợp phức tạp của dòng họ, bộ dữ liệu mẫu (Seed Data) sẽ gồm 10 thành viên mô phỏng:
1. **Cụ Tổ (Root):** Nguyễn Văn Khởi (Đời 1, đã mất).
2. **Chi Trưởng (Branch 1):** Con trai cả Nguyễn Văn Trưởng (Đời 2) $\rightarrow$ Cháu nội Nguyễn Văn Hùng (Đời 3, còn sống).
3. **Chi Hai (Branch 2):** Con trai thứ Nguyễn Văn Hai (Đời 2) $\rightarrow$ Cháu nội Nguyễn Thị Mai (Đời 3, còn sống).
4. **Hôn nhân nội tộc (Ghost Node Test Case):** Cháu Đời 4 của Chi 1 kết hôn với Cháu Đời 3 của Chi 2.
5. **Thành viên chưa nối phả (Unlinked Node):** 1 người có `father_id = null`, `mother_id = null`.
6. **Người mất khuyết ngày tháng:** Chỉ có `death_year = 1975`.

### 4.2. Lệnh Chạy Kiểm Thử (CLI Commands):
```bash
# Chạy toàn bộ Unit Test & Integration Test
npm run test

# Chạy test ở chế độ theo dõi thay đổi (Watch Mode khi dev)
npm run test:watch

# Xuất báo cáo độ phủ mã nguồn (Coverage Report)
npm run test:coverage

# Chạy kiểm tra Typecheck TypeScript
npm run typecheck

# Chạy kiểm thử tự động trên trình duyệt E2E
npm run test:e2e
```

---

## 5. CHECKLIST KIỂM THỬ THỦ CÔNG (MANUAL QA CHECKLIST)

Dành cho các trải nghiệm thị giác và thao tác cảm ứng khó tự động hóa 100%:

- [ ] **Trải nghiệm Cảm ứng trên Di động (Touch UX):** Thử nghiệm thao tác 2 ngón tay thu phóng (Pinch-to-zoom) và vuốt di chuyển (Pan) cây phả hệ trên màn hình điện thoại xem có mượt mà 60 FPS không.
- [ ] **Hiển thị Ghost Node 🔗:** Kiểm tra viền nét đứt của Ghost Node có rõ ràng không; bấm vào có lướt camera sang nhánh gốc chính xác không.
- [ ] **Modal Form 1 Cấp:** Kiểm tra form thêm mới không bao giờ mở popup lồng; bàn phím ảo trên điện thoại không che khuất nút Lưu.
- [ ] **Lá chắn Quyền riêng tư (Privacy Guard):** Mở trình duyệt ẩn danh (vai trò `viewer`) xem cây, kiểm tra số điện thoại và địa chỉ của người còn sống có bị che giấu hoàn toàn không.
- [ ] **Độ Tương Phản & Dark Mode:** Kiểm tra màu sắc phả hệ trong cả chế độ Sáng (Light) và Tối (Dark) có trang trọng, dịu mắt và đọc rõ chữ đối với người cao tuổi không.
- [ ] **PWA & Web Push:** Cài đặt PWA lên màn hình Home của điện thoại Android/iOS (Add to Home Screen); thử nghiệm nhận thông báo nổi khi Vercel Cron kích hoạt.
