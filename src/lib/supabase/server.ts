import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const client = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });

  // Dev Mock User interception (strictly in development mode)
  if (process.env.NODE_ENV === 'development') {
    const devUserCookie = cookieStore.get('fat_dev_user');
    if (devUserCookie?.value) {
      try {
        const parsed = JSON.parse(devUserCookie.value);
        const originalGetUser = client.auth.getUser.bind(client.auth);
        client.auth.getUser = async (jwt?: string) => {
          const realUserResult = await originalGetUser(jwt);
          if (realUserResult.data?.user) {
            return realUserResult;
          }
          return {
            data: {
              user: {
                id: parsed.id,
                app_metadata: { provider: 'dev' },
                user_metadata: {
                  full_name: parsed.full_name,
                  avatar_url: parsed.avatar_url,
                },
                aud: 'authenticated',
                created_at: new Date().toISOString(),
                email: parsed.email,
                phone: '',
                role: 'authenticated',
                updated_at: new Date().toISOString(),
              } as any,
            },
            error: null,
          };
        };
      } catch {
        // ignore parse error
      }
    }
  }

  return client;
}
