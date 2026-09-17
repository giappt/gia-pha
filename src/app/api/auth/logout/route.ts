import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase server signOut warning:', err);
  }

  const cookieStore = cookies();
  cookieStore.delete('fat_dev_user');
  cookieStore.delete('fat_feature_flags_cache');

  const response = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất thành công',
  });

  // Explicitly clear cookies on response headers for complete client coverage
  response.cookies.delete('fat_dev_user');
  response.cookies.delete('fat_feature_flags_cache');

  return response;
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Supabase server signOut warning:', err);
  }

  const cookieStore = cookies();
  cookieStore.delete('fat_dev_user');
  cookieStore.delete('fat_feature_flags_cache');

  const response = NextResponse.redirect(new URL('/', request.url));
  response.cookies.delete('fat_dev_user');
  response.cookies.delete('fat_feature_flags_cache');

  return response;
}
