'use client';

import React, { useState, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Search, X, User } from 'lucide-react';
import { LayoutNode } from '@/types/tree';

interface SpotlightSearchProps {
  nodes: LayoutNode[];
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({ nodes }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { setCenter } = useReactFlow();

  const filteredNodes = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return nodes
      .filter((n) => n.data.fullName.toLowerCase().includes(q))
      .slice(0, 6);
  }, [nodes, query]);

  const handleSelectNode = (node: LayoutNode) => {
    setCenter(node.position.x + 100, node.position.y + 48, {
      zoom: 1.2,
      duration: 800,
    });
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative w-64 md:w-80">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Tìm tên thành viên..."
          className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm backdrop-blur-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && filteredNodes.length > 0 && (
        <div className="absolute top-10 left-0 right-0 z-40 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-lg backdrop-blur-md overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => handleSelectNode(node)}
              className="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                  <User className="w-3 h-3" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {node.data.fullName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Đời {node.data.generationLevel} • {node.data.branchName || 'Thành viên'}
                  </p>
                </div>
              </div>

              {node.data.isGhost && (
                <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                  Phản chiếu
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
