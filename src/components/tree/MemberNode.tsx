'use client';

import React, { memo } from 'react';
import { Handle, Position, type Node, type NodeProps, useReactFlow } from '@xyflow/react';
import { User, Sparkles, ArrowUpRight, Link2 } from 'lucide-react';
import { TreeNodeData } from '@/types/tree';

export type MemberNodeType = Node<TreeNodeData, 'memberNode'>;

export const MemberNode = memo(({ data }: NodeProps<MemberNodeType>) => {
  const nodeData = data;
  const { getNode, setCenter } = useReactFlow();
  const fullName = nodeData?.fullName || 'Thành viên';
  const isMale = nodeData?.gender === 'male';
  const isDeceased = nodeData?.lifeStatus === 'deceased';

  const handleNavigateToSpouse = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nodeData.internalSpouse?.id) return;
    const targetNode = getNode(nodeData.internalSpouse.id);
    if (targetNode) {
      setCenter(targetNode.position.x + 100, targetNode.position.y + 48, {
        zoom: 1.1,
        duration: 800,
      });
    }
  };

  const borderColor = isDeceased
    ? 'border-slate-400/60 dark:border-slate-600/60'
    : isMale
    ? 'border-blue-500/50 hover:border-blue-500'
    : 'border-pink-500/50 hover:border-pink-500';

  const avatarBg = isDeceased
    ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    : isMale
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
    : 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300';

  // Lấy 2 chữ cái đầu
  const words = fullName.trim().split(' ').filter(Boolean);
  const initials = words.length > 1
    ? (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase()
    : words[0]?.[0]?.toUpperCase() || 'TV';

  return (
    <div
      className={`group relative w-[200px] h-[96px] rounded-xl border bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-2.5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] flex flex-col justify-between overflow-hidden ${borderColor}`}
    >
      {/* Target Handle cho cha mẹ nối xuống (Tàng hình) */}
      <Handle
        type="target"
        position={Position.Top}
        id="parent-top"
        className="!opacity-0 !w-0 !h-0 !border-0 !p-0 !min-w-0 !min-h-0 pointer-events-none"
      />

      {/* Handle hông cho liên kết hôn phối nằm ngang (Tàng hình) */}
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-right"
        className="!opacity-0 !w-0 !h-0 !border-0 !p-0 !min-w-0 !min-h-0 !top-1/2 pointer-events-none"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="spouse-left"
        className="!opacity-0 !w-0 !h-0 !border-0 !p-0 !min-w-0 !min-h-0 !top-1/2 pointer-events-none"
      />

      {/* Header thẻ: Thế hệ & Huy hiệu trạng thái sinh tử / Cụ Tổ */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
          <span>Đời {nodeData.generationLevel}</span>
          {nodeData.isSenior && (
            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1 py-0.2 rounded border border-blue-200/60 dark:border-blue-800/60">
              (Trưởng)
            </span>
          )}
        </div>

        {nodeData.isRoot || nodeData.generationLevel === 1 ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <Sparkles className="w-2.5 h-2.5" /> Cụ Tổ
          </span>
        ) : (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
              isDeceased
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {isDeceased ? '† Đã mất' : 'Còn sống'}
          </span>
        )}
      </div>

      {/* Thân thẻ: Avatar & Tên */}
      <div className="flex items-center gap-2 my-0.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${avatarBg}`}
        >
          {initials || <User className="w-4 h-4" />}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="truncate text-[13px] font-bold text-slate-900 dark:text-slate-100"
            title={fullName}
          >
            {fullName}
          </p>
          <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">
            {nodeData.birthYear ? `SN: ${nodeData.birthYear}` : ''}
            {nodeData.deathYear ? ` - Mất: ${nodeData.deathYear}` : ''}
            {!nodeData.birthYear && !nodeData.deathYear && (nodeData.branchName || 'Thành viên')}
          </p>
        </div>
      </div>

      {/* Footer thẻ: Thông tin hôn phối nội tộc (khi ẩn node) HOẶC Chi nhánh & Số con */}
      {nodeData.internalSpouse && !nodeData.spouseIds?.includes(nodeData.internalSpouse.id) ? (
        <div className="flex items-center justify-between text-[9px] pt-1 mt-0.5 border-t border-slate-100 dark:border-slate-800/80">
          <span
            className="truncate max-w-[125px] flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300"
            title={`${nodeData.internalSpouse.roleTitle || 'Hôn phối'}: ${nodeData.internalSpouse.fullName}${
              nodeData.internalSpouse.branchName ? ` (${nodeData.internalSpouse.branchName})` : ''
            }`}
          >
            <Link2 className="w-2.5 h-2.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="truncate">
              {nodeData.internalSpouse.roleTitle || 'Chồng'}: {nodeData.internalSpouse.fullName}
            </span>
          </span>
          <button
            type="button"
            onClick={handleNavigateToSpouse}
            title={`Xem gia đình tại ${nodeData.internalSpouse.branchName || 'chi đối tác'}`}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 font-bold transition-colors whitespace-nowrap text-[9px]"
          >
            {nodeData.internalSpouse.branchName
              ? nodeData.internalSpouse.branchName.split(' - ')[0]
              : 'Xem'}{' '}
            <ArrowUpRight className="w-2.5 h-2.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[9px] pt-1 mt-0.5 border-t border-slate-100/80 dark:border-slate-800/60 text-slate-400">
          <span className="truncate max-w-[120px]">
            {nodeData.branchName || 'Huyết tộc'}
          </span>
          {nodeData.childCount != null && nodeData.childCount > 0 && (
            <span>{nodeData.childCount} người con</span>
          )}
        </div>
      )}

      {/* Source Handles con cái: Tàng hình */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="children-joint"
        style={{ top: '48px', left: '210px' }}
        className="!opacity-0 !w-0 !h-0 !border-0 !p-0 !min-w-0 !min-h-0 pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="children-single"
        style={{ left: '50%' }}
        className="!opacity-0 !w-0 !h-0 !border-0 !p-0 !min-w-0 !min-h-0 pointer-events-none"
      />
    </div>
  );
});

MemberNode.displayName = 'MemberNode';
