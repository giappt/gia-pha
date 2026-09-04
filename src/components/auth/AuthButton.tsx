'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/database';
import { LogIn, LogOut, ShieldCheck, User as UserIcon, Loader2, Sparkles, Settings } from 'lucide-react';

function getDevCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)fat_dev_user=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export default function AuthButton({
  initialUser = null,
  initialProfile = null,
}: {
  initialUser?: User | null;
  initialProfile?: UserProfile | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    // If server already provided user and profile, use it directly
    if (initialUser) {
      setUser(initialUser);
      if (initialProfile) {
        setProfile(initialProfile);
      }
      return;
    }

    async function getUserAndProfile() {
      // 1. In dev mode: Fast-check dev cookie immediately
      if (process.env.NODE_ENV === 'development') {
        const devUser = getDevCookie();
        if (devUser && isMounted) {
          setUser({
            id: devUser.id,
            email: devUser.email,
            user_metadata: {
              full_name: devUser.full_name,
              avatar_url: devUser.avatar_url,
            },
          } as unknown as User);

          setProfile({
            id: devUser.id,
            email: devUser.email,
            full_name: devUser.full_name,
            user_role: devUser.user_role,
            avatar_url: devUser.avatar_url,
            linked_member_id: null,
            assigned_branch_code: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          return;
        }
      }

      // Check if any supabase auth cookie exists
      const hasSupabaseCookie = typeof document !== 'undefined' && document.cookie.includes('sb-');
      if (!hasSupabaseCookie) {
        // Definite guest user, no need to make remote network request
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
        return;
      }

      // 2. Fetch Supabase session with a strict timeout to prevent hanging
      try {
        setIsLoading(true);
        const fetchPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null }, error: new Error('Auth timeout') }), 1500)
        );

        const {
          data: { user: currentUser },
        } = await Promise.race([fetchPromise, timeoutPromise]);

        if (!isMounted) return;

        if (currentUser) {
          setUser(currentUser);
          try {
            const profilePromise = supabase
              .from('users')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            const profileTimeout = new Promise<{ data: null }>((resolve) =>
              setTimeout(() => resolve({ data: null }), 1500)
            );
            const { data: userProfile } = await Promise.race([profilePromise, profileTimeout]);
            if (userProfile && isMounted) {
              setProfile(userProfile as UserProfile);
            }
          } catch {
            // Profile fetch error fallback
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('Supabase auth network check timed out or skipped:', err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    getUserAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      if (currentUser) {
        setUser(currentUser);
        try {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          if (userProfile && isMounted) {
            setProfile(userProfile as UserProfile);
          }
        } catch {
          // ignore error
        }
      } else if (process.env.NODE_ENV === 'development') {
        const devUser = getDevCookie();
        if (devUser) {
          setUser({
            id: devUser.id,
            email: devUser.email,
            user_metadata: {
              full_name: devUser.full_name,
              avatar_url: devUser.avatar_url,
            },
          } as unknown as User);
        } else {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) {
        console.error('Google OAuth error:', error);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login exception:', err);
      setIsLoading(false);
    }
  };

  const handleDevLogin = () => {
    setIsLoading(true);
    window.location.href = '/api/auth/dev-login?action=login';
  };

  const handleLogout = async () => {
    setIsLoading(true);
    if (process.env.NODE_ENV === 'development') {
      window.location.href = '/api/auth/dev-login?action=logout';
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsOpen(false);
    setIsLoading(false);
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800 animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
        <span className="text-xs">Đang kiểm tra...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button
          id="login-google-btn"
          onClick={handleLogin}
          className="flex items-center gap-2 px-3.5 py-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all duration-150 rounded-lg shadow-sm shadow-emerald-700/20"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Đăng nhập Google</span>
        </button>

        {process.env.NODE_ENV === 'development' && (
          <a
            id="dev-login-btn"
            href="/api/auth/dev-login?action=login"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/60 active:scale-95 transition-all rounded-lg"
            title="Bypass đăng nhập Google cấp quyền Super Admin cho môi trường Dev"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Dev Bypass</span>
          </a>
        )}
      </div>
    );
  }

  const isSuperAdmin = profile?.user_role === 'super_admin';
  const roleTitle = isSuperAdmin
    ? 'Super Admin'
    : profile?.user_role === 'branch_editor'
    ? 'Trưởng Chi'
    : profile?.user_role === 'claimed_member'
    ? 'Con Cháu Họ'
    : 'Khách Xem';

  const roleBadgeStyle = isSuperAdmin
    ? 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
    : profile?.user_role === 'branch_editor'
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
    : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="user-menu-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 pr-2.5 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors border border-slate-200/80 dark:border-slate-800"
      >
        {user.user_metadata?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name || 'User Avatar'}
            className="w-7 h-7 rounded-full border border-emerald-500 object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            {(user.email?.[0] || 'U').toUpperCase()}
          </div>
        )}

        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[120px] truncate">
            {user.user_metadata?.full_name || user.email?.split('@')[0]}
          </span>
          <span
            className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${roleBadgeStyle} inline-block leading-tight`}
          >
            {roleTitle}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {user.user_metadata?.full_name || 'Người dùng'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${roleBadgeStyle}`}>
                {isSuperAdmin && <ShieldCheck className="w-3 h-3 inline mr-1" />}
                {roleTitle}
              </span>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="py-1 border-b border-slate-100 dark:border-slate-800">
              <Link
                href="/admin/settings"
                onClick={() => setIsOpen(false)}
                id="admin-settings-link"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium text-left"
              >
                <Settings className="w-4 h-4 text-emerald-600" />
                <span>Cài đặt dòng họ</span>
              </Link>
            </div>
          )}

          <div className="py-1">
            <a
              href="/api/auth/dev-login?action=logout"
              id="logout-btn"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors font-medium text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
