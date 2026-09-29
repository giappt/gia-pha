'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  ArrowLeft,
  ExternalLink,
  Edit2,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  Sparkles,
  ClipboardList,
  ChevronDown,
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
  const isSuperAdmin = userProfile?.user_role === 'super_admin';
  const isBranchEditor = userProfile?.user_role === 'branch_editor';
  const isParent = userProfile?.user_role === 'claimed_member';

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

  // Super Admin Branch Selector
  const [selectedAdminBranchId, setSelectedAdminBranchId] = useState<string>('');

  // Find current branch info for branch editor
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

  // Filter members belonging to the active branch scope
  const branchMembers = useMemo(() => {
    if (isParent) {
      // Bố Mẹ: Chỉ xem con cái trong Gia Đình Của Bạn
      const myId = userProfile.linked_member_id;
      if (!myId) return [];
      return members.filter((m) => m.father_id === myId || m.mother_id === myId || m.id === myId);
    }

    if (isBranchEditor) {
      if (!assignedBranchCode) return [];
      return members.filter((m) => {
        const res = resolveMemberBranchHierarchy(m.id, members, initialBranches, initialSpouseRelations);
        return (
          res.matchedBranchIds.includes(assignedBranchCode) ||
          res.hierarchyLabels.some((lbl) => lbl.toLowerCase() === assignedBranchCode.toLowerCase())
        );
      });
    }

    if (isSuperAdmin) {
      // Super Admin: Chỉ hiển thị thành viên khi đã chọn một Chi cụ thể từ selector
      if (!selectedAdminBranchId) return [];
      return members.filter((m) => {
        const res = resolveMemberBranchHierarchy(m.id, members, initialBranches, initialSpouseRelations);
        return (
          res.matchedBranchIds.includes(selectedAdminBranchId) ||
          res.hierarchyLabels.some((lbl) => lbl.toLowerCase() === selectedAdminBranchId.toLowerCase())
        );
      });
    }

    return [];
  }, [
    members,
    isParent,
    isBranchEditor,
    isSuperAdmin,
    userProfile.linked_member_id,
    assignedBranchCode,
    selectedAdminBranchId,
    initialBranches,
    initialSpouseRelations,
  ]);

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

  // Dynamic titles and subtitles according to role (Spec 5.4)
  const portalTitle = isParent
    ? 'Phê Duyệt Hồ Sơ Con Cháu'
    : isBranchEditor
      ? `Phê Duyệt Thành Viên Chi ${currentBranch ? currentBranch.name : assignedBranchCode || ''}`
      : 'Phê Duyệt Hồ Sơ Toàn Tộc';

  const portalSubtitle = isParent
    ? 'Xét duyệt yêu cầu kết nối hoặc bổ sung thành viên trực hệ trong Gia Đình Của Bạn.'
    : isBranchEditor
      ? 'Xét duyệt hồ sơ con cháu thuộc Chi bạn phụ trách.'
      : 'Toàn quyền xét duyệt, ủy quyền và điều phối hồ sơ phả hệ toàn tộc.';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
          <Link
            href="/tree"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cây Gia Phả</span>
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

      {/* Navigation Controls & State Bar (Zero Layout Shift) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors relative cursor-pointer ${activeTab === 'pending'
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <Clock className="w-4 h-4" />
            <span>Hồ sơ đang chờ duyệt</span>
            {claims.length > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80">
                {claims.length}
              </span>
            )}
          </button>

          {!isParent && (
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-2 text-sm font-bold flex items-center gap-2 transition-colors relative cursor-pointer ${activeTab === 'members'
                  ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>
                {isSuperAdmin ? 'Xem theo Chi' : 'Thành viên trong Chi'}
              </span>
              {branchMembers.length > 0 && (
                <span className="text-[11px] font-medium text-slate-400">({branchMembers.length})</span>
              )}
            </button>
          )}
        </div>

        {/* Super Admin Branch Selector (Anti-Clutter: Dropdown lọc theo Chi, không xả đống 52 người) */}
        {isSuperAdmin && activeTab === 'members' && (
          <div className="flex items-center gap-2" id="super-admin-branch-selector">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
              Chọn Chi:
            </span>
            <select
              value={selectedAdminBranchId}
              onChange={(e) => setSelectedAdminBranchId(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">-- Chọn Chi nhánh để xem --</option>
              {initialBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.tierName || 'Chi'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: DANH SÁCH PHIẾU CHỜ DUYỆT (Fixed Table Layout w-[38%], w-[22%], w-[15%], w-[25%]) */}
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
                Mọi yêu cầu kết nối trong phạm vi của bạn đã được xử lý hoàn tất.
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
                    {claims.map((claim) => {
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
      )}

      {/* TAB 2: THÀNH VIÊN THEO CHI (Anti-Clutter: chỉ hiện khi Super Admin đã chọn Chi hoặc cho Trưởng Chi) */}
      {activeTab === 'members' && !isParent && (
        <div className="space-y-4">
          {isSuperAdmin && !selectedAdminBranchId ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Vui lòng chọn một Chi nhánh từ menu trên
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Hệ thống chỉ tải danh sách theo từng Chi nhánh để tối ưu hiệu năng và giữ giao diện tinh gọn, không xả phẳng toàn bộ phả hệ.
              </p>
            </div>
          ) : (
            <>
              {/* Controls: Search and Generation Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Tìm kiếm thành viên theo họ tên..."
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

              {/* Members Table with Fixed Widths w-[38%], w-[22%], w-[15%], w-[25%] */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm table-fixed">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                      <tr>
                        <th className="py-3 px-4 w-[38%]">Họ và Tên & Đời phả hệ</th>
                        <th className="py-3 px-4 w-[22%]">Giới tính & Năm sinh</th>
                        <th className="py-3 px-4 w-[15%]">Thứ bậc & Trạng thái</th>
                        <th className="py-3 px-4 w-[25%] text-right">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredBranchMembers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">
                            Không tìm thấy thành viên nào phù hợp
                          </td>
                        </tr>
                      ) : (
                        filteredBranchMembers.map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                              <div>{m.full_name}</div>
                              <div className="text-[11px] text-slate-400 font-normal">Đời {m.generation_level}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              <span>{m.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                              {m.birth_year ? <span className="text-slate-400 text-xs"> · ({m.birth_year})</span> : ''}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {m.is_senior ? (
                                <span className="text-amber-700 dark:text-amber-400 font-semibold block">Con trưởng</span>
                              ) : m.birth_order ? (
                                <span className="block">Con thứ {m.birth_order}</span>
                              ) : (
                                <span className="text-slate-400 block">-</span>
                              )}
                              <span className="text-[11px] text-slate-400">
                                {m.life_status === 'deceased' ? 'Đã mất' : 'Còn sống'}
                              </span>
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
            </>
          )}
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
