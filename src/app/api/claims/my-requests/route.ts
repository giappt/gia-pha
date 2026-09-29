import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ success: true, data: null });
    }

    const admin = createAdminClient();
    const db = admin || createClient();

    // Lấy yêu cầu pending mới nhất của người dùng
    const { data: claim, error } = await db
      .from('claim_requests')
      .select('*')
      .eq('user_id', userId)
      .eq('claim_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[GET /api/claims/my-requests] Query error:', error);
      return NextResponse.json({ success: true, data: null });
    }

    if (!claim) {
      return NextResponse.json({ success: true, data: null });
    }

    // Nếu claim có member_id, lấy thêm thông tin member để hiển thị
    let linkedMember = null;
    if (claim.member_id) {
      const { data: m } = await db
        .from('members')
        .select('id, full_name, gender, generation_level, birth_year')
        .eq('id', claim.member_id)
        .maybeSingle();
      linkedMember = m;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...claim,
        linked_member: linkedMember,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Lỗi kiểm tra yêu cầu cá nhân' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const admin = createAdminClient();
    const db = admin || createClient();

    // Hủy yêu cầu pending
    const { error } = await db
      .from('claim_requests')
      .delete()
      .eq('user_id', userId)
      .eq('claim_status', 'pending');

    if (error) {
      return NextResponse.json({ error: 'Không thể hủy yêu cầu' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã hủy yêu cầu kết nối gia phả thành công',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Lỗi khi hủy yêu cầu' },
      { status: 500 }
    );
  }
}
