import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateMemberAge } from '../src/lib/tree-layout/age-utils';

describe('Age Calculation Suite (Tuổi Dương & Tuổi Mụ)', () => {
  // TC_UT_AGE_CALC_01: Tính đúng tuổi dương (28) và tuổi mụ (29) cho người sinh năm 1998 vào năm 2026
  it('TC_UT_AGE_CALC_01: Tính đúng tuổi dương và tuổi mụ cho người còn sống kèm tooltip công thức', () => {
    const res = calculateMemberAge(1998, null, 'living', 2026);
    assert.ok(res !== null, 'Phải trả về kết quả tính tuổi');
    assert.strictEqual(res.solarAge, 28, 'Tuổi dương phải là 28 (2026 - 1998)');
    assert.strictEqual(res.lunarAge, 29, 'Tuổi mụ phải là 29 (28 + 1)');
    assert.strictEqual(res.isDeceased, false);
    assert.strictEqual(res.displayLabel, 'SN 1998 (28 tuổi · 29 mụ)');
    assert.ok(res.tooltipText.includes('2026 - 1998'), 'Tooltip phải giải thích công thức năm hiện tại trừ năm sinh');
    assert.ok(res.tooltipText.includes('tuổi dương + 1'), 'Tooltip phải giải thích công thức tuổi mụ');
  });

  // TC_UT_AGE_CALC_02: Người đã mất có năm mất (1920 - 1995)
  it('TC_UT_AGE_CALC_02: Tính đúng tuổi thọ dương và tuổi thọ mụ cho người đã mất', () => {
    const res = calculateMemberAge(1920, 1995, 'deceased', 2026);
    assert.ok(res !== null, 'Phải trả về kết quả tính tuổi thọ');
    assert.strictEqual(res.solarAge, 75, 'Hưởng thọ tuổi dương phải là 75 (1995 - 1920)');
    assert.strictEqual(res.lunarAge, 76, 'Tuổi mụ khi tạ thế phải là 76 (75 + 1)');
    assert.strictEqual(res.isDeceased, true);
    assert.strictEqual(res.displayLabel, '(1920 - 1995 · Thọ 75t, mụ 76)');
    assert.ok(res.tooltipText.includes('1995 - 1920'), 'Tooltip phải ghi rõ năm mất trừ năm sinh');
  });

  // TC_UT_AGE_CALC_03: Người đã mất chưa rõ năm mất
  it('TC_UT_AGE_CALC_03: Xử lý an toàn khi người đã mất chưa rõ năm mất', () => {
    const res = calculateMemberAge(1920, null, 'deceased', 2026);
    assert.ok(res !== null);
    assert.strictEqual(res.solarAge, null);
    assert.strictEqual(res.lunarAge, null);
    assert.strictEqual(res.displayLabel, 'SN 1920 (†)');
  });

  // TC_UT_AGE_CALC_04: Người không có năm sinh
  it('TC_UT_AGE_CALC_04: Trả về null an toàn khi không có năm sinh', () => {
    const res1 = calculateMemberAge(null, null, 'living', 2026);
    assert.strictEqual(res1, null);
    const res2 = calculateMemberAge(undefined, null, 'living', 2026);
    assert.strictEqual(res2, null);
  });
});
