'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  Info,
  Sliders,
  UserCheck,
} from 'lucide-react';
import {
  PERMISSION_MATRIX_DEFINITIONS,
  resolveEffectiveRole,
  type ImpersonatedRole,
} from '@/lib/admin/admin-engine';

const ROLES_META = [
  {
    id: 'guest',
    title: 'Khách Vãng Lai',
    subtitle: 'Chưa Đăng Nhập',
    badge: 'Guest',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    description: 'Người ngoài họ hoặc con cháu truy cập lần đầu qua liên kết chia sẻ mạng xã hội.',
    canImpersonate: true,
  },
  {
    id: 'viewer',
    title: 'Thành Viên Mới',
    subtitle: 'Đã Đăng Nhập Google',
    badge: 'Viewer',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    description: 'Đã xác thực Google nhưng chưa được Admin phê duyệt gắn vào một node phả hệ cụ thể.',
    canImpersonate: true,
  },
  {
    id: 'claimed_member',
    title: 'Con Cháu Gắn Node',
    subtitle: 'Chính Thức Trong Họ',
    badge: 'Member',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    description: 'Đã liên kết tài khoản với vị trí trong gia phả. Nhận trọn vẹn thông báo giỗ người thân.',
    canImpersonate: true,
  },
  {
    id: 'branch_editor',
    title: 'Biên Tập Viên Chi',
    subtitle: 'Cán Bộ Phả Hệ Nhánh',
    badge: 'Branch Editor',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    description: 'Phụ trách cập nhật thông tin con cháu, phối ngẫu và ngày mất cho nhánh phả hệ được phân công.',
    canImpersonate: true,
  },
  {
    id: 'super_admin',
    title: 'Quản Trị Tối Cao',
    subtitle: 'Trưởng Tộc / God Mode',
    badge: 'Super Admin',
    badgeColor: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800',
    description: 'Toàn quyền tối cao với toàn bộ cây phả hệ, bàn điều hành, phân quyền và dữ liệu dòng tộc.',
    canImpersonate: false,
  },
];

const CATEGORY_NAMES: Record<string, { label: string; icon: any; desc: string }> = {
  visibility: {
    label: '1. Tiếp Cận & Quyền Riêng Tư',
    icon: Eye,
    desc: 'Quy định khả năng tra cứu, hiển thị cây phả hệ và bảo mật thông tin liên lạc người sống.',
  },
  interaction: {
    label: '2. Tự Phục Vụ & Gắn Kết',
    icon: UserCheck,
    desc: 'Quyền gửi yêu cầu nhận diện nhân thân (claim node) và nhận tin nhắn Web Push nhắc giỗ.',
  },
  editing: {
    label: '3. Biên Tập & Hiệu Đính Gia Phả',
    icon: Sliders,
    desc: 'Quyền chỉnh sửa thông tin nhân thân, thêm con cháu và tái lập cấu trúc thứ tự đàn con.',
  },
  administration: {
    label: '4. Bàn Điều Hành & Bảo Trợ Tông Tộc',
    icon: ShieldCheck,
    desc: 'Quyền hạn quản trị tối cao, kiểm soát tài khoản, phê duyệt và nạp dữ liệu di sản họ tộc.',
  },
};

