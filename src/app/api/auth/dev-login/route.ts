import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

const DEV_MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'giap.pt.90@gmail.com',
  full_name: 'Giáp Phạm',
  user_role: 'super_admin' as const,
  avatar_url: null,
};

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cookieStore = cookies();

  if (searchParams.get('action') === 'login' || searchParams.get('login') === '1') {
    cookieStore.set('fat_dev_user', JSON.stringify(DEV_MOCK_USER), {
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
    });
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (searchParams.get('action') === 'logout' || searchParams.get('logout') === '1') {
    cookieStore.delete('fat_dev_user');
    return NextResponse.redirect(new URL('/', request.url));
  }

  const devUserCookie = cookieStore.get('fat_dev_user');
  return NextResponse.json({
    active: !!devUserCookie?.value,
    user: devUserCookie?.value ? JSON.parse(devUserCookie.value) : null,
  });
}

export async function POST() {
  // Production security gate: completely disabled in production
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Set cookie for dev session immediately (instant response, zero network latency)
  const cookieStore = cookies();
  cookieStore.set('fat_dev_user', JSON.stringify(DEV_MOCK_USER), {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({ success: true, user: DEV_MOCK_USER });
}

export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cookieStore = cookies();
  cookieStore.delete('fat_dev_user');

  return NextResponse.json({ success: true });
}
