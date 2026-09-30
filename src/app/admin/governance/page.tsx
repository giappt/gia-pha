'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  Sparkles,
  Loader2,
  Eye,
  UserCheck,
  Sliders,
  ChevronRight,
  Info,
  RefreshCw,
  Power,
} from 'lucide-react';
import type { ClanFeatureFlags, UserRole } from '@/types/database';
import {
  PERMISSION_MATRIX_DEFINITIONS,
  ROLES_META,
  resolveFeatureFlags,
  resolveEffectiveCellState,
  DEFAULT_FEATURE_FLAGS,
  type ImpersonatedRole,
  type EffectiveCellState,
  type PermissionMatrixItem,
} from '@/lib/admin/admin-engine';

const CATEGORY_NAMES: Record<string, { label: string; icon: React.ElementType; desc: string }> = {
  visibility: {
    label: '1. Tiếp Cận & Quyền Riêng Tư',
    icon: Eye,
    desc: 'Quy định khả năng tra cứu, hiển thị cây Gia Phả và bảo mật thông tin liên lạc người sống.',
  },
  interaction: {
    label: '2. Tự Phục Vụ & Gắn Kết',
    icon: UserCheck,
    desc: 'Quyền gửi yêu cầu nhận diện nhân thân (claim node) và nhận tin nhắn Web Push nhắc giỗ.',
  },
  editing: {
    label: '3. Biên Tập & Hiệu Đính Gia Phả',
    icon: Sliders,
    desc: 'Quyền chỉnh sửa thông tin nhân thân và cập nhật thông tin trong gia đình.',
  },
  administration: {
    label: '4. Bàn Điều Hành & Phê Duyệt',
    icon: ShieldCheck,
    desc: 'Quyền xét duyệt hồ sơ kết nối của con cháu trong phạm vi gia đình.',
  },
};

const FLAG_TITLES: Partial<Record<keyof ClanFeatureFlags, string>> = {
  enable_public_tree: 'Công Khai Cây Cho Khách',
  mask_living_member_privacy: 'Lá Chắn Che SĐT Người Sống',
  enable_kinship_lookup: 'Tra Cứu Vai Vế Xưng Hô',
  enable_anniversaries: 'Phân Hệ Lịch Giỗ Gia Tộc',
  allow_member_claims: 'Tiếp Nhận Yêu Cầu Nhận Node',
  enable_push_notifications: 'Thông Báo Đẩy Web Push',
  allow_member_self_edit: 'Tự Quản Thông Tin Gia Đình',
  allow_family_claim_approval: 'Duyệt Hồ Sơ Con Cháu',
  maintenance_mode: 'Bảo Trì Toàn Tộc',
};

// 8 Tính năng hệ thống cốt lõi có cờ Bật / Tắt
const CLAN_SYSTEM_FEATURES = PERMISSION_MATRIX_DEFINITIONS.filter((item) => Boolean(item.masterFlagKey));

