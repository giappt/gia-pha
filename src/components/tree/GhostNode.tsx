'use client';

import React, { memo } from 'react';
import { Handle, Position, type Node, type NodeProps, useReactFlow } from '@xyflow/react';
import { Link2, ArrowUpRight, User } from 'lucide-react';
import { TreeNodeData } from '@/types/tree';

export type GhostNodeType = Node<TreeNodeData, 'ghostNode'>;

export const GhostNode = memo(({ data }: NodeProps<GhostNodeType>) => {
  const nodeData = data;
  const { getNode, setCenter } = useReactFlow();
  const fullName = nodeData?.fullName || 'Thành viên nội tộc';
  const isMale = nodeData?.gender === 'male';
  const isDeceased = nodeData?.lifeStatus === 'deceased';

  const handleNavigateToOriginal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nodeData.originalMemberId) return;

    const targetNode = getNode(nodeData.originalMemberId);
    if (targetNode) {
      setCenter(targetNode.position.x + 100, targetNode.position.y + 48, {
        zoom: 1.1,
        duration: 800,
      });
    }
  };

  const kinLabel = isMale ? 'Rể nội tộc' : 'Dâu nội tộc';

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
      className="group relative w-[200px] h-[96px] rounded-xl border-2 border-dashed border-amber-500 hover:border-amber-600 bg-amber-50/85 dark:bg-amber-950/40 backdrop-blur-sm p-2.5 shadow-sm transition-all duration-200 hover:shadow-md hover:scale-[1.02] flex flex-col justify-between"
      title="Thành viên phối ngẫu nội tộc"
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
        type="target"
        position={Position.Left}
        id="spouse-left"
        className="!opacity-0 !w-0 !h-0 !border-0 !p-0 !min-w-0 !min-h-0 !top-1/2 pointer-events-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="spouse-right"
        className="!opacity-0 !w-0 !h-0 !border-0 !p-0 !min-w-0 !min-h-0 !top-1/2 pointer-events-none"
      />

      {/* Header thẻ: Thế hệ & Nhãn dâu/rể nội tộc nét đứt vàng nổi bật */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-600 dark:text-slate-400">
          Đời {nodeData.generationLevel}
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 dark:bg-amber-900/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
          <Link2 className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> {kinLabel}
        </span>
      </div>

      {/* Thân thẻ: Avatar & Tên đồng bộ MemberNode */}
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
            {!nodeData.birthYear && !nodeData.deathYear && (nodeData.originalBranchName || 'Nội tộc')}
          </p>
        </div>
      </div>

      {/* Footer thẻ: Chi nhánh gốc & Nút lướt camera sang node gốc */}
      <div className="flex items-center justify-between text-[9px] bg-amber-100/60 dark:bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
        <span className="truncate max-w-[105px] text-amber-800 dark:text-amber-200 font-medium" title={nodeData.originalBranchName}>
          Gốc: {nodeData.originalBranchName || 'Chi khác'}
        </span>
        <button
          type="button"
          onClick={handleNavigateToOriginal}
          className="inline-flex items-center gap-0.5 font-bold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 hover:underline"
        >
          Vị trí gốc <ArrowUpRight className="w-2.5 h-2.5" />
        </button>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="children-joint"
        className="!opacity-0 !w-0 !h-0 !border-0 !p-0 !min-w-0 !min-h-0 pointer-events-none"
      />
    </div>
  );
});

GhostNode.displayName = 'GhostNode';
