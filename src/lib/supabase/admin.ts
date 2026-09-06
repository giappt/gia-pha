import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Admin Client với quyền Service Role Key.
 * Dùng độc quyền trên Server API Routes để thực hiện các lệnh Mutation (INSERT/UPDATE/DELETE),
 * vượt qua rào cản Row Level Security (RLS) của Supabase một cách an toàn và hợp chuẩn.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
