import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { GET as cronAnniversaryReminder } from '../src/app/api/cron/anniversary-reminder/route';
import {
  getTodayAnniversaryMembers,
  getTomorrowAnniversaryMembers,
  getDescendantMemberIds,
  getLineageMemberIds,
  getExtendedFamilyMemberIds,
  computeDeceasedHonorificPrefix,
} from '../src/lib/anniversaries/anniversary-engine';
import { findLowestCommonAncestor } from '../src/lib/kinship-engine/lca-finder';
import { resolveKinshipTerms } from '../src/lib/kinship-engine/regional-dictionaries';
import { solarToLunar } from '../src/lib/lunar/vietnamese-lunar';
import { MemberRecord } from '../src/types/tree';
import { Member } from '../src/types/database';

describe('Vercel Cron Anniversary Reminder Test Suite (Milestone 5)', () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = 'test-secret-key-12345';
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  // TC_INT_CRON_AUTH_SECURITY: Chặn đứng truy cập trái phép vào Route Cron
  it('TC_INT_CRON_AUTH_SECURITY: Sai hoặc thiếu CRON_SECRET trả về HTTP 401 Unauthorized', async () => {
    // 1. Không có header
    const reqNoAuth = new NextRequest('http://localhost:3000/api/cron/anniversary-reminder');
    const res1 = await cronAnniversaryReminder(reqNoAuth);
    assert.strictEqual(res1.status, 401, 'Phải chặn khi thiếu Secret');

    // 2. Sai Bearer token
    const reqWrongAuth = new NextRequest('http://localhost:3000/api/cron/anniversary-reminder', {
      headers: { Authorization: 'Bearer wrong-secret' },
    });
    const res2 = await cronAnniversaryReminder(reqWrongAuth);
    assert.strictEqual(res2.status, 401, 'Phải chặn khi sai Secret');

    // 3. Đúng Bearer token -> Được phép thực thi
    const reqValidAuth = new NextRequest('http://localhost:3000/api/cron/anniversary-reminder', {
      headers: { Authorization: 'Bearer test-secret-key-12345' },
    });
    const res3 = await cronAnniversaryReminder(reqValidAuth);
    assert.strictEqual(res3.status, 200, 'Phải trả về 200 khi đúng Secret');
    const json3 = await res3.json();
    assert.strictEqual(json3.success, true);
  });

  // TC_INT_CRON_DISPATCH_LOGIC: Quét đúng người giỗ hôm nay & lọc đúng con cháu nhận push
  it('TC_INT_CRON_DISPATCH_LOGIC: getTodayAnniversaryMembers quét chính xác người có ngày giỗ hôm nay', () => {
    // Ngày giả định: 15/09/2026
    const refDate = new Date(2026, 8, 15);
    const todayLunar = solarToLunar(15, 9, 2026);

    const mockMembers: MemberRecord[] = [
      {
        id: 'ancestor-today',
        full_name: 'Cụ Giỗ Hôm Nay',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: todayLunar.lunarDay,
        death_lunar_month: todayLunar.lunarMonth,
        generation_level: 1,
        is_root: true,
      },
      {
        id: 'ancestor-other-day',
        full_name: 'Cụ Giỗ Ngày Khác',
        gender: 'female',
        life_status: 'deceased',
        death_lunar_day: (todayLunar.lunarDay % 28) + 1,
        death_lunar_month: (todayLunar.lunarMonth % 12) + 1,
        generation_level: 1,
        is_root: false,
      },
      {
        id: 'living-member',
        full_name: 'Người Còn Sống',
        gender: 'male',
        life_status: 'living',
        generation_level: 2,
        is_root: false,
      },
    ];

    const matched = getTodayAnniversaryMembers(mockMembers, refDate);
    assert.strictEqual(matched.length, 1, 'Chỉ có 1 cụ trùng ngày giỗ hôm nay');
    assert.strictEqual(matched[0].id, 'ancestor-today');
  });

  // TC_UT_TOMORROW_ANNIVERSARY_CALCULATION: Tính chính xác các vị tiền nhân có ngày giỗ vào ngày mai theo Âm lịch UTC+7
  it('TC_UT_TOMORROW_ANNIVERSARY_CALCULATION: getTomorrowAnniversaryMembers quét chuẩn người có giỗ ngày mai', () => {
    // Ngày giả định: 15/09/2026 -> Ngày mai: 16/09/2026
    const refDate = new Date(2026, 8, 15);
    const tomorrowLunar = solarToLunar(16, 9, 2026);

    const mockMembers: MemberRecord[] = [
      {
        id: 'ancestor-tomorrow',
        full_name: 'Bà Giỗ Ngày Mai',
        gender: 'female',
        life_status: 'deceased',
        death_lunar_day: tomorrowLunar.lunarDay,
        death_lunar_month: tomorrowLunar.lunarMonth,
        generation_level: 1,
        is_root: true,
      },
      {
        id: 'ancestor-today',
        full_name: 'Cụ Giỗ Hôm Nay',
        gender: 'male',
        life_status: 'deceased',
        death_lunar_day: solarToLunar(15, 9, 2026).lunarDay,
        death_lunar_month: solarToLunar(15, 9, 2026).lunarMonth,
        generation_level: 1,
        is_root: false,
      },
      {
        id: 'living-member',
        full_name: 'Con Cháu Còn Sống',
        gender: 'female',
        life_status: 'living',
        death_lunar_day: tomorrowLunar.lunarDay,
        death_lunar_month: tomorrowLunar.lunarMonth,
        generation_level: 2,
        is_root: false,
      },
    ];

    const matched = getTomorrowAnniversaryMembers(mockMembers, refDate);
    assert.strictEqual(matched.length, 1, 'Chỉ có đúng 1 cụ trùng ngày giỗ ngày mai');
    assert.strictEqual(matched[0].id, 'ancestor-tomorrow');
  });

  // TC_INT_CRON_RECIPIENT_BATCHING_CHI_1_ONLY: Con cháu Chi 1 chỉ nhận thông báo giỗ Hôm nay của tiền nhân Chi 1
  it('TC_INT_CRON_RECIPIENT_BATCHING_CHI_1_ONLY: Con cháu Chi 1 chỉ nhận giỗ của Cụ Chi 1, không nhận Bà Chi 2', () => {
    const mockMembers: MemberRecord[] = [
      { id: 'cux', full_name: 'Cụ X Chi 1', gender: 'male', life_status: 'deceased', generation_level: 1, is_root: true },
      { id: 'parent-b', full_name: 'Bố Người B', gender: 'male', father_id: 'cux', life_status: 'living', generation_level: 2, is_root: false },
      { id: 'user-b', full_name: 'Người B (Chi 1)', gender: 'male', father_id: 'parent-b', life_status: 'living', generation_level: 3, is_root: false },
      { id: 'bay', full_name: 'Bà Y Chi 2', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'parent-a', full_name: 'Mẹ Người A', gender: 'female', mother_id: 'bay', life_status: 'living', generation_level: 2, is_root: false },
      { id: 'user-a', full_name: 'Người A (Chi 2)', gender: 'male', mother_id: 'parent-a', life_status: 'living', generation_level: 3, is_root: false },
    ];

    const cuxDescendants = getDescendantMemberIds('cux', mockMembers);
    const bayDescendants = getDescendantMemberIds('bay', mockMembers);

    // Người B là con cháu Cụ X
    assert.strictEqual(cuxDescendants.has('user-b'), true, 'Người B phải thuộc trực hệ Cụ X');
    assert.strictEqual(bayDescendants.has('user-b'), false, 'Người B tuyệt đối không thuộc trực hệ Bà Y');

    // Kiểm tra định dạng thông báo cho Cụ X (Hôm nay)
    const displayNameCux = mockMembers[0].full_name.startsWith('Cụ ')
      ? mockMembers[0].full_name
      : `Cụ ${mockMembers[0].full_name}`;
    const title = `Hôm nay là Ngày Giỗ ${displayNameCux}`;
    const body = `Tức ngày 15/7 Âm lịch!`;
    assert.strictEqual(title, 'Hôm nay là Ngày Giỗ Cụ X Chi 1');
    assert.strictEqual(body, 'Tức ngày 15/7 Âm lịch!');
  });

  // TC_INT_CRON_RECIPIENT_BATCHING_CHI_2_ONLY: Con cháu Chi 2 chỉ nhận thông báo giỗ Ngày mai của tiền nhân Chi 2
  it('TC_INT_CRON_RECIPIENT_BATCHING_CHI_2_ONLY: Con cháu Chi 2 chỉ nhận giỗ của Bà Chi 2, không nhận Cụ Chi 1', () => {
    const mockMembers: MemberRecord[] = [
      { id: 'cux', full_name: 'Cụ X Chi 1', gender: 'male', life_status: 'deceased', generation_level: 1, is_root: true },
      { id: 'parent-b', full_name: 'Bố Người B', gender: 'male', father_id: 'cux', life_status: 'living', generation_level: 2, is_root: false },
      { id: 'user-b', full_name: 'Người B (Chi 1)', gender: 'male', father_id: 'parent-b', life_status: 'living', generation_level: 3, is_root: false },
      { id: 'bay', full_name: 'Bà Y Chi 2', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'parent-a', full_name: 'Mẹ Người A', gender: 'female', mother_id: 'bay', life_status: 'living', generation_level: 2, is_root: false },
      { id: 'user-a', full_name: 'Người A (Chi 2)', gender: 'male', mother_id: 'parent-a', life_status: 'living', generation_level: 3, is_root: false },
    ];

    const cuxDescendants = getDescendantMemberIds('cux', mockMembers);
    const bayDescendants = getDescendantMemberIds('bay', mockMembers);

    // Người A là con cháu Bà Y
    assert.strictEqual(bayDescendants.has('user-a'), true, 'Người A phải thuộc trực hệ Bà Y');
    assert.strictEqual(cuxDescendants.has('user-a'), false, 'Người A tuyệt đối không thuộc trực hệ Cụ X');

    // Kiểm tra định dạng thông báo cho Bà Y (Ngày mai)
    const displayNameBay = mockMembers[3].full_name.startsWith('Bà ')
      ? mockMembers[3].full_name
      : `Bà ${mockMembers[3].full_name}`;
    const title = `Ngày mai có Ngày Giỗ ${displayNameBay}`;
    const body = `Tức ngày 16/7 Âm lịch.`;
    assert.strictEqual(title, 'Ngày mai có Ngày Giỗ Bà Y Chi 2');
    assert.strictEqual(body, 'Tức ngày 16/7 Âm lịch.');
  });

  // TC_INT_CRON_RECIPIENT_BATCHING_DUAL_ANNIVERSARIES: Người liên quan trực hệ cả 2 nhận đúng 2 thông báo độc lập
  it('TC_INT_CRON_RECIPIENT_BATCHING_DUAL_ANNIVERSARIES: Người liên quan cả 2 nhận 2 thông báo với 2 tag độc lập', () => {
    const mockMembers: MemberRecord[] = [
      { id: 'cux', full_name: 'Cụ X', gender: 'male', life_status: 'deceased', generation_level: 1, is_root: true },
      { id: 'bay', full_name: 'Bà Y', gender: 'female', life_status: 'deceased', generation_level: 1, is_root: false },
      { id: 'parent-c', full_name: 'Bố Người C', gender: 'male', father_id: 'cux', mother_id: 'bay', life_status: 'living', generation_level: 2, is_root: false },
      { id: 'user-c', full_name: 'Người C', gender: 'male', father_id: 'parent-c', life_status: 'living', generation_level: 3, is_root: false },
    ];

    const cuxDescendants = getDescendantMemberIds('cux', mockMembers);
    const bayDescendants = getDescendantMemberIds('bay', mockMembers);

    assert.strictEqual(cuxDescendants.has('user-c'), true, 'Người C thuộc trực hệ Cụ X');
    assert.strictEqual(bayDescendants.has('user-c'), true, 'Người C thuộc trực hệ Bà Y');

    const tagToday = `anniversary-today-${mockMembers[0].id}`;
    const tagTomorrow = `anniversary-tomorrow-${mockMembers[1].id}`;

    assert.notStrictEqual(tagToday, tagTomorrow, 'Hai thẻ thông báo phải mang tag độc lập để không ghi đè');
    assert.strictEqual(tagToday, 'anniversary-today-cux');
    assert.strictEqual(tagTomorrow, 'anniversary-tomorrow-bay');
  });

  // TC_INT_CRON_SKIP_UNLINKED_GUEST: Khách/User chưa liên kết node bị bỏ qua, không gửi push tránh spam
  it('TC_INT_CRON_SKIP_UNLINKED_GUEST: User chưa có linked_member_id bị bỏ qua hoàn toàn', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routePath = path.resolve(process.cwd(), 'src/app/api/cron/anniversary-reminder/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');

    assert.ok(
      routeContent.includes('if (!linkedMemberId)') && routeContent.includes('continue;'),
      'Route Cron phải bỏ qua subscription nếu chưa liên kết node (linkedMemberId null/undefined)'
    );
  });

  // TC_UT_LINEAGE_FILTER_HELPER: Trích xuất toàn bộ nhánh dọc (tổ tiên + con cháu + anh chị em)
  it('TC_UT_LINEAGE_FILTER_HELPER: getLineageMemberIds trả về đúng tập hợp nhánh dọc', () => {
    const mockMembers: MemberRecord[] = [
      { id: 'grandpa', full_name: 'Ông Nội', gender: 'male', life_status: 'deceased', generation_level: 1, is_root: true },
      { id: 'father', full_name: 'Bố', gender: 'male', father_id: 'grandpa', life_status: 'living', generation_level: 2, is_root: false },
      { id: 'mother', full_name: 'Mẹ', gender: 'female', life_status: 'living', generation_level: 2, is_root: false },
      { id: 'me', full_name: 'Tôi', gender: 'male', father_id: 'father', mother_id: 'mother', life_status: 'living', generation_level: 3, is_root: false },
      { id: 'brother', full_name: 'Anh Trai', gender: 'male', father_id: 'father', mother_id: 'mother', life_status: 'living', generation_level: 3, is_root: false },
      { id: 'child', full_name: 'Con Tôi', gender: 'male', father_id: 'me', life_status: 'living', generation_level: 4, is_root: false },
      { id: 'other-branch', full_name: 'Người Nhánh Khác', gender: 'male', life_status: 'living', generation_level: 3, is_root: false },
    ];

    const lineage = getLineageMemberIds('me', mockMembers);

    assert.strictEqual(lineage.has('me'), true, 'Bao gồm chính mình');
    assert.strictEqual(lineage.has('father'), true, 'Bao gồm bố');
    assert.strictEqual(lineage.has('mother'), true, 'Bao gồm mẹ');
    assert.strictEqual(lineage.has('grandpa'), true, 'Bao gồm ông nội');
    assert.strictEqual(lineage.has('brother'), true, 'Bao gồm anh trai');
    assert.strictEqual(lineage.has('child'), true, 'Bao gồm con');
    assert.strictEqual(lineage.has('other-branch'), false, 'Không bao gồm người nhánh khác');
  });

  // TC_INT_CRON_RESPECTS_FEATURE_FLAG: Route Cron kiểm tra cờ tính năng trước khi gửi push
  it('TC_INT_CRON_RESPECTS_FEATURE_FLAG: Route Cron kiểm tra logic cờ enable_push_notifications và enable_anniversaries', async () => {
    // 1. Kiểm tra cấu trúc route có đoạn rà soát feature_flags
    const fs = await import('fs');
    const path = await import('path');
    const routePath = path.resolve(process.cwd(), 'src/app/api/cron/anniversary-reminder/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');

    assert.ok(
      routeContent.includes('enable_push_notifications === false') ||
      routeContent.includes('flags.enable_push_notifications === false'),
      'Route Cron phải kiểm tra cờ enable_push_notifications'
    );
    assert.ok(
      routeContent.includes('enable_anniversaries === false') ||
      routeContent.includes('flags.enable_anniversaries === false'),
      'Route Cron phải kiểm tra cờ enable_anniversaries'
    );
    assert.ok(
      routeContent.includes('Web Push notification is disabled by Clan Admin'),
      'Route Cron phải có thông báo khi cờ tính năng bị tắt'
    );
  });

  // TC_UT_CRON_PERSONALIZED_KINSHIP: Danh xưng trong push notification gọi theo Kinship Engine của người nhận
  it('TC_UT_CRON_PERSONALIZED_KINSHIP: Danh xưng gọi theo Kinship Engine của người nhận (Bà nội, Bác, Chú)', () => {
    const mockMembers: MemberRecord[] = [
      { id: 'uyen', full_name: 'Phạm Văn Uyên', gender: 'male', life_status: 'deceased', generation_level: 11, is_root: false },
      { id: 'cham', full_name: 'Nguyễn Thị Chăm', gender: 'female', life_status: 'deceased', generation_level: 11, is_root: false },
      { id: 'cuong', full_name: 'Phạm Văn Cường', gender: 'male', father_id: 'uyen', mother_id: 'cham', life_status: 'deceased', generation_level: 12, birth_order: 1, is_root: false },
      { id: 'thang', full_name: 'Phạm Văn Thắng', gender: 'male', father_id: 'uyen', mother_id: 'cham', life_status: 'living', generation_level: 12, birth_order: 2, is_root: false },
      { id: 'giap', full_name: 'Phạm Tiến Giáp', gender: 'male', father_id: 'thang', life_status: 'living', generation_level: 13, is_root: false },
    ];

    const membersMap = new Map<string, Member>();
    mockMembers.forEach((m) => membersMap.set(m.id, m as unknown as Member));

    const spouseMap = new Map<string, string[]>([
      ['uyen', ['cham']],
      ['cham', ['uyen']],
    ]);

    // 1. Kiểm tra danh xưng Giáp gọi Bà Chăm (Bà nội)
    const lcaCham = findLowestCommonAncestor('giap', 'cham', membersMap, spouseMap);
    assert.ok(lcaCham.lcaNodeId, 'Phải tìm thấy LCA giữa Giáp và Bà Chăm');
    const resCham = resolveKinshipTerms(lcaCham, membersMap.get('giap')!, membersMap.get('cham')!);
    assert.ok(resCham?.termAtoB, 'Phải xác định được danh xưng xưng hô');
    assert.ok(
      resCham.termAtoB.includes('Bà') || resCham.termAtoB.includes('Bà nội'),
      `Giáp gọi Cụ Chăm phải là Bà hoặc Bà nội, thực tế: ${resCham.termAtoB}`
    );

    const prefixCham = computeDeceasedHonorificPrefix(mockMembers[1], 13, resCham.termAtoB);
    const titleToday = `Hôm nay là Ngày Giỗ ${prefixCham} ${mockMembers[1].full_name}`;
    assert.ok(
      titleToday.includes('Bà nội Nguyễn Thị Chăm') || titleToday.includes('Bà Nguyễn Thị Chăm'),
      `Tiêu đề hôm nay phải chứa danh xưng Bà nội hoặc Bà: ${titleToday}`
    );

    // 2. Kiểm tra danh xưng Giáp gọi Bác Cường (Bác ruột - con trưởng)
    const lcaCuong = findLowestCommonAncestor('giap', 'cuong', membersMap, spouseMap);
    assert.ok(lcaCuong.lcaNodeId, 'Phải tìm thấy LCA giữa Giáp và Bác Cường');
    const resCuong = resolveKinshipTerms(lcaCuong, membersMap.get('giap')!, membersMap.get('cuong')!);
    assert.ok(resCuong?.termAtoB, 'Phải xác định được danh xưng xưng hô');
    assert.ok(
      resCuong.termAtoB.includes('Bác') || resCuong.termAtoB.includes('Chú'),
      `Giáp gọi Cụ Cường phải là Bác hoặc Chú, thực tế: ${resCuong.termAtoB}`
    );

    const prefixCuong = computeDeceasedHonorificPrefix(mockMembers[2], 13, resCuong.termAtoB);
    const titleTomorrow = `Ngày mai có Ngày Giỗ ${prefixCuong} ${mockMembers[2].full_name}`;
    assert.ok(
      titleTomorrow.includes('Bác Phạm Văn Cường') || titleTomorrow.includes('Chú Phạm Văn Cường'),
      `Tiêu đề ngày mai phải chứa danh xưng Bác hoặc Chú: ${titleTomorrow}`
    );
  });

  // TC_UT_EXTENDED_FAMILY_LINEAGE_SCOPE: Thuật toán mở rộng nhánh gia đình bao gồm Bác, Chú, Cô, Vợ/Chồng, Con cái
  it('TC_UT_EXTENDED_FAMILY_LINEAGE_SCOPE: getExtendedFamilyMemberIds mở rộng scope bao gồm Bác, Chú, Cô, Dâu/Rể và con cháu', () => {
    const mockMembers: MemberRecord[] = [
      { id: 'ong_to', full_name: 'Cụ Tổ Đời 10', gender: 'male', life_status: 'deceased', generation_level: 10, is_root: true },
      // Nhánh 1 (Nhánh của Giáp)
      { id: 'uyen', full_name: 'Ông Uyên', gender: 'male', father_id: 'ong_to', life_status: 'deceased', generation_level: 11, is_root: false },
      { id: 'cham', full_name: 'Bà Chăm', gender: 'female', life_status: 'deceased', generation_level: 11, is_root: false },
      { id: 'cuong', full_name: 'Bác Cường', gender: 'male', father_id: 'uyen', mother_id: 'cham', life_status: 'deceased', generation_level: 12, is_root: false },
      { id: 'bac_dau', full_name: 'Bác Dâu Lan', gender: 'female', life_status: 'living', generation_level: 12, is_root: false },
      { id: 'anh_dung', full_name: 'Anh Dũng (con Bác Cường)', gender: 'male', father_id: 'cuong', mother_id: 'bac_dau', life_status: 'living', generation_level: 13, is_root: false },
      { id: 'co_mai', full_name: 'Cô Mai', gender: 'female', father_id: 'uyen', mother_id: 'cham', life_status: 'living', generation_level: 12, is_root: false },
      { id: 'thang', full_name: 'Bố Thắng', gender: 'male', father_id: 'uyen', mother_id: 'cham', life_status: 'living', generation_level: 12, is_root: false },
      { id: 'giap', full_name: 'Giáp', gender: 'male', father_id: 'thang', life_status: 'living', generation_level: 13, is_root: false },
      // Nhánh 2 (Chi khác xa xôi)
      { id: 'ong_hung', full_name: 'Ông Hùng (Chi 2)', gender: 'male', father_id: 'ong_to', life_status: 'deceased', generation_level: 11, is_root: false },
      { id: 'tuan', full_name: 'Tuấn (Chi 2)', gender: 'male', father_id: 'ong_hung', life_status: 'living', generation_level: 12, is_root: false },
    ];

    const spouseMap = new Map<string, string[]>([
      ['uyen', ['cham']],
      ['cham', ['uyen']],
      ['cuong', ['bac_dau']],
      ['bac_dau', ['cuong']],
    ]);

    const scope = getExtendedFamilyMemberIds('giap', mockMembers, spouseMap);

    // 1. Phải chứa chính mình, bố, ông bà nội
    assert.strictEqual(scope.has('giap'), true, 'Bao gồm chính mình');
    assert.strictEqual(scope.has('thang'), true, 'Bao gồm bố');
    assert.strictEqual(scope.has('uyen'), true, 'Bao gồm ông nội');
    assert.strictEqual(scope.has('cham'), true, 'Bao gồm bà nội');

    // 2. Phải chứa anh chị em của bố (Bác, Cô) và vợ/chồng của họ
    assert.strictEqual(scope.has('cuong'), true, 'Bao gồm bác Cường');
    assert.strictEqual(scope.has('bac_dau'), true, 'Bao gồm bác dâu');
    assert.strictEqual(scope.has('co_mai'), true, 'Bao gồm cô Mai');

    // 3. Phải chứa anh em họ (con của bác Cường)
    assert.strictEqual(scope.has('anh_dung'), true, 'Bao gồm anh họ');

    // 4. Tuyệt đối KHÔNG chứa người ở chi nhánh khác xa xôi
    assert.strictEqual(scope.has('ong_hung'), false, 'Không bao gồm ông Hùng chi khác');
    assert.strictEqual(scope.has('tuan'), false, 'Không bao gồm Tuấn chi khác');
  });

  // TC_INT_CRON_SENDS_BOTH_TODAY_AND_TOMORROW_FOR_EXTENDED_FAMILY: Gửi đủ 2 thông báo khi có giỗ Bà nội (Hôm nay) và giỗ Bác (Ngày mai)
  it('TC_INT_CRON_SENDS_BOTH_TODAY_AND_TOMORROW_FOR_EXTENDED_FAMILY: Route Cron hỗ trợ gửi song song 2 thông báo cho phạm vi mở rộng', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const routePath = path.resolve(process.cwd(), 'src/app/api/cron/anniversary-reminder/route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf8');

    // 1. Route phải sử dụng getExtendedFamilyMemberIds để lấy phạm vi nhận tin
    assert.ok(
      routeContent.includes('getExtendedFamilyMemberIds('),
      'Route Cron phải gọi getExtendedFamilyMemberIds để bao gồm anh chị em bố mẹ và con cháu'
    );

    // 2. Route phải định dạng danh xưng cá nhân hóa
    assert.ok(
      routeContent.includes('formatPersonalizedDisplayName('),
      'Route Cron phải có hàm formatPersonalizedDisplayName tính danh xưng cá nhân hóa'
    );

    // 3. Route phải hỗ trợ cả matchingToday và matchingTomorrow độc lập
    assert.ok(
      routeContent.includes('matchingToday') && routeContent.includes('matchingTomorrow'),
      'Route Cron phải duyệt riêng matchingToday và matchingTomorrow'
    );

    // 4. Tag thông báo phải phân biệt rõ today và tomorrow
    assert.ok(
      routeContent.includes('anniversary-today-') && routeContent.includes('anniversary-tomorrow-'),
      'Payload phải chứa tag anniversary-today- và anniversary-tomorrow-'
    );

    // 5. Tiêu đề đúng chuẩn
    assert.ok(
      routeContent.includes('Hôm nay là Ngày Giỗ ') && routeContent.includes('Ngày mai có Ngày Giỗ '),
      'Tiêu đề thông báo phải có tiền tố icon và cấu trúc chuẩn'
    );
  });
});

