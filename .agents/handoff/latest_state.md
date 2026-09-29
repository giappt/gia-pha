# STATE MANIFEST
### 1. Key Context
- Dự án: FAT - Family Tree Management System (Next.js 14 App Router, TypeScript, TailwindCSS, Supabase PostgreSQL).
- Milestone 8: Member Onboarding & Decentralized Approval.
  + Phase 1: Onboarding, Form Nhận/Nối Người Thân & Refinement UX (Hoàn thành 100%).
  + Phase 2: Quyền Tự Quản Gia Đình Của Bạn & Ngữ Cảnh Thao Tác Trong Drawer (Anti-Pill & Contextual Actions, Hoàn thành 100%).
  + Phase 2.5: Quản Trị Tam Đại Đồng Đường & Thuần Việt Hóa Thân Tộc Drawer (Hoàn thành 100%):
    * Lõi RBAC Tam Đại: Mở rộng `canUserManageMember` trong `src/lib/claims/claim-engine.ts` cho phép ông bà ($F_0$) quản lý/sửa hồ sơ cháu trực hệ ($F_2$).
    * Edge Case 9: Tự động thu hồi quyền sửa của $F_0$ khi cháu ($F_2$) hoặc cha/mẹ ($F_1$) đã tự nhận tài khoản riêng (`linked_user_id` / `claimed_by`).
    * Định vị thân tộc: Khối con cái trong `MemberDetailDrawer.tsx` hiển thị `Con cái (Cháu của bạn) (N):` khi $F_0$ xem con ruột $F_1$.
    * Thuần Việt hóa Hôn phối: `Vợ (N):` & `+ Thêm vợ` cho Nam; `Chồng (N):` & `+ Thêm chồng` cho Nữ; `MemberFormModal.tsx` hiển thị `Thêm Vợ Cho:` / `Thêm Chồng Cho:`.
    * Tooltip Đặt làm Gốc: Bổ sung tooltip giải thích ý nghĩa lọc nhánh và đổi góc nhìn xưng hô thân tộc cho nút `[🎯 Đặt làm Gốc]` (vừa được tinh chỉnh câu chữ trực tiếp trong Drawer).
- Hệ thống kiểm chứng Code-First 3 Tầng:
  + Typecheck: 0 lỗi (`npm.cmd run typecheck`).
  + Build: 34/34 routes xanh (`npm.cmd run build`).
  + Test Suite: 388/388 tests PASS, 37/37 suites (`npm.cmd test`, bổ sung 5 tests mới cho Phase 2.5, 0 failures so với Known_Failing_Baseline).
- Các file đang mở / vừa chỉnh sửa:
  + `src/lib/claims/claim-engine.ts`
  + `src/components/tree/MemberDetailDrawer.tsx`
  + `src/components/modals/MemberFormModal.tsx`
  + `tests/decentralized-claim.test.ts`
  + `docs/17_Micro-Spec_Milestone_8_Member_Onboarding_Decentralized_Approval.md` (Đã reverse-sync tick PASS Mục 7.1)
  + `.agents/brain/lessons_learned.md` (Đã ghi nhận bài học kinh nghiệm Tam Đại Đồng Đường & Thuần Việt Hóa Thân Tộc)
  + `task.md` (Đã cập nhật tiến độ Phase 2.5)

### 2. Task Checklist
- [x] Phase 1: Onboarding, Form Nhận/Nối Người Thân & Refinement UX
- [x] Phase 2: Quyền Tự Quản Gia Đình Của Bạn & Ngữ Cảnh Thao Tác Trong Drawer (Anti-Pill & Contextual Actions)
- [x] Phase 2.5: Quản Trị Tam Đại Đồng Đường & Thuần Việt Hóa Thân Tộc Drawer
- [ ] Phase 3: Phê Duyệt Phân Tán (3 tầng), Cơ Chế Ủy Quyền Cho Trưởng Chi & Cổng Quản Trị Chi Nhánh (`/branch`)

### 3. Immediate Next Step
- Khởi động **Phase 3 của Milestone 8**: Thảo luận / Lên đặc tả chi tiết cho cơ chế Phê duyệt phân tán (Super Admin gán phiếu cho Trưởng Chi xác minh, Trưởng Chi duyệt phiếu tạo node tự động cập nhật cây) và giao diện Cổng Quản Trị Chi (`/branch`).
