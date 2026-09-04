# STATE MANIFEST
### 1. Key Context
- **Trạng thái Codebase & Kiểm chứng:**
  - `npm.cmd run typecheck`: 0 lỗi (`tsc --noEmit` exit 0).
  - `npm.cmd run build`: 0 lỗi, tĩnh hóa thành công 12/12 routes, route `/tree` đạt 73.7 kB.
  - `npm.cmd test`: **38/38 tests PASS 100%** (SLA layout benchmark 1.787 nodes đạt ~10.55 ms).
  - Đã bổ sung dataset `SAMPLE_POLYGAMY_MEMBERS` vào `src/lib/tree-layout/sample-data.ts` và nút chọn nhanh `Cụ Chiến (Đa thê & Con riêng)` trên Toolbar.
- **Phát hiện Visual UAT từ User (Human UAT) kèm ảnh chụp màn hình:**
  1. *Điểm xuất phát nhánh con Vợ Hai:* Đang rơi vào khe giữa Vợ Cả và Vợ Hai, gây cảm giác thị giác kỳ quặc (nhìn như con của 2 bà vợ).
  2. *Xung đột thanh Bus (Bus Collision - Hình 2):* Đường bus ngang của cụm con riêng (Khuyết) và cụm con Vợ Cả (Minh, Lan) cùng cao độ $Y = 143\text{px}$, trong khi anh Minh nằm lệch trái dưới chân Cụ Chiến, khiến đường ngang cắt xuyên qua đường dọc của cụ Chiến gây lồng chéo nhau.
  3. *Băn khoăn về "Con Chung":* Nếu chỉ hạ nhánh từ chân người mẹ thì không thể hiện được huyết thống người cha (nhìn như mẹ đơn thân hoặc con riêng của mẹ), làm gãy liên kết phụ hệ họ nội trên cây.
- **Hai phương án kiến trúc đang thảo luận chốt phương án:**
  - **Phương án A (Cụ Chiến ở giữa 2 bà - Đối xứng hoàn hảo):** `[Vợ Cả] ══ ⚪ ══ [Chồng] ══ ⚪ ══ [Vợ Hai]`. Nhánh con chung hạ từ 2 khuyên hôn nhân 2 bên; con riêng khuyết mẹ hạ từ chân Cụ Chiến. Triệt tiêu 100% lồng đường và không rơi vào khe 2 bà.
  - **Phương án B (Dàn sang phải + Tách cao độ Bus):** Giữ trật tự `[Chồng] ══ [Vợ Cả] ══ [Vợ Hai]`, nhưng tách cao độ bus ngang ($Y_1=130\text{px}$, $Y_2=150\text{px}$, $Y_3=170\text{px}$) và căn chỉnh tọa độ $X$ đàn con thẳng dưới khu vực của mẹ.

### 2. Task Checklist
- [x] Nâng cấp toàn diện Luật kiểm thử lên Version 7 (`[R-VERIFY]`, `[VERIFY_COMMANDS]`, 38/38 tests pass).
- [x] Hoàn thành thi công Milestone 3.1 (Core Canvas, Bus Hierarchy, Focus Root, Ghost Node nội tộc đối xứng 2 chiều, Flat Seamless Footer).
- [x] Hoàn thành thi công Milestone 3.2 (Slide-over Drawer, Thân tộc 1 đời, Benchmark 1.500 nodes, phân cụm con đa thê & con riêng).
- [x] Tích hợp bộ dữ liệu mẫu UAT gia đình Cụ Chiến trực tiếp lên Toolbar.
- [x] Phát hiện lỗi thị giác UAT: Bus Collision (lồng đường) và nhánh con Vợ Hai rơi vào khe giữa 2 bà.
- [/] Brainstorm và chốt phương án xử lý cấu trúc cây đa thê con chung (Phương án A: Chồng ở giữa vs Phương án B: Tách cao độ Bus).
- [ ] Chạy `/feature-spec` cập nhật đặc tả vi mô cho mô hình phân nhánh con đa thê được chọn.
- [ ] Chạy `/feature-code` thi công sửa thuật toán dàn trang (`genealogy-layout.ts`) và `MemberNode.tsx`, chạy test kiểm chứng.

### 3. Immediate Next Step
- Chốt lựa chọn giữa **Phương án A** (Cụ Chiến ở giữa 2 bà) và **Phương án B** (Xếp sang phải + Tách cao độ Bus), sau đó cập nhật Spec và thi công tinh chỉnh layout.
