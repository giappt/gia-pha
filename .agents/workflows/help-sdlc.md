---
description: "[Bảng điều khiển] Hiển thị Cheatsheet tra cứu toàn bộ pipeline 13 bước (0–12, kèm bước phụ 8.5 /doc-readme) SDLC và cách kết nối chúng."
---

# BẢNG ĐIỀU KHIỂN SDLC (CHEAT SHEET)

**Mục tiêu:** Bảng điều khiển (Dashboard) và Sơ đồ luồng (Flowchart) chỉ dẫn toàn bộ Vòng đời Phát triển Phần mềm (SDLC) gồm 13 bước (0–12, kèm bước phụ 8.5 /doc-readme).

## SƠ ĐỒ LUỒNG (WORKFLOW MAP)
Agent BẮT BUỘC phải tham chiếu sơ đồ này để biết lệnh nào cần gọi trước, lệnh nào gọi sau.

```mermaid
graph TD
    %% Định nghĩa các Style
    classDef startFill fill:#f9f,stroke:#333,stroke-width:2px;
    classDef phase1 fill:#e1f5fe,stroke:#03a9f4,stroke-width:2px;
    classDef phase2 fill:#fff3e0,stroke:#ff9800,stroke-width:2px;
    classDef phase3 fill:#e8f5e9,stroke:#4caf50,stroke-width:2px;
    classDef loopFill fill:#ffebee,stroke:#f44336,stroke-width:2px,stroke-dasharray: 5 5;

    %% Điểm bắt đầu
    Start((Bắt đầu Dự án)):::startFill --> S0

    subgraph PHASE 1: THE CORE (Kiến trúc & Dữ liệu)
        S0["/idea-init (Bước 0) <br/> Lên ý tưởng sơ khai"]:::phase1
        S1["/doc-arch (Bước 1) <br/> Tạo Kiến trúc (File 01)"]:::phase1
        S2["/doc-glossary (Bước 2) <br/> Chuẩn hoá từ vựng (File 02)"]:::phase1
        S3["/doc-db (Bước 3) <br/> Thiết kế DB Schema (File 03)"]:::phase1
        
        S0 --> S1 --> S2 --> S3
    end

    subgraph PHASE 2: THE SHELL (Hạ tầng, UI & Ràng buộc)
        S4["/doc-ui (Bước 4) <br/> Thiết kế luồng UI/UX (File 04)"]:::phase2
        S5["/doc-tech (Bước 5) <br/> Chốt Tech Stack & API (File 05)"]:::phase2
        S6["/doc-security (Bước 6) <br/> Lập Mô hình bảo mật (File 06)"]:::phase2
        S7["/doc-qa (Bước 7) <br/> Lập Chiến lược Test (File 07)"]:::phase2
        S8["/doc-deploy (Bước 8) <br/> Cấu hình Deploy (File 08)"]:::phase2
        S85["/doc-readme (Bước 8.5) <br/> Tổng hợp README.md"]:::phase2
        
        S3 --> S4 --> S5 --> S6 --> S7 --> S8 --> S85
    end

    subgraph PHASE 3: EXECUTION (Vòng lặp Thi công Chuẩn Kỹ Nghệ)
        S9["/feature-brainstorm (Bước 9) <br/> Thiết kế sâu, Root Cause & Blast Radius"]:::phase3
        S10["/feature-spec (Bước 10) <br/> Routing Spec, Sinh Test Matrix & Regression Guard"]:::phase3
        S11["/feature-code (Bước 11) <br/> Code + 3-Tier Verification (Build, Test, Proof)"]:::phase3
        S12["/feature-fix (Bước 12) <br/> Fast-Track Fix (Vá nhanh typo/CSS)"]:::loopFill
        
        S85 --> S9 --> S10 --> S11
        S11 -. "UAT phát hiện lỗi nhỏ" .-> S12
        S12 -. "Lỗi nhỏ: Vá xong test lại" .-> S11
        S12 -. "Lỗi kiến trúc / Hóc búa: Leo thang" .-> S9
        S11 -. "UAT lỗi sâu / Cần mở rộng" .-> S9
        S11 -. "Hoàn thành -> Tính năng mới" .-> S9
    end
```

## CHEATSHEET CHỨC NĂNG CÁC LỆNH
Dưới đây là chi tiết và nguyên tắc kết nối của pipeline 13 bước (0–12, kèm bước phụ 8.5 /doc-readme) SDLC. Nguyên tắc tối thượng là **Context Value Chain** (Output bước trước là Input bước sau). Không được nhảy cóc.

