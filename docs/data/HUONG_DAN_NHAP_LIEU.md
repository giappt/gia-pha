# HƯỚNG DẪN NHẬP LIỆU GIA PHẢ HỌ PHẠM VĂN (FILE EXCEL 19 CỘT)

Tài liệu này hướng dẫn chi tiết cách sử dụng file [`gia_pha_ho_pham_van.xlsx`](file:///home/kakashi/sources/pj/gia-pha/docs/data/gia_pha_ho_pham_van.xlsx) để hoàn thiện dữ liệu và nạp vào phần mềm quản lý gia phả FAT.

---

## 1. TỔNG QUAN FILE DỮ LIỆU
- **Tên file:** `docs/data/gia_pha_ho_pham_van.xlsx`
- **Số lượng nhân khẩu:** 1.299 người (Đời 1 $\rightarrow$ Đời 14).
- **Trạng thái tự động hóa sẵn có:**
  - ✅ **Đã đánh số thứ tự (STT):** Từ 1 đến 1.299.
  - ✅ **Đã ghép cặp Vợ/Chồng:** Cột `STT Vợ/Chồng` đã được tự động điền liên kết hai chiều.
  - ✅ **Đã bóc tách Ngày Giỗ Âm Lịch:** Cột `Ngày mất (Âm)` và `Tháng mất (Âm)` đã được trích xuất từ văn bản cổ.
  - ✅ **Đã liên kết Trục Khởi Nguyên 4 Đời Đầu:**
    - Cụ Thủy Tổ: **Phạm Văn Chiến** (`STT = 1`, `Cụ Tổ = 'Đ'`).
    - Cụ Đời 2: **Phạm Văn Đồng** (`STT = 4`, `STT Bố = 1`).
    - Cụ Đời 3: **Phạm Kim Chức** (`STT = 6`, `STT Bố = 4`).
    - Cụ Đời 4: **Phạm Khắc Tường** (`STT = 8`, `STT Bố = 6`).

---

## 2. NHIỆM VỤ DUY NHẤT CỦA NGƯỜI NHẬP LIỆU: ĐIỀN CỘT `STT BỐ`

Cột **`STT Bố` (Cột E)** và **`STT Mẹ` (Cột F)** từ Đời 5 trở đi hiện đang để trống.
Để tạo đường nối cây cho một người, bạn chỉ cần làm như sau:

### Quy tắc điền:
1. Tìm người con cần gán cha (ví dụ: ở Đời 5, Cụ `Phạm Kim Đức`).
2. Nhìn lên Đời 4 để tìm Cụ Bố (Cụ `Phạm Khắc Tường` có `STT = 8`).
3. Gõ số **`8`** vào ô `STT Bố` của Cụ Đức.
4. **Xong!** Bạn không bao giờ phải gõ những chuỗi mã phức tạp.

> [!TIP]
> **Mẹo nhận biết Node Lá (Người không có con cái):**
> Trong cột `Ghi chú / Tiểu sử`, nếu có các cụm từ:
> - *"Không con chết sớm"*, *"Chết không con"*, *"Không vợ con"*, *"Đi tu – chết sớm"*, *"Mất từ nhỏ"*
> $\rightarrow$ Các cụ này chắc chắn **không có con ở đời sau**, bạn có thể bỏ qua ngay, không bao giờ phải tìm con cháu cho họ.

---

## 3. LỘ TRÌNH ĐIỀN DỮ LIỆU ĐỀ XUẤT (CHIA NHỎ TỪNG ĐỢT)

Đừng cố gắng điền một lúc cả 1.299 người! Hãy chia làm 3 đợt:

### Đợt 1: Trục Xương Sống 7 Đời Đầu (~30 người)
- Điền `STT Bố` từ Đời 5 $\rightarrow$ Đời 7 (đến 7 Cụ Khởi tổ 7 Chi: Lúa, Bớp, Nguyệt, Chuyên, Quy, Diễn, Canh).
- Thời gian thực hiện: Khoảng **15 – 30 phút**.
- Sau khi điền xong Đợt 1 $\rightarrow$ Lưu file và upload lên phần mềm để ngắm toàn bộ Cây Tổ 7 đời đầu!

### Đợt 2: Nhánh Chi Của Gia Đình Bạn (Đời 7 $\rightarrow$ Đời 14)
- Mở bộ lọc (Filter) trong Excel, lọc nhánh Chi của gia đình bạn.
- Điền `STT Bố` dọc theo nhánh từ Cụ Tổ Chi xuống đến ông bà, bố mẹ và bạn/con cái bạn (khoảng 30 – 50 người).
- Upload file $\rightarrow$ Nhánh gia đình bạn đã liên thông 100% từ Cụ Thủy Tổ đến thế hệ trẻ nhất!

### Đợt 3: Bàn Giao Cho Các Chi Khác
- Gửi file này cho các Bác Trưởng Chi khác để họ điền phần chi của họ theo sổ sách gia đình.

---

## 4. CÁCH UPLOAD FILE LÊN HỆ THỐNG GIA PHẢ
1. Mở trình duyệt, truy cập: **`http://localhost:3000/admin/import`**.
2. Kéo thả file `docs/data/gia_pha_ho_pham_van.xlsx` vào khung tải lên (hoặc bấm chọn file).
3. Hệ thống sẽ quét toàn bộ 1.299 người trong **0.5 giây**, tự động kiểm tra chu trình đồ thị và báo cáo số dòng hợp lệ.
4. Bấm nút **`[🚀 Bắt đầu Nạp Dữ Liệu]`**.
5. Toàn bộ gia phả Họ Phạm Văn sẽ chính thức được lưu vĩnh viễn vào CSDL Supabase Cloud!

---

## 5. HƯỚNG DẪN CHẠY LẠI SCRIPT CHUYỂN ĐỔI (DÀNH CHO LẬP TRÌNH VIÊN)
Nếu trong tương lai bạn cập nhật lại file gốc `GIA PHẢ HỌ PHẠM VĂN.docx` và muốn sinh lại toàn bộ file Excel:

```bash
# Chạy lệnh duy nhất để bóc tách từ Word và tạo file Excel chuẩn:
npm run data:convert
```

Lệnh này sẽ tự động:
1. Đọc file `GIA PHẢ HỌ PHẠM VĂN.docx` qua script `scripts/extract_genealogy.py`.
2. Bóc tách thế hệ, họ tên, giới tính, ngày giỗ Âm lịch, liên kết cặp vợ chồng.
3. Gán truyền đơn trực hệ Đời 1 $\rightarrow$ Đời 4.
4. Xuất file chuẩn hóa 19 cột ra `docs/data/gia_pha_ho_pham_van.xlsx` qua `scripts/build-clan-excel.mjs`.
5. Tự động dọn dẹp sạch sẽ các file tạm trong `scratch/`.
