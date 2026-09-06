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
  User,
  CornerDownRight,
} from 'lucide-react';
import type { BranchNode } from '@/types/database';
import type { MemberRecord } from '@/types/tree';
import { validateBranchTree } from '@/lib/tree-layout/branch-engine';

interface BranchTaxonomyManagerProps {
  initialBranches: BranchNode[];
  allMembers: MemberRecord[];
  onBranchesSaved?: (updatedBranches: BranchNode[]) => void;
}

const TIER_PRESETS = ['Ngành', 'Chi', 'Nhánh', 'Phái', 'Họ', 'Khác'];

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
  allMembers,
  onBranchesSaved,
}: BranchTaxonomyManagerProps) {
  const [branches, setBranches] = useState<BranchNode[]>(initialBranches);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Thêm Ngành mới ở tầng gốc
  const handleAddRootBranch = () => {
    const newId = 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newTier = 'Ngành';
    const newName = `Ngành ${branches.length + 1}`;
    setBranches((prev) => [
      ...prev,
      {
        id: newId,
        tierName: newTier,
        name: newName,
        rootMemberId: null,
        children: [],
      },
    ]);
  };

  // Thêm Chi nhánh con trực thuộc một nhánh cha
  const handleAddChildBranch = (parentId: string) => {
    const newId = 'b_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newChild: BranchNode = {
      id: newId,
      tierName: 'Chi',
      name: 'Chi mới',
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

  // Lưu cấu trúc cây phân chi
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
        body: JSON.stringify({ branches }),
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
          onBranchesSaved(branches);
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

      {/* Main Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        {/* Header with Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-600" />
              <span>Cấu Trúc Phân Cấp Ngành & Chi Tông Tộc</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Thiết lập thứ bậc phả hệ (Ngành → Chi → Nhánh). Gán Cụ Khởi Nguồn (`Root Member`) để
              hệ thống tự động kế thừa danh xưng cho mọi con cháu.
            </p>
          </div>

          <button
            type="button"
            id="add-root-branch-btn"
            onClick={handleAddRootBranch}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Ngành Mới</span>
          </button>
        </div>

        {/* Informational Guidance Tip */}
        <div className="my-4 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Quy ước Kế thừa Tự động:</span> Khi bạn chọn một Cụ làm{' '}
            <strong>Cụ Khởi Nguồn</strong> của một Ngành/Chi, toàn bộ con cháu phụ hệ (cha → con) của
            Cụ đó sẽ tự động mang huy hiệu phân cấp (ví dụ:{' '}
            <code className="px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 font-mono text-[11px]">
              Đời 7 · Ngành 1 · Chi 2
            </code>
            ) trên Cây phả hệ và Lịch giỗ mà không cần nhập tay từng người.
          </div>
        </div>

        {/* Tree List */}
        <div className="mt-6 space-y-4">
          {branches.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              <GitBranch className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Chưa có cấu trúc Ngành/Chi nào được thiết lập
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
                Bắt đầu bằng việc bấm nút &quot;Thêm Ngành Mới&quot; ở trên để tạo nhánh gốc đầu tiên
                cho dòng họ của bạn.
              </p>
            </div>
          ) : (
            branches.map((rootNode) => (
              <BranchNodeRow
                key={rootNode.id}
                node={rootNode}
                depth={0}
                allMembers={sortedMembers}
                onAddChild={handleAddChildBranch}
                onUpdate={handleUpdateBranch}
                onDelete={handleDeleteBranch}
              />
            ))
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

interface BranchNodeRowProps {
  node: BranchNode;
  depth: number;
  allMembers: MemberRecord[];
  onAddChild: (parentId: string) => void;
  onUpdate: (id: string, updates: Partial<BranchNode>) => void;
  onDelete: (id: string) => void;
}

function BranchNodeRow({
  node,
  depth,
  allMembers,
  onAddChild,
  onUpdate,
  onDelete,
}: BranchNodeRowProps) {
  return (
    <div
      className={`space-y-3 ${
        depth > 0
          ? 'ml-4 sm:ml-8 pl-3 sm:pl-4 border-l-2 border-emerald-300 dark:border-emerald-900/60'
          : ''
      }`}
    >
      <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-850 hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex flex-col md:flex-row md:items-center gap-3">
        {/* Tier & Name Inputs */}
        <div className="flex items-center gap-2 flex-1">
          {depth > 0 && <CornerDownRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />}

          {/* Tier Selector */}
          <select
            value={node.tierName}
            onChange={(e) => onUpdate(node.id, { tierName: e.target.value })}
            className="w-24 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            {TIER_PRESETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Branch Name Input */}
          <input
            type="text"
            value={node.name}
            onChange={(e) => onUpdate(node.id, { name: e.target.value })}
            placeholder="VD: Ngành Trưởng, Chi 2..."
            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Root Member Selector */}
        <div className="w-full md:w-72">
          <div className="relative">
            <select
              value={node.rootMemberId || ''}
              onChange={(e) => onUpdate(node.id, { rootMemberId: e.target.value || null })}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 truncate"
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
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            type="button"
            onClick={() => onAddChild(node.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/60 dark:border-emerald-800 transition-colors cursor-pointer"
            title="Thêm phân chi trực thuộc bên dưới nhánh này"
          >
            <Plus className="w-3 h-3" />
            <span>Thêm Chi Con</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
            title="Xóa nhánh này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Render Nested Children */}
      {node.children && node.children.length > 0 && (
        <div className="space-y-3">
          {node.children.map((child) => (
            <BranchNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
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
