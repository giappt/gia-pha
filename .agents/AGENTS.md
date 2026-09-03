---
Parent-Profile: software-engineer
Profile-Version: 4
---

# PROJECT-SCOPED RULES (FAT - FAMILY TREE MANAGEMENT SYSTEM)

Dưới đây là các nguyên tắc TỐI THƯỢNG mà AI Agent BẮT BUỘC PHẢI TUÂN THỦ khi thao tác trong dự án này.

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

## 4. STRICT EXECUTION & REVERSE SYNC
- **No Hallucination:** Khi code tính năng, phải bám sát **100%** vào file Đặc tả Vi mô (`Micro-Spec`). Không tự ý bịa thêm tính năng không có trong tài liệu.
- **Reverse Sync (Đồng bộ ngược):** Nếu trong quá trình code hoặc fix bug, bạn buộc phải đổi giải pháp kỹ thuật so với thiết kế ban đầu (do hạn chế của framework) => Bạn **BẮT BUỘC** phải mở lại file `Micro-Spec` (hoặc các file `01~05` liên quan) để cập nhật lại nội dung. Tài liệu luôn phải là Single Source of Truth khớp với code thực tế.

## 5. 3-TIER VERIFICATION LOOP (VÒNG LẶP KIỂM CHỨNG 3 TẦNG)
- Code xong **TUYỆT ĐỐI CẤM** báo cáo hoàn thành ngay cho User.
- Bắt buộc chạy qua 3 tầng kiểm chứng:
  1. **Tầng 1 (Compile & Build):** `next build` / TypeScript sạch 100% 0 lỗi.
  2. **Tầng 2 (Thực thi Test Cases Tự động):** Chạy Unit Test hoặc dùng `browser_subagent` tự động mở trình duyệt click, tương tác và kiểm tra DOM/Console log khớp với từng Test Case trong Spec.
  3. **Tầng 3 (Regression Guard):** Kiểm tra các tính năng lân cận (pan/zoom, tìm kiếm, modal, dark mode) để chống thoái lui.
- Chỉ khi TẤT CẢ Test Cases báo PASS thực nghiệm mới được phép tick `- [x] AC` trong Micro-Spec và mời User UAT.

## 6. HUMAN-IN-THE-LOOP & TEMPLATE
- **Human-in-the-loop:** Ở mỗi bước chuyển tiếp giữa các Phase tài liệu hoặc giữa khâu "Lên Spec" và "Code", luôn phải **DỪNG LẠI** và hỏi ý kiến User. Chỉ code khi được phép.
- **Sử dụng Template:** Bất kỳ file tài liệu nào được sinh ra đều phải tuân thủ 100% định dạng của các file mẫu trong thư mục `docs/templates/`. Không tự bỏ bớt các section quan trọng.

## 7. IN-CONTEXT LOGGING (GHI CHÉP BÀI HỌC TẠI TRẬN)
- Mỗi khi bạn (AI) vừa phân tích và sửa xong một lỗi (bug) trong quá trình code, HOẶC khi User vừa chốt một quy ước kỹ thuật/logic mới trong lúc chat, bạn **BẮT BUỘC PHẢI** tự động ghi chú tóm tắt lại bài học đó (1-2 gạch đầu dòng) vào file `.agents/brain/lessons_learned.md` trước khi trả lời User.
- Đây là "sổ tay kinh nghiệm" sống còn của dự án. Không được phép lười biếng bỏ qua bước ghi chép này.

## 8. ARCHITECTURE SYNC & IMPACT ANALYSIS (RÀ SOÁT DƯ CHẤN BẰNG TOOL)
- **Cơ chế Quét Công Cụ:** Khi kiến trúc hệ thống thay đổi (đổi Database, nâng cấp Auth), tuyệt đối không được dùng "trí nhớ" để liệt kê file. Bắt buộc dùng `grep_search` với từ khóa đặc trưng cao để truy vết toàn bộ Workspace (từ file Markdown đến SQL, Config).
- **Tài liệu Cặp (Coupled Documents):** Khi sửa một thiết kế dạng văn bản (ví dụ `DB-Schema.md`), BẮT BUỘC phải tự động suy luận và tìm kiếm script thực thi tương ứng (như `init-db.sql`) để sửa đổi đồng bộ.

## 9. PLANNING MODE BEFORE MASS EXECUTION (QUY HOẠCH TRƯỚC KHI THỰC THI)
- **Cấm tự ý sửa hàng loạt:** Dù `grep_search` phát hiện ra nhiều file cần cập nhật, AI CẤM TUYỆT ĐỐI việc tự ý mở các file script/cấu hình để sửa ngay lập tức.
- **Duyệt trước (Human-in-the-loop):** Bắt buộc phải xuất ra `implementation_plan.md` liệt kê danh sách các tệp bị "Hiệu ứng dây chuyền" và Tóm tắt chiến lược cập nhật (High-level summary). Chờ User duyệt xong thì mới tiến hành sửa hàng loạt.