export default function AdminRolesPage() {
  const router = useRouter();
  const [activeImpersonation, setActiveImpersonation] = useState<ImpersonatedRole>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Đọc cookie hiện thời
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

  const handleStartImpersonate = (roleId: string) => {
    document.cookie = `fat_impersonated_role=${encodeURIComponent(roleId)}; path=/; max-age=${60 * 60 * 24}`;
    setActiveImpersonation(roleId as ImpersonatedRole);
    window.dispatchEvent(new Event('fat_impersonation_change'));

    const meta = ROLES_META.find((r) => r.id === roleId);
    setToastMessage(`Đã kích hoạt chế độ Đóng Vai: "${meta?.title || roleId}". Thanh điều khiển nổi đã sẵn sàng!`);
    setTimeout(() => setToastMessage(null), 5000);
    router.refresh();
  };

  const handleExitImpersonate = () => {
    document.cookie = 'fat_impersonated_role=; path=/; max-age=0';
    setActiveImpersonation(null);
    window.dispatchEvent(new Event('fat_impersonation_change'));
    setToastMessage('Đã thoát chế độ đóng vai. Bạn đang ở toàn quyền Quản Trị Tối Cao (Super Admin).');
    setTimeout(() => setToastMessage(null), 4000);
    router.refresh();
  };

  // Gom các quyền theo nhóm danh mục
  const categories = ['visibility', 'interaction', 'editing', 'administration'] as const;

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 text-white dark:bg-emerald-950 dark:text-emerald-100 border border-emerald-500/50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <Link href="/admin" className="hover:underline flex items-center gap-1 text-slate-500 hover:text-emerald-600">
              <ArrowLeft className="w-3.5 h-3.5" /> Bàn Điều Hành
            </Link>
            <span>/</span>
            <span>Thành Viên & Tài Khoản</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Phân Quyền & Ma Trận Vai Trò Tông Tộc
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Tổng hợp đặc quyền của 5 cấp bậc vai trò trong hệ thống Gia Phả Số. Super Admin có toàn quyền tối thượng (God Mode) và có thể kích hoạt Chế độ Đóng Vai để nghiệm thu trải nghiệm thực tế.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/users"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Quản Lý Tài Khoản</span>
          </Link>
          <Link
            href="/admin/features"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Cài Đặt Tính Năng</span>
          </Link>
        </div>
      </div>

      {/* Thông điệp Nguyên Tắc & Hướng Dẫn Đóng Vai */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-amber-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-amber-950/30 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Đặc Quyền Tối Thượng Super Admin & Bảo Đảm Không Bị Khóa Quyền</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                GOD MODE
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Tài khoản Super Admin không bị hạn chế bởi bất kỳ cờ tính năng nào. Khi bấm <strong>[Thử Đóng Vai]</strong>, hệ thống chỉ tạm thời mô phỏng giao diện người dùng mà không làm giảm quyền bảo mật thật của bạn. Nút <strong>[Vào Quản Trị]</strong> trên thanh banner nổi luôn luôn khả dụng.
            </p>
          </div>
        </div>

        {activeImpersonation && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 px-3 py-2 rounded-lg shrink-0 shadow-xs">
            <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
            <div className="text-xs">
              <span className="text-slate-500 dark:text-slate-400">Đang đóng vai: </span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                {ROLES_META.find((r) => r.id === activeImpersonation)?.title}
              </span>
            </div>
            <button
              type="button"
              onClick={handleExitImpersonate}
              className="ml-2 px-2 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md transition-colors cursor-pointer"
            >
              Thoát Đóng Vai
            </button>
          </div>
        )}
      </div>

      {/* BẢNG MA TRẬN PHÂN QUYỀN 5 CỘT */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
        <table className="w-full text-left border-collapse min-w-[950px]">
          {/* Header Bảng: 5 Cột Roles */}
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
              <th className="p-4 w-[320px] text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Hạng Mục Đặc Quyền Hệ Thống
              </th>
              {ROLES_META.map((role) => (
                <th
                  key={role.id}
                  className={`p-3.5 text-center transition-colors border-l border-slate-200/70 dark:border-slate-800/70 ${
                    activeImpersonation === role.id
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 ring-2 ring-amber-500/50 inset-0'
                      : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-full border mb-1.5 ${role.badgeColor}`}
                    >
                      {role.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {role.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {role.subtitle}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Bảng: Phân theo 4 nhóm */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {categories.map((catKey) => {
              const catMeta = CATEGORY_NAMES[catKey];
              const permsInCat = PERMISSION_MATRIX_DEFINITIONS.filter((p) => p.category === catKey);
              const CatIcon = catMeta.icon;

              return (
                <React.Fragment key={catKey}>
                  {/* Category Header Row */}
                  <tr className="bg-slate-100/70 dark:bg-slate-900/90 border-t-2 border-slate-300 dark:border-slate-700">
                    <td colSpan={6} className="p-3">
                      <div className="flex items-center gap-2">
                        <CatIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                          {catMeta.label}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 italic hidden sm:inline">
                          — {catMeta.desc}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Permissions Rows in Category */}
                  {permsInCat.map((perm) => (
                    <tr
                      key={perm.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="p-3.5 pr-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {perm.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {perm.description}
                        </div>
                      </td>

                      {/* 5 Cột trạng thái */}
                      {ROLES_META.map((role) => {
                        const hasPerm = (perm.roles as any)[role.id] ?? false;
                        const isCurrentActive = activeImpersonation === role.id;

                        return (
                          <td
                            key={role.id}
                            className={`p-3 text-center border-l border-slate-200/50 dark:border-slate-800/50 ${
                              isCurrentActive ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              {hasPerm ? (
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                                  <span className="hidden xl:inline">Được phép</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-slate-400 dark:text-slate-600 text-[11px]">
                                  <XCircle className="w-4 h-4 opacity-40" />
                                  <span className="hidden xl:inline">Bị khóa</span>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>

          {/* Footer Bảng: Nút Hành Động Đóng Vai */}
          <tfoot>
            <tr className="bg-slate-50/90 dark:bg-slate-900/80 border-t-2 border-slate-300 dark:border-slate-700">
              <td className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Hành Động Kiểm Thử:</span>
                </div>
                <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                  Đóng vai lập tức không cần đăng xuất
                </div>
              </td>

              {ROLES_META.map((role) => {
                const isCurrentActive = activeImpersonation === role.id;

                return (
                  <td
                    key={role.id}
                    className={`p-3 text-center border-l border-slate-200 dark:border-slate-800 ${
                      isCurrentActive ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''
                    }`}
                  >
                    {role.canImpersonate ? (
                      isCurrentActive ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 animate-pulse">
                            ● ĐANG ĐÓNG VAI
                          </span>
                          <button
                            type="button"
                            onClick={handleExitImpersonate}
                            className="w-full px-2 py-1 text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-md shadow-xs transition-colors cursor-pointer"
                          >
                            Thoát vai
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStartImpersonate(role.id)}
                          className="w-full px-2 py-1.5 text-[11px] font-semibold bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-300 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-600 text-slate-700 dark:text-slate-200 rounded-md shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          title={`Kích hoạt chế độ xem với vai trò ${role.title}`}
                        >
                          <span>🎭 Thử đóng vai</span>
                        </button>
                      )
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="px-2 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 rounded-md">
                          👑 Vai Trò Gốc
                        </span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Hướng Dẫn & Quy Định Nghiệp Vụ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1.5">
            <Info className="w-4 h-4 text-blue-500" />
            <span>Quy Trình Nâng Cấp Tự Động</span>
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Khi người dùng Google xác thực lần đầu, họ mặc định mang vai trò <strong>Viewer</strong>. Khi gửi yêu cầu nhận node và được Admin phê duyệt gán vào phả hệ, hệ thống tự động thăng cấp thành <strong>Con Cháu Gắn Node (claimed_member)</strong>.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Bảo Vệ Quyền Riêng Tư (Privacy Masking)</span>
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Số điện thoại của người còn sống bị che mờ bằng dấu sao (<code>0912***789</code>) đối với Khách vãng lai và Thành viên mới. Chỉ con cháu trong họ đã được phê duyệt mới xem được đầy đủ để liên lạc nội bộ.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-xs">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Không Giới Hạn Cho Quản Trị Viên</span>
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            Super Admin luôn có quyền truy cập vào tất cả các phân hệ dữ liệu, kiểm tra nhật ký lỗi, gán phân quyền tài khoản và cấu hình cờ tính năng mở rộng dòng tộc theo thời gian thực.
          </p>
        </div>
      </div>
    </div>
  );
}
