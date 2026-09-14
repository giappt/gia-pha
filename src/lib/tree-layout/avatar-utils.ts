/**
 * Trích xuất 2 chữ cái đại diện (Initials) cho Avatar thành viên dòng họ.
 *
 * Quy chuẩn:
 * - Nếu là người khuyết danh (isAnonymous: true): trả về "KD".
 * - Nếu có >= 2 từ (ví dụ "Nguyễn Văn Trưởng"): lấy chữ cái đầu của 2 từ cuối (Tên đệm + Tên chính) -> "VT".
 *   Lý do: Trong dòng họ, đại đa số cùng mang một Họ, lấy Đệm + Tên giúp phân biệt rõ ràng và trực quan nhất.
 * - Nếu chỉ có 1 từ (ví dụ "Trưởng"): lấy 2 ký tự đầu in hoa ("TR"). Nếu từ chỉ có 1 chữ cái -> in hoa chữ cái đó.
 * - Nếu rỗng / null / undefined / khoảng trắng: fallback "TV" (Thành Viên).
 */
export function getMemberInitials(fullName?: string | null, isAnonymous?: boolean): string {
  if (isAnonymous) return 'KD';
  if (!fullName || !fullName.trim()) return 'TV';

  // Lọc sạch nội dung trong ngoặc đơn (...) hoặc ngoặc vuông [...] (tên húy, biệt danh, ghi chú)
  const cleanName = fullName.replace(/[\(\[][^\)\]]*[\)\]]/g, '').trim();
  const effectiveName = cleanName || fullName.replace(/[\(\[\]\)]/g, '').trim();
  if (!effectiveName) return 'TV';

  const words = effectiveName.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const secondLast = words[words.length - 2];
    const last = words[words.length - 1];
    return (secondLast[0] + last[0]).toUpperCase();
  }

  const single = words[0];
  if (single.length >= 2) {
    return single.slice(0, 2).toUpperCase();
  }
  return single.toUpperCase();
}
