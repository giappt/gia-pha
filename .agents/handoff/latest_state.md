# STATE MANIFEST

### 1. Key Context
- **Dự án:** FAT (Family Tree Management System) - Hệ Thống Quản Lý Gia Phả Họ Phạm.
- **Tech Stack & Môi trường:** Next.js 14+ (App Router), React, TypeScript, TailwindCSS, Supabase PostgreSQL, Node.js v20.14.0 trên Windows PowerShell (`npm.cmd`).
- **Dev Server:** Đang chạy tại `http://localhost:3000`.
- **Nội dung hoàn thành gần nhất:**
  1. **Đồng bộ SSOT Lịch Giỗ (`/anniversaries`):** Nạp `default_kinship_region`, `custom_kinship_dictionary` từ `clan_settings` và bảng `spouse_relations` từ Supabase vào API route và `anniversary-engine.ts`. Thành viên đã liên kết nhận diện chuẩn xác danh xưng thân tộc (badge "x của bạn"), khách vãng lai nhận danh xưng mặc định theo thế hệ (Cụ / Ông / Bà).
  2. **Khắc phục nhịp nối trực hệ dọc (`/kinship`):** Tách bạch cờ `isSpouse: true` cho người ngoài họ và `isSpouseBridge: true` cho người trong họ; ràng buộc nhịp `═(Hôn phối)═` chỉ hiển thị khi hai node cùng thế hệ. Nhịp giữa Cha - Con luôn là trục đứng nét liền xanh ngọc bích `bg-emerald-600`.
  3. **Chuẩn hóa Thứ bậc sinh (Birth Order) & Loại bỏ "Chi Thứ":**
     - Xóa sạch 100% nhãn `· Chi Thứ` / `· Chi Trưởng` trên các thẻ node của Sơ đồ Dòng Trực Hệ Dọc (`#direct-lineage-tree`) và Sơ đồ Cây Chữ V (`LineageNodeCard`).
     - Bổ sung trường `birthOrder?: number | null;` vào `KinshipPathNode`.
     - Xây dựng helper `formatBirthOrder`: `1` $\rightarrow$ `"Con cả"`, `n > 1` $\rightarrow$ `"Con thứ n"`, `null` $\rightarrow$ ẩn.
     - Bảo vệ người phối ngẫu ngoại tộc (`isSpouse: true`, badge `💍 Hôn phối`) tuyệt đối không bị gắn nhãn thứ bậc sinh.
- **Kết quả Kiểm chứng 3 Tầng (`[R-VERIFY]`):**
  - Typecheck (`npm.cmd run typecheck`): 0 errors.
  - Test Suite (`npm.cmd test`): **307 / 307 tests PASS** (32 suites, 0 fail, 0 skipped).
  - Build (`npm.cmd run build`): 31/31 routes static compile thành công 100%.
- **Tài liệu & Bài học kinh nghiệm:**
  - Đã cập nhật và tick `[x] AC47–AC50`, `[x] RG25–RG27` trong `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md`.
  - Đã ghi chép bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`.
- **Các tệp sửa đổi trọng tâm:**
  - `src/types/kinship.ts`: Thêm `birthOrder` vào `KinshipPathNode`.
  - `src/lib/kinship-engine/regional-dictionaries.ts`: Hàm `formatBirthOrder` và chuẩn hóa so sánh.
  - `src/lib/kinship-engine/lca-finder.ts`: Nạp `birthOrder` vào toàn bộ các luồng duyệt phả hệ.
  - `src/app/kinship/page.tsx`: Gỡ bỏ nhãn Chi Thứ/Trưởng, hiển thị `formatBirthOrder(node.birthOrder)`.
  - `src/app/api/anniversaries/route.ts` & `src/lib/anniversaries/anniversary-engine.ts`: Đồng bộ SSOT lịch giỗ.
  - `tests/kinship-ssot.test.ts`: 13 test cases SSOT (TC38–TC50).

### 2. Task Checklist
- [x] Brainstorm phân tích căn nguyên và thống nhất thay thế "Chi Thứ" bằng "Con cả / Con thứ N" (`/feature-brainstorm`).
- [x] Cập nhật Đặc tả Vi mô `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md` (Section 5.7, TC47–TC50, AC47–AC50, UAT_SSOT_07, RG25–RG27).
- [x] Bổ sung trường `birthOrder?: number | null;` vào `KinshipPathNode` trong `src/types/kinship.ts`.
- [x] Nạp `birthOrder: m.birth_order ?? null` trong `buildPathNodes` và các hàm LCA bridge của `src/lib/kinship-engine/lca-finder.ts`.
- [x] Xóa bỏ nhãn `· Chi Trưởng` / `· Chi Thứ` và thay thế bằng `Con cả`, `Con thứ 2`, `Con thứ 3`... trên `#direct-lineage-tree` và `LineageNodeCard` trong `src/app/kinship/page.tsx` (loại trừ `isSpouse: true`).
- [x] Viết test tự động TC47–TC50 trong `tests/kinship-ssot.test.ts`.
- [x] Thực thi Vòng Lặp Kiểm Chứng 3 Tầng: `Typecheck`, `Test` (307/307 tests pass), `Build` 0 lỗi, reverse-sync tick `[x] AC47–AC50` và `[x] RG25–RG27`.
- [x] Ghi chép bài học kinh nghiệm vào `.agents/brain/lessons_learned.md`.
- [x] Bàn giao kết quả và kịch bản Human Visual UAT (`UAT_SSOT_07`) cho User.

### 3. Immediate Next Step
- Sẵn sàng nhận yêu cầu hoặc tính năng tiếp theo từ User (hoặc mở rộng thêm tính năng cho Milestone 4 / quản lý cây phả hệ).
