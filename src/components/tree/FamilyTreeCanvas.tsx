'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type NodeTypes,
  type EdgeTypes,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { MemberNode } from './MemberNode';
import { GhostNode } from './GhostNode';
import { FamilyBusEdge } from './FamilyBusEdge';
import { TreeToolbar, type RootOption } from './TreeToolbar';
import { calculateTreeLayout } from '@/lib/tree-layout/genealogy-layout';
import { MemberRecord, SpouseRelationRecord, LayoutNode, TreeNodeData } from '@/types/tree';
import { Keyboard } from 'lucide-react';

const nodeTypes: NodeTypes = {
  memberNode: MemberNode,
  ghostNode: GhostNode,
};

const edgeTypes: EdgeTypes = {
  familyBusEdge: FamilyBusEdge,
};

interface FamilyTreeCanvasProps {
  initialMembers: MemberRecord[];
  initialSpouseRelations: SpouseRelationRecord[];
  clanName: string;
}

const FamilyTreeCanvasInternal: React.FC<FamilyTreeCanvasProps> = ({
  initialMembers,
  initialSpouseRelations,
  clanName,
}) => {
  const [showMaternalBranches, setShowMaternalBranches] = useState(true);
  const [showInternalHusbands, setShowInternalHusbands] = useState(true);
  const [focusRootId, setFocusRootId] = useState<string | null>(null);

  // Danh sách các Gốc khả dụng để người dùng chọn xem (toàn bộ thành viên gia tộc)
  const availableRoots = useMemo<RootOption[]>(() => {
    return initialMembers
      .slice()
      .sort((a, b) => {
        if (a.generation_level !== b.generation_level) return a.generation_level - b.generation_level;
        if (a.birth_order != null && b.birth_order != null) return a.birth_order - b.birth_order;
        return a.full_name.localeCompare(b.full_name);
      })
      .map((m) => ({
        id: m.id,
        name: m.full_name,
        branchName: m.branch_name || undefined,
        generationLevel: m.generation_level,
      }));
  }, [initialMembers]);

  // Tính toán layout phụ thuộc vào initialMembers, initialSpouseRelations, showMaternalBranches, showInternalHusbands và focusRootId
  const currentLayout = useMemo(() => {
    return calculateTreeLayout(initialMembers, initialSpouseRelations, {
      showMaternalBranches,
      showInternalHusbands,
      focusRootId,
    });
  }, [initialMembers, initialSpouseRelations, showMaternalBranches, showInternalHusbands, focusRootId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TreeNodeData>>(
    currentLayout.nodes as unknown as Node<TreeNodeData>[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentLayout.edges);
  const [isLocked, setIsLocked] = useState(true);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Cập nhật lại nodes và edges khi chuyển đổi tùy chọn hoặc chọn Gốc mới
  useEffect(() => {
    setNodes(currentLayout.nodes as unknown as Node<TreeNodeData>[]);
    setEdges(currentLayout.edges);
  }, [currentLayout, setNodes, setEdges]);

  // Lắng nghe sự kiện bàn phím Spacebar để đổi con trỏ chuột sang bàn tay kéo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div
      style={{ width: '100%', height: 'calc(100vh - 4rem)' }}
      className={`relative select-none bg-slate-50 dark:bg-slate-950 overflow-hidden ${
        isSpacePressed ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {/* Toolbar phía trên tinh gọn 3 cụm */}
      <TreeToolbar
        clanName={clanName}
        memberCount={initialMembers.length}
        nodeCount={nodes.length}
        nodes={nodes as LayoutNode[]}
        isLocked={isLocked}
        onToggleLock={() => setIsLocked((prev) => !prev)}
        showMaternalBranches={showMaternalBranches}
        onToggleMaternalBranches={() => setShowMaternalBranches((prev) => !prev)}
        showInternalHusbands={showInternalHusbands}
        onToggleInternalHusbands={() => setShowInternalHusbands((prev) => !prev)}
        focusRootId={focusRootId}
        onSelectFocusRoot={setFocusRootId}
        availableRoots={availableRoots}
      />

      {/* Canvas React Flow */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={!isLocked}
        minZoom={0.1}
        maxZoom={2.0}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 800 }}
        panOnDrag={true}
        panOnScroll={false}
        zoomOnScroll={true}
        className="touch-none"
        style={{ width: '100%', height: '100%' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="#94A3B8"
          className="opacity-35 dark:opacity-20"
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
          className="!bg-white/90 dark:!bg-slate-900/90 !border-slate-200 dark:!border-slate-800 !rounded-xl !shadow-sm backdrop-blur-md"
        />
      </ReactFlow>

      {/* Footer gợi ý phím tắt */}
      <div className="absolute bottom-4 left-4 z-30 pointer-events-none hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-sm text-[11px] text-slate-500 dark:text-slate-400 shadow-sm">
        <Keyboard className="w-3.5 h-3.5 text-emerald-600" />
        <span>
          Giữ <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">Space</kbd> + kéo chuột để lia phả đồ | Cuộn chuột để phóng to/thu nhỏ
        </span>
      </div>
    </div>
  );
};

export const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FamilyTreeCanvasInternal {...props} />
    </ReactFlowProvider>
  );
};
