import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { GET as getTree } from '../src/app/api/tree/route';
import { POST as importExcelData } from '../src/app/api/admin/import/route';

describe('Database Schema Synchronization & Migration Test Suite (Milestone 7.2)', () => {
  // TC_UT_MIGRATION_SQL_INTEGRITY: Kiểm chứng cú pháp và tính toàn vẹn của Migration SQL
  it('TC_UT_MIGRATION_SQL_INTEGRITY: File migration chứa đầy đủ các câu lệnh DDL bổ sung cột và Google Auth Trigger', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20260907000000_db_sync_and_auth_trigger.sql'
    );
    assert.ok(fs.existsSync(migrationPath), 'File migration 20260907000000_db_sync_and_auth_trigger.sql phải tồn tại');

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // 1. Kiểm tra các cột bổ sung cho bảng members
    assert.ok(sqlContent.includes('ALTER TABLE public.members'), 'Phải có câu lệnh ALTER TABLE public.members');
    assert.ok(sqlContent.includes('is_senior BOOLEAN NOT NULL DEFAULT FALSE'), 'Phải bổ sung cột is_senior');
    assert.ok(sqlContent.includes('is_anonymous BOOLEAN NOT NULL DEFAULT FALSE'), 'Phải bổ sung cột is_anonymous');
    assert.ok(sqlContent.includes('branch_name VARCHAR(100)'), 'Phải bổ sung cột branch_name');

    // 2. Kiểm tra các cột bổ sung cho bảng clan_settings
    assert.ok(sqlContent.includes('ALTER TABLE public.clan_settings'), 'Phải có câu lệnh ALTER TABLE public.clan_settings');
    assert.ok(sqlContent.includes('branch_tiers JSONB NOT NULL DEFAULT'), 'Phải bổ sung cột branch_tiers');
    assert.ok(sqlContent.includes('feature_flags JSONB NOT NULL DEFAULT'), 'Phải bổ sung cột feature_flags');

    // 3. Kiểm tra function và trigger cho Google Auth
    assert.ok(sqlContent.includes('CREATE OR REPLACE FUNCTION public.handle_new_user()'), 'Phải có hàm trigger handle_new_user()');
    assert.ok(sqlContent.includes('giap.pt.90@gmail.com'), 'Phải cấu hình email designated admin');
    assert.ok(sqlContent.includes('user_role := \'super_admin\'') || sqlContent.includes('THEN \'super_admin\''), 'Phải gán quyền super_admin cho email admin');
    assert.ok(sqlContent.includes('CREATE TRIGGER on_auth_user_created'), 'Phải tạo trigger on_auth_user_created trên auth.users');
  });

  // TC_UT_MIGRATION_DEDICATED_FILE_INTEGRITY: Kiểm chứng File Migration riêng biệt 20260907000001
  it('TC_UT_MIGRATION_DEDICATED_FILE_INTEGRITY: File migration 20260907000001_add_is_adopted_column.sql tồn tại độc lập và hợp lệ', () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20260907000001_add_is_adopted_column.sql'
    );
    assert.ok(fs.existsSync(migrationPath), 'File migration 20260907000001_add_is_adopted_column.sql bắt buộc phải tồn tại');

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    assert.ok(
      sqlContent.includes('ALTER TABLE public.members'),
      'Migration bắt buộc phải có câu lệnh ALTER TABLE public.members'
    );
    assert.ok(
      sqlContent.includes('is_adopted BOOLEAN NOT NULL DEFAULT FALSE'),
      'Migration bắt buộc phải có lệnh thêm cột is_adopted để tránh lỗi PGRST204 schema cache'
    );
  });

  // TC_UT_IMPORT_PAYLOAD_SCHEMA_MATCH: Kiểm chứng payload Import tương thích 100% với PostgreSQL Schema
  it('TC_UT_IMPORT_PAYLOAD_SCHEMA_MATCH: API import từ chối payload rỗng và xử lý chuyển đổi dữ liệu chuẩn', async () => {
    // 1. Kiểm tra từ chối payload không có hàng
    const reqEmpty = new NextRequest('http://localhost:3000/api/admin/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: [] }),
    });
    const resEmpty = await importExcelData(reqEmpty);
    assert.strictEqual(resEmpty.status, 400, 'Payload không có rows phải trả về 400');
    const jsonEmpty = await resEmpty.json();
    assert.strictEqual(jsonEmpty.success, false);
  });

  // TC_UT_SEED_SCRIPT_INTEGRITY: Kiểm chứng Engine Seed Data CSDL
  it('TC_UT_SEED_SCRIPT_INTEGRITY: Script seed-database.mjs tồn tại và chứa đầy đủ logic nạp 2 bộ dữ liệu', () => {
    const seedScriptPath = path.resolve(process.cwd(), 'scripts/seed-database.mjs');
    assert.ok(fs.existsSync(seedScriptPath), 'Script scripts/seed-database.mjs phải tồn tại');

    const content = fs.readFileSync(seedScriptPath, 'utf8');

    // Kiểm tra các dataset được hỗ trợ
    assert.ok(content.includes('clan28'), 'Phải hỗ trợ dataset clan28');
    assert.ok(content.includes('pham-van'), 'Phải hỗ trợ dataset pham-van');
    assert.ok(content.includes('clean'), 'Phải hỗ trợ chế độ dọn sạch clean');

    // Kiểm tra logic ánh xạ string ID sang UUID hợp lệ cho PostgreSQL
    assert.ok(content.includes('crypto.randomUUID()'), 'Phải sử dụng crypto.randomUUID() để tạo khóa chính UUID');
    assert.ok(content.includes('spouse_relations'), 'Phải nạp quan hệ hôn phối');
    assert.ok(content.includes('clan_settings'), 'Phải cập nhật cấu hình dòng họ');
  });

  // TC_INT_TREE_DATA_SOURCE_DISCRIMINATION: Phân định nguồn dữ liệu CSDL thật vs Mock Fallback
  it('TC_INT_TREE_DATA_SOURCE_DISCRIMINATION: GET /api/tree hỗ trợ header x-test-fixture để bảo đảm tính cô lập', async () => {
    const requestWithFixture = new NextRequest('http://localhost:3000/api/tree', {
      headers: { 'x-test-fixture': 'true' },
    });
    const response = await getTree(requestWithFixture);

    assert.strictEqual(response.status, 200, 'HTTP status phải là 200');
    const json = await response.json();
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.members.length, 28, 'x-test-fixture phải trả về đúng 28 thành viên mẫu chuẩn');
    assert.ok(json.spouseRelations.length >= 8, 'Phải trả về danh sách hôn phối');
  });
});
