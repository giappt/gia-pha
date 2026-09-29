'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  AlertCircle,
  Loader2,
  ClipboardList,
  ArrowLeft,
  Filter,
} from 'lucide-react';
import type { BranchNode, ClaimRequestRow, UserProfile } from '@/types/database';
import { getMemberInitials } from '@/lib/tree-layout/avatar-utils';

export interface EnrichedClaim extends ClaimRequestRow {
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

interface AdminClaimsClientProps {
  userProfile: UserProfile;
  initialBranches: BranchNode[];
}

export default function AdminClaimsClient({
  userProfile,
  initialBranches = [],
}: AdminClaimsClientProps) {
  const isSuperAdmin = userProfile?.user_role === 'super_admin';
  const isBranchEditor = userProfile?.user_role === 'branch_editor';
  const isClaimedMember = userProfile?.user_role === 'claimed_member';

  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Branch Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');

  // Find assigned branch for branch editor
  const assignedBranchCode = userProfile?.assigned_branch_code;
  const currentBranch = useMemo(() => {
    if (!assignedBranchCode) return null;
    return initialBranches.find(
      (b) =>
        b.id.toLowerCase() === assignedBranchCode.toLowerCase() ||
        b.name.toLowerCase() === assignedBranchCode.toLowerCase()
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

  // Filtered claims based on Branch Filter & Search
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // 1. Branch scoping filter
      if (isBranchEditor && assignedBranchCode) {
        const matchBranch =
          !claim.target_branch_code ||
          claim.target_branch_code.toLowerCase() === assignedBranchCode.toLowerCase();
        const matchAssigned = claim.assigned_to === userProfile.id;
        if (!matchBranch && !matchAssigned) return false;
      } else if (isSuperAdmin && selectedBranchId !== 'all') {
        const matchBranch =
          claim.target_branch_code?.toLowerCase() === selectedBranchId.toLowerCase();
        if (!matchBranch) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const applicantName = claim.applicant?.full_name?.toLowerCase() || '';
        const applicantEmail = claim.applicant?.email?.toLowerCase() || '';
        const targetMemberName = claim.target_member?.full_name?.toLowerCase() || '';
        const proposedChildName = claim.proposed_data?.full_name?.toLowerCase() || '';
        const proposedParentName = claim.proposed_parent?.full_name?.toLowerCase() || '';

        const matches =
          applicantName.includes(query) ||
          applicantEmail.includes(query) ||
          targetMemberName.includes(query) ||
          proposedChildName.includes(query) ||
          proposedParentName.includes(query);

        if (!matches) return false;
      }

      return true;
    });
  }, [claims, isBranchEditor, assignedBranchCode, isSuperAdmin, selectedBranchId, searchQuery, userProfile.id]);

  // Review actions
  const handleReview = async (claimId: string, decision: 'approved' | 'rejected') => {
    let rejectionReason: string | undefined = undefined;
    if (decision === 'rejected') {
      const reasonInput = window.prompt(
        'Nhập lý do từ chối yêu cầu kết nối:',
        'Thông tin đối chiếu chưa trùng khớp với hồ sơ gia phả'
      );
      if (reasonInput === null) return;
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
        setClaims((prev) => prev.filter((c) => c.id !== claimId));
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Lỗi mạng khi gửi quyết định duyệt' });
    } finally {
      setProcessingClaimId(null);
    }
  };

  // Dynamic titles and subtitles according to role (Spec 5.4 & 5.5)
  const portalTitle = isClaimedMember
    ? 'Phê Duyệt Hồ Sơ Con Cháu'
    : isBranchEditor
      ? `Phê Duyệt Thành Viên Chi ${currentBranch ? currentBranch.name : assignedBranchCode || ''}`
      : 'Phê Duyệt Hồ Sơ Toàn Tộc';

  const portalSubtitle = isClaimedMember
    ? 'Xét duyệt và kết nối hồ sơ con cháu trong gia đình của bạn.'
    : isBranchEditor
      ? 'Xét duyệt hồ sơ con cháu thuộc Chi bạn phụ trách.'
      : 'Toàn quyền xét duyệt, ủy quyền và điều phối hồ sơ phả hệ toàn tộc.';

