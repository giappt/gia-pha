import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getUpcomingAnniversaries,
  getAccurateSolarAnniversary,
} from '../src/lib/anniversaries/anniversary-engine';
import { calculateNextAnniversary } from '../src/lib/lunar/vietnamese-lunar';
import { MemberRecord } from '../src/types/tree';

describe('Anniversary Calculation & Kinship Integration Test Suite (Milestone 5)', () => {
  // TC_UT_ANNIV_WINDOW_30_DAYS: Quét & gom nhóm ngày giỗ cửa sổ 30 ngày
  it('TC_UT_ANNIV_WINDOW_30_DAYS: Quét & gom nhóm ngày giỗ cửa sổ 30 ngày', () => {
    // Reference date: Giả định ngày 01/09/2026
    const refDate = new Date(2026, 8, 1); // 01/09/2026

    // Tính ngày âm lịch của 01/09/2026 -> ngày 21/07 âm lịch năm Bính Ngọ
    // Tạo 3 thành viên:
    // M1: Giỗ ngày 21/07 âm lịch (rơi vào đúng hôm nay 01/09/2026, daysLeft = 0)
    // M2: Giỗ ngày 25/07 âm lịch (rơi vào khoảng 05/09/2026, daysLeft = 4)
    // M3: Giỗ ngày 15/09 âm lịch (rơi vào khoảng 25/10/2026, daysLeft > 30 ngày)
    const mockMembers: MemberRecord[] = [
      {
        id: 'm1',
        full_name: 'Cụ Mộc Một',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: 21,
        death_lunar_month: 7,
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'm2',
        full_name: 'Cụ Mộc Hai',
        gender: 'female',
        life_status: 'deceased',
        death_lunar_day: 25,
        death_lunar_month: 7,
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'm3',
        full_name: 'Cụ Mộc Ba (Xa Hơn 30 Ngày)',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: 15,
        death_lunar_month: 9,
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'm4-living',
        full_name: 'Người Còn Sống',
        gender: 'male',
        life_status: 'living', // Còn sống -> loại trừ
        generation_level: 3,
        is_root: false,
      },
    ];

    const groups = getUpcomingAnniversaries(mockMembers, {
      daysAhead: 30,
      referenceDate: refDate,
    });

    assert.ok(groups.length > 0, 'Phải có ít nhất 1 nhóm ngày giỗ');
    // M3 không được xuất hiện vì vượt quá 30 ngày
    const allIncludedMemberIds = groups.flatMap((g) => g.members.map((m) => m.id));
    assert.ok(allIncludedMemberIds.includes('m1'), 'Phải chứa m1 (giỗ hôm nay)');
    assert.ok(allIncludedMemberIds.includes('m2'), 'Phải chứa m2 (giỗ 4 ngày tới)');
    assert.ok(!allIncludedMemberIds.includes('m3'), 'Không được chứa m3 vì ngoài 30 ngày');
    assert.ok(!allIncludedMemberIds.includes('m4-living'), 'Không được chứa người còn sống');

    // Kiểm tra thứ tự sắp xếp tăng dần theo days_left
    for (let i = 0; i < groups.length - 1; i++) {
      assert.ok(
        groups[i].days_left <= groups[i + 1].days_left,
        'Các nhóm ngày giỗ phải sắp xếp tăng dần theo days_left'
      );
    }
  });

  // TC_UT_ANNIV_LEAP_FALLBACK: Xử lý ngày giỗ tháng nhuận khi năm không có nhuận
  it('TC_UT_ANNIV_LEAP_FALLBACK: Xử lý ngày giỗ tháng nhuận khi năm không có nhuận', () => {
    // Năm 2026 (Bính Ngọ) không có tháng 4 nhuận
    // Cụ mất vào ngày 15/04 nhuận
    const result = getAccurateSolarAnniversary(15, 4, true, new Date(2026, 0, 1));

    assert.ok(result.solarDay >= 1 && result.solarDay <= 31, 'Ngày dương hợp lệ');
    assert.ok(result.solarMonth >= 1 && result.solarMonth <= 12, 'Tháng dương hợp lệ');
    assert.strictEqual(result.solarYear, 2026, 'Phải tính cho năm 2026');
    assert.ok(result.daysLeft >= 0, 'Số ngày còn lại phải >= 0');
  });

  // TC_UT_ANNIV_SHORT_MONTH: Xử lý ngày giỗ 30 Âm lịch rơi vào tháng thiếu 29 ngày
  it('TC_UT_ANNIV_SHORT_MONTH: Xử lý ngày giỗ 30 Âm lịch rơi vào tháng thiếu 29 ngày', () => {
    // Thử tính ngày giỗ cho ngày 30 âm lịch
    const result = getAccurateSolarAnniversary(30, 8, false, new Date(2026, 0, 1));

    assert.ok(result.solarDateStr, 'Phải sinh ra chuỗi ngày dương');
    assert.ok(result.solarDay >= 1 && result.solarDay <= 31);
    assert.strictEqual(result.solarYear, 2026);
  });

  // TC_UT_ANNIV_RELATIVE_KINSHIP: Gán danh xưng tương đối với người xem
  it('TC_UT_ANNIV_RELATIVE_KINSHIP: Gán danh xưng tương đối với người xem', () => {
    // Giả định gia phả có 3 thế hệ:
    // Ông nội (m-ong, đời 1, đã mất) -> Bố (m-bo, đời 2) -> Cháu (m-chau, đời 3)
    const clanMembers: MemberRecord[] = [
      {
        id: 'm-ong',
        full_name: 'Nguyễn Văn Ông',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: 15,
        death_lunar_month: 8,
        generation_level: 1,
        is_root: true,
      },
      {
        id: 'm-bo',
        full_name: 'Nguyễn Văn Bố',
        gender: 'male',
        father_id: 'm-ong',
        life_status: 'living',
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'm-chau',
        full_name: 'Nguyễn Văn Cháu',
        gender: 'male',
        father_id: 'm-bo',
        life_status: 'living',
        generation_level: 3,
        is_root: false,
      },
    ];

    // Xem lịch giỗ từ góc nhìn của m-chau
    const refDate = new Date(2026, 7, 1); // 01/08/2026
    const groups = getUpcomingAnniversaries(clanMembers, {
      daysAhead: 90,
      referenceDate: refDate,
      viewerMemberId: 'm-chau',
    });

    const ongItem = groups.flatMap((g) => g.members).find((m) => m.id === 'm-ong');
    assert.ok(ongItem, 'Phải tìm thấy thẻ ngày giỗ của Cụ Ông');
    assert.ok(
      ongItem.relative_kinship && ongItem.relative_kinship.includes('Ông nội'),
      `Huy hiệu phải chứa danh xưng "Ông nội" (thực tế: ${ongItem?.relative_kinship})`
    );
  });

  // TC_UT_ANNIV_DEDUP_INFO: Dòng thành viên không lặp lại chuỗi ngày âm, tính đúng tuổi thọ
  it('TC_UT_ANNIV_DEDUP_INFO: Dòng thành viên có đầy đủ năm sinh - năm mất và tính đúng tuổi hưởng thọ', () => {
    const testMembers: MemberRecord[] = [
      {
        id: 'm-truong',
        full_name: 'Nguyễn Văn Trưởng',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: 26,
        death_lunar_month: 7,
        generation_level: 2,
        is_root: false,
        birth_year: 1935,
        death_year: 2005,
      },
    ];

    const refDate = new Date(2026, 8, 7); // 07/09/2026
    const groups = getUpcomingAnniversaries(testMembers, {
      daysAhead: 30,
      referenceDate: refDate,
    });

    assert.strictEqual(groups.length, 1);
    const item = groups[0].members[0];
    assert.strictEqual(item.birth_year, 1935);
    assert.strictEqual(item.death_year, 2005);

    // Tuổi hưởng thọ theo phong tục tính tuổi truyền thống (kèm tuổi mụ / năm mất - năm sinh + 1)
    const lifespan = item.death_year && item.birth_year ? item.death_year - item.birth_year + 1 : null;
    assert.strictEqual(lifespan, 71, 'Tuổi hưởng thọ 2005 - 1935 + 1 phải là 71 tuổi');
  });
});

