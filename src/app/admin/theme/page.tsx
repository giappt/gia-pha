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
  ShieldCheck,
  Calendar,
  Clock,
  Check,
  Search,
  UserCheck,
  Rocket,
  ArrowRight,
  Layers,
  FlaskConical,
} from 'lucide-react';
import type { ClanThemeConfig, DesignProfileId, ThemeApplyScope, UserProfile } from '@/types/database';
import {
  DEFAULT_THEME_CONFIG,
  resolveThemeConfig,
  promoteCanaryToProduction,
} from '@/lib/admin/admin-engine';
import { AnniversaryBlocCardPreview } from '@/components/anniversaries/AnniversaryBlocCard';
import { MOCK_ANNIVERSARY_GROUP_TODAY } from '@/fixtures/anniversary-fixtures';

const PROFILE_NAMES: Record<DesignProfileId, string> = {
  classic: 'Classic Minimalist',
  heritage: 'Modern Vietnamese Heritage',
  contemporary_heritage: 'Contemporary Heritage',
};

type ThemeAdminTab = 'production' | 'canary';

export default function AdminThemePage() {
  const [themeConfig, setThemeConfig] = useState<ClanThemeConfig>(DEFAULT_THEME_CONFIG);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ThemeAdminTab>('production');
  const [canaryPreviewMode, setCanaryPreviewMode] = useState<'canary' | 'base'>('canary');

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

  const handleBaseProfileSelect = (profile: DesignProfileId) => {
    setThemeConfig((prev) => ({
      ...prev,
      active_profile: profile,
    }));
    setStatusMessage(null);
  };

  const handleCanaryProfileSelect = (profile: DesignProfileId) => {
    setThemeConfig((prev) => ({
      ...prev,
      canary_profile: profile,
    }));
    setStatusMessage(null);
  };

  const handleCanaryToggle = (enabled: boolean) => {
    setThemeConfig((prev) => ({
      ...prev,
      canary_enabled: enabled,
      apply_scope: enabled ? (prev.apply_scope === 'all' ? 'admin_only' : prev.apply_scope) : 'all',
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

  const handleSaveConfig = async (configToSave: ClanThemeConfig, successMsg?: string) => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/clan-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_config: configToSave }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({
          type: 'success',
          text: successMsg || 'Đã lưu cấu hình Giao Diện dòng họ thành công! Thay đổi sẽ áp dụng ngay khi người dùng tải lại trang.',
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveConfig(themeConfig);
  };

  const handlePromoteToProduction = async () => {
    const promoted = promoteCanaryToProduction(themeConfig);
    setThemeConfig(promoted);
    await handleSaveConfig(
      promoted,
      `Đã phổ cập phong cách ${PROFILE_NAMES[promoted.active_profile]} cho toàn thể dòng họ thành công!`
    );
  };

  const filteredUsers = users.filter((u) => {
    if (!userSearchQuery) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  const activeCanaryProfile = themeConfig.canary_profile || (themeConfig.active_profile === 'contemporary_heritage' ? 'heritage' : 'contemporary_heritage');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Đang nạp cấu hình giao diện và theme profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Giao Diện & Profile
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cấu hình phong cách hiển thị chính thức cho dòng họ hoặc triển khai thử nghiệm có kiểm soát.
            </p>
          </div>
        </div>

        {/* Thông báo trạng thái */}
        {statusMessage && (
          <div
            className={`mt-4 p-3.5 rounded-lg border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
              }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium leading-relaxed">{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold text-xs"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* THANH ĐIỀU HƯỚNG PHÂN HỆ (SEGMENTED MODE SWITCHER) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-control border border-slate-200/80 dark:border-slate-700 w-fit">
        <button
          type="button"
          id="theme-mode-base"
          onClick={() => setActiveTab('production')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'production'
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
        >

          <span>Giao Diện Chính Thức</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
            Toàn Dòng Họ
          </span>
        </button>

        <button
          type="button"
          id="theme-mode-canary"
          onClick={() => setActiveTab('canary')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold transition-all cursor-pointer ${activeTab === 'canary'
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
        >

          <span>Phòng Thử Nghiệm Canary</span>
          {themeConfig.canary_enabled ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              Đang Bật
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-semibold">
              Đang Tắt
            </span>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: GIAO DIỆN CHÍNH THỨC DÒNG HỌ (PRODUCTION BASE THEME)              */}
        {/* BỐ CỤC TẦNG LỚP BỀ THẾ (SPACIOUS TIERED LAYOUT)                          */}
        {/* ========================================================================= */}
        {activeTab === 'production' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Banner trạng thái */}
            <div className="p-4 rounded-card border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-2">

                  <span>1. Phong Cách Giao Diện Chính Thức Dòng Họ</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Áp dụng mặc định cho 100% con cháu và khách vãng lai khi truy cập.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-bold bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Đang Áp Dụng: {PROFILE_NAMES[themeConfig.active_profile]}</span>
              </div>
            </div>

            {/* TẦNG 1: BỘ CHỌN PHONG CÁCH (Lưới 3 Card Theme dàn đều 3 cột) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card Profile 1: Classic Minimalist */}
              <div
                id="theme-card-classic"
                onClick={() => handleBaseProfileSelect('classic')}
                className={`relative p-4 rounded-card border-2 cursor-pointer transition-all flex flex-col justify-between ${themeConfig.active_profile === 'classic'
                  ? 'border-emerald-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80 hover:opacity-100 hover:border-slate-300'
                  }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        CL
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Classic Minimalist
                        </h3>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Tối Giản Hiện Đại (Xanh Ngọc)
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${themeConfig.active_profile === 'classic'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}
                    >
                      {themeConfig.active_profile === 'classic' && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="mt-2.5">
                    {themeConfig.active_profile === 'classic' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Đang Áp Dụng: Toàn Dòng Họ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Sẵn Sàng Kích Hoạt
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Phong cách phẳng thanh lịch với tông màu chủ đạo Xanh Ngọc Lục Bảo (Emerald), bo cong mềm mại 16px, thẻ giỗ card tối giản.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                    Xanh Ngọc Lục Bảo
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                    Góc Bo 16px Mềm Mại
                  </span>
                </div>
              </div>

              {/* Card Profile 2: Modern Vietnamese Heritage */}
              <div
                id="theme-card-heritage"
                onClick={() => handleBaseProfileSelect('heritage')}
                className={`relative p-4 rounded-card border-2 cursor-pointer transition-all flex flex-col justify-between ${themeConfig.active_profile === 'heritage'
                  ? 'border-red-600 bg-white dark:bg-slate-900 shadow-md ring-2 ring-red-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80 hover:opacity-100 hover:border-slate-300'
                  }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                        VH
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Modern Vietnamese Heritage
                        </h3>
                        <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold">
                          Truyền Thống Dòng Tộc (Đỏ & Vàng Kim)
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${themeConfig.active_profile === 'heritage'
                        ? 'border-red-600 bg-red-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}
                    >
                      {themeConfig.active_profile === 'heritage' && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="mt-2.5">
                    {themeConfig.active_profile === 'heritage' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        Đang Áp Dụng: Toàn Dòng Họ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Sẵn Sàng Kích Hoạt
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Hòa sắc Đỏ son tươi kết hợp Vàng hoàng kim, viền mực thước 6px, kết hợp thiết kế Lịch Bloc xé giấy truyền thống tôn nghiêm.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800">
                    Đỏ Son & Vàng Kim
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                    Lịch Bloc Xé Giấy
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    Góc Bo 6px
                  </span>
                </div>
              </div>

              {/* Card Profile 3: Contemporary Heritage */}
              <div
                id="theme-card-contemporary-heritage"
                onClick={() => handleBaseProfileSelect('contemporary_heritage')}
                className={`relative p-4 rounded-card border-2 cursor-pointer transition-all flex flex-col justify-between ${themeConfig.active_profile === 'contemporary_heritage'
                  ? 'border-[#0F382C] bg-white dark:bg-stone-900 shadow-md ring-2 ring-[#0F382C]/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-80 hover:opacity-100 hover:border-slate-300'
                  }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#0F382C] text-[#FAF8F2] flex items-center justify-center font-black text-xs shadow-xs border border-[#164E3D]">
                        CH
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          Contemporary Heritage
                        </h3>
                        <p className="text-[11px] text-[#0F382C] dark:text-emerald-400 font-semibold">
                          Di Sản Đương Đại (Heritage SSOT)
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${themeConfig.active_profile === 'contemporary_heritage'
                        ? 'border-[#0F382C] bg-[#0F382C] text-white'
                        : 'border-slate-300 dark:border-slate-600'
                        }`}
                    >
                      {themeConfig.active_profile === 'contemporary_heritage' && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="mt-2.5">
                    {themeConfig.active_profile === 'contemporary_heritage' ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0F382C]/10 dark:bg-emerald-950/80 text-[#0F382C] dark:text-emerald-300 border border-[#0F382C]/20 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0F382C] animate-pulse" />
                        Đang Áp Dụng: Toàn Dòng Họ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Sẵn Sàng Kích Hoạt
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    Nền giấy Dó ngà ấm, viền hairline đá tự nhiên, xanh ngọc di sản (`#0F382C`), bóng than chì trầm ấm, tem lịch bloc 3 trạng thái.
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#F5F2EA] text-[#1C1917] border border-[#EAE5D9]">
                    Giấy Dó Ngà Ấm
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0F382C]/10 text-[#0F382C] border border-[#0F382C]/20 dark:text-emerald-300">
                    Xanh Ngọc Di Sản
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Lịch Bloc 3 Sắc Màu
                  </span>
                </div>
              </div>
            </div>

            {/* TẦNG 2: KHUNG XEM TRƯỚC BỀ THẾ (max-w-2xl mx-auto) */}
            <div className="max-w-2xl mx-auto w-full space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Xem Trước Giao Diện Mẫu (Live Preview)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Phong cách đang chọn: <strong className="text-slate-900 dark:text-slate-100">{PROFILE_NAMES[themeConfig.active_profile]}</strong>
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Bản Chuẩn Mực 100%
                </span>
              </div>

              {/* Component Preview Thật */}
              <div className="flex justify-center p-4 sm:p-6 rounded-card bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                {themeConfig.active_profile === 'heritage' || themeConfig.active_profile === 'contemporary_heritage' ? (
                  <div className="w-full">
                    <AnniversaryBlocCardPreview variant="today" profile={themeConfig.active_profile} />
                  </div>
                ) : (
                  <div className="w-full rounded-card border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Ngày Giỗ Gần Nhất
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Hôm Nay Giỗ
                      </span>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {MOCK_ANNIVERSARY_GROUP_TODAY.members[0].display_name || MOCK_ANNIVERSARY_GROUP_TODAY.members[0].full_name}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        Hôm nay ({MOCK_ANNIVERSARY_GROUP_TODAY.solar_day}/{MOCK_ANNIVERSARY_GROUP_TODAY.solar_month}/{MOCK_ANNIVERSARY_GROUP_TODAY.solar_year}) · Âm lịch: {MOCK_ANNIVERSARY_GROUP_TODAY.lunar_day}/{MOCK_ANNIVERSARY_GROUP_TODAY.lunar_month} ({MOCK_ANNIVERSARY_GROUP_TODAY.lunar_year_name})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TẦNG 3: NÚT LƯU ÁP DỤNG CHO TOÀN DÒNG HỌ */}
            <div className="max-w-md mx-auto pt-2 text-center space-y-2">
              <button
                id="save-theme-btn"
                type="submit"
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-control bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Áp Dụng Cho Toàn Dòng Họ</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-slate-500">
                Phong cách được chọn sẽ trở thành giao diện chính thức cho 100% con cháu và khách vãng lai.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PHÒNG THỬ NGHIỆM CANARY (CANARY LAB & ROLLOUT)                     */}
        {/* BỐ CỤC TẦNG LỚP BỀ THẾ (SPACIOUS TIERED LAYOUT)                          */}
        {/* ========================================================================= */}
        {activeTab === 'canary' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Thử Nghiệm & Switch Bật/Tắt */}
            <div className="p-4 rounded-card border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200 uppercase tracking-wider flex items-center gap-2">

                  <span>2. Phòng Thử Nghiệm Giao Diện Mới (Canary Rollout)</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Cho phép Admin hoặc nhóm tài khoản chỉ định trải nghiệm thử một phong cách mới mà không làm thay đổi giao diện của dòng họ.
                </p>
              </div>

              {/* Công tắc Bật/Tắt Thử Nghiệm */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {themeConfig.canary_enabled ? 'Đang Bật Thử Nghiệm' : 'Đang Tắt Thử Nghiệm'}
                </span>
                <button
                  type="button"
                  id="canary-toggle-btn"
                  onClick={() => handleCanaryToggle(!themeConfig.canary_enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-control transition-colors cursor-pointer ${themeConfig.canary_enabled ? 'bg-amber-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-control bg-white transition-transform ${themeConfig.canary_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            {!themeConfig.canary_enabled ? (
              /* KHI CANARY ĐANG TẮT */
              <div className="p-8 rounded-card border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
                <ShieldCheck className="w-10 h-10 text-emerald-600 mx-auto opacity-80" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Toàn Thể Dòng Họ Đang Dùng Chung 1 Phong Cách Chuẩn Mực
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Không có thử nghiệm nào đang chạy. 100% thành viên (Admin, con cháu và khách) đều đang trải nghiệm phong cách{' '}
                  <strong className="text-emerald-700 dark:text-emerald-400">{PROFILE_NAMES[themeConfig.active_profile]}</strong>.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleCanaryToggle(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-control bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Bật Chế Độ Thử Nghiệm Phong Cách Mới</span>
                  </button>
                </div>
              </div>
            ) : (
              /* KHI CANARY ĐANG BẬT: BỐ CỤC TẦNG LỚP BỀ THẾ */
              <div className="space-y-6">
                {/* TẦNG 1: ĐIỀU KHIỂN THỬ NGHIỆM (Lưới 2 Cột) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* Cột 1: Chọn phong cách thử nghiệm */}
                  <div className="p-4 rounded-card border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Phong Cách Đang Thử Nghiệm (Canary Profile):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(['classic', 'heritage', 'contemporary_heritage'] as DesignProfileId[]).map((pid) => {
                        const isSelected = activeCanaryProfile === pid;
                        const isSameAsBase = themeConfig.active_profile === pid;
                        return (
                          <div
                            key={pid}
                            onClick={() => handleCanaryProfileSelect(pid)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                              ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 shadow-xs ring-1 ring-amber-500/20'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                              }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{PROFILE_NAMES[pid]}</span>
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 dark:border-slate-600'
                                  }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                            </div>
                            {isSameAsBase && (
                              <span className="mt-1 block text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                (Trùng Base Dòng Họ)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cột 2: Chọn đối tượng thử nghiệm */}
                  <div className="p-4 rounded-card border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Đối Tượng Được Trải Nghiệm Thử Nghiệm:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Scope 1: Admin Only */}
                      <div
                        id="scope-btn-admin-only"
                        onClick={() => handleScopeSelect('admin_only')}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${themeConfig.apply_scope === 'admin_only'
                          ? 'border-amber-600 bg-amber-50/40 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="text-xs font-bold">Chỉ Super Admin</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Chỉ Super Admin thấy giao diện thử nghiệm; con cháu vẫn thấy giao diện chính thức.
                        </p>
                      </div>

                      {/* Scope 2: Custom Users Whitelist */}
                      <div
                        id="scope-btn-custom-users"
                        onClick={() => handleScopeSelect('custom_users')}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${themeConfig.apply_scope === 'custom_users'
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-bold">
                            Admin + Whitelist ({themeConfig.allowed_user_ids.length})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Super Admin và các tài khoản con cháu chỉ định được cùng trải nghiệm trước.
                        </p>
                      </div>
                    </div>

                    {/* Danh sách thành viên Whitelist */}
                    {themeConfig.apply_scope === 'custom_users' && (
                      <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            <span>Chọn tài khoản con cháu:</span>
                          </span>
                          <div className="relative w-44">
                            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                              placeholder="Tìm tên/email..."
                              className="w-full pl-7 pr-2 py-1 text-[11px] border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                          {filteredUsers.length === 0 ? (
                            <div className="p-3 text-center text-xs text-slate-400">
                              Không tìm thấy tài khoản.
                            </div>
                          ) : (
                            filteredUsers.map((u) => {
                              const isChecked = themeConfig.allowed_user_ids.includes(u.id);
                              return (
                                <div
                                  key={u.id}
                                  onClick={() => toggleUserInWhitelist(u.id)}
                                  className={`px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-xs transition-colors ${isChecked ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => { }}
                                      className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="font-semibold text-slate-900 dark:text-slate-100 text-[11px]">
                                      {u.full_name || 'Chưa cập nhật tên'}
                                    </span>
                                  </div>
                                  <span className="text-slate-400 text-[10px]">{u.email}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* TẦNG 2: KHUNG ĐỐI CHIẾU XEM TRƯỚC BỀ THẾ (max-w-2xl mx-auto) */}
                <div className="max-w-2xl mx-auto w-full space-y-3 pt-2">
                  {/* Bộ Gạt Đối Chiếu 2 Chế Độ Sắc Nét */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 p-2 rounded-card bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60">
                    <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-control border border-amber-200 dark:border-amber-800 shadow-xs">
                      <button
                        type="button"
                        id="canary-view-preview-btn"
                        onClick={() => setCanaryPreviewMode('canary')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${canaryPreviewMode === 'canary'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Bản Thử Nghiệm: {PROFILE_NAMES[activeCanaryProfile]}</span>
                      </button>
                      <button
                        type="button"
                        id="canary-view-base-btn"
                        onClick={() => setCanaryPreviewMode('base')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${canaryPreviewMode === 'base'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                          }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Bản Con Cháu: {PROFILE_NAMES[themeConfig.active_profile]}</span>
                      </button>
                    </div>

                    <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-200 px-2 py-0.5">
                      {canaryPreviewMode === 'canary' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                          <span>Đang đối chiếu: Góc nhìn người thử nghiệm</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          <span>Đang đối chiếu: Góc nhìn con cháu & khách</span>
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Component Preview Thật ở 100% tỷ lệ chuẩn mực */}
                  <div className="flex justify-center p-4 sm:p-6 rounded-card bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                    {(() => {
                      const profileToRender = canaryPreviewMode === 'canary' ? activeCanaryProfile : themeConfig.active_profile;
                      if (profileToRender === 'heritage' || profileToRender === 'contemporary_heritage') {
                        return (
                          <div className="w-full">
                            <AnniversaryBlocCardPreview variant="today" profile={profileToRender} />
                          </div>
                        );
                      }
                      return (
                        <div className="w-full rounded-card border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 p-5 shadow-xs">
                          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-600" />
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                Ngày Giỗ Gần Nhất
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Hôm Nay Giỗ
                            </span>
                          </div>

                          <div className="mt-3">
                            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                              {MOCK_ANNIVERSARY_GROUP_TODAY.members[0].display_name || MOCK_ANNIVERSARY_GROUP_TODAY.members[0].full_name}
                            </h4>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              Hôm nay ({MOCK_ANNIVERSARY_GROUP_TODAY.solar_day}/{MOCK_ANNIVERSARY_GROUP_TODAY.solar_month}/{MOCK_ANNIVERSARY_GROUP_TODAY.solar_year}) · Âm lịch: {MOCK_ANNIVERSARY_GROUP_TODAY.lunar_day}/{MOCK_ANNIVERSARY_GROUP_TODAY.lunar_month} ({MOCK_ANNIVERSARY_GROUP_TODAY.lunar_year_name})
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* TẦNG 3: TÓM TẮT & HÀNH ĐỘNG PHỔ CẬP 1-CLICK */}
                <div className="max-w-2xl mx-auto w-full p-4 rounded-card border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                  {/* Bảng tóm tắt ma trận phân bổ */}
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>Tóm Tắt Phân Bổ Trải Nghiệm Giao Diện Hiện Tại:</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      • <strong className="text-amber-800 dark:text-amber-300">{themeConfig.apply_scope === 'custom_users' ? `Super Admin + ${themeConfig.allowed_user_ids.length} tài khoản chỉ định` : 'Chỉ Super Admin'}</strong>: Trải nghiệm phong cách thử nghiệm <strong className="text-amber-900 dark:text-amber-100">{PROFILE_NAMES[activeCanaryProfile]}</strong>.
                    </p>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      • <strong className="text-emerald-800 dark:text-emerald-300">Toàn thể con cháu & khách vãng lai</strong>: Tiếp tục trải nghiệm phong cách chuẩn mực <strong className="text-emerald-900 dark:text-emerald-100">{PROFILE_NAMES[themeConfig.active_profile]}</strong> (Không bị xáo trộn).
                    </p>
                  </div>

                  {/* Hành động: 1-Click Phổ Cập & Lưu */}
                  <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      id="promote-btn"
                      onClick={handlePromoteToProduction}
                      disabled={isSaving || activeCanaryProfile === themeConfig.active_profile}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-control bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>Phổ Cập Cho Toàn Dòng Họ (1-Click)</span>
                    </button>

                    <button
                      type="submit"
                      id="save-canary-btn"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-control bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu Cấu Hình Thử Nghiệm</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 text-center sm:text-left">
                    * Bấm "Phổ Cập Cho Toàn Dòng Họ" sẽ biến phong cách thử nghiệm thành phong cách chính thức cho 100% con cháu và tự động tắt Canary.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chân Trang: Nút Thoát Về Bàn Điều Hành */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            <span>Quay Về Bàn Điều Hành</span>
          </Link>
          <span className="text-[11px] text-slate-400">
            Hệ Thống Quản Trị Phong Cách Gia Phả FAT
          </span>
        </div>
      </form>
    </div>
  );
}
