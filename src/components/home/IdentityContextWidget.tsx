'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Link as LinkIcon,
  Eye,
  Clock,
  UserCheck,
  ShieldCheck,
  Sparkles,
  X,
  Loader2,
  Bell,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { UserProfile, BranchNode } from '@/types/database';
import type { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import { getMemberInitials } from '@/lib/tree-layout/avatar-utils';
import { resolveMemberBranchHierarchy, USER_PREFERENCES_EVENT } from '@/lib/tree-layout/branch-engine';
import ConnectGenealogyModal from '@/components/modals/ConnectGenealogyModal';

interface IdentityContextWidgetProps {
  user: User | null;
  userProfile: UserProfile | null;
  members: MemberRecord[];
  branches?: BranchNode[];
  spouseRelations?: SpouseRelationRecord[];
  userInitials?: string;
  claimedMemberIds?: string[];
}

export default function IdentityContextWidget({
  user,
  userProfile,
  members = [],
  branches = [],
  spouseRelations = [],
  userInitials,
  claimedMemberIds = [],
}: IdentityContextWidgetProps) {
  const [pendingClaim, setPendingClaim] = useState<any | null>(null);
  const [isLoadingClaim, setIsLoadingClaim] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancellingClaim, setIsCancellingClaim] = useState(false);

  // Đồng bộ với sự kiện thay đổi tùy chọn cá nhân
  useEffect(() => {
    const handlePrefChange = () => {
      // Preferences changed, widget keeps in sync
    };
    window.addEventListener(USER_PREFERENCES_EVENT, handlePrefChange);
    return () => {
      window.removeEventListener(USER_PREFERENCES_EVENT, handlePrefChange);
    };
  }, []);

  // Fetch pending claim if user exists and not linked
  const loadMyClaim = async () => {
    if (!user) return;
    try {
      setIsLoadingClaim(true);
      const res = await fetch('/api/claims/my-requests');
      if (res.ok) {
        const json = await res.json();
        setPendingClaim(json.data || null);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingClaim(false);
    }
  };

  useEffect(() => {
    if (user && !userProfile?.linked_member_id) {
      loadMyClaim();
    }
  }, [user, userProfile?.linked_member_id]);

  // Precompute Map for fast lookup
  const membersMap = useMemo(() => {
    const map = new Map<string, MemberRecord>();
    for (const m of members) {
      if (m?.id) map.set(m.id, m);
    }
    return map;
  }, [members]);


  // Cancel pending claim
  const [incomingClaims, setIncomingClaims] = useState<any[]>([]);
  const [reviewingClaim, setReviewingClaim] = useState<any | null>(null);
  const [isProcessingReview, setIsProcessingReview] = useState(false);

  // Fetch incoming claims for household approval
  const loadIncomingClaims = async () => {
    if (!user || !userProfile?.linked_member_id) return;
    try {
      const res = await fetch('/api/claims/pending');
      if (res.ok) {
        const json = await res.json();
        setIncomingClaims(json.data || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user && userProfile?.linked_member_id) {
      loadIncomingClaims();
    }
  }, [user, userProfile?.linked_member_id]);

  const handleReviewDecision = async (decision: 'approved' | 'rejected') => {
    if (!reviewingClaim) return;
    let rejectionReason: string | undefined = undefined;
    if (decision === 'rejected') {
      const promptRes = window.prompt('Nhập lý do từ chối yêu cầu kết nối:', 'Thông tin chưa trùng khớp với gia phả gia đình');
      if (promptRes === null) return;
      rejectionReason = promptRes.trim() || 'Thông tin chưa trùng khớp';
    } else {
      if (!window.confirm('Bạn có chắc chắn muốn phê duyệt kết nối thành viên này vào gia đình?')) return;
    }

    setIsProcessingReview(true);
    try {
      const res = await fetch(`/api/claims/${reviewingClaim.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, rejection_reason: rejectionReason }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Lỗi khi xử lý phê duyệt');
      } else {
        alert(json.message || 'Thao tác thành công');
        setIncomingClaims((prev) => prev.filter((c) => c.id !== reviewingClaim.id));
        setReviewingClaim(null);
        window.location.reload();
      }
    } catch {
      alert('Lỗi mạng khi xử lý');
    } finally {
      setIsProcessingReview(false);
    }
  };

  const handleCancelClaim = async () => {
    if (!confirm('Bạn có chắc chắn muốn hủy yêu cầu kết nối gia phả này không?')) return;
    setIsCancellingClaim(true);
    try {
      const res = await fetch('/api/claims/my-requests', { method: 'DELETE' });
      if (res.ok) {
        setPendingClaim(null);
      }
    } catch {
      alert('Không thể hủy yêu cầu, vui lòng thử lại.');
    } finally {
      setIsCancellingClaim(false);
    }
  };

  if (!user) return null;

  const linkedMemberId = userProfile?.linked_member_id;
  const linkedMember = linkedMemberId ? membersMap.get(linkedMemberId) : null;
  const isSuperAdmin = userProfile?.user_role === 'super_admin';

  // Resolve hierarchy info of linked member
  const hierarchyRes = linkedMemberId
    ? resolveMemberBranchHierarchy(linkedMemberId, members, branches, spouseRelations)
    : null;

  return (
    <>
      <div className="w-full max-w-2xl mx-auto mb-8 p-3.5 sm:p-4 rounded-card bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* User Avatar + Greeting */}
          <div className="flex items-center gap-3">
            {user.user_metadata?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata.full_name || 'User Avatar'}
                className="w-10 h-10 rounded-full border border-emerald-500/50 object-cover aspect-square shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs aspect-square shrink-0 shadow-xs">
                {getMemberInitials(user.user_metadata?.full_name || user.email)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  Xin chào, {user.user_metadata?.full_name || user.email?.split('@')[0]}!
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${isSuperAdmin
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : userProfile?.user_role === 'branch_editor'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : userProfile?.user_role === 'claimed_member'
                        ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                >
                  {isSuperAdmin
                    ? 'Super Admin'
                    : userProfile?.user_role === 'branch_editor'
                      ? 'Trưởng Chi'
                      : userProfile?.user_role === 'claimed_member'
                        ? 'Thành Viên'
                        : 'Khách Xem'}
                </span>
              </div>

              {/* Status Line 1: Linked Member Info */}
              {linkedMember ? (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    {linkedMember.full_name} · Đời {linkedMember.generation_level || 1}
                    {hierarchyRes?.primaryBranchName ? ` · ${hierarchyRes.primaryBranchName}` : ''}
                  </span>
                </div>
              ) : pendingClaim ? (
                /* Status Line 2: Pending Claim Alert */
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-amber-700 dark:text-amber-300">
                  <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                  <span className="font-medium truncate max-w-[260px] sm:max-w-xs">
                    Hồ sơ đang chờ duyệt:{' '}
                    <strong>
                      {pendingClaim.linked_member?.full_name ||
                        pendingClaim.proposed_data?.full_name ||
                        'Kết nối gia phả'}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelClaim}
                    disabled={isCancellingClaim}
                    className="text-[10px] text-rose-600 hover:underline ml-1 font-semibold"
                  >
                    {isCancellingClaim ? '...' : '[Hủy]'}
                  </button>
                </div>
              ) : (
                /* Status Line 3: Not Linked */
                <p className="text-xs text-slate-500 mt-0.5">
                  Chưa liên kết với Gia Phả
                </p>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* If Linked: View on Tree Button */}
            {linkedMemberId ? (
              <Link
                href={`/tree?focus=${linkedMemberId}`}
                id="view-my-node-btn"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100 transition-all shadow-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vị trí</span> trên Cây
              </Link>
            ) : !pendingClaim ? (
              /* If Not Linked and No Pending: Connect CTA Button */
              <button
                type="button"
                id="open-connect-genealogy-modal-btn"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs shadow-emerald-700/20"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Nối vào Gia Phả</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Banner Thông Báo Có Con Cháu Chờ Duyệt (Anti-Pill Typography) */}
        {incomingClaims.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-amber-200/80 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 dark:bg-amber-950/30 p-3 rounded-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                  Có {incomingClaims.length} yêu cầu kết nối từ con cháu cần phê duyệt
                </p>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-400 mt-0.5">
                  {incomingClaims[0].request_type === 'propose_child'
                    ? `Con cháu "${incomingClaims[0].proposed_data?.full_name}" xin nối vào gia đình của bạn`
                    : `Hồ sơ "${incomingClaims[0].target_member?.full_name || 'thành viên'}" có người xin nhận diện`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReviewingClaim(incomingClaims[0])}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all self-end sm:self-center shrink-0 cursor-pointer"
            >
              Xem & Phê Duyệt
            </button>
          </div>
        )}
      </div>

      {/* Modal Phê Duyệt Con Cháu Cho Bố Mẹ */}
      {reviewingClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Xác Nhận Kết Nối Con Cháu
                </h3>
              </div>
              <button
                onClick={() => setReviewingClaim(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-1.5">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Người gửi yêu cầu:{' '}
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {reviewingClaim.applicant?.full_name || reviewingClaim.applicant?.email}
                  </span>
                </p>
                <p className="text-slate-500">Email: {reviewingClaim.applicant?.email}</p>
                {reviewingClaim.request_type === 'propose_child' && reviewingClaim.proposed_data && (
                  <>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-2">
                      Thông tin con đề xuất:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-300">
                      <li>
                        Họ và tên: <strong>{reviewingClaim.proposed_data.full_name}</strong>
                      </li>
                      <li>
                        Giới tính: {reviewingClaim.proposed_data.gender === 'male' ? 'Nam' : 'Nữ'}
                      </li>
                      {reviewingClaim.proposed_data.birth_year && (
                        <li>Năm sinh: {reviewingClaim.proposed_data.birth_year}</li>
                      )}
                      {reviewingClaim.proposed_data.birth_order && (
                        <li>Thứ tự con trong nhà: Thứ {reviewingClaim.proposed_data.birth_order}</li>
                      )}
                      {reviewingClaim.proposed_data.is_senior && (
                        <li className="text-amber-700 dark:text-amber-400 font-semibold">
                          Nguyện vọng: Con Trưởng (Trưởng Nam)
                        </li>
                      )}
                    </ul>
                  </>
                )}
                {reviewingClaim.verification_notes && (
                  <p className="text-slate-600 dark:text-slate-300 italic pt-1">
                    Lời nhắn gửi: &quot;{reviewingClaim.verification_notes}&quot;
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleReviewDecision('rejected')}
                disabled={isProcessingReview}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                Từ Chối
              </button>
              <button
                type="button"
                onClick={() => handleReviewDecision('approved')}
                disabled={isProcessingReview}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                {isProcessingReview ? 'Đang duyệt...' : 'Chấp Thuận & Gắn Node'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect Genealogy Modal */}
      <ConnectGenealogyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadMyClaim();
        }}
        userFullName={user.user_metadata?.full_name}
        userEmail={user.email}
        members={members}
        branches={branches}
        spouseRelations={spouseRelations}
        claimedMemberIds={claimedMemberIds}
      />
    </>
  );
}

