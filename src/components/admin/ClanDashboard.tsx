'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  ArrowRight,
  RefreshCw,
  Clock,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';
import { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import { UnlinkedMembersDrawer } from '@/components/tree/UnlinkedMembersDrawer';
import { getUnlinkedMembers } from '@/lib/tree-layout/graph-validation';
import {
  computeClanVitalityMetrics,
  type ClanVitalityMetrics,
} from '@/lib/admin/admin-engine';
import FamilyTreeIcon from '../icons/FamilyTreeIcon';

export default function ClanDashboard() {
  const [metrics, setMetrics] = useState<ClanVitalityMetrics | null>(null);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [spouses, setSpouses] = useState<SpouseRelationRecord[]>([]);
  const [unlinkedCount, setUnlinkedCount] = useState(0);
  const [isUnlinkedDrawerOpen, setIsUnlinkedDrawerOpen] = useState(false);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [featureFlags, setFeatureFlags] = useState<any>(null);
  const [clanName, setClanName] = useState('GIA PHẢ PHẠM VĂN');
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      const [treeRes, userRes, clanRes] = await Promise.all([
        fetch('/api/tree').then((r) => (r.ok ? r.json() : { data: {} })),
        fetch('/api/users').then((r) => (r.ok ? r.json() : { data: [] })),
        fetch('/api/clan-settings').then((r) => (r.ok ? r.json() : { data: {} })),
      ]);

      const memList: MemberRecord[] = Array.isArray(treeRes.data?.members) ? treeRes.data.members : [];
      const spList: SpouseRelationRecord[] = Array.isArray(treeRes.data?.spouseRelations) ? treeRes.data.spouseRelations : [];
      const users = Array.isArray(userRes.data) ? userRes.data : [];

      setMembers(memList);
      setSpouses(spList);

      const computed = computeClanVitalityMetrics(memList, users);
      setMetrics(computed);

      const unlinked = getUnlinkedMembers(memList, spList);
      setUnlinkedCount(unlinked.length);

      setRecentUsers(users.slice(0, 4));

      if (clanRes.data?.feature_flags) {
        setFeatureFlags(clanRes.data.feature_flags);
      }
      if (clanRes.data?.clan_name) {
        setClanName(clanRes.data.clan_name);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handler: Nối phả trực tiếp từ Drawer rà soát việc khẩn
  const handleRelinkMember = async (
    memberId: string,
    relinkPayload: string | { father_id: string | null; mother_id: string | null }
  ) => {
    let updatePayload: { father_id?: string | null; mother_id?: string | null };

    if (typeof relinkPayload === 'string') {
      const parent = members.find((m) => m.id === relinkPayload);
      const isMother = parent?.gender === 'female';
      updatePayload = isMother ? { mother_id: relinkPayload } : { father_id: relinkPayload };
    } else {
      updatePayload = relinkPayload;
    }

    const res = await fetch(`/api/members/${memberId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Nối phả thất bại');
    }

    // Tự động tải lại dữ liệu để làm tươi Dashboard
    await loadDashboardData();
  };

  // Handler: Xóa thành viên rác an toàn từ Drawer
  const handleDeleteMember = async (memberId: string) => {
    const res = await fetch(`/api/members/${memberId}`, {
      method: 'DELETE',
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Xóa thành viên thất bại');
    }

    // Tự động tải lại dữ liệu để làm tươi Dashboard
    await loadDashboardData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-28">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Đang tổng hợp dữ liệu Bàn Điều Hành...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Bàn Điều Hành
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
              Hệ Thống Trực Tuyến
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-1">
            {clanName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng quan sức khỏe dữ liệu phả ký, danh sách con cháu và trạng thái vận hành hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <span>Xem Cây Phả Hệ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Pillar 1: Vitality & Digital Coverage Cards (Chuẩn hóa rounded-lg đĩnh đạc) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Members */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tổng Nhân Khẩu
            </span>
            <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics?.totalMembers.toLocaleString('vi-VN') || 0}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-emerald-600 font-semibold">{metrics?.males || 0} Nam</span>
              <span>•</span>
              <span className="text-pink-600 font-semibold">{metrics?.females || 0} Nữ</span>
              <span>•</span>
              <span className="text-slate-400 font-medium">{metrics?.deceased || 0} Đã mất</span>
            </div>
          </div>
        </div>

        {/* Card 2: Generations */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Độ Sâu Phả Hệ
            </span>
            <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <FamilyTreeIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics?.maxGeneration || 1} <span className="text-sm font-bold text-slate-400">Thế Hệ</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Tính từ Cụ Tổ Đời 1 đến thế hệ con cháu trẻ nhất.
            </p>
          </div>
        </div>

        {/* Card 3: Account Coverage */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tài Khoản Đã Vào
            </span>
            <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics?.totalUsers || 0} <span className="text-sm font-bold text-slate-400">Users</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="text-blue-600 font-bold">{metrics?.linkedUsers || 0} đã gắn node</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{metrics?.unlinkedUsers || 0} chưa gắn</span>
            </div>
          </div>
        </div>

        {/* Card 4: System Operational State */}
        <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Trạng Thái Hệ Thống
            </span>
            <div className="w-8 h-8 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{featureFlags?.maintenance_mode ? 'Bảo Trì' : 'Đang Hoạt Động'}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Cây phả hệ: {featureFlags?.enable_public_tree ? 'Công khai' : 'Nội bộ'} • Bảo vệ sống: {featureFlags?.mask_living_member_privacy ? 'Bật' : 'Tắt'}
            </p>
          </div>
        </div>
      </div>

      {/* Pillar 2: Action Center (Cảnh báo việc khẩn & rà soát dữ liệu) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Action Items (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Trung Tâm Việc Cần Xử Lý & Rà Soát Dữ Liệu</span>
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {unlinkedCount + (metrics?.unlinkedUsers || 0)} mục cần chú ý
            </span>
          </div>

          <div className="space-y-3">
            {/* Item 1: Unlinked Members Warning (Tích hợp Drawer rà soát nối phả tại chỗ) */}
            <div className="p-4 rounded-lg border border-amber-200/90 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200">
                    {unlinkedCount > 0
                      ? `Có ${unlinkedCount} thành viên chưa nối phả (thiếu thông tin cha/mẹ)`
                      : 'Cây gia phả hoàn chỉnh (Không có thành viên trôi dạt thiếu cha mẹ)'}
                  </h3>
                  <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                    {unlinkedCount > 0
                      ? 'Các thành viên này thuộc thế hệ sau nhưng chưa được gắn với cha mẹ cụ thể trên cây đồ thị.'
                      : 'Toàn bộ con cháu từ Đời 2 trở đi đều đã được kết nối huyết thống chính xác với tiền nhân.'}
                  </p>
                </div>
              </div>
              {unlinkedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsUnlinkedDrawerOpen(true)}
                  id="btn-check-unlinked-members"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-xs flex-shrink-0 cursor-pointer"
                >
                  <span>Kiểm tra</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Item 2: Unlinked Google Users Alert */}
            <div className="p-4 rounded-lg border border-blue-200/90 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200">
                    {metrics && metrics.unlinkedUsers > 0
                      ? `Có ${metrics.unlinkedUsers} tài khoản Google mới chưa được gắn node phả hệ`
                      : 'Toàn bộ tài khoản đã được đối soát & liên kết'}
                  </h3>
                  <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1 leading-relaxed">
                    Con cháu đã đăng nhập tài khoản. Trưởng tộc có thể trực tiếp liên kết tài khoản của họ vào đúng vị trí trên cây phả hệ.
                  </p>
                </div>
              </div>
              <Link
                href="/admin/users"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-xs flex-shrink-0"
              >
                <span>Gán node</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Pillar 3: Quick Action Launchers (Chuẩn hóa rounded-md) */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Phím Tắt Tác Vụ Quản Trị
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/admin/branches"
                className="p-3.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-center group"
              >
                <FamilyTreeIcon className="w-5 h-5 mx-auto text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-2">
                  Ngành & Chi
                </span>
              </Link>

              <Link
                href="/admin/users"
                className="p-3.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-center group"
              >
                <Users className="w-5 h-5 mx-auto text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-2">
                  Tài Khoản
                </span>
              </Link>

              <Link
                href="/admin/features"
                className="p-3.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-center group"
              >
                <SlidersHorizontal className="w-5 h-5 mx-auto text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-2">
                  Bật/Tắt Cờ
                </span>
              </Link>

              <Link
                href="/admin/import"
                className="p-3.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all text-center group"
              >
                <FileSpreadsheet className="w-5 h-5 mx-auto text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-2">
                  Nạp Excel
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Audit (5 cols - Chuẩn hóa rounded-lg) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/90 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Nhật Ký Hoạt Động & Biến Động</span>
            </h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
              Gần Đây
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Cập nhật cấu trúc phân cấp Ngành/Chi & Cụ Khởi Nguồn
                </p>
                <span className="text-[11px] text-slate-400">Vừa xong • Super Admin</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Đồng bộ danh mục quy ước xưng hô 32 quan hệ
                </p>
                <span className="text-[11px] text-slate-400">Hôm nay • Hệ thống</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Nạp thành công dữ liệu phả ký 1.299 nhân khẩu từ file Excel
                </p>
                <span className="text-[11px] text-slate-400">Gần đây • Ingestion Pipeline</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Khởi tạo hệ thống gia phả số hóa trực tuyến FAT
                </p>
                <span className="text-[11px] text-slate-400">Khởi đầu • Ban Quản Trị</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <Link
              href="/admin/users"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
            >
              <span>Xem danh sách tài khoản thành viên</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer Rà Soát & Nối Phả Cho Thành Viên Chưa Nối */}
      <UnlinkedMembersDrawer
        isOpen={isUnlinkedDrawerOpen}
        onClose={() => setIsUnlinkedDrawerOpen(false)}
        members={members}
        spouses={spouses}
        onRelinkMember={handleRelinkMember}
        onDeleteMember={handleDeleteMember}
      />
    </div>
  );
}
