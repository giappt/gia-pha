---
description: "[Bước 7/12] Lập Chiến lược Test (File 07) VÀ dựng hạ tầng test chạy được thật, khai báo [VERIFY_COMMANDS]."
---

# LỆNH: /doc-qa

**Mục tiêu:** Chuẩn hoá quy trình đảm bảo chất lượng (QA) — và quan trọng hơn: **biến chiến lược trên giấy thành hạ tầng test chạy được thật**.

> 🔴 **BÀI HỌC XƯƠNG MÁU:** Đã từng xảy ra tình trạng `07_Test-QA-Strategy.md` viết rất hay về Vitest, coverage 85%… trong khi thư mục test **chưa hề tồn tại** và manifest **không có script test**. Hậu quả dây chuyền: `/feature-code` không có cách nào kiểm chứng bằng code, nên phải bấu víu vào việc mở trình duyệt mò mẫm — đốt token mà không tạo ra bằng chứng nào. Lệnh này tồn tại để chặn đứng kịch bản đó. **Tài liệu QA không kèm hạ tầng chạy được = chưa hoàn thành.**

1. **[ĐỌC NGỮ CẢNH]:** Đọc lướt toàn bộ ngữ cảnh dự án (01 đến 06) và file `docs/templates/07_template_Kiem-thu_Test-QA-Strategy.md`. Áp dụng luật *Đọc một lần* — không đọc lại file đã đọc.

2. **[CHỐT CHIẾN LƯỢC]:** Thiết lập tiêu chuẩn Unit / Integration / E2E cho đúng tech stack đã chốt ở File 05. Tạo file `docs/07_Test-QA-Strategy.md`.

3. 🔴 **[DỰNG HẠ TẦNG TEST THẬT — BƯỚC KHÔNG ĐƯỢC BỎ QUA]:**
   - Cài test runner phù hợp tech stack (**hỏi User trước khi cài dependency mới**).
   - Thêm lệnh chạy test vào manifest của dự án (`package.json` scripts / `Makefile` / `pyproject.toml`…).
   - Tạo thư mục test và viết **ÍT NHẤT 1 smoke test chạy được thật** (không phải test rỗng, phải có assert thật).
   - **Chạy lệnh test đó một lần** và dán output log terminal vào báo cáo. Nếu chưa chạy được, phải sửa cho tới khi chạy được — CẤM báo cáo hoàn thành Bước 7 khi lệnh test chưa từng chạy xanh.

4. 🔴 **[GHI KHỐI `[VERIFY_COMMANDS]` VÀO `.agents/AGENTS.md`]:**
   - Điền đầy đủ `Typecheck`, `Build`, `Test`, `Test_Dir`, `Dev_URL` bằng **lệnh thật đã chạy được ở Bước 3** (không phải lệnh phỏng đoán).
   - Ghi `Known_Failing_Baseline`: số lượng test fail cố hữu hiện tại + lý do (ví dụ *"14 fail trên Windows do path separator, pass trên Linux"*), hoặc `none`.
     - ⚠️ **Đây là một trong hai cửa duy nhất được phép ghi giá trị này** (cửa còn lại là User xác nhận qua chat). `/feature-code` và `/feature-fix` chỉ được ĐỌC — xem `[R-VERIFY.CMD]`. Vì vậy phải khảo sát trung thực và đầy đủ ngay tại đây: baseline sai ở bước này sẽ khoá cứng cả Phase 3.
   - Đây là hợp đồng mà `/feature-code` và `/feature-fix` sẽ đọc để biết phải chạy lệnh gì. Sai ở đây thì hỏng toàn bộ Phase 3.

5. **[BÁO CÁO & CHUYỂN TIẾP]:** Báo cáo kèm: log lệnh test chạy thật + khối `[VERIFY_COMMANDS]` vừa ghi. Khuyên User chạy tiếp lệnh `/doc-deploy`.
