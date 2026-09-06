/**
 * Module tiện ích tính toán Tuổi Dương & Tuổi Mụ song song kèm Tooltip giải thích chi tiết
 */

export interface MemberAgeResult {
  solarAge: number | null;
  lunarAge: number | null;
  displayLabel: string;
  tooltipText: string;
  isDeceased: boolean;
}

/**
 * Tính toán tuổi dương lịch và tuổi mụ truyền thống của thành viên
 * @param birthYear Năm sinh (Dương lịch)
 * @param deathYear Năm mất (Dương lịch, nếu đã mất)
 * @param lifeStatus Tình trạng sống: 'living' hoặc 'deceased'
 * @param currentYear Năm hiện tại (mặc định lấy năm hệ thống hoặc fallback 2026)
 */
export function calculateMemberAge(
  birthYear?: number | null,
  deathYear?: number | null,
  lifeStatus: 'living' | 'deceased' = 'living',
  currentYear: number = new Date().getFullYear() || 2026
): MemberAgeResult | null {
  if (!birthYear || isNaN(birthYear)) return null;

  if (lifeStatus === 'deceased') {
    if (deathYear && !isNaN(deathYear)) {
      const solarAge = Math.max(0, deathYear - birthYear);
      const lunarAge = solarAge + 1;
      return {
        solarAge,
        lunarAge,
        displayLabel: `(${birthYear} - ${deathYear} · Thọ ${solarAge}t, mụ ${lunarAge})`,
        tooltipText: `• Hưởng thọ: ${solarAge} tuổi dương (${deathYear} - ${birthYear})\n• Tuổi Mụ: ${lunarAge} tuổi khi tạ thế (theo phong tục truyền thống = tuổi dương + 1)`,
        isDeceased: true,
      };
    }
    return {
      solarAge: null,
      lunarAge: null,
      displayLabel: `SN ${birthYear} (†)`,
      tooltipText: `Sinh năm ${birthYear} (Đã mất, chưa rõ năm mất)`,
      isDeceased: true,
    };
  }

  const solarAge = Math.max(0, currentYear - birthYear);
  const lunarAge = solarAge + 1;
  return {
    solarAge,
    lunarAge,
    displayLabel: `SN ${birthYear} (${solarAge} tuổi · ${lunarAge} mụ)`,
    tooltipText: `• Tuổi Dương: ${solarAge} tuổi (tính theo năm ${currentYear} - ${birthYear})\n• Tuổi Mụ: ${lunarAge} tuổi (theo phong tục truyền thống = tuổi dương + 1)`,
    isDeceased: false,
  };
}