export default function AdminGovernancePage() {
  const router = useRouter();
  const [flags, setFlags] = useState<ClanFeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<keyof ClanFeatureFlags | null>(null);
  const [savedKey, setSavedKey] = useState<keyof ClanFeatureFlags | null>(null);
  const [activeImpersonation, setActiveImpersonation] = useState<ImpersonatedRole>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Đọc cookie đóng vai hiện thời
  const readImpersonatedRole = (): ImpersonatedRole => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/(?:^|;\s*)fat_impersonated_role=([^;]+)/);
    return match ? (decodeURIComponent(match[1]) as ImpersonatedRole) : null;
  };

  useEffect(() => {
    setActiveImpersonation(readImpersonatedRole());

    const handleSync = () => {
      setActiveImpersonation(readImpersonatedRole());
    };

    window.addEventListener('fat_impersonation_change', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('fat_impersonation_change', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Tải cờ tính năng từ máy chủ
  const loadFlags = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/clan-settings');
      if (res.ok) {
        const json = await res.json();
        if (json.data?.feature_flags) {
          setFlags(resolveFeatureFlags(json.data.feature_flags));
        }
      }
    } catch (err) {
      console.error('Failed to load feature flags for governance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  // Xử lý bật/tắt tính năng với Optimistic Update và Rollback
  const handleToggleMasterSwitch = async (key: keyof ClanFeatureFlags, itemName: string) => {
    const previousFlags = { ...flags };
    const nextValue = !flags[key];
    const newFlags: ClanFeatureFlags = {
      ...flags,
      [key]: nextValue,
    };

    // 1. Optimistic Update tại chỗ
    setFlags(newFlags);
    setSavingKey(key);

    try {
      const res = await fetch('/api/clan-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_flags: newFlags }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Server rejected update');
      }

      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2500);

      const actionText = nextValue ? 'ĐÃ BẬT' : 'ĐÃ TẮT';
      const featureLabel = FLAG_TITLES[key] || itemName;
      setToastMessage(`Đã ${actionText} tính năng "${featureLabel}". Phân quyền các vai trò đã được tự động cập nhật.`);
      setTimeout(() => setToastMessage(null), 4000);
      router.refresh();
    } catch (err) {
      console.error('Error updating feature flag:', err);
      // Rollback
      setFlags(previousFlags);
      setToastMessage('Lỗi kết nối máy chủ. Đã hoàn tác trạng thái công tắc.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setSavingKey(null);
    }
  };

  const handleStartImpersonate = (roleId: string) => {
    document.cookie = `fat_impersonated_role=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24}`;
    setActiveImpersonation(roleId as ImpersonatedRole);
    window.dispatchEvent(new Event('fat_impersonation_change'));

    const meta = ROLES_META.find((r) => r.id === roleId);
    setToastMessage(`Đã kích hoạt chế độ Đóng Vai: "${meta?.title || roleId}".`);
    setTimeout(() => setToastMessage(null), 4000);
    router.refresh();
  };

  const handleExitImpersonate = () => {
    document.cookie = 'fat_impersonated_role=; path=/; max-age=0';
    setActiveImpersonation(null);
    window.dispatchEvent(new Event('fat_impersonation_change'));
    setToastMessage('Đã thoát chế độ đóng vai. Bạn đang ở quyền Quản Trị Tối Cao (Super Admin).');
    setTimeout(() => setToastMessage(null), 4000);
    router.refresh();
  };

  const scrollToRow = (itemId: string) => {
    const el = document.getElementById(`matrix-row-${itemId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('bg-amber-100/50', 'dark:bg-amber-950/40');
      setTimeout(() => {
        el.classList.remove('bg-amber-100/50', 'dark:bg-amber-950/40');
      }, 2000);
    }
  };

  // Tính toán danh sách tính năng đang bị tắt
  const disabledMasterSwitches = useMemo(() => {
    const list: { key: keyof ClanFeatureFlags; item: PermissionMatrixItem }[] = [];
    const seen = new Set<string>();

    for (const item of CLAN_SYSTEM_FEATURES) {
      if (item.masterFlagKey && !flags[item.masterFlagKey]) {
        if (!seen.has(item.masterFlagKey)) {
          seen.add(item.masterFlagKey);
          list.push({ key: item.masterFlagKey, item });
        }
      }
    }
    return list;
  }, [flags]);

  const categories = ['visibility', 'interaction', 'editing', 'administration'] as const;

  // Lọc theo danh mục
  const filteredCategories = filterCategory === 'all'
    ? categories
    : categories.filter((c) => c === filterCategory);

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-100 border border-emerald-500/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Header chuẩn hóa theo mẫu /admin/users (Hình 1) */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Bật/Tắt Tính Năng & Phân Quyền
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kiểm soát trạng thái bật/tắt các tính năng của dòng họ và quyền hạn tương ứng của từng vai trò.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadFlags}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm Mới</span>
          </button>
        </div>
      </div>

      {/* TẦNG 1: THANH TRẠNG THÁI TÍNH NĂNG (FEATURE STATUS BAR) */}
      {flags.maintenance_mode ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wide flex items-center gap-2">
                <span>Hệ thống đang ở chế độ bảo trì toàn họ</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-100">
                  BẢO TRÌ
                </span>
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                Toàn bộ con cháu và khách ngoài tạm thời không truy cập được. Duy nhất Super Admin giữ quyền truy cập quản trị.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={savingKey === 'maintenance_mode'}
            onClick={() => handleToggleMasterSwitch('maintenance_mode', 'Bảo Trì Toàn Tộc')}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
          >
            {savingKey === 'maintenance_mode' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Mở Cửa Hệ Thống</span>
          </button>
        </div>
      ) : disabledMasterSwitches.length > 0 ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Power className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide flex items-center gap-2">
                <span>Có {disabledMasterSwitches.length} tính năng đang tắt</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100">
                  {disabledMasterSwitches.length} TẮT
                </span>
              </h3>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                Khi tính năng bị tắt, các vai trò tương ứng sẽ tạm thời không sử dụng được. Nhấp vào tên tính năng để cuộn đến dòng tương ứng:
              </p>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {disabledMasterSwitches.map(({ key, item }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => scrollToRow(item.id)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800 rounded-md border border-amber-300 dark:border-amber-700 transition-colors cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>{FLAG_TITLES[key] || item.name}</span>
                    <ChevronRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                Toàn bộ tính năng đang hoạt động bình thường
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                Các phân hệ tính năng đều đang được bật và quyền hạn của các vai trò được áp dụng theo đúng thiết lập.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shrink-0">
            HOẠT ĐỘNG
          </span>
        </div>
      )}

      {/* Thanh Lọc Danh Mục & Chú Giải Trạng Thái */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-slate-50 dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-2 shrink-0">
            Lọc Danh Mục:
          </span>
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer shrink-0 ${filterCategory === 'all'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
          >
            Tất Cả ({CLAN_SYSTEM_FEATURES.length} Tính Năng)
          </button>
          {categories.map((catKey) => {
            const cat = CATEGORY_NAMES[catKey];
            const count = CLAN_SYSTEM_FEATURES.filter((i) => i.category === catKey).length;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setFilterCategory(catKey)}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer shrink-0 ${filterCategory === catKey
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
              >
                {cat.label.split('.')[1]?.trim() || cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Chú giải 4 trạng thái ô (Legend) */}
        <div className="flex items-center gap-3 text-xs flex-wrap border-t lg:border-t-0 pt-2 lg:pt-0 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-600 dark:text-slate-400">Được phép</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PauseCircle className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-400 font-semibold">Đang tắt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
            <span className="text-slate-400 dark:text-slate-500">Khóa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-purple-700 dark:text-purple-300 font-semibold">Toàn quyền</span>
          </div>
        </div>
      </div>

      {/* TẦNG 2: BẢNG MA TRẬN 7 CỘT (FLUID FULL-WIDTH MATRIX TABLE) */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[1024px]">
          {/* Header Bảng */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80">
              <th className="p-4 w-[300px] text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Hạng Mục Tính Năng
              </th>
              <th className="p-3.5 w-[150px] text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-l border-slate-200/70 dark:border-slate-800/70 bg-amber-50/30 dark:bg-amber-950/20">
                <div className="flex items-center justify-center gap-1.5">
                  <Power className="w-3.5 h-3.5 text-amber-600" />
                  <span>Bật / Tắt</span>
                </div>
              </th>
              {ROLES_META.map((role) => (
                <th
                  key={role.id}
                  className={`p-3 text-center transition-colors border-l border-slate-200/70 dark:border-slate-800/70 ${activeImpersonation === role.id
                    ? 'bg-amber-100/50 dark:bg-amber-950/40 ring-2 ring-amber-400 inset-0'
                    : ''
                    }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${role.badgeColor}`}
                    >
                      {role.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {role.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {role.subtitle}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Bảng: 100% các dòng đều có công tắc bật/tắt */}
          <tbody>
            {filteredCategories.map((catKey) => {
              const cat = CATEGORY_NAMES[catKey];
              const items = CLAN_SYSTEM_FEATURES.filter((item) => item.category === catKey);
              if (items.length === 0) return null;

              return (
                <React.Fragment key={catKey}>
                  {/* Category Header Row */}
                  <tr className="bg-slate-100/75 dark:bg-slate-900/90 border-t-2 border-b border-slate-200 dark:border-slate-800">
                    <td colSpan={7} className="px-4 py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                            {cat.label}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                            · {cat.desc}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {items.length} tính năng
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Matrix Items: 100% có switch */}
                  {items.map((item, idx) => {
                    const masterKey = item.masterFlagKey!;
                    const isMasterOn = Boolean(flags[masterKey]);
                    const isSavingThis = savingKey === masterKey;
                    const isSavedThis = savedKey === masterKey;

                    return (
                      <tr
                        key={item.id}
                        id={`matrix-row-${item.id}`}
                        className={`border-b border-slate-100 dark:border-slate-800/80 transition-colors ${idx % 2 === 0
                          ? 'bg-white dark:bg-slate-950'
                          : 'bg-slate-50/40 dark:bg-slate-900/30'
                          } hover:bg-slate-50 dark:hover:bg-slate-900/50`}
                      >
                        {/* Cột 1: Tên & Mô tả tính năng */}
                        <td className="p-4 align-middle">
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                              {item.name}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </td>

                        {/* Cột 2: Bật / Tắt Tính Năng */}
                        <td className="p-3 align-middle text-center border-l border-slate-200/70 dark:border-slate-800/70 bg-amber-50/15 dark:bg-amber-950/10">
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <button
                              type="button"
                              disabled={isSavingThis}
                              onClick={() => handleToggleMasterSwitch(masterKey, item.name)}
                              className={`relative inline-flex items-center justify-between w-28 px-2 py-1 rounded-md text-xs font-bold transition-all shadow-xs cursor-pointer border ${isMasterOn
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-500'
                                : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-700 dark:border-rose-500'
                                } ${isSavingThis ? 'opacity-80 cursor-wait' : ''}`}
                              title={`Nhấp để ${isMasterOn ? 'TẮT' : 'BẬT'}: ${FLAG_TITLES[masterKey] || item.name}`}
                            >
                              <span className="flex items-center gap-1">
                                {isSavingThis ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Power className="w-3 h-3" />
                                )}
                                <span>{isMasterOn ? 'BẬT' : 'TẮT'}</span>
                              </span>
                              <span
                                className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] bg-white transition-transform ${isMasterOn
                                  ? 'text-emerald-700 font-extrabold'
                                  : 'text-rose-700 font-extrabold'
                                  }`}
                              >
                                {isMasterOn ? 'ON' : 'OFF'}
                              </span>
                            </button>

                            {isSavedThis && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                                ✓ Đã lưu
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cột 3 -> 7: 5 Cột Vai Trò */}
                        {ROLES_META.map((role) => {
                          const state: EffectiveCellState = resolveEffectiveCellState(
                            item,
                            role.id as UserRole | 'guest',
                            flags
                          );

                          return (
                            <td
                              key={role.id}
                              className={`p-3 align-middle text-center border-l border-slate-200/70 dark:border-slate-800/70 transition-colors ${activeImpersonation === role.id
                                ? 'bg-amber-50/50 dark:bg-amber-950/30'
                                : ''
                                }`}
                            >
                              <div className="flex flex-col items-center justify-center">
                                {state === 'ACTIVE' && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold shadow-2xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>Được phép</span>
                                  </div>
                                )}

                                {state === 'SUSPENDED' && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 text-xs font-semibold shadow-2xs animate-pulse">
                                    <PauseCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <span>Đang tắt</span>
                                  </div>
                                )}

                                {state === 'LOCKED' && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50/80 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-slate-800/50 text-xs font-semibold">
                                    <XCircle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                                    <span>Khóa</span>
                                  </div>
                                )}

                                {state === 'GOD_MODE' && (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60 text-xs font-bold shadow-2xs">
                                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                    <span>Toàn quyền</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* TẦNG 3: FOOTER THỬ ĐÓNG VAI NGHIỆM THU (ROLE IMPERSONATION STUDIO) */}
          <tfoot>
            <tr className="border-t-2 border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900">
              <td colSpan={2} className="p-4 align-middle">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Xem chức năng với vai trò
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bấm vào từng vai trò để trải nghiệm giao diện hệ thống dưới góc nhìn của vai trò đó.
                    </p>
                  </div>
                </div>
              </td>
              {ROLES_META.map((role) => (
                <td
                  key={role.id}
                  className="p-3 text-center align-middle border-l border-slate-200/70 dark:border-slate-800/70"
                >
                  {role.canImpersonate ? (
                    activeImpersonation === role.id ? (
                      <button
                        type="button"
                        onClick={handleExitImpersonate}
                        className="w-full px-2 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors shadow-xs cursor-pointer"
                      >
                        Thoát Vai
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartImpersonate(role.id)}
                        className="w-full px-2 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-750 border border-emerald-300 dark:border-emerald-700 rounded-md transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Đóng vai</span>
                      </button>
                    )
                  ) : (
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 px-2 py-1 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                      Tài khoản gốc
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Thông tin giải thích quy tắc */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Quy tắc hoạt động và mối liên hệ giữa Bật/Tắt tính năng & Phân quyền:
          </p>
          <p>
            1. <strong>Khi tính năng BẬT:</strong> Quyền truy cập được xác định theo vai trò quy định của từng thành viên (Được phép hoặc Khóa).
          </p>
          <p>
            2. <strong>Khi tính năng TẮT:</strong> Toàn bộ các vai trò thông thường sẽ tạm thời chuyển sang trạng thái <strong>Đang tắt</strong>.
          </p>
          <p>
            3. <strong>Quản Trị Viên Tối Cao (Super Admin):</strong> Luôn giữ quyền kiểm soát tối cao trên mọi tính năng để phục vụ việc cấu hình và quản trị hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
}