## 10. DEEP DISCUSSION PRINCIPLE (NGUYÊN TẮC THẢO LUẬN SÂU)
- **Chống giao tiếp máy móc:** Không lạm dụng các giới hạn định lượng (như "chỉ hỏi 2-3 câu"). Hãy dùng tư duy Phân cấp ưu tiên và Chia chặng (Phased Discussion) để dẫn dắt User đối với các tính năng khổng lồ.
- **Chống dạy đời (Anti-Socratic):** Đóng vai trò Tư vấn viên (Consultant). Đưa ra lựa chọn và phân tích đánh đổi (Trade-off). Cấm hỏi vặn User. Cấm tự ý chốt phương án thay User.

## 11. QUY TẮC ĐỒNG BỘ TOÀN CỤC (GLOBAL SYNC POLICY)
```yaml
[SYNC_POLICY]
Mode: STATIC_COPY
Local_Template_Dir: docs/templates/
Local_Cache_Dir: docs/templates/
Naming_Convention: Identical
```
> Ghi chú: Với `STATIC_COPY`, `Local_Cache_Dir` trùng `Local_Template_Dir` (không có tầng cache riêng vì template được copy nguyên bản, không cần merge).

## 12. SCRATCHPAD & SELF-CLEANUP POLICY (QUY TẮC TỰ HỦY FILE TẠM)
- **Khu vực tạm thời cách ly:** Mọi script kiểm thử độc lập, script sinh tài nguyên (asset generators), hoặc file query debug DB bắt buộc chỉ được tạo trong thư mục `scratch/` (đã được cấu hình trong `.gitignore`).
- **Tự hủy ngay sau khi dùng:** Ngay khi script thực thi xong mục đích (VD: đã sinh xong icon PNG), AI **BẮT BUỘC PHẢI tự động xóa file script đó ngay trong cùng lượt chạy tool**, không được để tồn đọng sang các lượt sau.
- **Cấm xả rác vào thư mục công khai/mã nguồn:** Tuyệt đối không tạo file HTML preview tạm thời vào `public/` hoặc file debug `.js` vương vãi trong thư mục gốc.

## 13. SPEC CONTRACT & TEST TRUTH HIERARCHY (CẤP BẬC CHÂN LÝ SPEC & TEST)
- **Mục 7 trong Micro-Spec là Chân lý Tối cao:** Mã nguồn (Code) chỉ là công nhân phục tùng Test Cases trong Spec.
- **Quy trình Trạng thái Rạch ròi:** Mọi tiêu chí test ban đầu phải ở dạng `- [ ] AC_i`. Code thi công cho đến khi test PASS 100% mới được chuyển sang `- [x] AC_i`.
- **Cấm Tick [x] bằng niềm tin:** Bắt buộc phải có bằng chứng thực nghiệm (Test Log / Browser Run Output) chứng minh AC thỏa mãn trước khi báo User nghiệm thu.

## 14. BROWSER SUBAGENT PRE-FLIGHT GATE & RATE GUARD (CỔNG KIỂM ĐỊNH TRÌNH DUYỆT & CHỐNG LÃNG PHÍ TOKEN)
- **Cấm dùng Browser để mò lỗi (No Trial-and-Error Debugging):** Tuyệt đối cấm dùng `browser_subagent` để mò lỗi hoặc thử-sai trạng thái UI. Mọi phân tích trạng thái bất đồng bộ, hydration hay rendering phải giải quyết trước bằng đọc code, phân tích console log, hoặc chạy lệnh `curl`.
- **Pre-flight Gate Bắt buộc:** Trước khi triệu hồi `browser_subagent`, hệ thống bắt buộc phải thỏa mãn 3 điều kiện tiên quyết:
  1. Compile & Build pass 100% 0 lỗi (`next build` / `npm run typecheck`).
  2. Toàn bộ Unit Test thực thi PASS 100%.
  3. Dùng `curl` kiểm tra endpoint cục bộ để xác nhận payload API trả về đúng và đầy đủ cấu trúc mong đợi.
- **Quy tắc Single-Shot Verification:** Gom toàn bộ kịch bản test và chụp bằng chứng vào **1 lần chạy browser subagent duy nhất**. Tuyệt đối không chia nhỏ thành nhiều lần gọi liên tiếp.
- **Dừng lại khi Thất bại (Hard Stop on Failure):** Nếu lần chạy browser đầu tiên thất bại hoặc phát sinh lỗi ngoài dự kiến $\rightarrow$ DỪNG LẠI NGAY LẬP TỨC và xin ý kiến User (hoặc mời User UAT bằng tay), nghiêm cấm tự ý retry liên tục làm cạn kiệt quota (`429 Resource Exhausted`).
- **Khóa Độ Phân Giải (Resolution Anchor):** Mọi lệnh giao task cho subagent bắt buộc phải yêu cầu resize viewport về chuẩn cố định `1280x800` ngay ở bước đầu tiên để tránh trượt tọa độ giao diện responsive (do viewport mặc định 2510px gây click trượt ra ngoài lề).

