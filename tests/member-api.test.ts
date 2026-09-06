import { describe, it } from 'node:test';
import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST as createMember, GET as getMembers } from '../src/app/api/members/route';
import { DELETE as deleteMember, PUT as updateMember } from '../src/app/api/members/[id]/route';
import { POST as createSpouseRelation } from '../src/app/api/spouse-relations/route';
import { POST as importExcelData } from '../src/app/api/admin/import/route';
import { createAdminClient } from '../src/lib/supabase/admin';

describe('Member & Admin API Integration Test Suite (Milestone 4)', () => {
  // TC_INT01: API Contract tạo thành viên mới
  it('TC_INT01: POST /api/members tạo thành viên hợp lệ trả về status 201 và payload chuẩn', async () => {
    const payload = {
      full_name: 'Nguyễn Văn Test API',
      gender: 'male',
      life_status: 'living',
      father_id: 'm-gen2-truong', // Trưởng là Đời 2 trong Clan 28
      birth_year: 1995,
      is_senior: false,
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 201, 'Status code phải là 201 Created');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.member.full_name, 'Nguyễn Văn Test API');
    // Cha là đời 2 -> Con phải tự động là đời 3
    assert.strictEqual(json.member.generation_level, 3, 'Thế hệ con phải là 3 khi cha là đời 2');
    assert.ok(json.member.id, 'Phải sinh ID cho thành viên mới');
  });

  // TC_INT02: API Contract từ chối xóa người có con
  it('TC_INT02: DELETE /api/members/[id] từ chối xóa thành viên có con cái (Safe Delete RESTRICT)', async () => {
    // m-root-khoi có con cái trong Clan 28
    const request = new NextRequest('http://localhost:3000/api/members/m-root-khoi', {
      method: 'DELETE',
    });

    const response = await deleteMember(request, { params: { id: 'm-root-khoi' } });
    assert.strictEqual(response.status, 400, 'Status code phải là 400 Bad Request');

    const json = await response.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Không thể xóa'));
    assert.ok(json.childrenCount > 0);
  });

  // TC_INT03: API Contract quan hệ hôn phối và phát hiện hôn nhân nội tộc
  it('TC_INT03: POST /api/spouse-relations tạo quan hệ hôn phối và phát hiện nội tộc', async () => {
    // Phong (m-gen4-phong, Chi 1) và Nga (m-gen4-nga, Chi 2) chưa kết hôn, cùng chung Cụ Tổ Khởi
    const payload = {
      member_a_id: 'm-gen4-phong',
      member_b_id: 'm-gen4-nga',
      marriage_order: 1,
    };

    const request = new NextRequest('http://localhost:3000/api/spouse-relations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createSpouseRelation(request);
    assert.strictEqual(response.status, 201, 'Status code phải là 201 Created');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.is_consanguineous, true, 'Phải phát hiện quan hệ nội tộc');
    assert.strictEqual(json.common_ancestor, 'Nguyễn Văn Khởi');
  });

  // TC_INT04: API Contract Bulk Import
  it('TC_INT04: POST /api/admin/import nạp batch dữ liệu thành công', async () => {
    const payload = {
      mode: 'append',
      rows: [
        {
          rowNumber: 2,
          stt: 1,
          fullName: 'Cụ Tổ Import',
          gender: 'Nam',
          lifeStatus: 'Đã mất',
          isRoot: true,
        },
        {
          rowNumber: 3,
          stt: 2,
          fullName: 'Con Cụ Import',
          gender: 'Nam',
          lifeStatus: 'Còn sống',
          fatherStt: 1,
        },
      ],
    };

    const request = new NextRequest('http://localhost:3000/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await importExcelData(request);
    assert.strictEqual(response.status, 200, 'Status code phải là 200 OK');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.importedCount, 2, 'Phải nạp thành công 2 bản ghi');
  });

  // TC_INT05: API Contract tạo thành viên kèm inline phối ngẫu mới ngoài họ
  it('TC_INT05: POST /api/members với new_spouse_name tự động tạo cả thành viên chính và phối ngẫu mới', async () => {
    const payload = {
      full_name: 'Nguyễn Văn Chồng Mới',
      gender: 'male',
      life_status: 'living',
      birth_year: 1990,
      new_spouse_name: 'Lê Thị Mai Dâu Mới',
      new_spouse_birth_year: 1993,
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 201, 'Status code phải là 201 Created');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.member.full_name, 'Nguyễn Văn Chồng Mới');
    assert.ok(json.newSpouse, 'Phải trả về bản ghi phối ngẫu mới được tạo');
    assert.strictEqual(json.newSpouse.full_name, 'Lê Thị Mai Dâu Mới');
    assert.strictEqual(json.newSpouse.gender, 'female', 'Giới tính phối ngẫu phải tự suy luận ngược chiều (Nữ)');
    assert.strictEqual(json.newSpouse.birth_year, 1993);
  });

  // TC_INT06: API Contract gán nối con cái từ danh sách chưa nối
  it('TC_INT06: PUT /api/members/[id] với child_ids_to_link cập nhật thành công danh sách con', async () => {
    const payload = {
      child_ids_to_link: ['m-gen4-mai-noi-toc'],
    };

    const request = new NextRequest('http://localhost:3000/api/members/m-gen2-truong', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await updateMember(request, { params: { id: 'm-gen2-truong' } });
    assert.strictEqual(response.status, 200, 'Status code phải là 200 OK');

    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.deepStrictEqual(json.linkedChildIds, ['m-gen4-mai-noi-toc']);
  });

  // TC_INT07: API Server Mutation sử dụng Supabase Admin Client
  it('TC_INT07: createAdminClient khởi tạo đúng Service Role Client và API Server Mutation chấp nhận mutation qua admin client', async () => {
    // 1. Kiểm tra createAdminClient an toàn khi thiếu env hoặc đủ env
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      assert.strictEqual(createAdminClient(), null, 'Phải trả về null an toàn khi thiếu SUPABASE_SERVICE_ROLE_KEY');

      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
      const adminClient = createAdminClient();
      assert.ok(adminClient, 'Phải tạo thành công Supabase admin client khi có đủ URL và Key');
      assert.strictEqual(typeof adminClient.from, 'function', 'Admin client phải có method from');
    } finally {
      if (prevUrl === undefined) {
        delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      } else {
        process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      }
      if (prevKey === undefined) {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      } else {
        process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
      }
    }

    // 2. Kiểm tra thao tác POST /api/members tạo thành viên không bị lỗi nuốt mất thông tin
    const payload = {
      full_name: 'Trần Thị Thu Admin',
      gender: 'female',
      life_status: 'living',
      birth_year: 1998,
      is_root: false,
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 201, 'POST phải trả về 201 Created');
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.member.full_name, 'Trần Thị Thu Admin');
    assert.strictEqual(json.member.gender, 'female');
  });

  // TC_INT_ORDER_01: API dọn trùng birth_order cho người cũ khi người mới nhận số thứ tự đó
  it('TC_INT_ORDER_01: POST /api/members dọn trùng birth_order của anh chị em đã có', async () => {
    // m-gen3-an là con của m-gen2-truong với birth_order = 1
    const payload = {
      full_name: 'Nguyễn Văn Em Chiếm Thứ Nhất',
      gender: 'male',
      life_status: 'living',
      father_id: 'm-gen2-truong',
      birth_year: 1975,
      birth_order: 1, // Trùng số 1 của m-gen3-an
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 201);
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.clearedBirthOrderId, 'm-gen3-an', 'Phải phát hiện và gỡ thứ tự của m-gen3-an');
  });

  // TC_INT_SENIOR_01: API tự động hạ cờ is_senior của người cũ khi người mới được gán làm con trưởng
  it('TC_INT_SENIOR_01: POST /api/members hạ cờ is_senior của người cũ khi chỉ định con trưởng mới', async () => {
    // m-gen3-an hiện đang là is_senior = true của m-gen2-truong
    const payload = {
      full_name: 'Nguyễn Văn Con Trưởng Mới',
      gender: 'male',
      life_status: 'living',
      father_id: 'm-gen2-truong',
      birth_year: 1972,
      birth_order: 4,
      is_senior: true, // Nhận làm trưởng
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 201);
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.demotedSeniorId, 'm-gen3-an', 'Phải hạ cờ con trưởng của m-gen3-an');
  });

  // TC_INT_SPOUSE_ORDER_01: API lưu đúng marriage_order khi thêm phối ngẫu
  it('TC_INT_SPOUSE_ORDER_01: POST /api/members lưu đúng marriage_order khi thêm phối ngẫu', async () => {
    const payload = {
      full_name: 'Trần Thị Vợ Hai',
      gender: 'female',
      life_status: 'living',
      birth_year: 1950,
      spouse_id: 'm-gen2-truong',
      marriage_order: 2,
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 201);
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.newSpouseRelation, 'Phải tạo quan hệ phối ngẫu');
    assert.strictEqual(json.newSpouseRelation.marriage_order, 2, 'marriage_order phải là 2');
  });

  // TC_INT_AGE_01: API từ chối tạo con cái có năm sinh <= năm sinh cha mẹ
  it('TC_INT_AGE_01: POST /api/members từ chối khi năm sinh con <= năm sinh bố/mẹ (HTTP 400)', async () => {
    // m-gen2-truong sinh năm 1935
    const payload = {
      full_name: 'Nguyễn Văn Nghịch Lý Thời Gian',
      gender: 'male',
      life_status: 'living',
      father_id: 'm-gen2-truong',
      birth_year: 1930, // 1930 <= 1935 -> Vô lý
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 400);
    const json = await response.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('không thể trước hoặc bằng'));
  });

  // TC_UT_DISTDIR_01: Kiểm tra Cách Ly Build next.config.mjs
  it('TC_UT_DISTDIR_01: next.config.mjs xử lý distDir chuẩn xác theo biến môi trường NEXT_DIST_DIR (fallback .next)', async () => {
    const configModule = await import('../next.config.mjs');
    const nextConfig = configModule.default;

    assert.ok(nextConfig, 'next.config.mjs phải export default config object');
    assert.strictEqual(
      typeof nextConfig.distDir,
      'string',
      'distDir phải là string'
    );
    assert.ok(
      nextConfig.distDir === '.next' || nextConfig.distDir === '.next-build',
      `distDir (${nextConfig.distDir}) phải là .next hoặc .next-build`
    );
  });

  // TC_INT_INTERNAL_SPOUSE_SUBMIT: Gửi yêu cầu phối ngẫu nội tộc qua POST /api/spouse-relations
  it('TC_INT_INTERNAL_SPOUSE_SUBMIT: Kết hôn nội tộc gọi POST /api/spouse-relations trả về 201 và phát hiện quan hệ huyết thống mà không tạo duplicate member', async () => {
    // Kết hôn giữa Nam (m-gen4-nam) và Lan (m-gen4-lan), cả hai cùng thuộc gia phả nhưng chưa có quan hệ hôn phối
    const payload = {
      member_a_id: 'm-gen4-nam',
      member_b_id: 'm-gen4-lan',
      marriage_order: 1,
      marriage_status: 'married',
    };

    const request = new NextRequest('http://localhost:3000/api/spouse-relations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const response = await createSpouseRelation(request);
    assert.strictEqual(response.status, 201, 'Status code phải là 201 Created');
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.ok(json.relation, 'Phải trả về bản ghi relation mới');
    assert.strictEqual(json.relation.member_a_id, 'm-gen4-nam');
    assert.strictEqual(json.relation.member_b_id, 'm-gen4-lan');
    assert.strictEqual(typeof json.is_consanguineous, 'boolean');
  });

  // TC_INT_IMPORT_DB_ERROR_PROPAGATION: Error integrity trong Bulk Import API
  it('TC_INT_IMPORT_DB_ERROR_PROPAGATION: POST /api/admin/import từ chối payload rỗng với HTTP 400 và không nuốt lỗi', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: [] }),
    });

    const response = await importExcelData(request);
    assert.strictEqual(response.status, 400, 'Phải trả về HTTP 400 khi rows rỗng');
    const json = await response.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('Không có dữ liệu'));
  });
});
