'use client';

import React, { useState, useEffect } from 'react';
import { GitBranch, RefreshCw } from 'lucide-react';
import type { BranchNode } from '@/types/database';
import type { MemberRecord } from '@/types/tree';
import BranchTaxonomyManager from '@/components/admin/BranchTaxonomyManager';

export default function AdminBranchesPage() {
  const [branches, setBranches] = useState<BranchNode[]>([]);
  const [branchTiers, setBranchTiers] = useState<string[]>(['Ngành', 'Chi', 'Nhánh', 'Phái']);
  const [allMembers, setAllMembers] = useState<MemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [settingsRes, membersRes] = await Promise.all([
          fetch('/api/clan-settings').then((r) => (r.ok ? r.json() : { data: {} })),
          fetch('/api/members').then((r) => (r.ok ? r.json() : { members: [] })),
        ]);

        if (Array.isArray(settingsRes.data?.branches)) {
          setBranches(settingsRes.data.branches);
        }
        if (Array.isArray(settingsRes.data?.branch_tiers) && settingsRes.data.branch_tiers.length > 0) {
          setBranchTiers(settingsRes.data.branch_tiers);
        }
        if (Array.isArray(membersRes.members)) {
          setAllMembers(membersRes.members);
        }
      } catch (err) {
        console.error('Failed to load branches data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Đang nạp cấu trúc Ngành/Chi...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Cấu Trúc Phân Cấp Ngành & Chi Tông Tộc
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Thiết lập thứ bậc phả hệ (Ngành → Chi → Nhánh → Phái) và gán Cụ Khởi Nguồn để hệ thống tự động kế thừa danh xưng cho con cháu.
            </p>
          </div>
        </div>
      </div>

      {/* Ultra-Wide Branch Taxonomy Manager */}
      <BranchTaxonomyManager
        initialBranches={branches}
        initialTiers={branchTiers}
        allMembers={allMembers}
        onBranchesSaved={(updated, updatedTiers) => {
          setBranches(updated);
          if (updatedTiers) setBranchTiers(updatedTiers);
        }}
      />
    </div>
  );
}
