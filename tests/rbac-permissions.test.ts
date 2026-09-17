import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { NextRequest } from 'next/server';
import {
  ROLE_PERMISSIONS,
  hasPermission,
  canManageTree,
  extractUserRoleFromRequest,
  verifyServerRole,
} from '../src/lib/auth/permissions';
import { POST as createMember } from '../src/app/api/members/route';
import { PUT as updateMember, DELETE as deleteMember } from '../src/app/api/members/[id]/route';
import { POST as importExcel } from '../src/app/api/admin/import/route';

describe('RBAC Permissions & Read-Only Tree Security Suite (Milestone 4 - Spec 4.6 & 5.10)', () => {
  // 1. TC_UT_RBAC_PERMISSIONS_MATRIX
  it('TC_UT_RBAC_PERMISSIONS_MATRIX: ma trận quyền ROLE_PERMISSIONS cho 4 vai trò chính xác', () => {
    // Viewer: chỉ được xem cây
    assert.deepStrictEqual(ROLE_PERMISSIONS.viewer, ['tree:view']);
    assert.strictEqual(hasPermission('viewer', 'tree:view'), true);
    assert.strictEqual(hasPermission('viewer', 'tree:edit_member'), false);
    assert.strictEqual(hasPermission('viewer', 'tree:delete_member'), false);
    assert.strictEqual(hasPermission('viewer', 'excel:import'), false);
    assert.strictEqual(canManageTree('viewer'), false);

    // Claimed Member: chỉ được xem cây (và các tính năng cá nhân)
    assert.deepStrictEqual(ROLE_PERMISSIONS.claimed_member, ['tree:view']);
    assert.strictEqual(hasPermission('claimed_member', 'tree:view'), true);
    assert.strictEqual(hasPermission('claimed_member', 'tree:edit_member'), false);
    assert.strictEqual(canManageTree('claimed_member'), false);

    // Branch Editor: có quyền sửa cây trong chi
    assert.strictEqual(hasPermission('branch_editor', 'tree:view'), true);
    assert.strictEqual(hasPermission('branch_editor', 'tree:edit_member'), true);
    assert.strictEqual(hasPermission('branch_editor', 'tree:delete_member'), true);
    assert.strictEqual(hasPermission('branch_editor', 'tree:manage_unlinked'), true);
    assert.strictEqual(hasPermission('branch_editor', 'excel:import'), false);
    assert.strictEqual(canManageTree('branch_editor'), true);

    // Super Admin: toàn quyền hệ thống
    assert.strictEqual(hasPermission('super_admin', 'tree:view'), true);
    assert.strictEqual(hasPermission('super_admin', 'tree:edit_member'), true);
    assert.strictEqual(hasPermission('super_admin', 'tree:delete_member'), true);
    assert.strictEqual(hasPermission('super_admin', 'excel:import'), true);
    assert.strictEqual(hasPermission('super_admin', 'admin:access'), true);
    assert.strictEqual(canManageTree('super_admin'), true);

    // Null/Undefined role
    assert.strictEqual(hasPermission(null, 'tree:view'), false);
    assert.strictEqual(canManageTree(undefined), false);
  });

  // 2. TC_UT_API_MEMBERS_REJECTS_VIEWER
  it('TC_UT_API_MEMBERS_REJECTS_VIEWER: POST /api/members từ chối tài khoản viewer với HTTP 403', async () => {
    const payload = {
      full_name: 'Người Mới Không Được Phép',
      gender: 'male',
      life_status: 'living',
    };

    const request = new NextRequest('http://localhost:3000/api/members', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'viewer',
      },
      body: JSON.stringify(payload),
    });

    const response = await createMember(request);
    assert.strictEqual(response.status, 403, 'Status code phải là 403 Forbidden');

    const json = await response.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('không có quyền'));
  });

  // 3. TC_UT_API_MEMBERS_UPDATE_REJECTS_VIEWER
  it('TC_UT_API_MEMBERS_UPDATE_REJECTS_VIEWER: PUT /api/members/[id] từ chối tài khoản viewer với HTTP 403', async () => {
    const payload = {
      full_name: 'Cố Tình Sửa Hồ Sơ',
    };

    const request = new NextRequest('http://localhost:3000/api/members/m-root-khoi', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'viewer',
      },
      body: JSON.stringify(payload),
    });

    const response = await updateMember(request, { params: { id: 'm-root-khoi' } });
    assert.strictEqual(response.status, 403, 'Status code phải là 403 Forbidden');

    const json = await response.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('không có quyền'));
  });

  // 4. TC_UT_API_MEMBERS_DELETE_REJECTS_VIEWER
  it('TC_UT_API_MEMBERS_DELETE_REJECTS_VIEWER: DELETE /api/members/[id] từ chối tài khoản viewer với HTTP 403', async () => {
    const request = new NextRequest('http://localhost:3000/api/members/m-gen4-phong', {
      method: 'DELETE',
      headers: {
        'x-user-role': 'viewer',
      },
    });

    const response = await deleteMember(request, { params: { id: 'm-gen4-phong' } });
    assert.strictEqual(response.status, 403, 'Status code phải là 403 Forbidden');

    const json = await response.json();
    assert.strictEqual(json.success, false);
    assert.ok(json.error.includes('không có quyền'));
  });

  // 5. TC_UT_API_IMPORT_REQUIRES_SUPER_ADMIN
  it('TC_UT_API_IMPORT_REQUIRES_SUPER_ADMIN: POST /api/admin/import chỉ cho phép super_admin, chặn viewer và branch_editor', async () => {
    // Case 1: Viewer bị chặn
    const viewerReq = new NextRequest('http://localhost:3000/api/admin/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'viewer',
      },
      body: JSON.stringify({ rows: [{ stt: 1, fullName: 'Test' }] }),
    });

    const viewerRes = await importExcel(viewerReq);
    assert.strictEqual(viewerRes.status, 403, 'Viewer phải bị chặn HTTP 403');

    // Case 2: Branch Editor cũng bị chặn (nhập Excel là quyền tối thượng của Super Admin)
    const editorReq = new NextRequest('http://localhost:3000/api/admin/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'branch_editor',
      },
      body: JSON.stringify({ rows: [{ stt: 1, fullName: 'Test' }] }),
    });

    const editorRes = await importExcel(editorReq);
    assert.strictEqual(editorRes.status, 403, 'Branch Editor phải bị chặn HTTP 403');
  });

  // 6. TC_UT_TREE_PAGE_PASSES_USER_ROLE
  it('TC_UT_TREE_PAGE_PASSES_USER_ROLE: src/app/tree/page.tsx trích xuất role và truyền canManageTree', () => {
    const filePath = path.join(process.cwd(), 'src/app/tree/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('canManageTree'), 'Phải import và sử dụng canManageTree trong TreePage');
    assert.ok(content.includes('userRole'), 'Phải khai báo userRole');
    assert.ok(content.includes('canManageTree={canManage}'), 'Phải truyền canManageTree prop vào FamilyTreeCanvas');
  });

  // 7. TC_UT_TOOLBAR_HIDES_ADD_AND_UNLINKED_FOR_VIEWER
  it('TC_UT_TOOLBAR_HIDES_ADD_AND_UNLINKED_FOR_VIEWER: TreeToolbar ẩn nút Thêm người và Khay chưa nối khi canManageTree = false', () => {
    const filePath = path.join(process.cwd(), 'src/components/tree/TreeToolbar.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Kiểm tra nút Thêm người có rào chắn canManageTree
    assert.ok(
      content.includes('canManageTree && onOpenAddMemberModal'),
      'Nút Thêm người phải được bảo vệ bởi điều kiện canManageTree'
    );

    // Kiểm tra nút Khay chưa nối có rào chắn canManageTree
    assert.ok(
      content.includes('canManageTree && unlinkedCount > 0 && onOpenUnlinkedDrawer'),
      'Nút Khay chưa nối phải được bảo vệ bởi điều kiện canManageTree'
    );

    // Kiểm tra nút Khóa phả đồ có hiển thị trạng thái Cố định cho viewer
    assert.ok(
      content.includes('canManageTree && onToggleLock ?'),
      'Khóa phả đồ chỉ cho phép toggle khi canManageTree === true'
    );
  });

  // 8. TC_UT_DRAWER_HIDES_EDIT_DELETE_FOR_VIEWER
  it('TC_UT_DRAWER_HIDES_EDIT_DELETE_FOR_VIEWER: MemberDetailDrawer ẩn nút Sửa và Xóa hồ sơ khi canManageTree = false', () => {
    const filePath = path.join(process.cwd(), 'src/components/tree/MemberDetailDrawer.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // Kiểm tra nút Sửa hồ sơ
    assert.ok(
      content.includes('canManageTree && onEditMember && target'),
      'Nút Sửa hồ sơ phải được bảo vệ bởi điều kiện canManageTree'
    );

    // Kiểm tra nút Xóa hồ sơ
    assert.ok(
      content.includes('canManageTree && onDeleteMember && target'),
      'Nút Xóa hồ sơ phải được bảo vệ bởi điều kiện canManageTree'
    );
  });
});
