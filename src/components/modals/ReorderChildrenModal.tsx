'use client';

import React, { useState, useEffect } from 'react';
import { GripVertical, ArrowUp, ArrowDown, Check, X, Users } from 'lucide-react';
import { MemberRecord } from '@/types/tree';

export interface ReorderChildrenModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentMember: MemberRecord | null;
  childrenList: MemberRecord[];
  onSaved: (updatedChildren: MemberRecord[]) => void;
}

export const ReorderChildrenModal: React.FC<ReorderChildrenModalProps> = ({
  isOpen,
  onClose,
  parentMember,
  childrenList,
  onSaved,
}) => {
  const [items, setItems] = useState<MemberRecord[]>([]);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && childrenList.length > 0) {
      // Sắp xếp khởi tạo theo thứ tự hiện tại
      const sorted = [...childrenList].sort((a, b) => {
        if (a.birth_order != null && b.birth_order != null) return a.birth_order - b.birth_order;
        if (a.birth_order != null && b.birth_order == null) return -1;
        if (a.birth_order == null && b.birth_order != null) return 1;
        if (a.birth_year != null && b.birth_year != null) return a.birth_year - b.birth_year;
        return a.full_name.localeCompare(b.full_name);
      });
      setItems(sorted);
      setErrorMessage(null);
    }
  }, [isOpen, childrenList]);

  if (!isOpen || !parentMember) return null;

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    // Hoán đổi tạm thời để hiển thị vị trí thả
    const newItems = [...items];
    const draggedItem = newItems.splice(draggedIdx, 1)[0];
    newItems.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Nút bấm di chuyển lên / xuống cho Mobile & Touch
  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    setItems(newItems);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const orderedChildIds = items.map((c) => c.id);
      const res = await fetch('/api/members/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: parentMember.id,
          orderedChildIds,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Không thể lưu thứ tự');
      }

      // Cập nhật lại birth_order cho các object item cục bộ
      const updatedList = items.map((child, idx) => ({
        ...child,
        birth_order: idx + 1,
      }));

      onSaved(updatedList);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('fat:members-reordered', {
            detail: { parentId: parentMember.id, updatedChildren: updatedList },
          })
        );
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu thứ tự con cái');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Sắp xếp thứ tự đàn con
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {parentMember.full_name} ({items.length} người con)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-2 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">
            Kéo thả bằng tay nắm hoặc bấm mũi tên để đổi thứ tự từ con cả (1) đến con út ({items.length}):
          </p>

          {errorMessage && (
            <div className="p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            {items.map((child, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === items.length - 1;
              const isDragging = draggedIdx === idx;

              return (
                <div
                  key={child.id}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all select-none ${
                    isDragging
                      ? 'opacity-40 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Drag Handle */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Kéo thả để sắp xếp"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Số thứ tự sinh mới */}
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>

                    {/* Thông tin con */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          {child.full_name}
                        </span>
                        {child.is_senior && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            (Trưởng)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {child.gender === 'male' ? 'Nam' : child.gender === 'female' ? 'Nữ' : 'Khác'}
                        {child.birth_year ? ` · SN: ${child.birth_year}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Move Up / Move Down Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => moveItem(idx, 'up')}
                      className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Lên trên"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => moveItem(idx, 'down')}
                      className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Xuống dưới"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {isSaving ? 'Đang lưu...' : 'Lưu thứ tự'}
          </button>
        </div>
      </div>
    </div>
  );
};
