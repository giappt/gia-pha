import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canUserReviewClaim } from '@/lib/claims/claim-engine';
import type { BranchNode, ClaimRequestRow, UserProfile } from '@/types/database';
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

  // Check dev user cookie override
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

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const db = admin || createClient();

    const userProfile = await getCurrentUserProfile(request, db);
    if (!userProfile) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để xem danh sách phê duyệt' },
        { status: 401 }
      );
    }

    // Khách / viewer không gắn node không có quyền duyệt
    if (userProfile.user_role === 'viewer' && !userProfile.linked_member_id) {
      return NextResponse.json(
        { error: 'Bạn không có quyền truy cập hàng đợi phê duyệt hồ sơ' },
        { status: 403 }
      );
    }

    // 1. Tải toàn bộ phiếu pending
    const { data: rawClaims, error: claimsErr } = await db
      .from('claim_requests')
      .select('*')
      .eq('claim_status', 'pending')
      .order('created_at', { ascending: false });

    if (claimsErr) {
      console.error('[GET /api/claims/pending] DB query error:', claimsErr);
      return NextResponse.json(
        { error: 'Lỗi truy vấn cơ sở dữ liệu' },
        { status: 500 }
      );
    }

    const allClaims: ClaimRequestRow[] = rawClaims || [];

    // 2. Tải ngữ cảnh phụ trợ (members, branches, spouse_relations) để chạy canUserReviewClaim
    const [membersRes, clanRes, spouseRes, usersRes] = await Promise.all([
      db.from('members').select('*'),
      db.from('clan_settings').select('branches').limit(1).maybeSingle(),
      db.from('spouse_relations').select('*'),
      db.from('users').select('id, email, full_name, avatar_url'),
    ]);

    const members: MemberRecord[] = membersRes?.data || [];
    const branches: BranchNode[] = clanRes?.data?.branches || [];
    const spouseRelations: SpouseRelationRecord[] = spouseRes?.data || [];
    const allUsers = usersRes?.data || [];

    const membersMap = new Map<string, MemberRecord>();
    for (const m of members) {
      if (m?.id) membersMap.set(m.id, m);
    }

    const usersMap = new Map<string, { id: string; email: string; full_name: string | null; avatar_url: string | null }>();
    for (const u of allUsers) {
      if (u?.id) usersMap.set(u.id, u);
    }

    // 3. Lọc scoped claims qua canUserReviewClaim
    const visibleClaims = allClaims.filter((claim) =>
      canUserReviewClaim(userProfile, claim, members, branches, spouseRelations)
    );

    // 4. Enrich dữ liệu cho frontend
    const enrichedData = visibleClaims.map((claim) => {
      const applicant = usersMap.get(claim.user_id) || {
        id: claim.user_id,
        email: 'N/A',
        full_name: 'Người dùng',
        avatar_url: null,
      };

      let targetMember = null;
      if (claim.member_id) {
        const m = membersMap.get(claim.member_id);
        if (m) {
          targetMember = {
            id: m.id,
            full_name: m.full_name,
            gender: m.gender,
            generation_level: m.generation_level,
            birth_year: m.birth_year,
          };
        }
      }

      let proposedParent = null;
      if (claim.proposed_data?.parent_id) {
        const p = membersMap.get(claim.proposed_data.parent_id);
        if (p) {
          proposedParent = {
            id: p.id,
            full_name: p.full_name,
            gender: p.gender,
            generation_level: p.generation_level,
          };
        }
      }

      let assignedEditor = null;
      if (claim.assigned_to) {
        const e = usersMap.get(claim.assigned_to);
        if (e) {
          assignedEditor = {
            id: e.id,
            email: e.email,
            full_name: e.full_name,
          };
        }
      }

      return {
        ...claim,
        applicant,
        target_member: targetMember,
        proposed_parent: proposedParent,
        assigned_editor: assignedEditor,
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedData,
    });
  } catch (err: any) {
    console.error('[GET /api/claims/pending] Exception:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi máy chủ khi lấy danh sách phiếu chờ duyệt' },
      { status: 500 }
    );
  }
}
