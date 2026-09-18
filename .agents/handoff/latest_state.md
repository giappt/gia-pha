# STATE MANIFEST
### 1. Key Context
- **Vấn đề cần giải quyết:** Trang tra cứu vai vế `http://localhost:3000/kinship` và API `/api/kinship` bị nhận diện sai các mối quan hệ qua hôn phối thành "Người ngoài họ":
  1. Vợ - Chồng (Phạm Văn Chiến & Đào Thị Liễu)
  2. Bố/Mẹ chồng - Con dâu; Bố/Mẹ vợ - Con rể (Phạm Văn Uyên & Chu Thị Hà)
  3. Chị dâu/Em dâu - Em chồng/Anh chồng (Chu Thị Hà & Phạm Văn Bẩy)
  4. Anh rể/Em rể - Em vợ/Anh vợ
  5. Bác dâu, Thím, Dượng, Mợ
  6. Chị em dâu, Cọc chèo (Anh em đồng hao)
- **Căn nguyên kỹ thuật (Root Cause):**
  - Thuật toán `findLowestCommonAncestor` trong `src/lib/kinship-engine/lca-finder.ts` chỉ duyệt ngược quan hệ huyết thống qua `father_id` và `mother_id`. Người dâu/rể không có cha mẹ ruột trong họ nên `commonAncestorIds.length === 0` dẫn đến `relationshipType: 'unrelated'`.
  - Trang `/kinship` và `/api/kinship` chưa nạp dữ liệu từ bảng `spouse_relations`.
- **Quyết định kiến trúc & Thiết kế đã chốt:**
  - Bổ sung `RelationshipType`: `'spouse' | 'in_law' | 'co_in_law'`.
  - Triển khai 4 kịch bản bản thể: (1) `spouse` trực tiếp; (2) `consanguineal` huyết thống ruột; (3) `in_law` cầu nối hôn nhân đơn ($S_A$ hoặc $S_B$); (4) `co_in_law` cầu nối hôn nhân đôi ($S_A$ và $S_B$).
  - Truy vấn đồng thời `members` và `spouse_relations` từ Supabase, nạp in-memory trên Client để giữ vững tốc độ tính toán 0ms.
  - Sơ đồ phả hệ trực quan bổ sung nhịp nối nét đôi `═(Hôn phối)═`.
  - Biểu tượng phân hệ "Xưng hô" đã được quy chuẩn sang `<Users />` (thay cho `<Compass />` theo mục 5.12 của Doc 13).
- **Trạng thái tài liệu (Single Source of Truth):**
  - Đã cập nhật đầy đủ file đặc tả [docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md](file:///d:/pj/other/fat/docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md) gồm: Mục 2 (Models), Mục 3 (Sequence Diagram), Mục 5.4 (Lõi thân tộc hôn nhân), Mục 7 (TC29–TC36, AC29–AC36, UAT_INLAW_01–04), Mục 8 (RG14–RG16).
  - Đã cập nhật Artifact [implementation_plan.md](file:///C:/Users/giap.pham/.gemini/antigravity-ide/brain/3b51857a-7638-49fa-bcc4-3ac274aa41bb/implementation_plan.md).
- **Môi trường & Baseline kiểm thử:**
  - Dev server `npm run dev` đang chạy nền trên port 3000.
  - 286/286 automated tests hiện có đang Pass 100%, compile và typecheck 0 lỗi.
- **Các tệp thao tác chính:**
  - `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md`
  - `src/types/kinship.ts`
  - `src/lib/kinship-engine/lca-finder.ts`
  - `src/lib/kinship-engine/regional-dictionaries.ts`
  - `src/app/api/kinship/route.ts`
  - `src/app/kinship/page.tsx`
  - `tests/kinship-inlaw.test.ts` (chuẩn bị tạo mới)

### 2. Task Checklist
- [x] Khắc phục lỗi trang `/kinship` và `/api/kinship` nạp dữ liệu thực tế từ Supabase DB.
- [x] Chuẩn hóa cột thế hệ `generation_level` cho toàn bộ schema và engine.
- [x] Brainstorm phân giải toàn diện quan hệ dâu rể / hôn phối (`/feature-brainstorm`).
- [x] Hoàn thiện tài liệu Đặc tả Vi mô `docs/10_Micro-Spec_Milestone_2_Kinship_Lunar.md` (`/feature-spec`).
- [x] Cập nhật `implementation_plan.md` cho phân hệ Affinal Kinship Engine.
- [ ] Cập nhật kiểu dữ liệu trong `src/types/kinship.ts` (`spouse`, `in_law`, `co_in_law`).
- [ ] Nâng cấp thuật toán `findLowestCommonAncestor` trong `src/lib/kinship-engine/lca-finder.ts` nạp `spouseMap` và giải quyết 4 kịch bản bản thể.
- [ ] Mở rộng bộ phân giải xưng hô `resolveKinshipTerms` trong `src/lib/kinship-engine/regional-dictionaries.ts` cho các danh xưng dâu rể theo 3 miền.
- [ ] Cập nhật API `src/app/api/kinship/route.ts` truy vấn thêm bảng `spouse_relations`.
- [ ] Cập nhật giao diện `src/app/kinship/page.tsx` nạp `spouse_relations` in-memory và render sơ đồ nhịp nối hôn nhân `═(Hôn phối)═`.
- [ ] Tạo file test tự động `tests/kinship-inlaw.test.ts` phủ toàn bộ TC29–TC36.
- [ ] Chạy kiểm chứng 3 tầng (`typecheck`, `test`, `build`) đạt 100% xanh và tick `[x] AC29–AC36`.
- [ ] Bàn giao các kịch bản nghiệm thu thị giác `UAT_INLAW_01–04` trên trình duyệt cho User.

### 3. Immediate Next Step
- Khởi động lệnh `/feature-code` để bắt đầu thi công code phân tầng theo đúng Spec: mở rộng `src/types/kinship.ts` và nâng cấp thuật toán `findLowestCommonAncestor` trong `src/lib/kinship-engine/lca-finder.ts`.
