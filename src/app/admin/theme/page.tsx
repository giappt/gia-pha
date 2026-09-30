'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Palette,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Users,
  Shield,
  Globe,
  Sparkles,
  Calendar,
  Clock,
  Flame,
  Check,
  Search,
  UserCheck,
} from 'lucide-react';
import type { ClanThemeConfig, DesignProfileId, ThemeApplyScope, UserProfile } from '@/types/database';
import { DEFAULT_THEME_CONFIG, resolveThemeConfig } from '@/lib/admin/admin-engine';
import { AnniversaryBlocCardPreview } from '@/components/anniversaries/AnniversaryBlocCard';
import { MOCK_ANNIVERSARY_GROUP_TODAY } from '@/fixtures/anniversary-fixtures';

export default function AdminThemePage() {
  const [themeConfig, setThemeConfig] = useState<ClanThemeConfig>(DEFAULT_THEME_CONFIG);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // 1. Tải cấu hình từ API
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [settingsRes, usersRes] = await Promise.all([
          fetch('/api/clan-settings'),
          fetch('/api/users').catch(() => null),
        ]);

        if (settingsRes.ok) {
          const json = await settingsRes.json();
          if (json.data?.theme_config) {
            setThemeConfig(resolveThemeConfig(json.data.theme_config));
          }
        }

        if (usersRes && usersRes.ok) {
          const json = await usersRes.json();
          if (Array.isArray(json.data)) {
            setUsers(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load theme config or users:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleProfileSelect = (profile: DesignProfileId) => {
    setThemeConfig((prev) => ({
      ...prev,
      active_profile: profile,
    }));
    setStatusMessage(null);
  };

  const handleScopeSelect = (scope: ThemeApplyScope) => {
    setThemeConfig((prev) => ({
      ...prev,
      apply_scope: scope,
    }));
    setStatusMessage(null);
  };

  const toggleUserInWhitelist = (userId: string) => {
    setThemeConfig((prev) => {
      const exists = prev.allowed_user_ids.includes(userId);
      return {
        ...prev,
        allowed_user_ids: exists
          ? prev.allowed_user_ids.filter((id) => id !== userId)
          : [...prev.allowed_user_ids, userId],
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/clan-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_config: themeConfig }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu cấu hình Giao Diện dòng họ thành công! Thay đổi sẽ áp dụng ngay khi người dùng tải lại trang.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: json.error || 'Có lỗi xảy ra khi lưu cấu hình giao diện.',
        });
      }
    } catch (err) {
      console.error('Failed to save theme config:', err);
      setStatusMessage({
        type: 'error',
        text: 'Lỗi kết nối máy chủ. Vui lòng thử lại sau giây lát.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Đang nạp cấu hình giao diện & theme profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200/80 dark:border-amber-800 shadow-xs">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Quản Trị Giao Diện & Design Profiles
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Chuyển đổi phong cách thị giác dòng họ và kiểm soát phạm vi triển khai có kiểm soát (Canary Rollout).
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Phần 1: Lựa chọn Design Profile */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              1. Lựa Chọn Phong Cách Giao Diện (Design Profile)
            </label>
            <span className="text-xs text-slate-500">
              Đang chọn:{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {themeConfig.active_profile === 'heritage'
                  ? 'Modern Vietnamese Heritage'
                  : 'Classic Minimalist'}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Card Profile 1: Classic Minimalist */}
            <div
              id="theme-card-classic"
              onClick={() => handleProfileSelect('classic')}
              className={`relative p-5 rounded-card border-2 cursor-pointer transition-all ${
                themeConfig.active_profile === 'classic'
                  ? 'border-emerald-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                    EM
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Classic Minimalist
                    </h3>
                    <p className="text-[11px] text-slate-500">Tối Giản Hiện Đại (Mặc định)</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    themeConfig.active_profile === 'classic'
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {themeConfig.active_profile === 'classic' && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Tông màu ngọc lục bảo thanh thoát (`emerald-600`), thẻ phẳng gọn gàng, phù hợp phong
                cách trang nhã và giao diện nguyên bản quen thuộc của dòng họ.
              </p>

              {/* Preview Chips */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                  Xanh Lục Bảo
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Thẻ Phẳng Chuẩn
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Lịch Giỗ Tiêu Chuẩn
                </span>
              </div>
            </div>

            {/* Card Profile 2: Modern Vietnamese Heritage */}
            <div
              id="theme-card-heritage"
              onClick={() => handleProfileSelect('heritage')}
              className={`relative p-5 rounded-card border-2 cursor-pointer transition-all ${
                themeConfig.active_profile === 'heritage'
                  ? 'border-red-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-red-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80 hover:opacity-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-amber-300 flex items-center justify-center font-black text-xs shadow-xs">
                    VH
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>Modern Vietnamese Heritage</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </h3>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      Truyền Thống Gia Tộc & Lịch Bloc
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    themeConfig.active_profile === 'heritage'
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {themeConfig.active_profile === 'heritage' && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                Hòa sắc Đỏ son tươi kết hợp Vàng hoàng kim, viền hairline sắc nét, selection highlight
                ấm cúng, kết hợp thiết kế Lịch Bloc xé giấy truyền thống tôn nghiêm.
              </p>

              {/* Preview Chips */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800">
                  Đỏ Son & Vàng Hoàng Kim
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                  Lịch Bloc Xé Giấy
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  Pull-Up Lunar Block
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Phần 2: Phạm Vi Áp Dụng (Rollout Scope) */}
        <div className="space-y-4 p-5 rounded-card border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              2. Phạm Vi Triển Khai (Canary Rollout Scope)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Quyết định ai sẽ được trải nghiệm phong cách giao diện này khi tải lại trang web.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Scope 1: All */}
            <div
              id="scope-btn-all"
              onClick={() => handleScopeSelect('all')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                themeConfig.apply_scope === 'all'
                  ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold">Toàn Bộ Dòng Họ (All)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Áp dụng ngay cho mọi thành viên và khách vãng lai khi truy cập.
              </p>
            </div>

            {/* Scope 2: Admin Only */}
            <div
              id="scope-btn-admin-only"
              onClick={() => handleScopeSelect('admin_only')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                themeConfig.apply_scope === 'admin_only'
                  ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold">Chỉ Admin (Admin Only)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Chỉ Super Admin thấy giao diện mới; con cháu vẫn dùng giao diện Classic.
              </p>
            </div>

            {/* Scope 3: Custom Users */}
            <div
              id="scope-btn-custom-users"
              onClick={() => handleScopeSelect('custom_users')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                themeConfig.apply_scope === 'custom_users'
                  ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold">Chỉ Định User (Whitelist)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Admin cùng danh sách thành viên chỉ định được trải nghiệm trước.
              </p>
            </div>
          </div>

          {/* User Whitelist Checklist khi chọn custom_users */}
          {themeConfig.apply_scope === 'custom_users' && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>
                    Danh sách tài khoản được chỉ định trải nghiệm ({themeConfig.allowed_user_ids.length} đã chọn):
                  </span>
                </div>
                <div className="relative w-48 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Tìm tên hoặc email..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                {filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Không tìm thấy tài khoản phù hợp với từ khóa.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isChecked = themeConfig.allowed_user_ids.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUserInWhitelist(u.id)}
                        className={`px-3.5 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-xs transition-colors ${
                          isChecked ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {u.full_name || 'Chưa cập nhật tên'}
                            </span>
                            <span className="text-slate-400 ml-2 text-[11px]">{u.email}</span>
                          </div>
                        </div>

                        {u.user_role === 'super_admin' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Super Admin
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Phần 3: Live Preview Thẻ Lịch Giỗ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              3. Xem Trước Giao Diện Mẫu (Live Preview)
            </label>
            <span className="text-xs text-slate-500">
              Mô phỏng thẻ Lịch Giỗ trang chủ theo phong cách{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {themeConfig.active_profile === 'heritage' ? 'Heritage Bloc' : 'Classic'}
              </strong>
            </span>
          </div>

          <div className="p-6 rounded-card border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center justify-center">
            {themeConfig.active_profile === 'heritage' ? (
              /* Heritage Preview Card tái sử dụng 100% Production Component */
              <div className="w-full flex justify-center">
                <AnniversaryBlocCardPreview variant="today" />
              </div>
            ) : (
              /* Classic Preview Card */
              <div className="w-full max-w-lg rounded-card border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/10 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Ngày Giỗ Gần Nhất
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Hôm Nay Giỗ
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {MOCK_ANNIVERSARY_GROUP_TODAY.members[0].display_name || MOCK_ANNIVERSARY_GROUP_TODAY.members[0].full_name}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Hôm nay ({MOCK_ANNIVERSARY_GROUP_TODAY.solar_day}/{MOCK_ANNIVERSARY_GROUP_TODAY.solar_month}/{MOCK_ANNIVERSARY_GROUP_TODAY.solar_year}) · Âm lịch: {MOCK_ANNIVERSARY_GROUP_TODAY.lunar_day}/{MOCK_ANNIVERSARY_GROUP_TODAY.lunar_month} ({MOCK_ANNIVERSARY_GROUP_TODAY.lunar_year_name})
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200/80 dark:border-slate-800">
          <Link
            href="/admin"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Quay Về
          </Link>

          <button
            id="save-theme-btn"
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-emerald-700/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Cấu Hình Giao Diện</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
