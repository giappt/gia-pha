---
Parent-Profile: software-engineer
Profile-Version: 7
---

# PROJECT-SCOPED RULES (FAT - FAMILY TREE MANAGEMENT SYSTEM)

Dưới đây là các nguyên tắc TỐI THƯỢNG mà AI Agent BẮT BUỘC PHẢI TUÂN THỦ khi thao tác trong dự án này.

> 🔑 **HỆ ID LUẬT BẤT BIẾN (STABLE RULE ID).** Mỗi mục mang một ID dạng `[R-XXX]` **không bao giờ đổi**, kể cả khi mục bị chèn thêm, xoá bớt hay đánh số lại.
> - **Mọi tham chiếu chéo BẮT BUỘC dùng ID, CẤM dùng số thứ tự** (`[R-VERIFY.INTEGRITY]`, không phải "Mục 2.3" hay "Rule 5").
> - Lý do: file này ở Local là bản **merge** giữa luật global và luật riêng dự án, nên số thứ tự luôn lệch so với template global. Số thứ tự chỉ để đọc cho dễ; ID mới là địa chỉ.
> - `/g-pull` merge **theo ID**: tìm `[R-XXX]` trong Local rồi thay đúng khối đó; không thấy ID nào = luật mới, chèn thêm. CẤM merge bằng cách dò số thứ tự.
> - ⚠️ **Hai không gian đánh số khác nhau, đừng lẫn:** `[R-*]` là luật trong file này; còn "Mục 7 / 7.1 / 7.2 / Mục 8" luôn có nghĩa là **section của tài liệu Micro-Spec** (template 09) — số đó ổn định vì template là `STATIC_COPY`, giữ nguyên.

## 1. NAMING CONVENTIONS & STYLE GUIDE
- **Tên File (API/Lib/Component):** Bắt buộc dùng `kebab-case` cho file chung (VD: `kinship-engine.ts`, `lunar-calendar.ts`) và `PascalCase` cho React Components (VD: `FamilyTreeView.tsx`, `GhostNode.tsx`, `MemberModal.tsx`).
- **Tên Biến & Hàm:** Bắt buộc dùng `camelCase` (VD: `findLowestCommonAncestor`, `calculateKinship`).
- **Tên Bảng & Cột Database (PostgreSQL):** Bắt buộc dùng `snake_case` (VD: `father_id`, `death_lunar_day`, `is_senior_branch`).
- **Ngôn ngữ Lập trình:** Viết tên biến, tên hàm, types và comment trong code bằng **Tiếng Anh** để đảm bảo chuẩn quốc tế. Giao tiếp với User bằng tiếng Việt.

## 2. TECH STACK CONSTRAINTS
- **Frontend / Fullstack:** Next.js 14+ (App Router), React, TypeScript, TailwindCSS, Lucide Icons, Shadcn UI / Radix Primitives.
- **Tree Visualization:** Thư viện đồ thị/cây phả hệ (React Flow / family-chart / D3.js) có hỗ trợ pan, zoom, collapse/expand.
- **Database & Backend Services:** **Supabase** (PostgreSQL với `WITH RECURSIVE` truy vấn đệ quy, Supabase Auth với Google OAuth, Supabase Storage cho avatar S3-compatible).
- **Hosting & Push Notifications:** Vercel (Serverless Hosting + Vercel Cron cho lịch quét giỗ ngầm) + PWA Web Push API.
> 🚫 Tuyệt đối KHÔNG ĐƯỢC TỰ Ý THÊM/ĐỔI thư viện hay framework khác nếu chưa có sự đồng ý của User.

## 3. DOMAIN & DATA INTEGRITY CONSTRAINTS (NGHIỆP VỤ CỐT LÕI GIA PHẢ)
- **Single Record & Ghost Node Policy (Chính sách Thực thể Duy nhất & Node Phản chiếu):**
  - Trong CSDL, mỗi thành viên tuyệt đối chỉ có **1 ID duy nhất**.
  - Khi có hôn nhân nội tộc (người cùng họ hàng xa lấy nhau), tuyệt đối KHÔNG nhân bản bản ghi. Hệ thống bắt buộc dùng cơ chế **Ghost Node (Node phản chiếu có ký hiệu 🔗)** tại nhánh của người phối ngẫu, trỏ ngược về node gốc và đường đi huyết thống.