- **0. `/idea-init`**: Chỉ dùng để thảo luận và phản biện, vắt kiệt ý tưởng DỰ ÁN ban đầu (đóng vai PM, chủ động chỉ ra điểm yếu). Không tạo file. *(Khác nhóm `/idea-*` Kho Ý tưởng bên dưới.)*
- **1. `/doc-arch`**: Dựa vào ý tưởng đã chốt -> Tạo `01_Architecture-Blueprint.md`.
- **2. `/doc-glossary`**: Dựa vào File 01 -> Tạo `02_Project-Glossary.md`. (Cực kỳ quan trọng để chuẩn hoá từ vựng).
- **3. `/doc-db`**: Dựa vào File 01, 02 -> Thiết kế CSDL và tạo `03_DB-Schema.md`.
- **4. `/doc-ui`**: Thiết kế luồng UX/UI -> Tạo `04_UI-UX-Flow.md`.
- **5. `/doc-tech`**: Chốt ngôn ngữ, thư viện, API (dựa trên 01~04) -> Tạo `05_Technical-Blueprint.md`.
- **6. `/doc-security`**: Lập mô hình bảo mật rủi ro -> Tạo `06_Security-Threat-Model.md`.
- **7. `/doc-qa`**: Lập chiến lược kiểm thử -> Tạo `07_Test-QA-Strategy.md`.
- **8. `/doc-deploy`**: Chốt phương án triển khai -> Tạo `08_Deployment-Environments.md`.
- **8.5. `/doc-readme`**: Lệnh trung tâm tổng hợp thông tin từ File 01, 05, 08 -> Sinh ra/Cập nhật `README.md` ngoài root. (Nên gọi bất cứ khi nào kiến trúc có thay đổi).
- **9. `/feature-brainstorm`**: Bộ não tư duy chiều sâu của hệ thống. Dùng cho: Tính năng mới, Mở rộng tính năng cũ, hoặc Mổ xẻ căn nguyên lỗi hóc búa (Root Cause Analysis). Lập Kế hoạch đồng bộ & Ma trận vùng ảnh hưởng (Blast Radius).
- **10. `/feature-spec`**: Định tuyến Spec (Nhánh A: Tạo mới vs Nhánh B: Cập nhật Spec cũ) + Thiết lập Hợp đồng Nghiệm thu qua Bảng Test Cases Ma Trận (Given - When - Then) và Regression Guard Checklist.
- **11. `/feature-code`**: Thi công mã nguồn bám sát Spec + Thực thi Vòng lặp Kiểm thử 3 Tầng (Build $\rightarrow$ Automated Test Cases $\rightarrow$ Regression Check). Chỉ tick `[x]` vào AC khi có bằng chứng thực nghiệm Pass.
- **12. `/feature-fix`**: Làn sửa nhanh có kiểm soát (Fast-Track) cho các lỗi nhỏ, typo, lệch màu CSS. Tự động leo thang sang `/feature-brainstorm` nếu phát hiện lỗi kiến trúc phức tạp.

**Nhóm Kho Ý tưởng (Idea Backlog) — gác/quản lý ý tưởng làm sau:**
Song song pipeline, dùng khi có ý tưởng nhưng chưa muốn làm ngay. Kho tại `.agents/backlog/`. Trạng thái tài liệu chỉ có 3: `parked | active | done`. Đều là lệnh **thủ công**.
- **`/idea-park [tiêu đề]`**: Gác ý tưởng vào Kho (thường sau `/feature-brainstorm`), kèm đủ ngữ cảnh. Cũng là cửa "cất lại" khi `/idea-get` chọn "chưa làm". → `parked`
- **`/idea-list`**: Liệt kê ý tưởng đang gác (read-only, chỉ đọc frontmatter → nhẹ token).
- **`/idea-get [id]`**: Lôi MỘT ý tưởng ra → thảo luận qua `/feature-brainstorm` (ra `implementation_plan`) → cuối phiên hỏi **"Chốt chưa?"**: **Chốt** → `/feature-spec` → `/feature-code`; **Chưa** → `/idea-park` cất lại. → `active`
- **`/idea-done [id]`**: Sau khi làm xong: archive (nếu trọn vẹn) hoặc **re-draft thông minh** phần còn lại (nếu làm một phần). → `done`
> Vòng đời: `/idea-park` → `/idea-list` → `/idea-get` →(Chốt?)→ spec→code → `/idea-done`; nhánh "Chưa" quay lại `/idea-park`.
> **Phân biệt:** `/idea-init` (Bước 0) = ý tưởng DỰ ÁN; nhóm `/idea-*` này = ý tưởng TÍNH NĂNG trong kho.

**Các lệnh Global/Meta khác (Dành cho Agent):**
- **/g-architect:** Phiên làm việc cấp cao để tái cấu trúc, thiết kế và nâng cấp trực tiếp hệ thống Profile Agent.
- **/g-context:** Kiểm tra mức độ chiếm dụng Context Window (% context, tokens) của phiên làm việc.
- **/local-review:** Rà soát sổ tay bài học (`brain/scratch/lessons_learned.md`) và đề xuất luật mới.
- **/local-update:** Thực thi việc ghi đè luật mới đã duyệt vào `.agents/AGENTS.md`.

## 🧭 BRAINSTORM vs FIX — PHÂN ĐỊNH RÕ RÀNG THEO CẤP ĐỘ (SEVERITY TRIAGE)

> **QUY TẮC CỐT TỬ:** 
> - **Lỗi nhỏ bề mặt (Typo, CSS, Logic 1 dòng đã rõ ràng):** Dùng **/feature-fix** (Vá nhanh 1 nhịp, không rườm rà).
> - **Tính năng mới HOẶC Lỗi kiến trúc hóc búa (Bất đồng bộ, DOM slicing, thiếu edge case):** Dùng **/feature-brainstorm** (Tư duy sâu mổ xẻ Root Cause và lập ma trận tác động).

| Tình huống thực tế | Phân loại | Lệnh khuyến nghị |
|---|---|---|
| "Nút bấm bị lệch màu chữ hoặc padding sai" | Nhỏ / Bề mặt | `/feature-fix` |
| "Sửa một lỗi typo trong câu thông báo" | Nhỏ / Bề mặt | `/feature-fix` |
| "Bấm highlight có chỗ ăn có chỗ không ăn (Multi-paragraph bug)" | Lỗi Kiến trúc / AST | `/feature-brainstorm` |
| "Thêm tính năng gộp highlight khi bôi đen đè" | Mở rộng tính năng | `/feature-brainstorm` |
| "Tích hợp thêm bộ tìm kiếm toàn văn Full-text search" | Tính năng mới độc lập | `/feature-brainstorm` |
