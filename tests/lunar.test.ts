import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  solarToLunar,
  lunarToSolar,
  getYearCanChi,
  calculateNextAnniversary,
} from '../src/lib/lunar/vietnamese-lunar';

describe('Vietnamese Lunar Calendar Astronomical Test Suite', () => {
  // TC04: Quy đổi Âm - Dương & Can Chi
  it('TC04: Quy đổi 19/02/2026 sang Âm lịch và Năm Can Chi', () => {
    const lunar = solarToLunar(19, 2, 2026);

    assert.strictEqual(lunar.lunarDay, 3, 'Ngày âm lịch phải là ngày 3 (Mùng 3 Tết)');
    assert.strictEqual(lunar.lunarMonth, 1, 'Tháng âm lịch phải là Tháng Giêng (tháng 1)');
    assert.strictEqual(lunar.lunarYear, 2026, 'Năm âm lịch phải là 2026');
    assert.strictEqual(lunar.isLeap, false, 'Không phải tháng nhuận');

    const canChi = getYearCanChi(2026);
    assert.strictEqual(canChi, 'Bính Ngọ', 'Năm 2026 phải là Bính Ngọ');
  });

  it('Kiểm tra Năm Can Chi các năm chuẩn', () => {
    assert.strictEqual(getYearCanChi(2024), 'Giáp Thìn');
    assert.strictEqual(getYearCanChi(1990), 'Canh Ngọ');
    assert.strictEqual(getYearCanChi(1975), 'Ất Mão');
    assert.strictEqual(getYearCanChi(1945), 'Ất Dậu');
  });

  it('Quy đổi 2 chiều: Âm sang Dương và Dương sang Âm đồng nhất', () => {
    // Tết Nguyên Đán Bính Ngọ 2026: Mùng 1 Tết là ngày 17/02/2026 Dương Lịch
    const solar = lunarToSolar(1, 1, 2026, false);
    assert.strictEqual(solar.day, 17);
    assert.strictEqual(solar.month, 2);
    assert.strictEqual(solar.year, 2026);

    // Quy đổi ngược lại 17/02/2026
    const lunar = solarToLunar(17, 2, 2026);
    assert.strictEqual(lunar.lunarDay, 1);
    assert.strictEqual(lunar.lunarMonth, 1);
    assert.strictEqual(lunar.lunarYear, 2026);
  });

  it('Tính ngày giỗ kế tiếp theo dương lịch', () => {
    // Giỗ cụ An vào ngày 11 tháng 9 âm lịch
    const anniversary2026 = calculateNextAnniversary(11, 9, false, 2026);
    assert.ok(anniversary2026.year === 2026, 'Phải rơi vào năm 2026');
    assert.ok(anniversary2026.month >= 1 && anniversary2026.month <= 12, 'Tháng hợp lệ');
    assert.ok(anniversary2026.day >= 1 && anniversary2026.day <= 31, 'Ngày hợp lệ');
  });
});
