# STATE MANIFEST
### 1. Key Context
- **Nhiệm vụ trọng tâm:** Tinh chỉnh modal kết nối gia phả (`ConnectGenealogyModal.tsx`) giải quyết triệt để vấn đề phản cảm thị giác: 2 thanh cuộn lồng nhau kề sát (Double Scrollbar Artifact) và giật nảy màn hình khi nhập thông tin ở Tab 2 "Tôi chưa có trên cây".
- **Kiến trúc chốt qua Brainstorm & Spec:** Chuyển đổi Tab 2 sang **Quy trình Wizard 2 Bước Tuần Tự (Wizard 2-Step)**:
  - **Bước 1 (Thông tin cá nhân):** Họ tên, Giới tính, Năm sinh (~220px, tuyệt đối 0 scrollbar) + nút `[ Tiếp Tục: Chọn Bố Mẹ → ]`.
  - **Bước 2 (Cội nguồn & Bố Mẹ):** Badge tóm tắt Bước 1 (có nút Sửa quay lại) + Tìm Bố Mẹ hiển thị **dạng Thẻ Phẳng (Inline List)** trực tiếp dưới ô input (loại bỏ hoàn toàn dropdown `absolute` lơ lửng, không che khuất checkbox hay textarea) + Đa thê + Stepper thứ tự con + Nguyện vọng con trưởng + Phiếu tìm cội nguồn + Sticky Footer có nút `[ ← Quay lại ]` và `[ Gửi Yêu Cầu Xét Duyệt ]`.
  - Toàn bộ modal chỉ có duy nhất **1 luồng cuộn tự nhiên duy nhất**, triệt tiêu 100% hiện tượng 2 thanh cuộn kề nhau.
- **Tập tin đã chỉnh sửa:**
  - `src/components/modals/ConnectGenealogyModal.tsx`: Đã thi công xong trọn vẹn Wizard 2 bước + Inline List phẳng.
  - `docs/17_Micro-Spec_Milestone_8_Member_Onboarding_Decentralized_Approval.md`: Đã cập nhật Section 5.2 và Section 7.2 (UAT_10).
  - `.agents/brain/lessons_learned.md`: Đã ghi nhận bài học kinh nghiệm về Wizard 2 bước & Triệt tiêu Double Scrollbar.
- **Kết quả kiểm chứng 3 tầng:**
  - Typecheck: `npm run typecheck` $\rightarrow$ 0 lỗi.
  - Build: `npm run build` $\rightarrow$ Thành công 33/33 static & dynamic routes.
  - Automated Tests: `npm test` $\rightarrow$ PASS 376/376 tests (36 suites, 0 fail).
- **Trạng thái môi trường & Dev Server:**
  - Dev server vừa được User restart sạch (`npm run dev`) để tránh lỗi 404 chunks do webpack cache sau khi build.

### 2. Task Checklist
- [x] Phase 1.1: Mở rộng migration CSDL `claim_requests` và cập nhật TypeScript types trong `src/types/database.ts`
- [x] Phase 1.2: Xây dựng `src/lib/claims/claim-engine.ts` (validate, deduce branch focus, format context card)
- [x] Phase 1.3: Viết Backend APIs `POST /api/claims` và `GET /api/claims/my-requests`
- [x] Phase 1.4: Xây dựng `IdentityContextWidget.tsx` và `ConnectGenealogyModal.tsx`
- [x] Phase 1.5: Phủ test cases Phase 1 ban đầu, Typecheck/Build sạch
- [x] Phase 1.6: Refinement UX & Kinship Logic (Xóa dropdown nhánh Home, cố định layout Tab 1, đưa nhân thân lên đầu Tab 2, đa thê & stepper con)
- [x] Phase 1.7: Bảo mật tra cứu Privacy-first Tab 1, gợi ý thứ tự con thông minh, nguyện vọng Con Trưởng & validate phiếu rỗng
- [x] Phase 1.8: Triệt tiêu Double Scrollbar & thi công Wizard 2 Bước Tuần Tự (Bước 1 gọn 220px 0 scrollbar, Bước 2 Inline Flat List không che khuất, 1 luồng cuộn duy nhất)
- [ ] Phase 2.1: Viết API `POST /api/members/quick-add-child` (Auto-approved khi `parentId === my_linked_id`)
- [ ] Phase 2.2: Thêm nút tròn ngọc bích `(+)` dưới chân node thẻ cá nhân của mình & vợ/chồng trên `FamilyTreeCanvas.tsx`
- [ ] Phase 2.3: Mở khóa `[Chỉnh sửa]` và `[+ Thêm Con]` trong `MemberDetailDrawer.tsx` cho tiểu gia đình (Bản thân, Vợ/Chồng, Con đẻ)
- [ ] Phase 2.4: Phủ test Phase 2 (`TC_UT_CLAIM_CAN_MANAGE_PARENT`, `TC_UT_CLAIM_AUTO_APPROVE_PARENT_ADD`), Human UAT nút `(+)` trên cây
- [ ] Phase 3: Phê duyệt phân tán (3 tầng), cơ chế Assign cho Trưởng Chi & Cổng quản trị `/branch`

### 3. Immediate Next Step
- Mời User kiểm thử thị giác (Human Visual UAT) trên trình duyệt tại `http://localhost:3000` để trải nghiệm Wizard 2 bước của Tab 2 (Bước 1 không cuộn $\rightarrow$ Tiếp tục $\rightarrow$ Bước 2 thẻ phẳng, không còn 2 thanh cuộn), hoặc tiếp tục bước tiếp theo sang **Phase 2 (Dấu + thêm con trực tiếp trên cây cho tài khoản đã liên kết)**.
