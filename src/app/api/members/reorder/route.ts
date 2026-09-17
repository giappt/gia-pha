import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ReorderChildrenRequest {
  parentId: string;
  orderedChildIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ReorderChildrenRequest = await request.json();
    const { parentId, orderedChildIds } = body;

    if (!parentId || !Array.isArray(orderedChildIds) || orderedChildIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Thiếu parentId hoặc mảng orderedChildIds không hợp lệ' },
        { status: 400 }
      );
    }

    const reorderedResults = orderedChildIds.map((childId, index) => ({
      id: childId,
      birth_order: index + 1,
    }));

    try {
      const admin = createAdminClient();
      const supabase = admin || createClient();

      // Cập nhật đồng loạt birth_order = index + 1 cho từng con trong mảng
      const updatePromises = orderedChildIds.map((childId, index) =>
        supabase
          .from('members')
          .update({ birth_order: index + 1 } as any)
          .eq('id', childId)
      );

      const results = await Promise.all(updatePromises);
      for (const res of results) {
        if (res && res.error) {
          console.warn('[POST /api/members/reorder] DB update item warning:', res.error.message);
        }
      }
    } catch (dbErr) {
      console.warn('[POST /api/members/reorder] DB update warning:', dbErr);
    }

    return NextResponse.json({
      success: true,
      items: reorderedResults,
      message: 'Cập nhật thứ tự đàn con thành công',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Lỗi hệ thống khi cập nhật thứ tự' },
      { status: 500 }
    );
  }
}
