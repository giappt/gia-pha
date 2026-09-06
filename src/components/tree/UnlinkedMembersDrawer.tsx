'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  Link2,
  Trash2,
  Search,
  Check,
  AlertCircle,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import { getUnlinkedMembers, canDeleteMember, validateNoCycle } from '@/lib/tree-layout/graph-validation';

export interface UnlinkedMembersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberRecord[];
  spouses: SpouseRelationRecord[];
  onRelinkMember: (memberId: string, parentId: string) => Promise<void>;
  onDeleteMember: (memberId: string) => Promise<void>;
}

export const UnlinkedMembersDrawer: React.FC<UnlinkedMembersDrawerProps> = ({
  isOpen,
  onClose,
  members,
  spouses,
  onRelinkMember,
  onDeleteMember,
}) => {
  // Lọc danh sách thành viên chưa nối phả chuẩn xác
  const unlinkedMembers = useMemo(() => {
    return getUnlinkedMembers(members, spouses);
  }, [members, spouses]);

  const [searchQuery, setSearchQuery] = useState('');
  const [relinkingMemberId, setRelinkingMemberId] = useState<string | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Lọc danh sách unlinked theo tìm kiếm
  const filteredUnlinked = useMemo(() => {
    if (!searchQuery.trim()) return unlinkedMembers;
    const q = searchQuery.toLowerCase().trim();
    return unlinkedMembers.filter((m) => m.full_name.toLowerCase().includes(q));
  }, [unlinkedMembers, searchQuery]);

  // Danh sách cha/mẹ khả dụng để nối (chỉ những người ĐÃ NỐI vào cây)
  const availableParents = useMemo(() => {
    if (!relinkingMemberId) return [];
    const unlinkedIds = new Set(unlinkedMembers.map((m) => m.id));
    // Cha mẹ phải là người đã nối và không phải con cháu của người cần nối (tránh chu trình)
    return members
      .filter((m) => !unlinkedIds.has(m.id))
      .filter((m) => {
        try {
          validateNoCycle(relinkingMemberId, m.id, members);
          return true;
        } catch {
          return false;
        }
      })
      .sort((a, b) => a.generation_level - b.generation_level);
  }, [relinkingMemberId, unlinkedMembers, members]);

  // Lọc danh sách cha mẹ tìm kiếm
  const filteredParents = useMemo(() => {
    if (!parentSearchQuery.trim()) return availableParents.slice(0, 15);
    const q = parentSearchQuery.toLowerCase().trim();
    return availableParents
      .filter((p) => p.full_name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [availableParents, parentSearchQuery]);

  if (!isOpen) return null;

  const handleStartRelink = (memberId: string) => {
    setRelinkingMemberId(memberId);
    setSelectedParentId('');
    setParentSearchQuery('');
    setActionError(null);
  };

  const handleConfirmRelink = async () => {
    if (!relinkingMemberId || !selectedParentId) {
      setActionError('Vui lòng chọn một người Cha/Mẹ để nối vào cây.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    try {
      await onRelinkMember(relinkingMemberId, selectedParentId);
      setRelinkingMemberId(null);
      setSelectedParentId('');
    } catch (err: any) {
      setActionError(err.message || 'Không thể nối thành viên vào cây');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (memberId: string) => {
    const check = canDeleteMember(memberId, members);
    if (!check.canDelete) {
      setActionError(check.reason || 'Không thể xóa thành viên này.');
      return;
    }

    if (!confirm('Bạn có chắc chắn muốn xóa thành viên mồ côi này khỏi hệ thống?')) {
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    try {
      await onDeleteMember(memberId);
    } catch (err: any) {
      setActionError(err.message || 'Lỗi khi xóa thành viên');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Drawer */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Khay Thành Viên Chưa Nối Phả
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Hiện có <strong className="text-amber-600">{unlinkedMembers.length}</strong> người chưa nối nhánh (đã tự động loại trừ Dâu/Rể ngoại tộc).
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Banner */}
          {actionError && (
            <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Search Box */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên thành viên chưa nối..."
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredUnlinked.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Check className="w-10 h-10 mx-auto text-emerald-500/60 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Tuyệt vời! Toàn bộ gia tộc đã được kết nối liền mạch.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Không còn thành viên nào bị cô lập ngoài cây phả hệ.
                </p>
              </div>
            ) : (
              filteredUnlinked.map((member) => {
                const isRelinkingThis = relinkingMemberId === member.id;

                return (
                  <div
                    key={member.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isRelinkingThis
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50/40 dark:bg-amber-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              member.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                            }`}
                          />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {member.full_name}
                          </h4>
                          {member.is_adopted && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                              Con nuôi
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {member.gender === 'male' ? 'Nam' : 'Nữ'} •{' '}
                          {member.birth_year ? `Sinh ${member.birth_year}` : 'Chưa rõ năm sinh'} •{' '}
                          <span
                            className={
                              member.life_status === 'living'
                                ? 'text-emerald-600 font-semibold'
                                : 'text-slate-400'
                            }
                          >
                            {member.life_status === 'living' ? 'Còn sống' : 'Đã mất'}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isRelinkingThis && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartRelink(member.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-[11px] font-semibold border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1"
                            >
                              <Link2 className="w-3 h-3" /> Nối vào cây
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(member.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Xóa thành viên mồ côi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Khung Autocomplete Nối Phả Tại Chỗ */}
                    {isRelinkingThis && (
                      <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/60 space-y-2">
                        <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200">
                          Chọn Cha / Mẹ để nối người này vào làm con:
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={parentSearchQuery}
                            onChange={(e) => setParentSearchQuery(e.target.value)}
                            placeholder="Gõ tên tìm cha mẹ trong cây..."
                            className="w-full px-3 py-1.5 rounded-lg text-xs border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>

                        <div className="max-h-36 overflow-y-auto rounded-lg border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/60">
                          {filteredParents.length === 0 ? (
                            <div className="p-2 text-center text-slate-400 text-[11px]">
                              Không tìm thấy cha mẹ phù hợp
                            </div>
                          ) : (
                            filteredParents.map((p) => (
                              <div
                                key={p.id}
                                onClick={() => setSelectedParentId(p.id)}
                                className={`p-2 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                  selectedParentId === p.id
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span>
                                  {p.full_name} ({p.gender === 'male' ? 'Bố' : 'Mẹ'}, Đời {p.generation_level})
                                </span>
                                {selectedParentId === p.id && <Check className="w-3.5 h-3.5 text-amber-600" />}
                              </div>
                            ))
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setRelinkingMemberId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={!selectedParentId || isProcessing}
                            onClick={handleConfirmRelink}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1 shadow-sm"
                          >
                            {isProcessing ? 'Đang nối...' : 'Xác nhận nối phả'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
