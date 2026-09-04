# STATE MANIFEST

### 1. Key Context
- **Hệ Thống Đã Nâng Cấp Hoàn Toàn Lên Version 6 (Local & Global):**
  - Đã cập nhật nguyên văn Kỷ luật `CODE-FIRST VERIFICATION LOOP` (Mục 5) và `TOTAL BAN ON BROWSER SUBAGENT FOR UI VALIDATION` (Mục 14) vào [.agents/AGENTS.md](file:///d:/pj/other/fat/.agents/AGENTS.md).
  - Đã đồng bộ lên Global Profile `~/.gemini/config/profiles/software-engineer/` (Git commit `3042fa7`).
  - Đã sửa script test trong [package.json](file:///d:/pj/other/fat/package.json) sang wildcard `"test": "npx tsx --test tests/*.test.ts"` (kiểm chứng pass 18/18 tests trong 3.52s).
  - Quy tắc cốt lõi: Cấm hoàn toàn `browser_subagent` mò mẫm hay nghiệm thu UI; 100% thẩm định thị giác chuyển cho Human UAT; bắt buộc viết Test Code tự động trong `tests/` trước/cùng lúc với viết logic.
  - Mã nguồn Milestone 3: **Cam kết 100% chưa chạm vào bất kỳ file code nào**.

- **Chiến Lược Phân Chặng Milestone 3 (Thin-Slicing Thành 2 Chặng Độc Lập):**

  #### 🟢 CHẶNG 1 — MILESTONE 3.1 (Nhiệm vụ thi công hiện tại): Core Interactive Tree Canvas & Ghost Node
  - **Mục tiêu:** Xây dựng lõi Canvas tương tác cơ bản, vẽ chính xác cây phả hệ gia tộc và giải quyết triệt để hôn nhân nội tộc bằng cơ chế Ghost Node 🔗.
  - **Quy mô dữ liệu:** Bộ dữ liệu mẫu 28 thành viên (4 thế hệ, 2 chi nhánh, 1 cặp kết hôn nội tộc giữa Chi 1 và Chi 2).
  - **Kiến trúc điều hướng:** Option B — Tách biệt hoàn toàn thành trang Canvas toàn màn hình tại `/tree` (`h-[calc(100vh-4rem)]`), giữ nguyên Trang chủ `/` làm Landing page. Navbar và nút "Khám Phá Cây Phả Hệ" liên kết sang `/tree`.
  - **Thư viện nền tảng:** `@xyflow/react` (React Flow 12).
  - **Các thành phần cốt lõi cần thi công:**
    1. `src/types/tree.ts`: Cấu trúc DTO cho TreeNode, TreeEdge, GhostNode data, MarriageEdge.
    2. `src/lib/tree-layout/genealogy-layout.ts`: Thuật toán dàn trang cây gia phả:
       - Phân tầng thế hệ theo trục Y cố định (`LEVEL_HEIGHT = 160px`).
       - Tọa độ người phối ngẫu (spouse) đặt ngang hàng bên phải node chính (`offset = NODE_WIDTH + 20px`).
       - Tính toán độ rộng nhánh con (subtree width) để chống va chạm tọa độ X giữa các chi họ (Zero-collision layout).
       - Nhận diện hôn nhân nội tộc $\rightarrow$ sinh node phản chiếu `isGhost: true` trỏ về `originalNodeId`.
    3. `src/app/api/tree/route.ts`: API Route trả về payload nodes và edges chuẩn.
    4. `src/components/tree/`:
       - `FamilyTreeCanvas.tsx`: Khung Canvas React Flow bọc ngoài, cấu hình snap-to-grid, panOnDrag, minZoom (0.1), maxZoom (2.0).
       - `MemberNode.tsx`: Thẻ thành viên phân biệt Nam (viền xanh)/Nữ (viền hồng), Còn sống/Đã mất (thẻ trang trọng có năm mất).
       - `GhostNode.tsx`: Thẻ node phản chiếu viền nét đứt màu hổ phách kèm biểu tượng 🔗 và nút click camera lướt về node gốc.
       - `TreeToolbar.tsx`: Thanh công cụ nổi phía trên (nút Reset view, Căn giữa Fit View, đếm thành viên, tên dòng họ).
       - `SpotlightSearch.tsx`: Thanh tìm kiếm nhanh tên thành viên với hiệu ứng bay camera đến đúng node.
    5. `src/app/tree/page.tsx`: Fullscreen Page bọc Canvas và Toolbar.
    6. `tests/tree-layout.test.ts`: Bộ Unit Test tự động cho thuật toán dàn trang không va chạm và sinh Ghost Node.

  #### 🟡 CHẶNG 2 — MILESTONE 3.2 (Chặng tiếp theo, KHÔNG làm lẫn vào 3.1): Performance Benchmark 600 Thành Viên & Advanced LOD
  - **Mục tiêu:** Mở rộng quy mô lên đại gia tộc (600+ thành viên, 7-10 đời), tối ưu hóa hiệu năng render canvas và thiết kế trải nghiệm điều hướng nhiều mức chi tiết (LOD).
  - **Các bài toán kỹ thuật & giải pháp chi tiết:**
    1. **Bài toán DOM Overload & Drop FPS:** Render 600 custom node cùng lúc khiến DOM có hàng ngàn phần tử JSX $\rightarrow$ lag giật khi kéo thả.
       - *Giải pháp:* Kích hoạt `onlyRenderVisibleElements={true}` trên `@xyflow/react` kết hợp Viewport Culling. Các node ngoài màn hình camera sẽ bị unmount khỏi DOM, giảm tải 85% tài nguyên đồ họa.
    2. **Bài toán Over-Clustering (Nhòe chữ khi Zoom Out):** Khi thu nhỏ để xem toàn cảnh 10 đời, 600 thẻ thông tin đè nghẹt lên nhau.
       - *Giải pháp:* Kỹ thuật **Level of Detail (LOD) Renderer** phản ứng theo `zoom` level:
         - **Far View (`zoom < 0.4`):** Node tự động co cụm thành dạng **Minimal Dot/Pill** (chỉ hiển thị chấm tròn màu giới tính và họ tên chữ nhỏ, ẩn hoàn toàn avatar, ngày sinh/mất để giữ giao diện thông thoáng).
         - **Mid View (`0.4 <= zoom < 0.8`):** Thẻ thu gọn (Compact Card: avatar nhỏ, tên, vai vế).
         - **Close-up View (`zoom >= 0.8`):** Thẻ chi tiết đầy đủ (Full Card: đầy đủ thông tin, ngày âm lịch, nút thao tác).
    3. **Bài toán Main Thread Blocking khi tính Layout lớn:** Thuật toán dàn trang 600 nodes có thể mất >200ms gây đơ UI.
       - *Giải pháp:* Đưa thuật toán `genealogy-layout.ts` chạy trong **Web Worker** riêng biệt hoặc sử dụng Memoization Cache theo `clan_version`, đảm bảo Main Thread luôn đạt 60 FPS.
    4. **Dữ liệu kiểm thử & Tiêu chuẩn nghiệm thu Chặng 2 (Definition of Done):**
       - Tạo fixture mock 600 thành viên qua script `scratch/seed-large-clan-600.ts`.
       - Đo đạc FPS thực tế qua Chrome Performance / DevTools: Thao tác Pan/Zoom liên tục trên cây 600 node phải duy trì **$\ge 55$ FPS**.
       - Thời gian tính toán layout ban đầu cho 600 nodes **$\le 300\text{ms}$** (có test benchmark tự động trong `tests/tree-layout-perf.test.ts`).
       - Thời gian phản hồi API `GET /api/tree?clanId=...` cho 600 nodes **$\le 500\text{ms}$** (sử dụng CTE đệ quy tối ưu).

- **Nút Thắt Cần Giải Quyết Trước Khi Bắt Tay Code Chặng 3.1:**
  - File [docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md](file:///d:/pj/other/fat/docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md) hiện đang mang Mục 7 dạng 100% E2E trình duyệt cũ.
  - **Bắt buộc:** Phải refactor lại Mục 7 của Spec này theo chuẩn v6:
    + `7.1. Automated Test Suite`: Liệt kê các Unit Test cases toán học (`TC_UT01` zero collision, `TC_UT02` spouse offset, `TC_UT03` ghost node generation) và Integration Test `TC_INT01` (`GET /api/tree`).
    + `7.2. Human Visual UAT Matrix`: Liệt kê kịch bản nghiệm thu thị giác (Pan/Zoom, Spotlight, Toolbar, Responsive) cho User tự kiểm tra trên trình duyệt.

### 2. Task Checklist
- [x] Nâng cấp toàn diện Luật kiểm thử lên Version 6 (Local [.agents/AGENTS.md](file:///d:/pj/other/fat/.agents/AGENTS.md) & Global `template_AGENTS.md`, Git commit `3042fa7`).
- [x] Triệt tiêu 4 mâu thuẫn: sửa [package.json](file:///d:/pj/other/fat/package.json) wildcard `tests/*.test.ts` (pass 18/18 tests), đồng bộ [/feature-spec](file:///d:/pj/other/fat/.agents/workflows/feature-spec.md), [/feature-code](file:///d:/pj/other/fat/.agents/workflows/feature-code.md), [/feature-fix](file:///d:/pj/other/fat/.agents/workflows/feature-fix.md), [template Spec](file:///d:/pj/other/fat/docs/templates/09_template_Dac-ta-Vi-mo_Micro-Spec_n.md) và [docs/07_Test-QA-Strategy.md](file:///d:/pj/other/fat/docs/07_Test-QA-Strategy.md).
- [x] Định hình chiến lược phân chặng rõ ràng: Chặng 3.1 (Core Canvas & Ghost Node 28 nodes) và Chặng 3.2 (Scale 600 nodes & LOD).
- [ ] **Giai đoạn chuẩn bị Chặng 3.1:**
  - [ ] Refactor Mục 7 trong [docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md](file:///d:/pj/other/fat/docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md) sang 7.1 Automated Tests (`tests/tree-layout.test.ts`, `/api/tree`) và 7.2 Human Visual UAT.
- [ ] **Giai đoạn thi công Chặng 3.1 (Chạy `/feature-code`):**
  - [ ] Cài đặt `@xyflow/react`.
  - [ ] Viết types `src/types/tree.ts` và thuật toán `src/lib/tree-layout/genealogy-layout.ts`.
  - [ ] Viết test tự động `tests/tree-layout.test.ts` và chạy `npm test` PASS 100% chứng minh zero collision và ghost node.
  - [ ] Viết API `src/app/api/tree/route.ts`.
  - [ ] Thi công các UI components (`FamilyTreeCanvas`, `MemberNode`, `GhostNode`, `TreeToolbar`, `SpotlightSearch`, `src/app/tree/page.tsx`).
  - [ ] Cập nhật liên kết Navbar và Landing Page sang `/tree`.
  - [ ] Kiểm chứng 3 tầng: `npm run typecheck` $\rightarrow$ `npm test` PASS $\rightarrow$ Bàn giao URL cho Human UAT.
- [ ] **Giai đoạn Chặng 3.2 (Thực hiện sau khi Chặng 3.1 nghiệm thu hoàn tất):**
  - [ ] Lập Micro-Spec Chặng 3.2: Đặc tả bộ dữ liệu mẫu 600 thành viên, ngưỡng zoom LOD (3 mức) và chỉ số FPS.
  - [ ] Sinh fixture 600 thành viên và xây dựng benchmark test `tests/tree-layout-perf.test.ts` ($\le 300\text{ms}$).
  - [ ] Triển khai LOD Component Renderer và kích hoạt `onlyRenderVisibleElements`.
  - [ ] Tối ưu Web Worker / Caching cho layout calculation.
  - [ ] Nghiệm thu đo đạc FPS $\ge 55$ fps và bàn giao cho User.

### 3. Immediate Next Step
- Mở file [docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md](file:///d:/pj/other/fat/docs/11_Micro-Spec_Milestone_3_Interactive_Tree.md), sửa lại toàn bộ **Mục 7** để phân tách rõ ràng:
  1. `7.1. Bảng Kịch Bản Kiểm Thử Tự Động (Automated Test Suite trong tests/tree-layout.test.ts)`: Định nghĩa các test case toán học không va chạm tọa độ (`TC_UT01`), offset vợ chồng (`TC_UT02`), sinh Ghost Node (`TC_UT03`), và payload API `GET /api/tree` (`TC_INT01`).
  2. `7.2. Danh Sách Tiêu Chí Nghiệm Thu Thị Giác (Human Visual UAT Matrix)`: Kịch bản kiểm tra Pan/Zoom, Spotlight, Toolbar dành cho User tự thẩm định trên trình duyệt.
