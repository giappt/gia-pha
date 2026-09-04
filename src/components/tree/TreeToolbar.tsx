'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import {
  Maximize2,
  Users,
  Compass,
  Lock,
  Unlock,
  GitFork,
  Settings,
  ChevronDown,
  Globe,
  Target,
  X,
  Calendar,
  Search,
  Link2,
} from 'lucide-react';
import { SpotlightSearch } from './SpotlightSearch';
import { LayoutNode } from '@/types/tree';

export interface RootOption {
  id: string;
  name: string;
  branchName?: string;
  generationLevel: number;
}

interface TreeToolbarProps {
  clanName: string;
  memberCount: number;
  nodeCount: number;
  nodes: LayoutNode[];
  isLocked?: boolean;
  onToggleLock?: () => void;
  showMaternalBranches?: boolean;
  onToggleMaternalBranches?: () => void;
  showInternalHusbands?: boolean;
  onToggleInternalHusbands?: () => void;
  focusRootId?: string | null;
  onSelectFocusRoot?: (rootId: string | null) => void;
  availableRoots?: RootOption[];
  currentDataset?: 'clan28' | 'polygamy' | 'clan1500';
  onSwitchDataset?: (dataset: 'clan28' | 'polygamy' | 'clan1500') => void;
}

export const TreeToolbar: React.FC<TreeToolbarProps> = ({
  clanName,
  memberCount,
  nodeCount,
  nodes,
  isLocked = true,
  onToggleLock,
  showMaternalBranches = true,
  onToggleMaternalBranches,
  showInternalHusbands = true,
  onToggleInternalHusbands,
  focusRootId = null,
  onSelectFocusRoot,
  availableRoots = [],
  currentDataset = 'clan28',
  onSwitchDataset,
}) => {
  const { fitView } = useReactFlow();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isRootSelectOpen, setIsRootSelectOpen] = useState(false);
  const [rootSearchQuery, setRootSearchQuery] = useState('');

  const optionsRef = useRef<HTMLDivElement>(null);
  const rootSelectRef = useRef<HTMLDivElement>(null);

  const handleFitView = () => {
    fitView({ duration: 800, padding: 0.2 });
  };

  // Lọc danh sách Gốc theo từ khóa tìm kiếm
  const filteredRoots = React.useMemo(() => {
    if (!rootSearchQuery.trim()) return availableRoots;
    const q = rootSearchQuery.toLowerCase().trim();
    return availableRoots.filter((r) => r.name.toLowerCase().includes(q));
  }, [availableRoots, rootSearchQuery]);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsOptionsOpen(false);
      }
      if (rootSelectRef.current && !rootSelectRef.current.contains(event.target as Node)) {
        setIsRootSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentRootName = focusRootId
    ? availableRoots.find((r) => r.id === focusRootId)?.name || 'Nhánh đã chọn'
    : 'Toàn họ';

  return (
    <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* CỤM TRÁI: Tiêu đề Dòng họ & Bộ chọn Gốc hiển thị (Focus Root) */}
      <div className="pointer-events-auto flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase">
              {clanName}
            </h1>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              {memberCount} người ({nodeCount} thẻ)
            </div>
          </div>
        </div>

        {/* Dropdown Chọn Gốc Phả Đồ */}
        <div className="relative" ref={rootSelectRef}>
          <button
            type="button"
            onClick={() => setIsRootSelectOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              focusRootId
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70'
            }`}
          >
            {focusRootId ? (
              <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="truncate max-w-[130px]">Gốc: {currentRootName}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {focusRootId && onSelectFocusRoot && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectFocusRoot(null);
              }}
              title="Quay lại xem Toàn tộc"
              className="absolute -right-2 -top-1.5 w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] hover:bg-slate-900 shadow"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}

          {/* Menu chọn Gốc */}
          {isRootSelectOpen && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl py-1.5 z-40 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Chọn Gốc Phả Đồ
              </div>

              {/* Ô nhập tìm kiếm tên làm Gốc */}
              <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="relative flex items-center">
                  <Search className="absolute left-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={rootSearchQuery}
                    onChange={(e) => setRootSearchQuery(e.target.value)}
                    placeholder="Tìm tên thành viên làm Gốc..."
                    className="w-full h-7 pl-7 pr-6 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {rootSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setRootSearchQuery('')}
                      className="absolute right-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSelectFocusRoot?.(null);
                  setIsRootSelectOpen(false);
                  setRootSearchQuery('');
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  !focusRootId ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Toàn họ (Cụ Tổ)
                </span>
                {!focusRootId && <span className="text-[10px]">Đang xem</span>}
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <div className="max-h-56 overflow-y-auto">
                {filteredRoots.length === 0 ? (
                  <div className="px-3 py-3 text-center text-slate-400 text-[11px]">
                    Không tìm thấy thành viên
                  </div>
                ) : (
                  filteredRoots.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        onSelectFocusRoot?.(r.id);
                        setIsRootSelectOpen(false);
                        setRootSearchQuery('');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left ${
                        focusRootId === r.id
                          ? 'font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="truncate max-w-[190px]">{r.name}</div>
                        <div className="text-[9px] text-slate-400">
                          Đời {r.generationLevel} {r.branchName ? `• ${r.branchName}` : ''}
                        </div>
                      </div>
                      {focusRootId === r.id && <span className="text-[10px]">Đang xem</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CỤM PHẢI: Spotlight Search & Nút Tiện Ích Popover */}
      <div className="pointer-events-auto flex items-center gap-2">
        <SpotlightSearch nodes={nodes} />

        <div className="flex items-center gap-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Nút Căn giữa (Icon-only) */}
          <button
            type="button"
            onClick={handleFitView}
            title="Căn giữa toàn màn hình"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Maximize2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </button>

          {/* Nút Popover Menu Tùy Chọn [ ⚙ Tùy chọn ▾ ] */}
          <div className="relative" ref={optionsRef}>
            <button
              type="button"
              onClick={() => setIsOptionsOpen((prev) => !prev)}
              title="Tùy chọn hiển thị & Cài đặt"
              className={`flex items-center gap-1 p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isOptionsOpen
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Menu Popover */}
            {isOptionsOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl p-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150 space-y-1.5">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tùy Chọn Phả Đồ
                </div>

                {/* Switch Khóa phả đồ */}
                {onToggleLock && (
                  <button
                    type="button"
                    onClick={onToggleLock}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      {isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      Khóa vị trí thẻ
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isLocked
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {isLocked ? 'Đang khóa' : 'Mở khóa'}
                    </span>
                  </button>
                )}

                {/* Switch Mở rộng họ ngoại */}
                {onToggleMaternalBranches && (
                  <button
                    type="button"
                    onClick={onToggleMaternalBranches}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <GitFork className="w-3.5 h-3.5 text-purple-600" />
                      Mở rộng họ ngoại
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        showMaternalBranches
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {showMaternalBranches ? 'Bật' : 'Tắt'}
                    </span>
                  </button>
                )}

                {/* Switch Hiển thị Rể nội tộc */}
                {onToggleInternalHusbands && (
                  <button
                    type="button"
                    onClick={onToggleInternalHusbands}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors text-slate-700 dark:text-slate-200"
                  >
                    <span className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-amber-600" />
                      Hiển thị Rể nội tộc
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        showInternalHusbands
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {showInternalHusbands ? 'Bật' : 'Tắt'}
                    </span>
                  </button>
                )}

                {/* Chọn Nguồn Dữ Liệu */}
                {onSwitchDataset && (
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3 text-emerald-600" /> Nguồn dữ liệu kiểm thử
                    </div>
                    <div className="space-y-1 px-1">
                      <button
                        type="button"
                        onClick={() => onSwitchDataset('clan28')}
                        className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-colors flex items-center justify-between ${
                          currentDataset === 'clan28'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span>Clan 28 (Mẫu cơ bản)</span>
                        {currentDataset === 'clan28' && <span className="text-[9px]">Đang xem</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSwitchDataset('polygamy')}
                        className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-colors flex items-center justify-between ${
                          currentDataset === 'polygamy'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span>Cụ Chiến (Đa thê & Con riêng)</span>
                        {currentDataset === 'polygamy' && <span className="text-[9px]">Đang xem</span>}
                      </button>
                      <button
                        type="button"
                        onClick={() => onSwitchDataset('clan1500')}
                        className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-semibold transition-colors flex items-center justify-between ${
                          currentDataset === 'clan1500'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <span>Clan 1.500 (Tải nặng)</span>
                        {currentDataset === 'clan1500' && <span className="text-[9px]">Đang xem</span>}
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                <div className="flex items-center justify-between px-2 py-1 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" /> Lịch giỗ Âm lịch
                  </span>
                  <span className="font-semibold text-emerald-600">Mặc định</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
