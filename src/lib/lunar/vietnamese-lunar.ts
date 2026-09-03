/**
 * Thuật toán Thiên văn Âm lịch Việt Nam (Múi giờ UTC+7 - Kinh tuyến 105°E)
 * Dựa trên thuật toán tính lịch âm của TS. Hồ Ngọc Đức (Viện Công nghệ Thông tin)
 */

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
];

const TIMEZONE = 7.0; // Giờ Hà Nội / Việt Nam UTC+7
const PI = Math.PI;

/**
 * Đổi ngày Dương lịch sang số ngày Julius (Julian Day Number)
 */
export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd =
    dd +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

/**
 * Đổi số ngày Julius sang ngày Dương lịch { day, month, year }
 */
export function jdToDate(jd: number): { day: number; month: number; year: number } {
  let a: number;
  let b: number;
  let c: number;
  let d: number;
  let e: number;
  let m: number;

  if (jd > 2299160) {
    // Gregorian calendar
    const alpha = Math.floor((jd - 1867216.25) / 36524.25);
    a = jd + 1 + alpha - Math.floor(alpha / 4);
  } else {
    a = jd;
  }

  b = a + 1524;
  c = Math.floor((b - 122.1) / 365.25);
  d = Math.floor(365.25 * c);
  e = Math.floor((b - d) / 30.6001);

  const day = Math.floor(b - d - Math.floor(30.6001 * e));
  m = e < 14 ? e - 1 : e - 13;
  const year = m > 2 ? c - 4716 : c - 4715;

  return { day, month: m, year };
}

/**
 * Tính thời điểm điểm Sóc (New Moon) thứ k (tính bằng ngày Julius)
 */
function getNewMoonDay(k: number, timeZone = TIMEZONE): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;

  let Jd1 =
    2415020.75933 +
    29.53058868 * k +
    0.0001178 * T2 -
    0.000000155 * T3 +
    0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) +
    0.0021 * Math.sin(2 * dr * M) -
    0.4068 * Math.sin(Mpr * dr) +
    0.0161 * Math.sin(2 * dr * Mpr) -
    0.0004 * Math.sin(3 * dr * Mpr) +
    0.0104 * Math.sin(2 * dr * F) -
    0.0051 * Math.sin((M + Mpr) * dr) -
    0.0074 * Math.sin((M - Mpr) * dr) +
    0.0004 * Math.sin((2 * F + M) * dr) -
    0.0004 * Math.sin((2 * F - M) * dr) -
    0.0006 * Math.sin((2 * F + Mpr) * dr) +
    0.001 * Math.sin((2 * F - Mpr) * dr) +
    0.0005 * Math.sin((2 * Mpr + M) * dr);

  const deltat =
    T < -0.2
      ? -0.00002 + 0.000297 * T + 0.000264 * T2 - 0.000014 * T3
      : -0.000041 + 0.00018 * T + 0.000173 * T2;

  const JdNew = Jd1 + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

/**
 * Tính kinh độ mặt trời (Sun Longitude) tại thời điểm điểm Sóc
 */
function getSunLongitude(dayNumber: number, timeZone = TIMEZONE): number {
  const T = (dayNumber - 2451545.0 + 0.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL =
    (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M) +
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - PI * 2 * Math.floor(L / (PI * 2));
  return Math.floor((L / PI) * 6);
}

/**
 * Tìm tháng 11 Âm lịch của năm yy
 */
function getLunarMonth11(yy: number, timeZone = TIMEZONE): number {
  let off = jdFromDate(31, 12, yy) - 2415021;
  let k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

/**
 * Tìm vị trí tháng nhuận giữa 2 tháng 11 âm lịch
 */
function getLeapMonthOffset(a11: number, timeZone = TIMEZONE): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

/**
 * Quy đổi ngày Dương lịch sang Âm lịch Việt Nam UTC+7
 */
export function solarToLunar(
  day: number,
  month: number,
  year: number,
  timeZone = TIMEZONE
): { lunarDay: number; lunarMonth: number; lunarYear: number; isLeap: boolean } {
  const dayNumber = jdFromDate(day, month, year);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k, timeZone);
  }

  let a11 = getLunarMonth11(year, timeZone);
  let b11 = a11;
  let lunarYear = year;

  if (a11 >= monthStart) {
    lunarYear = year;
    a11 = getLunarMonth11(year - 1, timeZone);
  } else {
    lunarYear = year + 1;
    b11 = getLunarMonth11(year + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let isLeap = false;
  let lunarMonth = diff + 11;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) {
        isLeap = true;
      }
    }
  }

  if (lunarMonth > 12) {
    lunarMonth = lunarMonth - 12;
  }
  if (lunarMonth >= 11 && diff < 4) {
    lunarYear -= 1;
  }

  return { lunarDay, lunarMonth, lunarYear, isLeap };
}

/**
 * Quy đổi ngày Âm lịch sang ngày Dương lịch UTC+7
 */
export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  isLeap: boolean,
  timeZone = TIMEZONE
): { day: number; month: number; year: number } {
  let a11: number;
  let b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, timeZone);
    b11 = getLunarMonth11(lunarYear, timeZone);
  } else {
    a11 = getLunarMonth11(lunarYear, timeZone);
    b11 = getLunarMonth11(lunarYear + 1, timeZone);
  }

  let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) {
    off += 12;
  }

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) {
      leapMonth += 12;
    }
    if (isLeap && lunarMonth !== leapMonth) {
      // Nếu tháng không phải tháng nhuận mà truyền isLeap=true -> fallback về tháng thường
      isLeap = false;
    }
    if (isLeap || off >= leapOff) {
      off += 1;
    }
  }

  const monthStart = getNewMoonDay(k + off, timeZone);
  return jdToDate(monthStart + lunarDay - 1);
}

/**
 * Lấy tên năm Can Chi từ năm Dương/Âm lịch
 * Ví dụ: 1990 -> Canh Ngọ; 2024 -> Giáp Thìn; 2026 -> Bính Ngọ
 */
export function getYearCanChi(year: number): string {
  const canIndex = (year - 4) % 10;
  const chiIndex = (year - 4) % 12;

  const normalizedCan = canIndex < 0 ? canIndex + 10 : canIndex;
  const normalizedChi = chiIndex < 0 ? chiIndex + 12 : chiIndex;

  return `${CAN[normalizedCan]} ${CHI[normalizedChi]}`;
}

/**
 * Tính ngày giỗ kế tiếp (theo Dương lịch) trong năm mục tiêu
 * Nếu ngày giỗ ở tháng nhuận mà năm đó không có tháng nhuận, tự động fallback về tháng chính
 */
export function calculateNextAnniversary(
  lunarDay: number,
  lunarMonth: number,
  isLeap: boolean,
  targetSolarYear: number
): { day: number; month: number; year: number } {
  try {
    return lunarToSolar(lunarDay, lunarMonth, targetSolarYear, isLeap);
  } catch {
    // Fallback không nhuận
    return lunarToSolar(lunarDay, lunarMonth, targetSolarYear, false);
  }
}
