import { describe, it } from 'node:test';
import assert from 'node:assert';
import { findLowestCommonAncestor, buildSpouseMap } from '../src/lib/kinship-engine/lca-finder';
import { resolveKinshipTerms } from '../src/lib/kinship-engine/regional-dictionaries';
import { MOCK_CLAN_MEMBERS, MOCK_SPOUSE_RELATIONS } from '../src/lib/kinship-engine/mock-data';
import type { Member, SpouseRelation } from '../src/types/database';

function createTestMember(
  partial: Partial<Member> & { id: string; full_name: string; gender: 'male' | 'female' }
): Member {
  return {
    id: partial.id,
    full_name: partial.full_name,
    alias_name: partial.alias_name ?? null,
    gender: partial.gender,
    life_status: partial.life_status ?? 'living',
    father_id: partial.father_id ?? null,
    mother_id: partial.mother_id ?? null,
    birth_date: partial.birth_date ?? null,
    birth_year: partial.birth_year ?? null,
    death_date: partial.death_date ?? null,
    death_lunar_day: partial.death_lunar_day ?? null,
    death_lunar_month: partial.death_lunar_month ?? null,
    death_lunar_is_leap: partial.death_lunar_is_leap ?? false,
    death_lunar_year_name: partial.death_lunar_year_name ?? null,
    death_year: partial.death_year ?? null,
    burial_location: partial.burial_location ?? null,
    avatar_url: partial.avatar_url ?? null,
    phone: partial.phone ?? null,
    address: partial.address ?? null,
    biography: partial.biography ?? null,
    generation_number: partial.generation_number ?? 1,
    generation_level: partial.generation_level ?? 1,
    birth_order: partial.birth_order ?? 1,
    is_senior_branch: partial.is_senior_branch ?? false,
    is_adopted: partial.is_adopted ?? false,
    created_at: partial.created_at ?? new Date().toISOString(),
    updated_at: partial.updated_at ?? new Date().toISOString(),
  };
}