- **Kinship Engine Architecture (Tách rời Lõi Đồ thị & Từ điển Vùng miền):**
  - Thuật toán xác định vai vế phải chia làm 2 tầng tách biệt: (1) Lõi toán học đồ thị tìm LCA và tính thế hệ; (2) Bộ từ điển xưng hô ánh xạ cấu hình được (Configurable Regional Dictionary) hỗ trợ lưu cấu hình tùy biến của dòng họ.
- **Lunar Calendar First for Death Anniversaries (Lịch giỗ ưu tiên Âm lịch):**
  - Mặc định ngày giỗ được tính theo lịch âm. Thuật toán quy đổi âm - dương phải chuẩn xác theo múi giờ Việt Nam (UTC+7).
- **Claim Profile & Approval Gate (Kiểm soát Gán Node):**
  - Người dùng đăng nhập Google chỉ được gửi yêu cầu nhận node ("Claim Node"). Bắt buộc phải có Admin phê duyệt (Approve) mới được chính thức liên kết tài khoản với node gia phả.

## 4. [R-SPEC] STRICT EXECUTION & REVERSE SYNC
- **No Hallucination:** Khi code tính năng, phải bám sát **100%** vào file Đặc tả Vi mô (`Micro-Spec`). Không tự ý bịa thêm tính năng không có trong tài liệu.
- **Reverse Sync (Đồng bộ ngược):** Nếu trong quá trình code hoặc fix bug, bạn buộc phải đổi giải pháp kỹ thuật so với thiết kế ban đầu (do hạn chế của framework) => Bạn **BẮT BUỘC** phải mở lại file `Micro-Spec` (hoặc các file `01~05` liên quan) để cập nhật lại nội dung. Tài liệu luôn phải là Single Source of Truth khớp với code thực tế.

## 5. [R-VERIFY] CODE-FIRST VERIFICATION LOOP (VÒNG LẶP KIỂM CHỨNG BẰNG CODE THẬT)

### 5.1. [R-VERIFY.CMD] Khai báo lệnh kiểm chứng của dự án — `[VERIFY_COMMANDS]`
Profile này KHÔNG giả định tech stack. Mọi lệnh kiểm chứng phải được khai báo **một lần** tại khối dưới đây (do `/doc-qa` điền ở Bước 7) và mọi workflow chỉ được tham chiếu tới nó, CẤM hard-code tên lệnh trong luật hay trong workflow:

```yaml
[VERIFY_COMMANDS]
Typecheck: "npm.cmd run typecheck"
Build:     "npm.cmd run build"
Test:      "npm.cmd test"
Test_Dir:  "tests/"
Dev_URL:   "http://localhost:3000"
Known_Failing_Baseline: "none"
```

- **Cổng chặn:** Nếu `Test` còn trống hoặc chưa từng chạy xanh một lần, `/feature-code` **CẤM khởi động**. Phải quay lại `/doc-qa` dựng hạ tầng test trước. Đây là điều kiện cấu trúc — không được lách bằng cách "tạm thời kiểm thử thủ công".
- 🔴 **THẨM QUYỀN GHI `Known_Failing_Baseline` (chỉ 2 cửa):**
  1. `/doc-qa` — khi khảo sát và thiết lập hạ tầng test lần đầu.
  2. **User xác nhận rõ ràng qua chat** — với đúng con số và lý do đã được nêu ra trước.
  - `/feature-code` và `/feature-fix` **chỉ có quyền ĐỌC**. CẤM ghi, dù chỉ một con số, **bất kể lý do nghe hợp lý đến đâu**.
  - Gặp failure mới mà tin là không do mình gây ra ⇒ **DỪNG, báo cáo log, xin User xác nhận** rồi mới cập nhật. CẤM tự phán "đây là lỗi môi trường" rồi nâng baseline — đó chính là cách hợp thức hoá một regression thật.

### 5.2. [R-VERIFY.TIERS] Ba tầng kiểm chứng
- Tuyệt đối cấm báo hoàn thành nếu chưa có Test Code chứng minh.
  1. **Tầng 1 (Compile & Build):** Chạy lệnh `Typecheck` và `Build` đã khai báo — 0 lỗi.
  2. **Tầng 2 (Automated Test Suite):** Chạy lệnh `Test` đã khai báo. Tiêu chuẩn đạt là **0 failure mới so với `Known_Failing_Baseline`**, VÀ mọi test phủ các AC sắp được tick đều pass. (Không dùng chuẩn "PASS 100%" — repo thật luôn có thể có failure nền do môi trường; điều cần chứng minh là *thay đổi này không làm hỏng gì*, không phải *repo hoàn hảo*.)
  3. **Tầng 3 (Human UAT):** Bàn giao `Dev_URL` cho User tự mở trình duyệt nghiệm thu thị giác theo ý thích. Loại bỏ hoàn toàn sự phụ thuộc vào browser_subagent.
