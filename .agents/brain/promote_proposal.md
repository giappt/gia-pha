# ĐỀ XUẤT THĂNG CẤP GLOBAL PROFILE (PROMOTE PROPOSAL) — ĐÃ HOÀN TẤT (V6)

- **Target Profile:** `software-engineer`
- **Target Profile Path:** `~/.gemini/config/profiles/software-engineer/`
- **Current Active Version:** `Profile-Version: 6`
- **Trạng thái:** Đã thăng cấp và đồng bộ 100% vào Global Profile (Commit: `3042fa7`).

---

## 1. TÓM TẮT THAY ĐỔI TRIỆT ĐỂ V6
1. **Code-First Verification Loop (Vòng lặp Kiểm chứng bằng Code thật):**
   - Nghiêm cấm báo hoàn thành nếu chưa có Test Code chứng minh.
   - Bắt buộc 3 tầng: Typecheck/Build sạch -> Automated Test Suite (PASS 100%) -> Human UAT.
2. **Mandatory Test Suite Creation:**
   - Mục 7 trong Micro-Spec bắt buộc chia thành: 7.1 Automated Test Suite (`tests/*.test.ts`) và 7.2 Human Visual UAT Matrix.
3. **Total Ban on Browser Subagent for UI Validation:**
   - Loại bỏ hoàn toàn sự phụ thuộc vào `browser_subagent` cho kiểm thử giao diện.
   - Trao 100% quyền nghiệm thu thị giác cho User (Human UAT) trên màn hình trình duyệt thực tế.
4. **Đồng bộ Pipeline toàn diện:**
   - Sửa `package.json` tự động quét mọi file test qua wildcard `tests/*.test.ts`.
   - Đồng bộ `feature-spec`, `feature-code`, `feature-fix`, `template_AGENTS.md` và template spec mẫu.
