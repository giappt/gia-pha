import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getUpcomingAnniversariesFeed } from '../src/lib/services/anniversary.service';
import type { MemberRecord } from '../src/types/tree';
import type { BranchNode } from '../src/types/database';

describe('Anniversary SSOT Domain Service Suite (Milestone 9)', () => {
  const mockBranches: BranchNode[] = [
    {
      id: 'branch-1',
      name: 'Ngành 1',
      tierName: 'Ngành',
      rootMemberId: 'm-root-1',
      children: [
        {
          id: 'branch-1-1',
          name: 'Chi 1',
          tierName: 'Chi',
          rootMemberId: 'm-chi-1',
          children: [],
        },
        {
          id: 'branch-1-2',
          name: 'Chi 2',
          tierName: 'Chi',
          rootMemberId: 'm-chi-2',
          children: [],
        },
      ],
    },
  ];

  const mockMembers: MemberRecord[] = [
    {
      id: 'm-root-1',
      full_name: 'Phạm Văn Tổ',
      gender: 'male',
      generation_level: 1,
      father_id: null,
      mother_id: null,
      birth_year: 1850,
      death_year: 1920,
      death_lunar_day: 15,
      death_lunar_month: 8,
      death_lunar_is_leap: false,
      is_alive: false,
    } as unknown as MemberRecord,
    {
      id: 'm-chi-2',
      full_name: 'Phạm Văn Chi Hai',
      gender: 'male',
      generation_level: 2,
      father_id: 'm-root-1',
      mother_id: null,
      birth_year: 1880,
      death_year: 1950,
      death_lunar_day: 15,
      death_lunar_month: 8,
      death_lunar_is_leap: false,
      is_alive: false,
    } as unknown as MemberRecord,
    {
      id: 'm-member-deceased',
      full_name: 'Phạm Văn Con Chi Hai',
      gender: 'male',
      generation_level: 3,
      father_id: 'm-chi-2',
      mother_id: null,
      birth_year: 1910,
      death_year: 1980,
      death_lunar_day: 15,
      death_lunar_month: 8,
      death_lunar_is_leap: false,
      is_alive: false,
    } as unknown as MemberRecord,
  ];

  it('TC_UT_ANNIV_SERVICE_01: getUpcomingAnniversariesFeed nạp dữ liệu và phân giải đúng generation và branch_path', async () => {
    const feed = await getUpcomingAnniversariesFeed({
      daysAhead: 365,
      injectedMembers: mockMembers,
      injectedBranches: mockBranches,
      injectedSpouseRelations: [],
    });

    assert.ok(Array.isArray(feed), 'Feed trả về phải là một mảng');
    assert.ok(feed.length > 0, 'Phải tìm thấy ít nhất 1 nhóm ngày giỗ');

    const group = feed[0];
    assert.strictEqual(typeof group.days_left, 'number');
    assert.ok(group.members.length > 0, 'Nhóm phải có thành viên giỗ');

    const deceasedMember = group.members.find((m) => m.id === 'm-member-deceased');
    assert.ok(deceasedMember, 'Phải có thành viên m-member-deceased');
    assert.strictEqual(deceasedMember.generation, 3, 'Thế hệ phải là 3');
    assert.strictEqual(deceasedMember.branch_name, 'Chi 2', 'Tên chi trực tiếp phải là Chi 2');
    assert.strictEqual(deceasedMember.branch_path, 'Ngành 1 · Chi 2', 'Đường dẫn phân cấp phải là Ngành 1 · Chi 2');
  });

  it('TC_UT_ANNIV_SERVICE_02: Xử lý an toàn khi danh sách thành viên rỗng không gây crash', async () => {
    const feed = await getUpcomingAnniversariesFeed({
      daysAhead: 30,
      injectedMembers: [],
      injectedBranches: mockBranches,
      injectedSpouseRelations: [],
    });

    assert.ok(Array.isArray(feed), 'Feed phải là mảng rỗng');
    assert.strictEqual(feed.length, 0);
  });

  it('TC_UT_ANNIV_SERVICE_03: Service sử dụng đúng tên cột regional_preset trong câu lệnh select clan_settings', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const servicePath = path.resolve(__dirname, '../src/lib/services/anniversary.service.ts');
    const content = fs.readFileSync(servicePath, 'utf8');

    // Bắt buộc select regional_preset thay vì default_kinship_region
    assert.ok(
      content.includes("select('regional_preset, custom_kinship_dictionary, branches')"),
      'Service bắt buộc phải select regional_preset từ bảng clan_settings'
    );
    assert.ok(
      !content.includes("select('default_kinship_region,"),
      'CẤM select default_kinship_region vì cột này không tồn tại trong bảng clan_settings'
    );
  });
});
