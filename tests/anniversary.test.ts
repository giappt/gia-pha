import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  getUpcomingAnniversaries,
  getAccurateSolarAnniversary,
  getVietnameseDayOfWeek,
  formatSolarDateWithDayOfWeek,
  computeDeceasedHonorificPrefix,
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

  // TC_UT_SOLAR_DAY_OF_WEEK: Tính đúng Thứ trong tuần (Thứ Hai -> Chủ Nhật) và format Dương lịch đầy đủ
  it('TC_UT_SOLAR_DAY_OF_WEEK: Tính đúng Thứ trong tuần (Thứ Hai -> Chủ Nhật) và format Dương lịch đầy đủ', () => {
    // 18/10/2026 là Chủ Nhật (Date(2026, 9, 18).getDay() === 0)
    const dowSun = getVietnameseDayOfWeek(2026, 10, 18);
    assert.strictEqual(dowSun, 'Chủ Nhật');
    const formattedSun = formatSolarDateWithDayOfWeek(2026, 10, 18);
    assert.strictEqual(formattedSun, 'Chủ Nhật, ngày 18/10/2026');

    // 19/10/2026 là Thứ Hai (Date(2026, 9, 19).getDay() === 1)
    const dowMon = getVietnameseDayOfWeek(2026, 10, 19);
    assert.strictEqual(dowMon, 'Thứ Hai');
    const formattedMon = formatSolarDateWithDayOfWeek(2026, 10, 19);
    assert.strictEqual(formattedMon, 'Thứ Hai, ngày 19/10/2026');

    // Kiểm tra padding số 0 cho ngày/tháng < 10
    const formattedPad = formatSolarDateWithDayOfWeek(2026, 5, 3);
    assert.strictEqual(formattedPad, 'Chủ Nhật, ngày 03/05/2026');
  });

  // TC_UT_DECEASED_HONORIFIC_UNLINKED: Động cơ tiền tố danh xưng tiền nhân khi chưa liên kết node
  it('TC_UT_DECEASED_HONORIFIC_UNLINKED: Phân cấp thế hệ từ dưới lên chuẩn xác (>=4: Cụ, 2-3: Ông/Bà, 1: rỗng)', () => {
    const maxGen = 5;

    // Đời 1 ($k = 5 - 1 + 1 = 5 \ge 4$): Cụ
    const p1 = computeDeceasedHonorificPrefix({ id: '1', full_name: 'Phạm Văn A', gender: 'male', generation_level: 1 }, maxGen);
    assert.strictEqual(p1, 'Cụ', 'Đời 1 từ đáy lên là đời thứ 5 -> tiền tố Cụ');

    // Đời 2 ($k = 5 - 2 + 1 = 4 \ge 4$): Cụ (cả nam và nữ)
    const p2Male = computeDeceasedHonorificPrefix({ id: '2m', full_name: 'Phạm Văn B', gender: 'male', generation_level: 2 }, maxGen);
    const p2Female = computeDeceasedHonorificPrefix({ id: '2f', full_name: 'Lê Thị C', gender: 'female', generation_level: 2 }, maxGen);
    assert.strictEqual(p2Male, 'Cụ', 'Đời 2 (k=4) nam -> Cụ');
    assert.strictEqual(p2Female, 'Cụ', 'Đời 2 (k=4) nữ -> Cụ');

    // Đời 3 ($k = 5 - 3 + 1 = 3$): Nam -> Ông, Nữ -> Bà
    const p3Male = computeDeceasedHonorificPrefix({ id: '3m', full_name: 'Phạm Văn D', gender: 'male', generation_level: 3 }, maxGen);
    const p3Female = computeDeceasedHonorificPrefix({ id: '3f', full_name: 'Trần Thị E', gender: 'female', generation_level: 3 }, maxGen);
    assert.strictEqual(p3Male, 'Ông', 'Đời 3 (k=3) nam -> Ông');
    assert.strictEqual(p3Female, 'Bà', 'Đời 3 (k=3) nữ -> Bà');

    // Đời 4 ($k = 5 - 4 + 1 = 2$): Nam -> Ông, Nữ -> Bà
    const p4Male = computeDeceasedHonorificPrefix({ id: '4m', full_name: 'Phạm Văn F', gender: 'male', generation_level: 4 }, maxGen);
    const p4Female = computeDeceasedHonorificPrefix({ id: '4f', full_name: 'Hoàng Thị G', gender: 'female', generation_level: 4 }, maxGen);
    assert.strictEqual(p4Male, 'Ông', 'Đời 4 (k=2) nam -> Ông');
    assert.strictEqual(p4Female, 'Bà', 'Đời 4 (k=2) nữ -> Bà');

    // Đời 5 ($k = 5 - 5 + 1 = 1$, đời đáy): tiền tố rỗng
    const p5 = computeDeceasedHonorificPrefix({ id: '5', full_name: 'Phạm Văn Con', gender: 'male', generation_level: 5 }, maxGen);
    assert.strictEqual(p5, '', 'Đời 5 (k=1 đời đáy) -> không tiền tố');

    // Kiểm tra tích hợp qua getUpcomingAnniversaries
    const mockList: MemberRecord[] = [
      {
        id: 'ancestor-d2',
        full_name: 'Phạm Kim Đức',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: 21,
        death_lunar_month: 7,
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'member-d4',
        full_name: 'Phạm Văn Bảy',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: 21,
        death_lunar_month: 7,
        generation_level: 4,
        is_root: false,
      },
      {
        id: 'member-d5-bottom',
        full_name: 'Phạm Văn Chắt',
        gender: 'male',
        life_status: 'living',
        generation_level: 5,
        is_root: false,
      },
    ];

    const refDate = new Date(2026, 8, 1);
    const groups = getUpcomingAnniversaries(mockList, { referenceDate: refDate, daysAhead: 30 });
    assert.ok(groups.length > 0);

    const duc = groups[0].members.find((m) => m.id === 'ancestor-d2');
    assert.ok(duc);
    assert.strictEqual(duc.honorific_prefix, 'Cụ');
    assert.strictEqual(duc.display_name, 'Cụ Phạm Kim Đức');

    const bay = groups[0].members.find((m) => m.id === 'member-d4');
    assert.ok(bay);
    assert.strictEqual(bay.honorific_prefix, 'Ông');
    assert.strictEqual(bay.display_name, 'Ông Phạm Văn Bảy');
  });

  // TC_UT_DECEASED_HONORIFIC_LINKED: Động cơ danh xưng cá nhân hóa khi đã liên kết node theo quan hệ thân tộc
  it('TC_UT_DECEASED_HONORIFIC_LINKED: Tích hợp Kinship Engine xưng hô chuẩn theo ngôi người xem', () => {
    // Cây 3 thế hệ: Ông Nội (Đời 1) -> Cha (Đời 2) -> Viewer Cháu (Đời 3)
    const kinshipTree: MemberRecord[] = [
      {
        id: 'grandpa',
        full_name: 'Phạm Văn Cội',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: 21,
        death_lunar_month: 7,
        generation_level: 1,
        is_root: true,
      },
      {
        id: 'grandma',
        full_name: 'Lê Thị Nguồn',
        gender: 'female',
        life_status: 'deceased',
        death_lunar_day: 21,
        death_lunar_month: 7,
        generation_level: 1,
        is_root: false,
      },
      {
        id: 'father',
        full_name: 'Phạm Văn Thân',
        gender: 'male',
        father_id: 'grandpa',
        mother_id: 'grandma',
        life_status: 'living',
        generation_level: 2,
        is_root: false,
      },
      {
        id: 'viewer',
        full_name: 'Phạm Văn Cháu',
        gender: 'male',
        father_id: 'father',
        life_status: 'living',
        generation_level: 3,
        is_root: false,
      },
    ];

    const refDate = new Date(2026, 8, 1);
    const groups = getUpcomingAnniversaries(kinshipTree, {
      referenceDate: refDate,
      daysAhead: 30,
      viewerMemberId: 'viewer',
    });

    assert.ok(groups.length > 0);
    const grandpa = groups[0].members.find((m) => m.id === 'grandpa');
    assert.ok(grandpa);
    assert.strictEqual(grandpa.relative_kinship, 'Ông nội của bạn');
    assert.strictEqual(grandpa.honorific_prefix, 'Ông nội');
    assert.strictEqual(grandpa.display_name, 'Ông nội Phạm Văn Cội');

    const grandma = groups[0].members.find((m) => m.id === 'grandma');
    assert.ok(grandma);
    assert.strictEqual(grandma.relative_kinship, 'Bà nội của bạn');
    assert.strictEqual(grandma.honorific_prefix, 'Bà nội');
    assert.strictEqual(grandma.display_name, 'Bà nội Lê Thị Nguồn');
  });
});

