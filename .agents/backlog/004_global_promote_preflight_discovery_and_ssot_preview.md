---
id: 004
title: "Global Promote: Bổ sung luật Pre-flight Asset Discovery & Zero-Mockup Preview vào Profile software-engineer"
status: parked
priority: high
created: 2026-09-30
spawned_specs: []
---

## 1. Bối cảnh & Căn nguyên (Why)
- **Vấn đề đã xảy ra:** AI khi nhận task tạo trang/tính năng mới (như Live Preview trong `/admin/theme`) có xu hướng viết mã HTML/CSS inline thô sơ, chắp vá ("làm cho có") thay vì tái sử dụng Component thật (`AnniversaryBlocCard`) và logic có sẵn (`resolveMemberBranchHierarchy`).
- **Hậu quả:** Gây ra "Hai Nguồn Chân Lý" (Duplicate Source of Truth), dẫn tới sự phân mảnh thị giác nghiêm trọng (trang Home một kiểu, trang Lịch Giỗ một kiểu, Preview một kiểu, bo góc cọc cạch).
- **Phạm vi ảnh hưởng:** Đây là bài học xương máu mang tính phổ quát của mọi dự án lập trình (`software-engineer`), không riêng gì dự án Gia Phả. Do đó, cần được nâng cấp (promote) lên **Profile Global**.

---

## 2. Khối Luật Cần Đồng Bộ Lên Global (`Profile: software-engineer`)

Mở tệp Profile Global (ví dụ tại `C:\Users\giap.pham\.gemini\config\profiles\software-engineer\AGENTS.md` hoặc thư mục cấu hình global tương đương), chèn 3 điều luật sau trước mục `[SYNC_POLICY]` (hoặc nâng `Profile-Version` từ `v8` lên `v9`):

```markdown
## [R-DISCOVERY] PRE-FLIGHT ASSET DISCOVERY & ZERO-SHADOW POLICY (DÒ TÌM TÀI SẢN SẴN CÓ & CẤM TẠO BẢN SAO NHÁI)
- **Tư duy Kiến trúc sư trước khi gõ code:** Trước khi tạo mới bất kỳ UI Component, API endpoint, kiểu dữ liệu hay hàm logic nào, AI **BẮT BUỘC PHẢI DÙNG `grep_search`** để rà soát toàn bộ dự án:
  1. *Đã có component nào tương tự trong `src/components/` chưa?* (Nếu có $\rightarrow$ BẮT BUỘC tái sử dụng hoặc mở rộng props; TUYỆT ĐỐI CẤM tạo bản sao nhái Shadow Copy).
  2. *Đã có hàm/engine/service nào giải quyết bài toán này trong `src/lib/` hoặc `src/services/` chưa?* (Tuyệt đối cấm tự viết lại logic tính toán/biến đổi dữ liệu đã có sẵn).
  3. *Đã có Design Token nào trong CSS/Tailwind cho việc này chưa?* (Cấm tự bịa class màu sắc, khoảng cách, bo góc).
- **Anti-Silo Rule (Chống Cát Cứ Ốc Đảo):** Tuyệt đối cấm coi màn hình/file mình đang code là một ốc đảo cô lập. Mọi tính năng mới phải là một mắt xích gắn kết hữu cơ với hệ sinh thái mã nguồn hiện hữu. Bắt buộc kiểm tra toàn bộ các nơi đang tiêu thụ (Consumers) và vùng ảnh hưởng (Blast Radius) trước khi sửa.

## [R-UI.SSOT_PREVIEW] SINGLE SOURCE OF TRUTH FOR PREVIEWS & DEMOS (CẤM MOCKUP CHẮP VÁ TRONG XEM TRƯỚC)
- **Quy tắc Nguồn Chân Lý Duy Nhất:** Mọi khu vực Xem Trước Giao Diện (Live Preview, Demo Widget, Theme Switcher, Prototype) **BẮT BUỘC PHẢI IMPORT VÀ TÁI SỬ DỤNG TRỰC TIẾP COMPONENT SẢN XUẤT (Production Component)**.
- **Tuyệt đối cấm:** Viết mã HTML/CSS inline mô phỏng "cho có". Bất kỳ sự phân mảnh nào giữa màn hình Preview và Component thật đều bị coi là lỗi kiến trúc vi phạm Integrity nghiêm trọng.
- **Fixture Contract:** Mọi component hỗ trợ xem trước phải đi kèm dữ liệu mẫu chuẩn hóa (`.previewFixture` hoặc từ `@/fixtures`), đảm bảo khi component thay đổi thì Preview tự động cập nhật 100% theo.

## [R-DESIGN.TOKENS] SEMANTIC DESIGN TOKENS FIRST (CẤM HARDCODE CLASS HÌNH HỌC TÙY TIỆN)
- **Đồng bộ nhịp điệu hình học (Geometric Rhythm):** Cấm hardcode các class hình học tùy tiện (`rounded-2xl`, `rounded-xl`, `rounded-3xl`, `p-6`) rải rác trên các khung card và surface chính.
- **Bắt buộc dùng Semantic Tokens:** Mọi container/card chính trên hệ thống bắt buộc dùng semantic class `rounded-card` (hoặc token CSS tương đương). Mọi nút bấm/control dùng `rounded-control`. Khi thay đổi Theme Profile, toàn bộ hệ sinh thái giao diện phải tự động chuyển mình đồng loạt thông qua biến CSS.
```

---

## 3. Hướng Dẫn Kéo Cập Nhật Cho Các Dự Án Khác (Downstream Sync)
Sau khi đã cập nhật file Global Profile:
1. Tại bất kỳ dự án nào sử dụng profile `software-engineer`, chạy lệnh:
   ```bash
   /g-pull
   ```
2. Quy trình `/g-pull` sẽ dò tìm theo ID `[R-DISCOVERY]`, `[R-UI.SSOT_PREVIEW]`, `[R-DESIGN.TOKENS]` và tự động merge vào file `.agents/AGENTS.md` của dự án đó mà không làm mất các luật riêng cục bộ.