describe('Kinship Engine In-Law & Affinal Test Suite (TC29 - TC36)', () => {
  // Bộ dữ liệu mở rộng gia đình cụ Uyên để kiểm thử đầy đủ các nhánh dâu rể
  const TEST_MEMBERS: Member[] = [
    // Đời 1: Cụ Uyên
    createTestMember({
      id: 'fam-uyen',
      full_name: 'Phạm Văn Uyên',
      gender: 'male',
      life_status: 'living',
      father_id: null,
      mother_id: null,
      birth_year: 1940,
      birth_order: 1,
      is_senior_branch: true,
      generation_number: 1,
    }),
    // Đời 2: Chiến (con trai cả)
    createTestMember({
      id: 'fam-chien',
      full_name: 'Phạm Văn Chiến',
      gender: 'male',
      life_status: 'living',
      father_id: 'fam-uyen',
      mother_id: null,
      birth_year: 1965,
      birth_order: 1,
      is_senior_branch: true,
      generation_number: 2,
    }),
    // Đời 2: Liễu (Vợ Chiến - Dâu cả)
    createTestMember({
      id: 'fam-lieu',
      full_name: 'Đào Thị Liễu',
      gender: 'female',
      life_status: 'living',
      father_id: null,
      mother_id: null,
      birth_year: 1967,
      birth_order: 1,
      generation_number: 2,
    }),
    // Đời 2: Bẩy (con trai thứ 3 - em của Chiến và Mai)
    createTestMember({
      id: 'fam-bay',
      full_name: 'Phạm Văn Bẩy',
      gender: 'male',
      life_status: 'living',
      father_id: 'fam-uyen',
      mother_id: null,
      birth_year: 1970,
      birth_order: 3,
      is_senior_branch: false,
      generation_number: 2,
    }),
    // Đời 2: Hà (Vợ Bẩy - Dâu thứ)
    createTestMember({
      id: 'fam-ha',
      full_name: 'Chu Thị Hà',
      gender: 'female',
      life_status: 'living',
      father_id: null,
      mother_id: null,
      birth_year: 1972,
      birth_order: 2,
      generation_number: 2,
    }),
    // Đời 2: Mai (Con gái thứ 2 của Uyên - Chị gái của Bẩy)
    createTestMember({
      id: 'fam-mai',
      full_name: 'Phạm Thị Mai',
      gender: 'female',
      life_status: 'living',
      father_id: 'fam-uyen',
      mother_id: null,
      birth_year: 1968,
      birth_order: 2,
      generation_number: 2,
    }),
    // Đời 2: Thắng (Chồng Mai - Rể)
    createTestMember({
      id: 'fam-thang',
      full_name: 'Hoàng Văn Thắng',
      gender: 'male',
      life_status: 'living',
      father_id: null,
      mother_id: null,
      birth_year: 1966,
      birth_order: 1,
      generation_number: 2,
    }),
    // Đời 3: Phong (Con trai của Chiến & Liễu)
    createTestMember({
      id: 'fam-phong',
      full_name: 'Phạm Văn Phong',
      gender: 'male',
      life_status: 'living',
      father_id: 'fam-chien',
      mother_id: 'fam-lieu',
      birth_year: 1992,
      birth_order: 1,
      is_senior_branch: true,
      generation_number: 3,
    }),
    // Đời 3: Linh (Con gái của Bẩy & Hà)
    createTestMember({
      id: 'fam-linh',
      full_name: 'Phạm Thị Linh',
      gender: 'female',
      life_status: 'living',
      father_id: 'fam-bay',
      mother_id: 'fam-ha',
      birth_year: 1996,
      birth_order: 1,
      generation_number: 3,
    }),
  ];

  const TEST_SPOUSE_RELATIONS: SpouseRelation[] = [
    // Chiến & Liễu
    {
      id: 'sp-chien-lieu',
      member_a_id: 'fam-chien',
      member_b_id: 'fam-lieu',
      marriage_order: 1,
      marriage_status: 'married',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Bẩy & Hà
    {
      id: 'sp-bay-ha',
      member_a_id: 'fam-bay',
      member_b_id: 'fam-ha',
      marriage_order: 1,
      marriage_status: 'married',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Mai & Thắng
    {
      id: 'sp-mai-thang',
      member_a_id: 'fam-mai',
      member_b_id: 'fam-thang',
      marriage_order: 1,
      marriage_status: 'married',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const allMembers = [...MOCK_CLAN_MEMBERS, ...TEST_MEMBERS];
  const membersMap = new Map<string, Member>(allMembers.map((m) => [m.id, m]));
  const allSpouseRelations = [...MOCK_SPOUSE_RELATIONS, ...TEST_SPOUSE_RELATIONS];
  const spouseMap = buildSpouseMap(allSpouseRelations, membersMap);

  // ID các thành viên mẫu trong MOCK_CLAN_MEMBERS
  const ID_KHOI = '10000000-0000-0000-0000-000000000001'; // Cụ Khởi
  const ID_BINH = '20000000-0000-0000-0000-000000000001'; // Cụ Bình
  const ID_HUE = '20000000-0000-0000-0000-000000000002'; // Cụ Bà Huệ (vợ Cụ Bình)
  const ID_CUONG = '20000000-0000-0000-0000-000000000004'; // Cụ Cường (em Cụ Bình)

  // =========================================================================
  // TC29: Quan Hệ Vợ - Chồng Trực Tiếp
  // =========================================================================
  it('TC29: Quan Hệ Vợ - Chồng Trực Tiếp (Chiến & Liễu và Cụ Bình & Bà Huệ)', () => {
    // 1. Cặp Chiến & Liễu
    const lca = findLowestCommonAncestor('fam-chien', 'fam-lieu', membersMap, spouseMap);
    assert.strictEqual(lca.relationshipType, 'spouse', 'Phải nhận diện quan hệ spouse');
    assert.strictEqual(lca.spouseBridge?.type, 'spouse');

    const chien = membersMap.get('fam-chien')!;
    const lieu = membersMap.get('fam-lieu')!;
    const res = resolveKinshipTerms(lca, chien, lieu, 'north');
    assert.strictEqual(res.termAtoB, 'Vợ', 'Chiến gọi Liễu là Vợ');
    assert.strictEqual(res.termBtoA, 'Chồng', 'Liễu gọi Chiến là Chồng');

    // Đảo vai (Liễu gọi Chiến)
    const lcaSwap = findLowestCommonAncestor('fam-lieu', 'fam-chien', membersMap, spouseMap);
    const resSwap = resolveKinshipTerms(lcaSwap, lieu, chien, 'north');
    assert.strictEqual(resSwap.termAtoB, 'Chồng', 'Đảo vai: Liễu gọi Chiến là Chồng');
    assert.strictEqual(resSwap.termBtoA, 'Vợ', 'Đảo vai: Chiến gọi Liễu là Vợ');

    // 2. Cặp mẫu Cụ Bình & Bà Huệ trong MOCK_CLAN_MEMBERS
    const lcaMock = findLowestCommonAncestor(ID_BINH, ID_HUE, membersMap, spouseMap);
    assert.strictEqual(lcaMock.relationshipType, 'spouse');
    const binh = membersMap.get(ID_BINH)!;
    const hue = membersMap.get(ID_HUE)!;
    const resMock = resolveKinshipTerms(lcaMock, binh, hue, 'north');
    assert.strictEqual(resMock.termAtoB, 'Vợ', 'Cụ Bình gọi Cụ Bà Huệ là Vợ');
    assert.strictEqual(resMock.termBtoA, 'Chồng', 'Cụ Bà Huệ gọi Cụ Bình là Chồng');
  });

  // =========================================================================
  // TC30: Quan Hệ Bố/Mẹ Chồng - Con Dâu & Bố/Mẹ Vợ - Con Rể
  // =========================================================================
  it('TC30: Quan Hệ Bố Chồng - Con Dâu & Bố Vợ - Con Rể', () => {
    // 1. Cụ Uyên (Bố chồng) & Đào Thị Liễu (Con dâu qua chồng là Chiến)
    const lcaUyenLieu = findLowestCommonAncestor('fam-uyen', 'fam-lieu', membersMap, spouseMap);
    assert.strictEqual(lcaUyenLieu.relationshipType, 'in_law', 'Phải nhận diện quan hệ in_law');
    assert.strictEqual(lcaUyenLieu.spouseBridge?.bloodRelation, 'parent_child');

    const uyen = membersMap.get('fam-uyen')!;
    const lieu = membersMap.get('fam-lieu')!;
    const resUyenLieu = resolveKinshipTerms(lcaUyenLieu, uyen, lieu, 'north');
    assert.strictEqual(resUyenLieu.termAtoB, 'Con', 'Cụ Uyên gọi con dâu Liễu là Con');
    assert.strictEqual(resUyenLieu.termBtoA, 'Bố', 'Con dâu Liễu gọi Cụ Uyên là Bố');

    // Đảo vai (Liễu gọi Cụ Uyên)
    const lcaLieuUyen = findLowestCommonAncestor('fam-lieu', 'fam-uyen', membersMap, spouseMap);
    const resLieuUyen = resolveKinshipTerms(lcaLieuUyen, lieu, uyen, 'north');
    assert.strictEqual(resLieuUyen.termAtoB, 'Bố', 'Đảo vai: Liễu gọi Cụ Uyên là Bố');
    assert.strictEqual(resLieuUyen.termBtoA, 'Con', 'Đảo vai: Cụ Uyên gọi Liễu là Con');

    // 2. Cụ Khởi (Bố chồng) & Cụ Bà Huệ (Con dâu qua chồng là Cụ Bình)
    const lcaKhoiHue = findLowestCommonAncestor(ID_KHOI, ID_HUE, membersMap, spouseMap);
    assert.strictEqual(lcaKhoiHue.relationshipType, 'in_law');
    const khoi = membersMap.get(ID_KHOI)!;
    const hue = membersMap.get(ID_HUE)!;
    const resKhoiHue = resolveKinshipTerms(lcaKhoiHue, khoi, hue, 'north');
    assert.strictEqual(resKhoiHue.termAtoB, 'Con', 'Cụ Khởi gọi con dâu Huệ là Con');
    assert.strictEqual(resKhoiHue.termBtoA, 'Bố', 'Con dâu Huệ gọi Cụ Khởi là Bố');

    // 3. Cụ Uyên (Bố vợ) & Hoàng Văn Thắng (Con rể qua vợ là Mai)
    const lcaUyenThang = findLowestCommonAncestor('fam-uyen', 'fam-thang', membersMap, spouseMap);
    assert.strictEqual(lcaUyenThang.relationshipType, 'in_law');
    const thang = membersMap.get('fam-thang')!;
    const resUyenThang = resolveKinshipTerms(lcaUyenThang, uyen, thang, 'north');
    assert.strictEqual(resUyenThang.termAtoB, 'Con', 'Cụ Uyên gọi con rể Thắng là Con');
    assert.strictEqual(resUyenThang.termBtoA, 'Bố', 'Con rể Thắng gọi Cụ Uyên là Bố');
  });

  // =========================================================================
  // TC31: Quan Hệ Chị Dâu - Em Chồng
  // =========================================================================
  it('TC31: Quan Hệ Chị Dâu - Em Chồng (Liễu & Bẩy, Cụ Bà Huệ & Cụ Cường)', () => {
    // 1. Liễu (vợ anh Chiến) & Bẩy (em trai Chiến)
    const lca = findLowestCommonAncestor('fam-bay', 'fam-lieu', membersMap, spouseMap);
    assert.strictEqual(lca.relationshipType, 'in_law');

    const bay = membersMap.get('fam-bay')!;
    const lieu = membersMap.get('fam-lieu')!;
    const res = resolveKinshipTerms(lca, bay, lieu, 'north');
    assert.strictEqual(res.termAtoB, 'Chị dâu', 'Bẩy gọi Liễu là Chị dâu');
    assert.strictEqual(res.termBtoA, 'Chú', 'Liễu gọi Bẩy là Chú');

    // Đảo vai (Liễu gọi Bẩy)
    const lcaSwap = findLowestCommonAncestor('fam-lieu', 'fam-bay', membersMap, spouseMap);
    const resSwap = resolveKinshipTerms(lcaSwap, lieu, bay, 'north');
    assert.strictEqual(resSwap.termAtoB, 'Chú', 'Liễu gọi em chồng Bẩy là Chú');
    assert.strictEqual(resSwap.termBtoA, 'Chị dâu', 'Bẩy gọi chị dâu Liễu là Chị dâu');

    // 2. Cụ Cường & Cụ Bà Huệ (vợ Cụ Bình - anh trai Cường)
    const lcaMock = findLowestCommonAncestor(ID_CUONG, ID_HUE, membersMap, spouseMap);
    assert.strictEqual(lcaMock.relationshipType, 'in_law');
    const cuong = membersMap.get(ID_CUONG)!;
    const hue = membersMap.get(ID_HUE)!;
    const resMock = resolveKinshipTerms(lcaMock, cuong, hue, 'north');
    assert.strictEqual(resMock.termAtoB, 'Chị dâu', 'Cụ Cường gọi Cụ Bà Huệ là Chị dâu');
    assert.strictEqual(resMock.termBtoA, 'Chú', 'Cụ Bà Huệ gọi Cụ Cường là Chú');
  });

  // =========================================================================
  // TC32: Quan Hệ Em Dâu - Anh/Chị Chồng
  // =========================================================================
  it('TC32: Quan Hệ Em Dâu - Anh/Chị Chồng (Chiến & Hà)', () => {
    // Chiến (anh trai) & Hà (vợ của em trai Bẩy)
    const lca = findLowestCommonAncestor('fam-chien', 'fam-ha', membersMap, spouseMap);
    assert.strictEqual(lca.relationshipType, 'in_law');

    const chien = membersMap.get('fam-chien')!;
    const ha = membersMap.get('fam-ha')!;
    const res = resolveKinshipTerms(lca, chien, ha, 'north');
    assert.strictEqual(res.termAtoB, 'Em dâu', 'Anh Chiến gọi vợ của em trai là Em dâu');
    assert.strictEqual(res.termBtoA, 'Bác', 'Em dâu Hà gọi anh chồng là Bác');

    // Đảo vai (Hà gọi Chiến)
    const lcaSwap = findLowestCommonAncestor('fam-ha', 'fam-chien', membersMap, spouseMap);
    const resSwap = resolveKinshipTerms(lcaSwap, ha, chien, 'north');
    assert.strictEqual(resSwap.termAtoB, 'Bác', 'Em dâu Hà gọi anh chồng là Bác');
    assert.strictEqual(resSwap.termBtoA, 'Em dâu', 'Anh Chiến gọi em dâu là Em dâu');
  });

  // =========================================================================
  // TC33: Quan Hệ Anh Rể - Em Vợ & Em Rể
  // =========================================================================
  it('TC33: Quan Hệ Anh Rể - Em Vợ (Bẩy & Thắng)', () => {
    // Bẩy (em trai) & Thắng (chồng của chị gái Mai)
    const lca = findLowestCommonAncestor('fam-bay', 'fam-thang', membersMap, spouseMap);
    assert.strictEqual(lca.relationshipType, 'in_law');

    const bay = membersMap.get('fam-bay')!;
    const thang = membersMap.get('fam-thang')!;

    // Miền Bắc: Bẩy gọi Thắng là Anh rể, Thắng gọi Bẩy là Cậu
    const resNorth = resolveKinshipTerms(lca, bay, thang, 'north');
    assert.strictEqual(resNorth.termAtoB, 'Anh rể', 'Bẩy gọi Thắng là Anh rể');
    assert.strictEqual(resNorth.termBtoA, 'Cậu', 'Anh rể Thắng gọi em vợ Bẩy là Cậu');

    // Đảo vai (Thắng gọi Bẩy)
    const lcaSwap = findLowestCommonAncestor('fam-thang', 'fam-bay', membersMap, spouseMap);
    const resSwap = resolveKinshipTerms(lcaSwap, thang, bay, 'north');
    assert.strictEqual(resSwap.termAtoB, 'Cậu', 'Thắng gọi Bẩy là Cậu');
    assert.strictEqual(resSwap.termBtoA, 'Anh rể', 'Bẩy gọi Thắng là Anh rể');

    // Miền Nam: xưng Em
    const resSouth = resolveKinshipTerms(lca, bay, thang, 'south');
    assert.strictEqual(resSouth.termAtoB, 'Anh rể');
    assert.strictEqual(resSouth.termBtoA, 'Em');
  });

  // =========================================================================
  // TC34: Quan Hệ Bác Dâu, Thím, Dượng, Mợ
  // =========================================================================
  it('TC34: Quan Hệ Bác Dâu, Thím, Dượng, Mợ', () => {
    // 1. Vợ của Bác trai: Liễu (vợ Chiến) & Cháu Linh (con Bẩy)
    const lcaLinhLieu = findLowestCommonAncestor('fam-linh', 'fam-lieu', membersMap, spouseMap);
    assert.strictEqual(lcaLinhLieu.relationshipType, 'in_law');
    const linh = membersMap.get('fam-linh')!;
    const lieu = membersMap.get('fam-lieu')!;
    const resLinhLieu = resolveKinshipTerms(lcaLinhLieu, linh, lieu, 'north');
    assert.strictEqual(resLinhLieu.termAtoB, 'Bác dâu', 'Cháu Linh gọi vợ bác Chiến là Bác dâu');
    assert.strictEqual(resLinhLieu.termBtoA, 'Cháu', 'Bác dâu Liễu gọi Linh là Cháu');

    // 2. Vợ của Chú: Hà (vợ Bẩy) & Cháu Phong (con Chiến)
    const lcaPhongHa = findLowestCommonAncestor('fam-phong', 'fam-ha', membersMap, spouseMap);
    assert.strictEqual(lcaPhongHa.relationshipType, 'in_law');
    const phong = membersMap.get('fam-phong')!;
    const ha = membersMap.get('fam-ha')!;
    const resPhongHa = resolveKinshipTerms(lcaPhongHa, phong, ha, 'north');
    assert.strictEqual(resPhongHa.termAtoB, 'Thím', 'Cháu Phong gọi vợ chú Bẩy là Thím');
    assert.strictEqual(resPhongHa.termBtoA, 'Cháu', 'Thím Hà gọi Phong là Cháu');

    // 3. Chồng của Cô: Thắng (chồng Mai) & Cháu Phong (con Chiến)
    const lcaPhongThang = findLowestCommonAncestor('fam-phong', 'fam-thang', membersMap, spouseMap);
    assert.strictEqual(lcaPhongThang.relationshipType, 'in_law');
    const thang = membersMap.get('fam-thang')!;
    const resPhongThang = resolveKinshipTerms(lcaPhongThang, phong, thang, 'north');
    assert.ok(
      resPhongThang.termAtoB.toLowerCase().includes('dượng'),
      'Cháu Phong gọi chồng của cô Mai là Dượng'
    );
    assert.strictEqual(resPhongThang.termBtoA, 'Cháu', 'Dượng Thắng gọi Phong là Cháu');
  });

  // =========================================================================
  // TC35: Quan Hệ Chị Em Dâu & Đồng Hao (co_in_law)
  // =========================================================================
  it('TC35: Quan Hệ Chị Em Dâu (Liễu & Hà)', () => {
    // Liễu (vợ anh Chiến) & Hà (vợ em Bẩy)
    const lca = findLowestCommonAncestor('fam-ha', 'fam-lieu', membersMap, spouseMap);
    assert.strictEqual(lca.relationshipType, 'co_in_law', 'Phải nhận diện quan hệ co_in_law');

    const ha = membersMap.get('fam-ha')!;
    const lieu = membersMap.get('fam-lieu')!;
    const res = resolveKinshipTerms(lca, ha, lieu, 'north');
    assert.strictEqual(res.termAtoB, 'Chị dâu', 'Hà (vợ em) gọi Liễu (vợ anh) là Chị dâu');
    assert.strictEqual(res.termBtoA, 'Em dâu', 'Liễu (vợ anh) gọi Hà (vợ em) là Em dâu');

    // Đảo vai (Liễu gọi Hà)
    const lcaSwap = findLowestCommonAncestor('fam-lieu', 'fam-ha', membersMap, spouseMap);
    const resSwap = resolveKinshipTerms(lcaSwap, lieu, ha, 'north');
    assert.strictEqual(resSwap.termAtoB, 'Em dâu', 'Liễu gọi Hà là Em dâu');
    assert.strictEqual(resSwap.termBtoA, 'Chị dâu', 'Hà gọi Liễu là Chị dâu');
  });

  // =========================================================================
  // TC36: Cây Phả Hệ Trực Quan Nối Cầu Hôn Nhân (Breadcrumbs & Path)
  // =========================================================================
  it('TC36: Cây Phả Hệ Trực Quan Nối Cầu Hôn Nhân (Breadcrumbs & isSpouse Flags)', () => {
    // Cụ Uyên & Liễu (Bố chồng - Con dâu)
    const lca = findLowestCommonAncestor('fam-lieu', 'fam-uyen', membersMap, spouseMap);
    const lieu = membersMap.get('fam-lieu')!;
    const uyen = membersMap.get('fam-uyen')!;
    const res = resolveKinshipTerms(lca, lieu, uyen, 'north');

    // 1. Kiểm tra breadcrumbs chứa nhịp nối hôn phối
    const breadcrumbsStr = res.breadcrumbs.join(' ');
    assert.ok(
      breadcrumbsStr.includes('═(Hôn phối)═'),
      'Breadcrumbs phải chứa nhịp nối ═(Hôn phối)═ giữa Liễu và chồng Chiến'
    );

    // 2. Kiểm tra node người phối ngẫu ngoài họ có isSpouse: true và cầu nối huyết thống có isSpouseBridge: true
    const spouseNode = lca.pathA.find((n) => n.isSpouse);
    assert.ok(spouseNode, 'Đường đi pathA phải có node isSpouse đại diện cho người phối ngẫu ngoài họ');
    assert.strictEqual(spouseNode?.id, 'fam-lieu', 'Người mang cờ isSpouse là Liễu');

    const bridgeNode = lca.pathA.find((n) => n.isSpouseBridge);
    assert.ok(bridgeNode, 'Đường đi pathA phải có node isSpouseBridge đại diện cho cầu nối trong họ');
    assert.strictEqual(bridgeNode?.id, 'fam-chien', 'Cầu hôn phối của Liễu là chồng Chiến');

    // 3. Kiểm tra spouseBridge metadata
    assert.strictEqual(res.spouseBridge?.type, 'in_law');
    assert.strictEqual(res.spouseBridge?.spouseAId, 'fam-chien');
  });
});
