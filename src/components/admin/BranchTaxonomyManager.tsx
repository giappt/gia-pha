'use client';

import { useState } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  CornerDownRight,
} from 'lucide-react';
import type { BranchNode } from '@/types/database';
import type { MemberRecord } from '@/types/tree';
import {
  validateBranchTree,
  DEFAULT_BRANCH_TIERS,
  getNextTierName,
  findBranchesUsingTier,
} from '@/lib/tree-layout/branch-engine';

interface BranchTaxonomyManagerProps {
  initialBranches: BranchNode[];
  initialTiers?: string[];
  allMembers: MemberRecord[];
  onBranchesSaved?: (updatedBranches: BranchNode[], updatedTiers?: string[]) => void;
}

function findBranchNode(nodes: BranchNode[], targetId: string): BranchNode | null {
  for (const n of nodes) {
    if (n.id === targetId) return n;
    if (n.children && n.children.length > 0) {
      const found = findBranchNode(n.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function updateBranchNode(
  nodes: BranchNode[],
  targetId: string,
  updater: (node: BranchNode) => BranchNode
): BranchNode[] {
  return nodes.map((n) => {
    if (n.id === targetId) {
      return updater(n);
    }
    if (n.children && n.children.length > 0) {
      return { ...n, children: updateBranchNode(n.children, targetId, updater) };
    }
    return n;
  });
}

function deleteBranchNode(nodes: BranchNode[], targetId: string): BranchNode[] {
  return nodes
    .filter((n) => n.id !== targetId)
    .map((n) => ({
      ...n,
      children: n.children ? deleteBranchNode(n.children, targetId) : [],
    }));
}

function addChildBranchNode(
  nodes: BranchNode[],
  parentId: string,
  newChild: BranchNode
): BranchNode[] {
  return nodes.map((n) => {
    if (n.id === parentId) {
      return {
        ...n,
        children: [...(n.children || []), newChild],
      };
    }
    if (n.children && n.children.length > 0) {
      return { ...n, children: addChildBranchNode(n.children, parentId, newChild) };
    }
    return n;
  });
}

export default function BranchTaxonomyManager({
  initialBranches,
  initialTiers,
  allMembers,
  onBranchesSaved,
}: BranchTaxonomyManagerProps) {
  const [branches, setBranches] = useState<BranchNode[]>(initialBranches);
  const [tiers, setTiers] = useState<string[]>(
    Array.isArray(initialTiers) && initialTiers.length > 0 ? initialTiers : DEFAULT_BRANCH_TIERS
  );
  const [newTierInput, setNewTierInput] = useState('');
  const [isAddingTier, setIsAddingTier] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Thêm cấp bậc mới vào Master Data dòng họ
  const handleAddTier = () => {
    const trimmed = newTierInput.trim();
    if (!trimmed) {
      setIsAddingTier(false);
      return;
    }
    if (!tiers.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setTiers((prev) => [...prev, trimmed]);
    }
    setNewTierInput('');
    setIsAddingTier(false);
  };

  // Xóa cấp bậc khỏi danh mục dòng họ (với Integrity Guard)
  const handleRemoveTier = (tierToRemove: string) => {
    // 1. Kiểm tra ràng buộc toàn vẹn: Cấp bậc có đang được nhánh nào trong cây sử dụng không?
    const usedBranches = findBranchesUsingTier(branches, tierToRemove);
    if (usedBranches.length > 0) {
      const branchNames = usedBranches.map((b) => `"${b.name || b.tierName}"`).join(', ');
      setStatusMessage({
        type: 'error',
        text: `Không thể xóa cấp bậc "${tierToRemove}" vì đang được sử dụng trong phân cấp bởi ${usedBranches.length} nhánh (${branchNames}). Vui lòng đổi cấp bậc hoặc xóa các nhánh này trước!`,
      });
      return;
    }

    // 2. Cho phép xóa an toàn (kể cả khi là cấp cuối cùng để thiết lập lại từ đầu)
    setTiers((prev) => prev.filter((t) => t !== tierToRemove));
    setStatusMessage({
      type: 'success',
      text: `Đã xóa cấp bậc "${tierToRemove}".`,
    });
  };

  // Thêm Nhánh mới ở tầng gốc
  const handleAddRootBranch = () => {
    const newId = 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const rootTier = tiers[0] || 'Nhánh';
    const newName = `${rootTier} ${branches.length + 1}`;
    setBranches((prev) => [
      ...prev,
      {
        id: newId,
        tierName: rootTier,
        name: newName,
        rootMemberId: null,
        children: [],
      },
    ]);
  };

  // Thêm Chi nhánh con trực thuộc một nhánh cha (tự động gợi ý cấp kế tiếp)
  const handleAddChildBranch = (parentId: string) => {
    const newId = 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const parentNode = findBranchNode(branches, parentId);
    const parentTier = parentNode?.tierName;
    const childTier = getNextTierName(parentTier, tiers);

    const newChild: BranchNode = {
      id: newId,
      tierName: childTier,
      name: `${childTier} mới`,
      rootMemberId: null,
      children: [],
    };
    setBranches((prev) => addChildBranchNode(prev, parentId, newChild));
  };

  // Cập nhật thông tin của một nhánh
  const handleUpdateBranch = (branchId: string, updates: Partial<BranchNode>) => {
    setBranches((prev) => updateBranchNode(prev, branchId, (node) => ({ ...node, ...updates })));
  };

  // Xóa nhánh
  const handleDeleteBranch = (branchId: string) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Bạn có chắc chắn muốn xóa nhánh này và toàn bộ các chi con trực thuộc?')
    ) {
      return;
    }
    setBranches((prev) => deleteBranchNode(prev, branchId));
  };

  // Lưu cấu trúc cây phân chi và danh mục cấp bậc
  const handleSave = async () => {
    setStatusMessage(null);

    // Validate
    const validation = validateBranchTree(branches);
    if (!validation.isValid) {
      setStatusMessage({ type: 'error', text: validation.errors.join('. ') });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/clan-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branches, branch_tiers: tiers }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setStatusMessage({
          type: 'error',
          text: json.error || 'Có lỗi xảy ra khi lưu cấu trúc Ngành/Chi.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu cấu trúc Ngành/Chi thành công! Phả hệ và Lịch Giỗ sẽ tự động áp dụng.',
        });
        if (onBranchesSaved) {
          onBranchesSaved(branches, tiers);
        }
      }
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Không thể kết nối đến máy chủ để cập nhật dữ liệu.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Sắp xếp danh sách thành viên theo đời để dễ chọn
  const sortedMembers = [...allMembers].sort((a, b) => {
    if (a.generation_level !== b.generation_level) {
      return a.generation_level - b.generation_level;
    }
    return (a.birth_order || 0) - (b.birth_order || 0);
  });

  const rootTierName = tiers[0] || 'Nhánh';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Alert Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Single Card (Flat Anti Box-in-Box Canvas) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        {/* Header (Title & Description only, no add button here) */}
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-emerald-600" />
            <span>Cấu Trúc Phân Cấp Ngành & Chi Tông Tộc</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Thiết lập thứ bậc phả hệ ({tiers.join(' → ') || 'Ngành → Chi → Nhánh'}). Gán Cụ Khởi Nguồn (`Root Member`) để hệ thống tự động kế thừa danh xưng cho mọi con cháu.
          </p>
        </div>

        {/* Cụm 1: Quản Lý Thứ Bậc Tông Tộc (Flat Stepper Sequence - No Box-in-Box) */}
        <div className="py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thứ Bậc Tông Tộc (Thứ tự phân tầng từ cao xuống thấp):</span>
            </div>
            {tiers.length === 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                Chưa có cấp bậc nào. Hãy thêm cấp đầu tiên.
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {tiers.map((tier, idx) => (
              <div key={tier} className="flex items-center gap-1.5">
                {idx > 0 && <span className="text-slate-400 font-bold select-none">→</span>}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/80 dark:border-emerald-800 text-xs shadow-2xs">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-normal">
                    {idx + 1}.
                  </span>
                  <span>{tier}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTier(tier)}
                    className="text-emerald-600 hover:text-rose-600 dark:text-emerald-400 dark:hover:text-rose-400 transition-colors ml-0.5 cursor-pointer font-bold leading-none"
                    title={`Xóa cấp ${tier}`}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {isAddingTier ? (
              <div className="inline-flex items-center gap-1.5 ml-1">
                <input
                  type="text"
                  value={newTierInput}
                  onChange={(e) => setNewTierInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTier();
                    if (e.key === 'Escape') {
                      setIsAddingTier(false);
                      setNewTierInput('');
                    }
                  }}
                  placeholder="VD: Giáp, Phân chi..."
                  className="w-32 px-2.5 py-1 text-xs rounded border border-emerald-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTier(false);
                    setNewTierInput('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 px-1 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTier(true)}
                className="inline-flex items-center gap-1 ml-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded border border-dashed border-emerald-300 dark:border-emerald-700 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{tiers.length === 0 ? 'Thêm Cấp Đầu Tiên' : 'Thêm Cấp Mới'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Cụm 2: Cây Phân Cấp Các Nhánh & Gán Cụ Khởi Nguồn */}
        <div className="pt-4">
          {/* Header of Cụm 2 with Add Branch Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-600" />
                <span>Cây Phân Cấp Các Nhánh & Cụ Khởi Nguồn</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Gán Cụ Khởi Nguồn (`Root Member`) để hệ thống tự động kế thừa danh xưng cho mọi con cháu trực hệ.
              </p>
            </div>

            <button
              type="button"
              id="add-root-branch-btn"
              onClick={handleAddRootBranch}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm {rootTierName} Mới</span>
            </button>
          </div>

          {/* Informational Guidance Callout (Flat, minimal, no heavy box border) */}
          <div className="my-3 py-2.5 px-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/25 border-l-3 border-amber-400 dark:border-amber-600 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Quy ước Kế thừa Tự động:</span> Khi bạn chọn một Cụ làm{' '}
              <strong>Cụ Khởi Nguồn</strong> của một Ngành/Chi, toàn bộ con cháu phụ hệ (cha → con) của
              Cụ đó sẽ tự động mang huy hiệu phân cấp (ví dụ:{' '}
              <code className="px-1 py-0.5 rounded bg-amber-100/70 dark:bg-amber-900/50 font-mono text-[11px]">
                Đời 7 · Ngành 1 · Chi 2
              </code>
              ) trên Cây phả hệ và Lịch giỗ mà không cần nhập tay từng người.
            </div>
          </div>

          {/* Flat Tree Table Outline */}
          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800">
            {branches.length === 0 ? (
              <div className="py-12 text-center">
                <GitBranch className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Chưa có cấu trúc Ngành/Chi nào được thiết lập
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
                  Bắt đầu bằng việc bấm nút &quot;Thêm {rootTierName} Mới&quot; ở trên để tạo nhánh gốc đầu tiên
                  cho dòng họ của bạn.
                </p>
              </div>
            ) : (
              branches.map((rootNode) => (
                <FlatBranchRow
                  key={rootNode.id}
                  node={rootNode}
                  depth={0}
                  tiers={tiers}
                  allMembers={sortedMembers}
                  onAddChild={handleAddChildBranch}
                  onUpdate={handleUpdateBranch}
                  onDelete={handleDeleteBranch}
                />
              ))
            )}
          </div>

          {/* Dòng thêm nhánh ở đáy danh sách cây (Bottom Add Button) */}
          {branches.length > 0 && (
            <div className="mt-3 flex items-center justify-start">
              <button
                type="button"
                onClick={handleAddRootBranch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-dashed border-emerald-300 dark:border-emerald-800 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm {rootTierName} Mới ở Đáy Cây</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Bar */}
        {branches.length > 0 && (
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              id="save-branches-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold shadow-sm shadow-emerald-700/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang lưu cấu trúc...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Cấu Trúc Ngành/Chi</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface FlatBranchRowProps {
  node: BranchNode;
  depth: number;
  tiers: string[];
  allMembers: MemberRecord[];
  onAddChild: (parentId: string) => void;
  onUpdate: (id: string, updates: Partial<BranchNode>) => void;
  onDelete: (id: string) => void;
}

function FlatBranchRow({
  node,
  depth,
  tiers,
  allMembers,
  onAddChild,
  onUpdate,
  onDelete,
}: FlatBranchRowProps) {
  return (
    <div className="relative">
      {/* Flat Row Item (No nested border-box or heavy card background) */}
      <div
        className={`group py-2.5 px-2 sm:px-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center gap-3 ${
          depth > 0 ? 'ml-6 sm:ml-10' : ''
        }`}
      >
        {/* Tier Selector & Name Input */}
        <div className="flex items-center gap-2 flex-1">
          {depth > 0 && (
            <CornerDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-500 flex-shrink-0 opacity-80" />
          )}

          {/* Tier Selector (User-Defined Tiers) */}
          <div className="relative">
            <select
              value={node.tierName}
              onChange={(e) => onUpdate(node.id, { tierName: e.target.value })}
              className="px-2.5 py-1 rounded-md border border-emerald-200/80 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/50 text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {tiers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
              {!tiers.includes(node.tierName) && (
                <option value={node.tierName}>{node.tierName}</option>
              )}
            </select>
          </div>

          {/* Branch Name Ghost Input */}
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdate(node.id, { name: e.target.value })}
            placeholder="Tên nhánh (VD: Ngành Trưởng, Chi 2...)"
            className="flex-1 px-2.5 py-1 rounded-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 bg-transparent hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>

        {/* Root Member Selector */}
        <div className="w-full md:w-72">
          <select
            value={node.rootMemberId || ''}
            onChange={(e) => onUpdate(node.id, { rootMemberId: e.target.value || null })}
            className="w-full px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 truncate"
          >
            <option value="">-- Chọn Cụ Khởi Nguồn --</option>
            {allMembers.map((m) => (
              <option key={m.id} value={m.id}>
                [Đời {m.generation_level}] {m.full_name} ({m.gender === 'male' ? 'Nam' : 'Nữ'}
                {m.birth_year ? ` · ${m.birth_year}` : ''})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-end md:self-center">
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
            title="Thêm phân chi trực thuộc bên dưới nhánh này"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm Con</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            title="Xóa nhánh này"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Render Nested Children with Subtle Guide Line (No Nested Box Cards) */}
      {node.children && node.children.length > 0 && (
        <div className="relative ml-3 sm:ml-5 pl-2 sm:pl-3 border-l-2 border-emerald-100 dark:border-emerald-900/40">
          {node.children.map((child) => (
            <FlatBranchRow
              key={child.id}
              node={child}
              depth={depth + 1}
              tiers={tiers}
              allMembers={allMembers}
              onAddChild={onAddChild}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
