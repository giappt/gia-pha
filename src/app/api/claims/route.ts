import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validateProposedChildData, validateFindOriginData } from '@/lib/claims/claim-engine';
import type { ClaimRequestType, ProposedChildData } from '@/types/database';

async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  // 1. Test header bypass
  const headerUserId = request.headers.get('x-user-id');
  if (headerUserId) return headerUserId;

  // 2. Dev user cookie
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

  // 3. Supabase Auth
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

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để gửi yêu cầu kết nối gia phả' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      request_type,
      member_id,
      proposed_data,
      verification_notes,
    }: {
      request_type: ClaimRequestType;
      member_id?: string | null;
      proposed_data?: ProposedChildData | null;
      verification_notes?: string | null;
    } = body;

    if (!request_type || !['claim_existing', 'propose_child', 'find_origin'].includes(request_type)) {
      return NextResponse.json(
        { error: 'Loại yêu cầu không hợp lệ' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const db = admin || createClient();

    // 1. Kiểm tra xem người dùng đã có yêu cầu nào đang pending chưa
    const { data: existingPending } = await db
      .from('claim_requests')
      .select('id, claim_status')
      .eq('user_id', userId)
      .eq('claim_status', 'pending')
      .maybeSingle();

    if (existingPending) {
      return NextResponse.json(
        { error: 'Bạn đang có một yêu cầu đang chờ phê duyệt. Vui lòng đợi Ban Quản Trị xử lý.' },
        { status: 400 }
      );
    }

    // 2. Validate theo từng loại yêu cầu
    if (request_type === 'claim_existing') {
      if (!member_id) {
        return NextResponse.json(
          { error: 'Vui lòng chọn thành viên trên cây gia phả cần liên kết' },
          { status: 400 }
        );
      }

      // Kiểm tra thành viên này đã bị tài khoản khác liên kết chưa
      const { data: existingLinkedUser } = await db
        .from('users')
        .select('id, email, full_name')
        .eq('linked_member_id', member_id)
        .maybeSingle();

      if (existingLinkedUser && existingLinkedUser.id !== userId) {
        return NextResponse.json(
          { error: 'Hồ sơ thành viên này đã được liên kết với một tài khoản khác trong dòng họ.' },
          { status: 400 }
        );
      }
    } else if (request_type === 'propose_child') {
      const validation = validateProposedChildData(proposed_data);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        );
      }

      if (!proposed_data?.parent_id) {
        return NextResponse.json(
          { error: 'Vui lòng chọn Cha hoặc Mẹ trên cây gia phả để nối kết' },
          { status: 400 }
        );
      }
    } else if (request_type === 'find_origin') {
      const validation = validateFindOriginData(proposed_data);
      if (!validation.isValid) {
        return NextResponse.json(
          { error: validation.errors.join(', ') },
          { status: 400 }
        );
      }
    }

    // 3. Insert bản ghi vào claim_requests
    const insertPayload = {
      user_id: userId,
      member_id: request_type === 'claim_existing' ? member_id : null,
      request_type,
      claim_status: 'pending',
      proposed_data: proposed_data || null,
      verification_notes: verification_notes?.trim() || null,
    };

    const { data: createdClaim, error: insertError } = await db
      .from('claim_requests')
      .insert(insertPayload)
      .select('*')
      .single();

    if (insertError) {
      console.error('[POST /api/claims] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Không thể lưu yêu cầu kết nối gia phả. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Gửi yêu cầu kết nối gia phả thành công. Vui lòng chờ phê duyệt.',
        data: createdClaim,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[POST /api/claims] Unexpected exception:', err);
    return NextResponse.json(
      { error: err.message || 'Lỗi hệ thống khi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}
