import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
  supabase: ReturnType<typeof createServerClient> | null;
}> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, user: null, supabase: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh user session
  let user: User | null = null;
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    user = null;
  }

  // Dev mode: Kiểm tra cookie giả lập nếu chưa có session Supabase
  if (!user && process.env.NODE_ENV === 'development') {
    const devCookie = request.cookies.get('fat_dev_user');
    if (devCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(devCookie.value));
        if (parsed?.id) {
          user = {
            id: parsed.id,
            email: parsed.email,
            user_metadata: {
              full_name: parsed.full_name,
              avatar_url: parsed.avatar_url,
            },
          } as unknown as User;
        }
      } catch {
        // bỏ qua nếu cookie hỏng
      }
    }
  }

  return { response, user, supabase };
}
