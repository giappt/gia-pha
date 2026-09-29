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
      <div className="w-full max-w-2xl mx-auto mb-8 p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-xs transition-all">
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
      </div>

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