- **Mục 7 trong Micro-Spec là Chân lý Tối cao:** Mã nguồn (Code) chỉ là công nhân phục tùng Test Cases trong Spec.
- **Bắt buộc phân tách 2 phân khu kiểm thử trong Mục 7:**
  - **7.1. Automated Test Suite (trong `Test_Dir`):** Mọi tính năng có chứa Logic / Thuật toán / Data Transformation / API Route bắt buộc phải định nghĩa các kịch bản kiểm thử bằng code tự động (`TC_UT_xx`, `TC_INT_xx`). CẤM viết Spec 100% E2E trình duyệt khi có logic toán học hoặc API.
  - **7.2. Human Visual UAT Matrix:** Các kịch bản nghiệm thu thị giác trực tiếp trên màn hình trình duyệt dành cho User (màu sắc, spacing, pan/zoom canvas, responsive, console sạch).
- **Quy trình Trạng thái Rạch ròi:** Mọi tiêu chí test ban đầu phải ở dạng `- [ ] AC_i`. Chỉ chuyển sang `- [x] AC_i` khi test tự động phủ đúng AC đó đã pass.
- **Cấm Tick [x] bằng niềm tin:** Bắt buộc có bằng chứng thực nghiệm rõ ràng: output log của lệnh `Test` từ terminal cho file test tương ứng.

### 5.3. [R-VERIFY.INTEGRITY] Liêm chính của bằng chứng (TEST INTEGRITY) — chống lách luật
Luật "phải có test pass" tạo áp lực khiến agent dễ ép test xanh thay vì làm code đúng. Các hành vi sau bị **CẤM TUYỆT ĐỐI**, nặng ngang với báo cáo sai sự thật:
- Viết test không có assert, hoặc assert vào chính giá trị mà code vừa trả về (tautology).
- Nới lỏng / xoá / `skip` / comment-out một test đang fail để lấy màu xanh.
- **Tự ý sửa `Known_Failing_Baseline` trong lúc chạy `/feature-code` hoặc `/feature-fix` — bất kể lý do.** (Chỉ `/doc-qa` hoặc User mới có quyền ghi; xem `[R-VERIFY.CMD]`.)
- Báo "PASS" khi mới chỉ chạy một tập con test.
> Nếu không thể làm test xanh một cách trung thực: **DỪNG LẠI, báo cáo đúng hiện trạng fail kèm log**. Báo fail trung thực luôn được chấp nhận; báo pass giả thì không.

## 6. [R-NO-BROWSER] TOTAL BAN ON BROWSER SUBAGENT FOR UI VALIDATION (CẤM DÙNG TRÌNH DUYỆT AI ĐỂ NGHIỆM THU UI)
- **Cấm tuyệt đối dùng AI Browser Subagent để kiểm thử giao diện:** Nghiệm thu giao diện (CSS, màu sắc, DOM tĩnh, căn chỉnh pixel, hiệu ứng animation, pan/zoom) thuộc 100% về User (Human UAT) trên màn hình trình duyệt thực tế. Tuyệt đối không gọi `browser_subagent` để mò mẫm hay làm thay User khâu này.
- **Quy trình Bàn giao Nghiệm thu:** Sau khi Tầng 1 (Build) và Tầng 2 (Automated Test) đạt chuẩn `[R-VERIFY.TIERS]`, AI chỉ xuất test log thực tế và cung cấp URL cục bộ kèm hướng dẫn cụ thể để kính mời User tự mở trình duyệt nghiệm thu thị giác.

## 7. [R-SCRATCH] SCRATCHPAD & SELF-CLEANUP POLICY (QUY TẮC TỰ HỦY FILE TẠM)
- **Khu vực tạm thời cách ly:** Mọi script kiểm thử độc lập, script sinh tài nguyên (asset generators), hoặc file query debug bắt buộc chỉ được tạo trong thư mục `scratch/` (phải được cấu hình trong `.gitignore`).
- **Tự hủy ngay sau khi dùng:** Ngay khi script thực thi xong mục đích (VD: đã sinh xong icon PNG, đã convert xong mock data), AI **BẮT BUỘC PHẢI tự động xóa file script đó ngay trong cùng lượt chạy tool**, không được để tồn đọng sang các lượt sau.
- **Cấm xả rác vào thư mục công khai/mã nguồn:** Tuyệt đối không tạo file HTML preview tạm thời vào `public/` hoặc file script debug vương vãi trong thư mục gốc.

