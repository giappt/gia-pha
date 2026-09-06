/**
 * Hằng số xưng hô và danh xưng quan hệ gia phả chuẩn thuần Việt
 * Single Source of Truth cho toàn bộ ứng dụng
 */
export const KINSHIP_TERMS = {
  // Quan hệ trực hệ 1 đời
  PARENTS: 'Bố mẹ',
  FATHER: 'Bố',
  MOTHER: 'Mẹ',
  FATHER_FULL: 'Bố ruột',
  MOTHER_FULL: 'Mẹ ruột',
  SPOUSE: 'Hôn phối',
  SIBLINGS: 'Anh em',
  SIBLINGS_FULL: 'Anh em ruột',
  CHILDREN: 'Con cái',

  // Thứ bậc trong gia đình
  SENIOR_CHILD: 'Con trưởng',
  ADOPTED_CHILD: 'Con nuôi',

  // Danh vị thứ bậc hôn phối (Đa thê)
  WIFE_FIRST: 'Vợ cả',
  WIFE_SECOND: 'Vợ hai',
  WIFE_THIRD: 'Vợ ba',
  WIFE_DEFAULT: 'Vợ',
  HUSBAND_FIRST: 'Chồng cả',
  HUSBAND_SECOND: 'Chồng thứ',
  HUSBAND_DEFAULT: 'Chồng',

  // Phân loại xuất thân phối ngẫu
  CLAN_INTERNAL_BRIDE: 'Dâu nội tộc',
  CLAN_INTERNAL_GROOM: 'Rể nội tộc',
  CLAN_EXTERNAL_BRIDE: 'Dâu ngoài họ (Ngoại tộc)',
  CLAN_EXTERNAL_GROOM: 'Rể ngoài họ (Ngoại tộc)',

  // Trạng thái trống (Empty States)
  EMPTY_PARENTS: 'Chưa rõ thông tin bố mẹ',
  EMPTY_SPOUSE: 'Chưa ghi nhận hôn phối',
  EMPTY_SIBLINGS: 'Chưa ghi nhận anh em ruột',
  EMPTY_CHILDREN: 'Chưa có thông tin con cái',
} as const;
