import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUpcomingAnniversariesFeed } from '@/lib/services/anniversary.service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days');
    const branch = searchParams.get('branch') || undefined;
    const viewerMemberId = searchParams.get('viewerMemberId') || undefined;
    const scope = searchParams.get('scope') || undefined;

    let daysAhead = 30;
    if (daysParam) {
      const parsed = parseInt(daysParam, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 90) {
        daysAhead = parsed;
      }
    }

    let effectiveViewerId = viewerMemberId;

    // Nếu chưa có viewerMemberId từ query, thử lấy từ session của user đăng nhập
    if (!effectiveViewerId) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('linked_member_id')
            .eq('id', user.id)
            .single();
          if (profile?.linked_member_id) {
            effectiveViewerId = profile.linked_member_id;
          }
        }
      } catch {
        // Bỏ qua lỗi auth để fallback khách
      }
    }

    // Tiêu thụ dữ liệu tập trung từ SSOT Domain Service
    const data = await getUpcomingAnniversariesFeed({
      daysAhead,
      viewerMemberId: effectiveViewerId,
      branch,
      scope,
    });

    const totalCount = data.reduce((acc, g) => acc + g.members.length, 0);

    return NextResponse.json({
      success: true,
      data,
      totalCount,
      daysAhead,
      timeZone: 'Asia/Ho_Chi_Minh',
      viewerMemberId: effectiveViewerId || null,
      scope: scope || null,
    });
  } catch (error) {
    console.error('Error fetching anniversaries:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching anniversaries' },
      { status: 500 }
    );
  }
}
