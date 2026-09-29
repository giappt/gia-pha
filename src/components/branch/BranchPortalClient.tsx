'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Edit2,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import type { BranchNode, ClaimRequestRow, UserProfile } from '@/types/database';
import type { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import { resolveMemberBranchHierarchy } from '@/lib/tree-layout/branch-engine';
import { getMemberInitials } from '@/lib/tree-layout/avatar-utils';
import { MemberFormModal } from '@/components/modals/MemberFormModal';

interface EnrichedClaim extends ClaimRequestRow {
  applicant?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  target_member?: {
    id: string;
    full_name: string;
    gender: string;
    generation_level: number;
    birth_year?: number | null;
  } | null;
  proposed_parent?: {
    id: string;
    full_name: string;
    gender: string;
    generation_level: number;
  } | null;
  assigned_editor?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
}

interface BranchPortalClientProps {
  userProfile: UserProfile;
  initialBranches: BranchNode[];
  initialMembers: MemberRecord[];
  initialSpouseRelations: SpouseRelationRecord[];
}

export default function BranchPortalClient({
  userProfile,
  initialBranches = [],
  initialMembers = [],
  initialSpouseRelations = [],
}: BranchPortalClientProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'members'>('pending');
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab 2: Members in branch
  const [members, setMembers] = useState<MemberRecord[]>(initialMembers);
  const [spouseRelations] = useState<SpouseRelationRecord[]>(initialSpouseRelations);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedGen, setSelectedGen] = useState<string>('all');
  const [editingMember, setEditingMember] = useState<MemberRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Find current branch info
  const assignedBranchCode = userProfile?.assigned_branch_code;
  const currentBranch = useMemo(() => {
    if (!assignedBranchCode) return null;
    return initialBranches.find(
      (b) => b.id.toLowerCase() === assignedBranchCode.toLowerCase() || b.name.toLowerCase() === assignedBranchCode.toLowerCase()
    );
  }, [assignedBranchCode, initialBranches]);

  // Load pending claims
  const loadClaims = async () => {
    setIsLoadingClaims(true);
    try {
      const res = await fetch('/api/claims/pending');
      if (res.ok) {
        const json = await res.json();
        setClaims(json.data || []);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setStatusMessage({ type: 'error', text: errJson.error || 'Không thể tải danh sách phiếu chờ duyệt' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Lỗi mạng khi tải danh sách phiếu' });
    } finally {
      setIsLoadingClaims(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  // Filter members belonging to this branch
  const branchMembers = useMemo(() => {
    if (!assignedBranchCode && userProfile.user_role !== 'super_admin') return [];
    return members.filter((m) => {
      if (userProfile.user_role === 'super_admin' && !assignedBranchCode) return true;
      const res = resolveMemberBranchHierarchy(m.id, members, initialBranches, initialSpouseRelations);
      return (
        res.matchedBranchIds.includes(assignedBranchCode!) ||
        res.hierarchyLabels.some((lbl) => lbl.toLowerCase() === assignedBranchCode!.toLowerCase())
      );
    });
  }, [members, assignedBranchCode, initialBranches, initialSpouseRelations, userProfile.user_role]);

  // Generations available in this branch
  const availableGens = useMemo(() => {
    const gens = new Set(branchMembers.map((m) => m.generation_level).filter(Boolean));
    return Array.from(gens).sort((a, b) => a - b);
  }, [branchMembers]);

  // Filtered members for Tab 2
  const filteredBranchMembers = useMemo(() => {
    return branchMembers.filter((m) => {
      const matchSearch = memberSearch.trim()
        ? m.full_name.toLowerCase().includes(memberSearch.toLowerCase().trim())
        : true;
      const matchGen = selectedGen === 'all' ? true : m.generation_level === Number(selectedGen);
      return matchSearch && matchGen;
    });
  }, [branchMembers, memberSearch, selectedGen]);

  // Review actions
  const handleReview = async (claimId: string, decision: 'approved' | 'rejected') => {
    let rejectionReason: string | undefined = undefined;
    if (decision === 'rejected') {
      const reasonInput = window.prompt('Nhập lý do từ chối yêu cầu kết nối:', 'Thông tin đối chiếu chưa trùng khớp với hồ sơ gia phả');
      if (reasonInput === null) return; // user cancelled prompt
      rejectionReason = reasonInput.trim() || 'Thông tin đối chiếu chưa trùng khớp';
    } else {
      if (!window.confirm('Bạn có chắc chắn muốn phê duyệt yêu cầu kết nối này vào Cây Gia Phả?')) {
        return;
      }
    }

    setProcessingClaimId(claimId);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/claims/${claimId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, rejection_reason: rejectionReason }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMessage({ type: 'error', text: json.error || 'Lỗi khi xử lý phê duyệt' });
      } else {
        setStatusMessage({ type: 'success', text: json.message || 'Thao tác thành công' });
        // Cập nhật danh sách claims
        setClaims((prev) => prev.filter((c) => c.id !== claimId));

        // Nếu duyệt đề xuất con mới, bổ sung vào danh sách members để hiển thị Tab 2 ngay
        if (decision === 'approved' && json.data?.member) {
          setMembers((prev) => [...prev, json.data.member]);
        }
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Lỗi mạng khi gửi quyết định duyệt' });
    } finally {
      setProcessingClaimId(null);
    }
  };

  const branchTitle = currentBranch ? currentBranch.name : assignedBranchCode || 'Toàn Phả Hệ';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>CỔNG QUẢN TRỊ CHI NHÁNH PHÂN CẤP</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Quản Trị: {branchTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Phụ trách bởi: <strong className="text-slate-700 dark:text-slate-300">{userProfile.full_name || userProfile.email}</strong> · Phê duyệt con cháu & chuẩn hóa nhân khẩu trong Chi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tree"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Xem Trên Cây</span>
          </Link>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs font-semibold underline opacity-70 hover:opacity-100"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Navigation Tabs (Anti-Pill: Clean border bottom) */}
      <div className="flex items-center gap-4 border-b border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${
            activeTab === 'pending'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Hàng Đợi Duyệt Con Cháu</span>
          {claims.length > 0 && (
            <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80">
              {claims.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 transition-colors relative ${
            activeTab === 'members'
              ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Thành Viên Trong Chi</span>
          <span className="text-[11px] font-medium text-slate-400">({branchMembers.length})</span>
        </button>
      </div>

      {/* TAB 1: HÀNG ĐỢI DUYỆT CON CHÁU */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Danh sách phiếu yêu cầu đang chờ xác minh ({claims.length})
            </h2>
            <button
              onClick={loadClaims}
              disabled={isLoadingClaims}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {isLoadingClaims && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Làm mới</span>
            </button>
          </div>

          {isLoadingClaims ? (
            <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Đang tải danh sách phiếu chờ duyệt...</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Không có phiếu nào đang chờ phê duyệt
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Mọi yêu cầu kết nối vào Chi này đã được xử lý xong.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {claims.map((claim) => {
                const isProcessing = processingClaimId === claim.id;

                let typeLabel = 'Nhận hồ sơ trên cây';
                if (claim.request_type === 'propose_child') {
                  typeLabel = 'Đề xuất nối con mới';
                } else if (claim.request_type === 'find_origin') {
                  typeLabel = 'Tìm cội nguồn ngoài đời';
                }

                return (
                  <div
                    key={claim.id}
                    className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Applicant & Proposal details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      {claim.applicant?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={claim.applicant.avatar_url}
                          alt={claim.applicant.full_name || 'Avatar'}
                          className="w-10 h-10 rounded-full border border-emerald-500/40 object-cover shrink-0 aspect-square"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 aspect-square">
                          {getMemberInitials(claim.applicant?.full_name || claim.applicant?.email)}
                        </div>
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {claim.applicant?.full_name || claim.applicant?.email}
                          </span>
                          <span className="text-xs text-slate-400">({claim.applicant?.email})</span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            {typeLabel}
                          </span>
                        </div>

                        {/* Proposal details */}
                        {claim.request_type === 'propose_child' && claim.proposed_data && (
                          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              Họ tên con: {claim.proposed_data.full_name} · Giới tính: {claim.proposed_data.gender === 'male' ? 'Nam' : 'Nữ'}
                              {claim.proposed_data.birth_year ? ` · Sinh: ${claim.proposed_data.birth_year}` : ''}
                              {claim.proposed_data.birth_order ? ` · Con thứ ${claim.proposed_data.birth_order}` : ''}
                              {claim.proposed_data.is_senior ? ' · (Nguyện vọng Con Trưởng)' : ''}
                            </p>
                            {claim.proposed_parent && (
                              <p className="text-slate-500 dark:text-slate-400">
                                Nối vào: <strong className="text-slate-700 dark:text-slate-300">{claim.proposed_parent.full_name}</strong> (Đời {claim.proposed_parent.generation_level})
                              </p>
                            )}
                          </div>
                        )}

                        {claim.request_type === 'claim_existing' && claim.target_member && (
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            Xin nhận hồ sơ: <strong className="text-slate-800 dark:text-slate-200">{claim.target_member.full_name}</strong> · Đời {claim.target_member.generation_level}
                            {claim.target_member.birth_year ? ` · Sinh năm ${claim.target_member.birth_year}` : ''}
                          </div>
                        )}

                        {claim.request_type === 'find_origin' && claim.proposed_data && (
                          <div className="text-xs text-slate-600 dark:text-slate-300">
                            Ghi chú cha/mẹ ngoài đời: <em className="text-amber-800 dark:text-amber-300 font-medium">{claim.proposed_data.raw_parent_info || 'Chưa ghi rõ'}</em>
                          </div>
                        )}

                        {claim.verification_notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                            Lời nhắn: &quot;{claim.verification_notes}&quot;
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>Ngày gửi: {new Date(claim.created_at).toLocaleDateString('vi-VN')}</span>
                          {claim.assigned_editor && (
                            <>
                              <span>·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Được giao cho: {claim.assigned_editor.full_name || claim.assigned_editor.email}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions (Anti-Pill standard: rounded-lg buttons) */}
                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleReview(claim.id, 'rejected')}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shadow-2xs"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Từ chối</span>
                      </button>

                      <button
                        onClick={() => handleReview(claim.id, 'approved')}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Phê duyệt</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: THÀNH VIÊN TRONG CHI */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Controls: Search and Generation Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Tìm kiếm thành viên trong chi theo họ tên..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Lọc theo Đời:</span>
              <select
                value={selectedGen}
                onChange={(e) => setSelectedGen(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="all">Tất cả các đời ({branchMembers.length})</option>
                {availableGens.map((g) => (
                  <option key={g} value={g}>
                    Đời thứ {g} ({branchMembers.filter((m) => m.generation_level === g).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Đời Phả Hệ</th>
                    <th className="py-3 px-4">Giới tính & Năm sinh</th>
                    <th className="py-3 px-4">Thứ bậc</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredBranchMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Không tìm thấy thành viên nào phù hợp
                      </td>
                    </tr>
                  ) : (
                    filteredBranchMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {m.full_name}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          Đời {m.generation_level}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {m.gender === 'male' ? 'Nam' : 'Nữ'}
                          {m.birth_year ? ` · (${m.birth_year})` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {m.is_senior ? (
                            <span className="text-amber-700 dark:text-amber-400 font-semibold">Con trưởng</span>
                          ) : m.birth_order ? (
                            <span>Con thứ {m.birth_order}</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {m.life_status === 'deceased' ? (
                            <span className="inline-flex items-center gap-1 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Đã mất
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Còn sống
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingMember(m);
                                setIsEditModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Sửa thông tin thành viên"
                            >
                              <Edit2 className="w-3 h-3 inline mr-1" />
                              Sửa
                            </button>
                            <Link
                              href={`/tree?focus=${m.id}`}
                              className="px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Xem vị trí trên Cây"
                            >
                              <ExternalLink className="w-3 h-3 inline mr-1" />
                              Cây
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sửa Hồ Sơ Thành Viên */}
      {isEditModalOpen && editingMember && (
        <MemberFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingMember(null);
          }}
          mode="edit"
          initialData={editingMember}
          onSaved={(updated: MemberRecord) => {
            setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
            setIsEditModalOpen(false);
            setEditingMember(null);
            setStatusMessage({ type: 'success', text: `Đã cập nhật thông tin cho ${updated.full_name}` });
          }}
          allMembers={members}
          allSpouses={spouseRelations}
        />
      )}
    </div>
  );
}