  return (
    <div className="w-full space-y-6">
      {/* Top Header - Anti-Pill: icon bo góc rounded-xl, viền mảnh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl border border-emerald-200/80 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {portalTitle}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {portalSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadClaims}
            disabled={isLoadingClaims}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-2xs cursor-pointer"
          >
            <Clock className={`w-3.5 h-3.5 ${isLoadingClaims ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
          <Link
            href="/tree"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Cây Gia Phả</span>
          </Link>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 ${statusMessage.type === 'success'
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

      {/* Unified Filter Toolbar (Anti-Clutter, Flat & Responsive) */}
      <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo họ tên, email người gửi, con cái..."
            className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Branch Filter Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
            Chi tộc:
          </span>
          {isSuperAdmin ? (
            <select
              id="admin-claims-branch-selector"
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">Tất cả chi tộc (Toàn tộc)</option>
              {initialBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.tierName || 'Chi'})
                </option>
              ))}
            </select>
          ) : isBranchEditor ? (
            <div className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {currentBranch ? `${currentBranch.name} (${currentBranch.tierName || 'Chi'})` : assignedBranchCode || 'Chi phụ trách'}
            </div>
          ) : (
            <div className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              Gia Đình Của Bạn
            </div>
          )}
        </div>
      </div>

      {/* Main Approval Queue Table (Fixed Table Layout w-[38%], w-[22%], w-[15%], w-[25%]) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Hàng đợi phê duyệt ({filteredClaims.length} phiếu)
          </h2>
          {claims.length > 0 && (
            <span className="text-xs text-slate-400">
              Tổng số trong hệ thống: {claims.length}
            </span>
          )}
        </div>

        {isLoadingClaims ? (
          <div className="py-16 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Đang tải danh sách phiếu chờ duyệt...</span>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Không có phiếu nào đang chờ phê duyệt
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || selectedBranchId !== 'all'
                ? 'Không tìm thấy phiếu nào khớp với điều kiện lọc hiện tại.'
                : 'Mọi yêu cầu kết nối trong phạm vi của bạn đã được xử lý hoàn tất.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm table-fixed">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-[38%]">Thành viên & Người gửi</th>
                    <th className="py-3 px-4 w-[22%]">Loại yêu cầu & Nhánh</th>
                    <th className="py-3 px-4 w-[15%]">Thế hệ / Ngày</th>
                    <th className="py-3 px-4 w-[25%] text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredClaims.map((claim) => {
                    const isProcessing = processingClaimId === claim.id;

                    let typeLabel = 'Nhận hồ sơ trên cây';
                    let targetMemberId: string | null = claim.member_id || null;
                    if (claim.request_type === 'propose_child') {
                      typeLabel = 'Đề xuất nối con mới';
                      targetMemberId = claim.proposed_data?.parent_id || null;
                    } else if (claim.request_type === 'find_origin') {
                      typeLabel = 'Tìm cội nguồn ngoài đời';
                    }

                    return (
                      <tr
                        key={claim.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* Cột 1: w-[38%] - Người gửi & Chi tiết đề xuất */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-3 min-w-0">
                            {claim.applicant?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={claim.applicant.avatar_url}
                                alt={claim.applicant.full_name || 'Avatar'}
                                className="w-8 h-8 rounded-full border border-emerald-500/40 object-cover shrink-0 aspect-square mt-0.5"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 aspect-square mt-0.5">
                                {getMemberInitials(claim.applicant?.full_name || claim.applicant?.email)}
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {claim.applicant?.full_name || claim.applicant?.email}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{claim.applicant?.email}</p>

                              {claim.request_type === 'propose_child' && claim.proposed_data && (
                                <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                                  <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                                    Con: {claim.proposed_data.full_name}
                                  </span>
                                  <span>
                                    {' '}· {claim.proposed_data.gender === 'male' ? 'Nam' : 'Nữ'}
                                    {claim.proposed_data.birth_year ? ` · Sinh: ${claim.proposed_data.birth_year}` : ''}
                                    {claim.proposed_data.birth_order ? ` · Thứ ${claim.proposed_data.birth_order}` : ''}
                                    {claim.proposed_data.is_senior ? ' · (Con Trưởng)' : ''}
                                  </span>
                                  {claim.proposed_parent && (
                                    <p className="text-slate-500 dark:text-slate-400 truncate">
                                      Nối vào: {claim.proposed_parent.full_name}
                                    </p>
                                  )}
                                </div>
                              )}

                              {claim.request_type === 'claim_existing' && claim.target_member && (
                                <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 truncate">
                                  Hồ sơ: <strong className="text-slate-800 dark:text-slate-200">{claim.target_member.full_name}</strong>
                                  {claim.target_member.birth_year ? ` (${claim.target_member.birth_year})` : ''}
                                </div>
                              )}

                              {claim.verification_notes && (
                                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 italic truncate" title={claim.verification_notes}>
                                  &quot;{claim.verification_notes}&quot;
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: w-[22%] - Loại yêu cầu & Nhánh */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="font-medium text-emerald-800 dark:text-emerald-300 block">
                            {typeLabel}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {claim.target_branch_code || 'Chưa định nhánh'}
                          </span>
                        </td>

                        {/* Cột 3: w-[15%] - Thế hệ & Ngày gửi */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          <span className="block font-medium">
                            {claim.proposed_parent
                              ? `Đời ${(claim.proposed_parent.generation_level || 0) + 1}`
                              : claim.target_member
                                ? `Đời ${claim.target_member.generation_level}`
                                : '-'}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            {new Date(claim.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </td>

                        {/* Cột 4: w-[25%] - Thao tác */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {targetMemberId && (
                              <Link
                                href={`/tree?focus=${targetMemberId}`}
                                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                                title="Xem vị trí trên Cây"
                              >
                                <ExternalLink className="w-3 h-3 inline mr-1" />
                                <span>Cây</span>
                              </Link>
                            )}

                            <button
                              onClick={() => handleReview(claim.id, 'rejected')}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shadow-2xs"
                            >
                              <XCircle className="w-3 h-3 inline mr-1" />
                              <span>Từ chối</span>
                            </button>

                            <button
                              onClick={() => handleReview(claim.id, 'approved')}
                              disabled={isProcessing}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              )}
                              <span>Duyệt</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