## 8. [R-HITL] HUMAN-IN-THE-LOOP & TEMPLATE
- **Human-in-the-loop:** Ở mỗi bước chuyển tiếp giữa các Phase tài liệu hoặc giữa khâu "Lên Spec" và "Code", luôn phải **DỪNG LẠI** và hỏi ý kiến User. Chỉ code khi được phép.
- **Sử dụng Template:** Bất kỳ file tài liệu nào được sinh ra đều phải tuân thủ 100% định dạng của các file mẫu trong thư mục `docs/templates/`. Không tự bỏ bớt các section quan trọng.

## 9. [R-LESSONS] IN-CONTEXT LOGGING (GHI CHÉP BÀI HỌC TẠI TRẬN)
- Mỗi khi bạn (AI) vừa phân tích và sửa xong một lỗi (bug) phức tạp trong quá trình code, HOẶC khi User vừa chốt một quy ước kỹ thuật/logic mới trong lúc chat, bạn **BẮT BUỘC PHẢI** tự động ghi chú lại bài học đó một cách cô đọng vào file `.agents/brain/lessons_learned.md` trước khi trả lời User.
- Đây là "sổ tay kinh nghiệm" sống còn của dự án. Không được phép lười biếng bỏ qua bước ghi chép này.

## 10. [R-IMPACT] ARCHITECTURE SYNC & IMPACT ANALYSIS (RÀ SOÁT DƯ CHẤN BẰNG TOOL)
- **Cơ chế Quét Công Cụ:** Khi kiến trúc hệ thống thay đổi (đổi Database, nâng cấp Auth), tuyệt đối không được dùng "trí nhớ" để liệt kê file. Bắt buộc dùng `grep_search` với từ khóa đặc trưng cao để truy vết toàn bộ Workspace (từ file Markdown đến SQL, Config).
- **Tài liệu Cặp (Coupled Documents):** Khi sửa một thiết kế dạng văn bản (ví dụ `DB-Schema.md`), BẮT BUỘC phải tự động suy luận và tìm kiếm script thực thi tương ứng (như `init-db.sql`) để sửa đổi đồng bộ.

## 11. [R-PLAN] PLANNING MODE BEFORE MASS EXECUTION (QUY HOẠCH TRƯỚC KHI THỰC THI)
- **Cấm tự ý sửa hàng loạt:** Dù `grep_search` phát hiện ra 10 file cần cập nhật, AI CẤM TUYỆT ĐỐI việc tự ý mở các file script/cấu hình để sửa ngay lập tức.
- **Duyệt trước (Human-in-the-loop):** Bắt buộc phải xuất ra `implementation_plan.md` liệt kê danh sách các tệp bị "Hiệu ứng dây chuyền" và Tóm tắt chiến lược cập nhật (High-level summary). Chờ User duyệt xong thì mới tiến hành sửa hàng loạt.

## 12. [R-CONSULT] DEEP DISCUSSION PRINCIPLE (NGUYÊN TẮC THẢO LUẬN SÂU)
- **Chống giao tiếp máy móc:** Không lạm dụng các giới hạn định lượng (như "chỉ hỏi 2-3 câu"). Hãy dùng tư duy Phân cấp ưu tiên và Chia chặng (Phased Discussion) để dẫn dắt User đối với các tính năng khổng lồ.
- **Chống dạy đời (Anti-Socratic):** Đóng vai trò Tư vấn viên (Consultant). Đưa ra lựa chọn và phân tích đánh đổi (Trade-off). Cấm hỏi vặn User. Cấm tự ý chốt phương án thay User.

## 13. [R-SYNC] QUY TẮC ĐỒNG BỘ TOÀN CỤC (GLOBAL SYNC POLICY)
```yaml
[SYNC_POLICY]
Mode: STATIC_COPY
Local_Template_Dir: docs/templates/
Local_Cache_Dir: docs/templates/
Naming_Convention: Identical
```
> Ghi chú: Với `STATIC_COPY`, `Local_Cache_Dir` trùng `Local_Template_Dir` (không có tầng cache riêng vì template được copy nguyên bản, không cần merge).
