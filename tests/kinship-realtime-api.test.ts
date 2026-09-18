import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { findLowestCommonAncestor } from '../src/lib/kinship-engine/lca-finder';
import { resolveKinshipTerms } from '../src/lib/kinship-engine/regional-dictionaries';
import type { Member } from '../src/types/database';

describe('Kinship Realtime & Schema Normalization Suite', () => {
  it('TC_INT_KINSHIP_API_QUERY: should verify /api/kinship queries generation_level and has 0 generation_number in SQL order', () => {
    const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'kinship', 'route.ts');
    const content = fs.readFileSync(routePath, 'utf8');

    assert.strictEqual(
      content.includes(".order('generation_number'"),
      false,
      'Must NOT query non-existent column generation_number in Supabase order'
    );
    assert.strictEqual(
      content.includes(".order('generation_level'"),
      true,
      'Must query existing column generation_level in Supabase order'
    );
  });

  it('TC_INT_KINSHIP_PAGE_NORMALIZATION: should verify kinship/page.tsx supports dynamic fetching and generation_level', () => {
    const pagePath = path.join(process.cwd(), 'src', 'app', 'kinship', 'page.tsx');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.strictEqual(
      content.includes('/api/members'),
      true,
      'Must fetch real clan members from /api/members'
    );
    assert.strictEqual(
      content.includes('generation_level'),
      true,
      'Must support generation_level for proper generation rendering'
    );
  });

  it('TC_UT_KINSHIP_ENGINE_WITH_GENERATION_LEVEL: should calculate LCA and kinship terms correctly with DB records (generation_level)', () => {
    // Giả lập 3 bản ghi chuẩn từ Supabase PostgreSQL chỉ có generation_level
    const dbAncestor: Member = {
      id: 'ancestor-001',
      full_name: 'Nguyễn Văn Tổ',
      alias_name: null,
      gender: 'male',
      life_status: 'deceased',
      father_id: null,
      mother_id: null,
      birth_date: null,
      birth_year: 1900,
      death_date: null,
      death_lunar_day: null,
      death_lunar_month: null,
      death_lunar_is_leap: false,
      death_lunar_year_name: null,
      death_year: 1970,
      burial_location: null,
      avatar_url: null,
      phone: null,
      address: null,
      biography: null,
      generation_level: 1,
      birth_order: 1,
      is_senior_branch: true,
      is_adopted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const dbChild1: Member = {
      ...dbAncestor,
      id: 'child-001',
      full_name: 'Nguyễn Văn Con Trưởng',
      father_id: 'ancestor-001',
      birth_year: 1930,
      generation_level: 2,
      birth_order: 1,
      is_senior_branch: true,
    };

    const dbChild2: Member = {
      ...dbAncestor,
      id: 'child-002',
      full_name: 'Nguyễn Thị Con Gái',
      gender: 'female',
      father_id: 'ancestor-001',
      birth_year: 1935,
      generation_level: 2,
      birth_order: 2,
      is_senior_branch: false,
    };

    const testMap = new Map<string, Member>([
      [dbAncestor.id, dbAncestor],
      [dbChild1.id, dbChild1],
      [dbChild2.id, dbChild2],
    ]);

    // 1. Kiểm tra quan hệ Trực hệ Bố - Con
    const lcaParentChild = findLowestCommonAncestor(dbAncestor.id, dbChild1.id, testMap);
    assert.strictEqual(lcaParentChild.lcaNodeId, dbAncestor.id);
    assert.strictEqual(lcaParentChild.lcaNode?.generationNumber, 1);
    assert.strictEqual(lcaParentChild.relationshipType, 'parent_child');

    const resParentChild = resolveKinshipTerms(lcaParentChild, dbAncestor, dbChild1, 'north');
    assert.strictEqual(resParentChild.termAtoB, 'Con');
    assert.strictEqual(resParentChild.termBtoA, 'Bố');

    // 2. Kiểm tra quan hệ Anh Em Ruột (cùng đời 2)
    const lcaSiblings = findLowestCommonAncestor(dbChild1.id, dbChild2.id, testMap);
    assert.strictEqual(lcaSiblings.lcaNodeId, dbAncestor.id);
    assert.strictEqual(lcaSiblings.relationshipType, 'sibling');

    const resSiblings = resolveKinshipTerms(lcaSiblings, dbChild1, dbChild2, 'north');
    assert.strictEqual(resSiblings.termAtoB, 'Em');
    assert.strictEqual(resSiblings.termBtoA, 'Anh');
  });
});
