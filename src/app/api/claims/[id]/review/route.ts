import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canUserReviewClaim } from '@/lib/claims/claim-engine';
import { resolveFeatureFlags } from '@/lib/admin/admin-engine';
import type { BranchNode, ClaimRequestRow, UserProfile, ClanFeatureFlags } from '@/types/database';
import type { MemberRecord, SpouseRelationRecord } from '@/types/tree';

export const dynamic = 'force-dynamic';

async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const cookieStore = cookies();
    const devUserCookie = cookieStore.get('fat_dev_user');
    if (devUserCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(devUserCookie.value));
        if (parsed?.id) return parsed.id;
      } catch {
        // ignore
      }
    }
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

async function getCurrentUserProfile(request: NextRequest, db: any): Promise<UserProfile | null> {
  const userId = await getCurrentUserId(request);
  if (!userId) return null;

  if (userId === '00000000-0000-0000-0000-000000000001') {
    return {
      id: userId,
      email: 'admin@giapha.vn',
      full_name: 'Giáp Phạm',
      user_role: 'super_admin',
      avatar_url: null,
      linked_member_id: null,
      assigned_branch_code: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    const cookieStore = cookies();
    const devUserCookie = cookieStore.get('fat_dev_user');
    if (devUserCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(devUserCookie.value));
        if (parsed?.id === userId) {
          return {
            id: parsed.id,
            email: parsed.email || 'dev@giapha.vn',
            full_name: parsed.full_name || 'Dev User',
            user_role: parsed.user_role || 'viewer',
            avatar_url: parsed.avatar_url || null,
            linked_member_id: parsed.linked_member_id || null,
            assigned_branch_code: parsed.assigned_branch_code || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
      } catch {
        // ignore
      }
    }
  }

  const { data: profile } = await db
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  return profile || null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claimId = params.id;
    if (!claimId) {
      return NextResponse.json({ error: 'Thiếu mã yêu cầu' }, { status: 400 });
    }

    const admin = createAdminClient();
    const db = admin || createClient();

    const userProfile = await getCurrentUserProfile(request, db);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện thao tác duyệt' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { decision, assigned_to, rejection_reason } = body;

    if (!decision || !['approved', 'rejected', 'assign'].includes(decision)) {
      return NextResponse.json(
        { error: 'Quyết định phê duyệt không hợp lệ (approved, rejected, assign)' },
        { status: 400 }
      );
    }

    // 1. Tải phiếu cần xử lý
    const { data: claim, error: fetchErr } = await db
      .from('claim_requests')
      .select('*')
      .eq('id', claimId)
      .maybeSingle();

    if (fetchErr || !claim) {
      return NextResponse.json(
        { error: 'Yêu cầu không tồn tại' },
        { status: 404 }
      );
    }

    if (claim.claim_status !== 'pending') {
      return NextResponse.json(
        { error: 'Yêu cầu này đã được xử lý trước đó' },
        { status: 400 }
      );
    }

    // 2. Tải ngữ cảnh phân quyền
    const [membersRes, clanRes, spouseRes] = await Promise.all([
      db.from('members').select('*'),
      db.from('clan_settings').select('branches, feature_flags').limit(1).maybeSingle(),
      db.from('spouse_relations').select('*'),
    ]);

    const members: MemberRecord[] = membersRes?.data || [];
    const branches: BranchNode[] = clanRes?.data?.branches || [];
    const spouseRelations: SpouseRelationRecord[] = spouseRes?.data || [];

    const membersMap = new Map<string, MemberRecord>();
    for (const m of members) {
      if (m?.id) membersMap.set(m.id, m);
    }

    // 3. Xử lý quyết định 'assign' (Giao việc cho Trưởng Chi)
    if (decision === 'assign') {
      if (userProfile.user_role !== 'super_admin') {
        return NextResponse.json(
          { error: 'Chỉ Quản Trị Viên Tối Cao mới có quyền ủy quyền phiếu cho Trưởng Chi' },
          { status: 403 }
        );
      }

      if (!assigned_to) {
        return NextResponse.json(
          { error: 'Vui lòng chọn Trưởng Chi để phân công xác minh' },
          { status: 400 }
        );
      }

      const { error: updateAssignErr } = await db
        .from('claim_requests')
        .update({
          assigned_to,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (updateAssignErr) {
        return NextResponse.json(
          { error: 'Không thể cập nhật phân công: ' + updateAssignErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Đã ủy quyền phiếu cho Trưởng Chi xác minh thành công',
      });
    }

    // 4. Kiểm tra quyền duyệt cho 'approved' hoặc 'rejected'
    const hasPermission = canUserReviewClaim(
      userProfile,
      claim,
      members,
      branches,
      spouseRelations
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Bạn không có quyền hạn phê duyệt hoặc từ chối phiếu này' },
        { status: 403 }
      );
    }

    // Rào chắn Cầu Dao Tổng (Circuit Breaker Gate):
    // Khi allow_family_claim_approval hoặc allow_member_self_edit bị tắt, đóng băng quyền tự duyệt của claimed_member
    if (userProfile.user_role === 'claimed_member') {
      let featureFlags: ClanFeatureFlags = resolveFeatureFlags(clanRes?.data?.feature_flags);
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        const cookieStore = cookies();
        const devFeatureFlagsStr = cookieStore.get('fat_dev_feature_flags')?.value;
        if (devFeatureFlagsStr) {
          try {
            featureFlags = resolveFeatureFlags(JSON.parse(devFeatureFlagsStr));
          } catch {
            // ignore
          }
        }
      }

      if (
        featureFlags.allow_family_claim_approval === false ||
        featureFlags.allow_member_self_edit === false
      ) {
        return NextResponse.json(
          {
            error:
              'Chức năng tự duyệt hồ sơ con cháu trong gia đình đang tạm đóng băng theo chính sách tông tộc. Vui lòng chuyển phiếu cho Trưởng Chi hoặc Ban Quản Trị.',
          },
          { status: 403 }
        );
      }
    }

    // 5. Xử lý 'rejected'
    if (decision === 'rejected') {
      const reason = rejection_reason?.trim() || 'Không thỏa mãn điều kiện đối chiếu thông tin';
      const { error: rejectErr } = await db
        .from('claim_requests')
        .update({
          claim_status: 'rejected',
          rejection_reason: reason,
          reviewed_by: userProfile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', claimId);

      if (rejectErr) {
        return NextResponse.json(
          { error: 'Lỗi khi từ chối yêu cầu: ' + rejectErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Đã từ chối yêu cầu kết nối gia phả',
      });
    }

    // 6. Xử lý 'approved'
    if (decision === 'approved') {
      if (claim.request_type === 'find_origin') {
        return NextResponse.json(
          {
            error:
              'Phiếu Tìm Cội Nguồn chưa rõ cha mẹ trên cây. Vui lòng hướng dẫn người nộp hoặc chọn Cha/Mẹ trước khi phê duyệt gắn node.',
          },
          { status: 400 }
        );
      }

      if (claim.request_type === 'claim_existing') {
        if (!claim.member_id) {
          return NextResponse.json(
            { error: 'Phiếu thiếu thông tin thành viên liên kết' },
            { status: 400 }
          );
        }

        // Kiểm tra an toàn: Node này đã bị ai liên kết trước đó chưa
        const { data: alreadyLinked } = await db
          .from('users')
          .select('id, full_name, email')
          .eq('linked_member_id', claim.member_id)
          .maybeSingle();

        if (alreadyLinked && alreadyLinked.id !== claim.user_id) {
          return NextResponse.json(
            { error: 'Hồ sơ thành viên này đã được liên kết với một tài khoản khác.' },
            { status: 400 }
          );
        }

        // Cập nhật users table
        await db
          .from('users')
          .update({
            linked_member_id: claim.member_id,
            user_role: 'claimed_member',
            updated_at: new Date().toISOString(),
          })
          .eq('id', claim.user_id);

        // Cập nhật claim_requests
        await db
          .from('claim_requests')
          .update({
            claim_status: 'approved',
            reviewed_by: userProfile.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', claimId);

        return NextResponse.json({
          success: true,
          message: 'Phê duyệt nhận hồ sơ thành viên thành công',
        });
      }

      if (claim.request_type === 'propose_child') {
        const pData = claim.proposed_data;
        if (!pData || !pData.parent_id) {
          return NextResponse.json(
            { error: 'Thiếu thông tin Cha/Mẹ đề xuất' },
            { status: 400 }
          );
        }

        const parent = membersMap.get(pData.parent_id);
        if (!parent) {
          return NextResponse.json(
            { error: 'Không tìm thấy thông tin Cha/Mẹ trên cây gia phả' },
            { status: 404 }
          );
        }

        const genLevel = (parent.generation_level || 1) + 1;
        let fatherId: string | null = null;
        let motherId: string | null = null;

        if (parent.gender === 'male') {
          fatherId = parent.id;
          motherId = pData.spouse_id || null;
        } else {
          motherId = parent.id;
          fatherId = pData.spouse_id || null;
        }

        // Tịnh tiến thứ tự sinh (Insert & Shift)
        const targetOrder = pData.birth_order ? Number(pData.birth_order) : 1;

        // Lấy toàn bộ con hiện có của cha mẹ này
        const siblings = members.filter(
          (m) =>
            (fatherId && m.father_id === fatherId) ||
            (motherId && m.mother_id === motherId)
        );

        // Shift các con có birth_order >= targetOrder
        const siblingsToShift = siblings.filter(
          (s) => s.birth_order != null && s.birth_order >= targetOrder
        );

        for (const s of siblingsToShift) {
          await db
            .from('members')
            .update({
              birth_order: (s.birth_order || 0) + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', s.id);
        }

        // Tạo bản ghi mới trong members
        const newMemberPayload = {
          full_name: pData.full_name,
          gender: pData.gender,
          birth_year: pData.birth_year ? Number(pData.birth_year) : null,
          birth_order: targetOrder,
          is_senior: Boolean(pData.is_senior),
          father_id: fatherId,
          mother_id: motherId,
          generation_level: genLevel,
          life_status: 'living',
          is_root: false,
          notes: pData.notes || null,
        };

        const { data: newMember, error: insertMemErr } = await db
          .from('members')
          .insert(newMemberPayload)
          .select('*')
          .single();

        if (insertMemErr || !newMember) {
          return NextResponse.json(
            { error: 'Không thể tạo bản ghi thành viên mới: ' + insertMemErr?.message },
            { status: 500 }
          );
        }

        // Cập nhật users table
        await db
          .from('users')
          .update({
            linked_member_id: newMember.id,
            user_role: 'claimed_member',
            updated_at: new Date().toISOString(),
          })
          .eq('id', claim.user_id);

        // Cập nhật claim_requests
        await db
          .from('claim_requests')
          .update({
            claim_status: 'approved',
            member_id: newMember.id,
            reviewed_by: userProfile.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', claimId);

        return NextResponse.json({
          success: true,
          message: 'Phê duyệt đề xuất nối con mới vào gia phả thành công',
          data: {
            member: newMember,
          },
        });
      }
    }

    return NextResponse.json({ error: 'Thao tác không được hỗ trợ' }, { status: 400 });
  } catch (err: any) {
    console.error('[PATCH /api/claims/:id/review] Exception:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống khi xử lý phê duyệt' },
      { status: 500 }
    );
  }
}
