import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint } = body || {};

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Trường endpoint là bắt buộc' },
        { status: 400 }
      );
    }

    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();

      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);
    } catch (dbErr) {
      console.warn('[POST /api/push/unsubscribe] DB delete warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('Error in /api/push/unsubscribe:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
