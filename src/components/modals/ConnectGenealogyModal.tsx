'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserCheck,
  UserPlus,
  Sparkles,
  Lock,
  Minus,
  Plus,
  Check,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import type { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import type { BranchNode } from '@/types/database';
import {
  formatMemberContextCard,
  getCandidateSpouses,
  getParentDisplayNameWithSpouse,
  calculateSuggestedBirthOrder,
  calculateBirthOrderExplanation,
  filterUnclaimedCandidateMembers,
} from '@/lib/claims/claim-engine';

interface ConnectGenealogyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userFullName?: string | null;
  userEmail?: string | null;
  members: MemberRecord[];
  branches?: BranchNode[];
  spouseRelations?: SpouseRelationRecord[];
  claimedMemberIds?: string[];
}

export default function ConnectGenealogyModal({
  isOpen,
  onClose,
  onSuccess,
  userFullName = '',
  userEmail = '',
  members = [],
  branches = [],
  spouseRelations = [],
  claimedMemberIds = [],
}: ConnectGenealogyModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');

  // Tab 1 state: Claim existing node
  const [searchQuery, setSearchQuery] = useState(userFullName || '');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [claimNotes, setClaimNotes] = useState('');

  // Tab 2 state: Propose new child / find origin
  const [newMemberStep, setNewMemberStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState(userFullName || '');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthYear, setBirthYear] = useState<string>('');
  const [parentId, setParentId] = useState<string>('');
  const [parentSearchQuery, setParentSearchQuery] = useState('');
  const [selectedSpouseId, setSelectedSpouseId] = useState<string>('');
  const [isStepchild, setIsStepchild] = useState<boolean>(false);
  const [birthOrder, setBirthOrder] = useState<number>(1);
  const [isSenior, setIsSenior] = useState<boolean>(false);
  const [isOriginUnknown, setIsOriginUnknown] = useState<boolean>(false);
  const [rawParentInfo, setRawParentInfo] = useState('');
  const [rawAncestorInfo, setRawAncestorInfo] = useState('');
  const [notes, setNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key & scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  // Precompute Map for fast lookup
  const membersMap = useMemo(() => {
    const map = new Map<string, MemberRecord>();
    for (const m of members) {
      if (m?.id) map.set(m.id, m);
    }
    return map;
  }, [members]);

  // Tab 1: Filter members with 3-generation context (Bảo mật: Lọc sạch 100% hồ sơ đã liên kết)
  const filteredExistingMembers = useMemo(() => {
    return filterUnclaimedCandidateMembers(members, claimedMemberIds, searchQuery, membersMap)
      .slice(0, 20)
      .map((m) => formatMemberContextCard(m, membersMap, branches, spouseRelations));
  }, [searchQuery, members, claimedMemberIds, membersMap, branches, spouseRelations]);

  // Tab 2: Filter parents with spouse names
  const filteredParents = useMemo(() => {
    if (!parentSearchQuery.trim()) return [];
    const q = parentSearchQuery.toLowerCase().trim();
    return members
      .filter((m) => m.full_name?.toLowerCase().includes(q))
      .slice(0, 15);
  }, [parentSearchQuery, members]);

  // Tab 2: Candidate spouses of selected parent
  const candidateSpouses = useMemo(() => {
    if (!parentId) return [];
    return getCandidateSpouses(parentId, membersMap, spouseRelations);
  }, [parentId, membersMap, spouseRelations]);

  // Tab 2: When parent is selected, automatically select spouse if exactly 1 spouse exists
  const handleSelectParent = (pId: string) => {
    setParentId(pId);
    setParentSearchQuery('');
    const spouses = getCandidateSpouses(pId, membersMap, spouseRelations);
    if (spouses.length === 1) {
      setSelectedSpouseId(spouses[0].id);
      setIsStepchild(false);
    } else {
      setSelectedSpouseId('');
      setIsStepchild(false);
    }
  };

  // Tab 2: Existing children of selected parent & auto-suggest birth order
  const existingChildren = useMemo(() => {
    if (!parentId) return [];
    return members
      .filter((m) => m.father_id === parentId || m.mother_id === parentId)
      .sort((a, b) => (a.birth_order || 0) - (b.birth_order || 0));
  }, [parentId, members]);

  // When parent, children or birthYear change, auto suggest birth order
  useEffect(() => {
    if (parentId && existingChildren.length > 0) {
      const parsedYear = birthYear ? Number(birthYear) : null;
      const suggestion = calculateSuggestedBirthOrder(parsedYear, existingChildren);
      setBirthOrder(suggestion.suggestedOrder);
    } else {
      setBirthOrder(1);
    }
  }, [parentId, existingChildren, birthYear]);

  // Ngữ cảnh vị trí con trực quan theo số thứ tự đang chọn
  const birthOrderExplanation = useMemo(() => {
    return calculateBirthOrderExplanation(birthOrder, existingChildren);
  }, [birthOrder, existingChildren]);

  if (!isOpen || !mounted) return null;

  // Submit Tab 1: Claim existing node
  const handleClaimExisting = async () => {
    if (!selectedMemberId) {
      setErrorMessage('Vui lòng chọn hồ sơ của bạn trên cây gia phả');
      return;
    }

    if (claimedMemberIds.includes(selectedMemberId)) {
      setErrorMessage('Hồ sơ này đã được liên kết với một tài khoản khác trong dòng họ.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: 'claim_existing',
          member_id: selectedMemberId,
          verification_notes: claimNotes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || 'Gửi yêu cầu thất bại');
      } else {
        setSuccessMessage('Gửi yêu cầu nhận hồ sơ thành công! Vui lòng chờ phê duyệt.');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }
    } catch {
      setErrorMessage('Lỗi kết nối mạng, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Tab 2: Propose new child or find origin
  const handleProposeNew = async () => {
    if (!fullName.trim()) {
      setErrorMessage('Vui lòng nhập họ và tên của bạn');
      return;
    }

    if (!isOriginUnknown && !parentId) {
      setErrorMessage('Vui lòng chọn Cha hoặc Mẹ trên cây gia phả, hoặc tick chọn "Chưa rõ Cha Mẹ"');
      return;
    }

    if (isOriginUnknown && !rawParentInfo.trim()) {
      setErrorMessage('Vui lòng nhập Tên Bố / Mẹ ngoài đời để Ban Quản Trị có thông tin đối chiếu');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const request_type = !isOriginUnknown ? 'propose_child' : 'find_origin';
      const selectedParent = parentId ? membersMap.get(parentId) : null;
      const parentRelation = selectedParent?.gender === 'female' ? ('mother' as const) : ('father' as const);

      const proposed_data = {
        full_name: fullName.trim(),
        gender,
        birth_year: birthYear ? Number(birthYear) : null,
        birth_order: !isOriginUnknown ? birthOrder : null,
        is_senior: gender === 'male' && isSenior ? true : false,
        parent_id: !isOriginUnknown ? parentId : null,
        parent_relation: parentRelation,
        spouse_id: !isOriginUnknown && !isStepchild ? selectedSpouseId || null : null,
        is_stepchild: isStepchild,
        raw_parent_info: isOriginUnknown ? rawParentInfo.trim() || null : null,
        raw_ancestor_info: isOriginUnknown ? rawAncestorInfo.trim() || null : null,
        notes: notes.trim() || null,
      };

      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type,
          proposed_data,
          verification_notes: notes.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setErrorMessage(json.error || 'Gửi hồ sơ thất bại');
      } else {
        setSuccessMessage(
          !isOriginUnknown
            ? 'Đã gửi đề xuất thêm con vào gia phả thành công!'
            : 'Đã gửi phiếu Tìm Cội Nguồn thành công! Ban Quản Trị sẽ xác minh ghép nối.'
        );
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      }
    } catch {
      setErrorMessage('Lỗi kết nối mạng, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedParent = parentId ? membersMap.get(parentId) : null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto flex min-h-full items-start justify-center p-3 sm:p-4 pt-8 sm:pt-12 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="connect-genealogy-modal-dialog"
        className="relative w-full max-w-lg h-[620px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Kết Nối Vào Gia Phả
              </h3>
              <p className="text-xs text-slate-500"></p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="shrink-0 flex border-b border-slate-100 dark:border-slate-800 px-5 pt-2 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => {
              setActiveTab('existing');
              setErrorMessage(null);
              setNewMemberStep(1);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'existing'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Tôi đã có tên trên cây</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('new');
              setErrorMessage(null);
              setNewMemberStep(1);
            }}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${activeTab === 'new'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Tôi chưa có trên cây</span>
          </button>
        </div>

        {/* Alert Messages (Cố định shrink-0) */}
        {errorMessage && (
          <div className="shrink-0 mx-5 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2 text-rose-800 dark:text-rose-200 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="shrink-0 mx-5 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2 text-emerald-800 dark:text-emerald-200 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab 1 Content: Claim Existing Node */}
        {activeTab === 'existing' && (
          <>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Tìm kiếm tên của bạn trên Gia Phả:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Gõ tên bạn hoặc tên cha..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Results List with Fixed Height Container (chống giật nảy layout) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Kết quả tìm kiếm ({filteredExistingMembers.length}):
                </label>

                {filteredExistingMembers.length === 0 ? (
                  <div className="h-44 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center p-4 text-center text-xs text-slate-400">
                    {searchQuery.trim()
                      ? `Không tìm thấy người nào chưa liên kết phù hợp với tên "${searchQuery}". Bạn có thể chuyển sang tab "Tôi chưa có trên cây (Thêm mới)" để gửi đề xuất bổ sung mới.`
                      : 'Gõ họ tên của bạn để tìm kiếm...'}
                  </div>
                ) : (
                  <div className="h-52 overflow-y-auto space-y-1.5 pr-1">
                    {filteredExistingMembers.map((card) => {
                      const isSelected = selectedMemberId === card.id;

                      return (
                        <div
                          key={card.id}
                          onClick={() => setSelectedMemberId(card.id)}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between text-left cursor-pointer ${isSelected
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                            : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300'
                            }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                {card.fullName}
                              </span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {card.gender} {card.birthYear ? `· ${card.birthYear}` : ''}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                              {card.branchInfo}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{card.parentInfo}</p>
                          </div>

                          <div className="shrink-0 ml-2">
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded-lg transition-all ${isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-400 hover:text-emerald-600'
                                }`}
                            >
                              {isSelected ? 'Đã chọn' : 'Chọn →'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lời nhắn gửi Ban Quản Trị / Bố Mẹ (tùy chọn):
                </label>
                <input
                  type="text"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="Ví dụ: Cháu Tuấn, con út của bố Bình ở Hà Nội..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Pinned Sticky Footer Tab 1 */}
            <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                type="button"
                id="submit-claim-existing-btn"
                disabled={!selectedMemberId || isSubmitting || claimedMemberIds.includes(selectedMemberId)}
                onClick={handleClaimExisting}
                className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang gửi yêu cầu...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Gửi Yêu Cầu Liên Kết (1-Chạm)</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Tab 2 Content: Propose New Member (Wizard 2 Bước Tuần Tự) */}
        {activeTab === 'new' && (
          <>
            {newMemberStep === 1 ? (
              /* ==================== BƯỚC 1: THÔNG TIN CÁ NHÂN ==================== */
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Header Chỉ Báo Tiến Trình Bước 1 */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-control bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[11px] font-bold">
                        1
                      </span>
                      Thông tin cá nhân của bạn
                    </span>
                    <span className="text-slate-400 text-[11px] font-medium">Bước 1 / 2</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Họ và tên của bạn: *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ví dụ: Phạm Văn Tuấn"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Giới tính: *
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setGender('male')}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${gender === 'male'
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                        >
                          Nam
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender('female')}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${gender === 'female'
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500'
                            }`}
                        >
                          Nữ
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Năm sinh: (tùy chọn)
                      </label>
                      <input
                        type="number"
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value)}
                        placeholder="Ví dụ: 1995"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Pinned Sticky Footer Bước 1 */}
                <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <button
                    type="button"
                    disabled={!fullName.trim()}
                    onClick={() => {
                      if (fullName.trim()) {
                        setErrorMessage(null);
                        setNewMemberStep(2);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span>Tiếp Tục: Chọn Bố Mẹ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              /* ==================== BƯỚC 2: CỘI NGUỒN TRONG HỌ ==================== */
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-6">
                  {/* Badge Tóm Tắt Bước 1 kèm nút Sửa */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-control bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{fullName}</span>
                        <span className="text-slate-500 text-[11px] ml-1.5">
                          ({gender === 'male' ? 'Nam' : 'Nữ'}{birthYear ? `, sinh ${birthYear}` : ''})
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewMemberStep(1)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold"
                    >
                      Sửa
                    </button>
                  </div>

                  {/* Khối Cội nguồn trong gia phả */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        2. Liên kết trong họ
                      </span>
                      <span className="text-slate-400 text-[11px] font-medium">Bước 2 / 2</span>
                    </div>

                    {!isOriginUnknown ? (
                      /* Có Cha/Mẹ trên Cây Gia Phả */
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Bố (hoặc Mẹ) của bạn trong Gia Phả: *
                          </label>

                          {!parentId ? (
                            <div>
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={parentSearchQuery}
                                  onChange={(e) => setParentSearchQuery(e.target.value)}
                                  placeholder="Gõ tên bố hoặc mẹ để tìm..."
                                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              {/* Danh sách gợi ý cha mẹ dạng Inline List phẳng (Zero Dropdown, Zero Double-Scrollbar) */}
                              {filteredParents.length > 0 && (
                                <div className="mt-2 space-y-1.5 border border-slate-200 dark:border-slate-700/80 rounded-xl p-2 bg-slate-50/60 dark:bg-slate-850/60">
                                  <div className="text-[11px] font-semibold text-slate-500 px-1 pb-0.5">
                                    Gợi ý phù hợp ({filteredParents.length}):
                                  </div>
                                  {filteredParents.slice(0, 4).map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => handleSelectParent(p.id)}
                                      className="w-full text-left p-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-750 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs transition-colors shadow-2xs"
                                    >
                                      <div>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">
                                          {getParentDisplayNameWithSpouse(p, membersMap, spouseRelations, branches)}
                                        </span>
                                      </div>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] shrink-0 ml-2">
                                        Chọn →
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Khi đã chọn cha mẹ: Card xác nhận và nút đổi */
                            selectedParent && (
                              <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-emerald-950 dark:text-emerald-100">
                                    {selectedParent.full_name}
                                  </span>
                                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block mt-0.5">
                                    {getParentDisplayNameWithSpouse(selectedParent, membersMap, spouseRelations, branches)}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setParentId('');
                                    setSelectedSpouseId('');
                                    setIsStepchild(false);
                                  }}
                                  className="text-xs text-rose-600 hover:underline font-semibold"
                                >
                                  Đổi
                                </button>
                              </div>
                            )
                          )}
                        </div>

                        {/* Khi đã chọn Cha/Mẹ: Xác nhận Người Phối Ngẫu (Mẹ ruột / Bố ruột) hoặc Con Riêng */}
                        {selectedParent && (
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 animate-in fade-in duration-150">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {candidateSpouses.length > 0
                                ? `Xác nhận ${selectedParent.gender === 'male' ? 'Mẹ' : 'Bố'} cho bạn:`
                                : `Thông tin bạn đời:`}
                            </label>

                            {candidateSpouses.length > 0 ? (
                              <div className="space-y-1.5">
                                {candidateSpouses.map((spouse) => {
                                  const isSelected = selectedSpouseId === spouse.id && !isStepchild;
                                  return (
                                    <label
                                      key={spouse.id}
                                      className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${isSelected
                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-slate-900 dark:text-white font-medium'
                                        : 'border-transparent hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                      <input
                                        type="radio"
                                        name="candidate_spouse"
                                        checked={isSelected}
                                        onChange={() => {
                                          setSelectedSpouseId(spouse.id);
                                          setIsStepchild(false);
                                        }}
                                        className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500 mt-0.5 shrink-0"
                                      />
                                      <div className="text-xs leading-tight">
                                        <div>
                                          {spouse.spouseTitle}: <strong>{spouse.fullName}</strong>{' '}
                                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                                            ({spouse.birthYear ? `Sinh ${spouse.birthYear}` : 'Chưa rõ năm sinh'})
                                          </span>
                                        </div>
                                        {isSelected && (
                                          <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-normal">
                                            Con chung của {selectedParent.full_name} & {spouse.fullName}.
                                          </p>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })}

                                {/* Tùy chọn Lưu làm con riêng */}
                                <label
                                  className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors border ${isStepchild
                                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-slate-900 dark:text-white font-medium'
                                    : 'border-transparent hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                  <input
                                    type="radio"
                                    name="candidate_spouse"
                                    checked={isStepchild}
                                    onChange={() => {
                                      setSelectedSpouseId('');
                                      setIsStepchild(true);
                                    }}
                                    className="w-3.5 h-3.5 text-amber-600 focus:ring-amber-500 mt-0.5 shrink-0"
                                  />
                                  <div className="text-xs leading-tight">
                                    <div>
                                      Con riêng của {selectedParent.full_name} (Không chọn {selectedParent.gender === 'male' ? 'Mẹ' : 'Bố'})
                                    </div>
                                    {isStepchild && (
                                      <p className="text-[10.5px] text-amber-600 dark:text-amber-400 mt-0.5 font-normal">
                                        Lưu làm con riêng (hạ nhánh trực tiếp từ {selectedParent.gender === 'male' ? 'Bố' : 'Mẹ'}).
                                      </p>
                                    )}
                                  </div>
                                </label>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                                Người này chưa có bạn đời trên cây → Sẽ lưu làm con riêng của {selectedParent.full_name}.
                              </p>
                            )}

                            {/* Bộ chọn thứ tự con đẻ tự nhiên (Number Stepper không giới hạn) */}
                            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                              <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                                  Bạn là con thứ mấy?
                                </label>
                                <span className="text-[11px] text-slate-500">
                                  {existingChildren.length > 0
                                    ? `Bố mẹ hiện có ${existingChildren.length} người con trên cây: ${existingChildren
                                      .map((c) => c.full_name)
                                      .join(', ')}`
                                    : 'Chưa có người con nào được ghi nhận trên cây.'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setBirthOrder((prev) => Math.max(1, prev - 1))}
                                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold active:scale-95 transition-all"
                                  title="Giảm thứ tự"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-14 text-center font-bold text-sm text-emerald-700 dark:text-emerald-400">
                                  {birthOrder === 1 ? 'Con cả' : `Thứ #${birthOrder}`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setBirthOrder((prev) => prev + 1)}
                                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold active:scale-95 transition-all"
                                  title="Tăng thứ tự"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Dòng giải thích ngữ cảnh vị trí trực quan */}
                            {birthOrderExplanation && (
                              <div className="p-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                                <span className="font-semibold shrink-0">Vị trí:</span>
                                <span>{birthOrderExplanation}</span>
                              </div>
                            )}

                            {/* Nguyện vọng Con Trưởng (Trưởng Nam gánh họ) khi chọn Nam */}
                            {gender === 'male' && (
                              <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-200 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={isSenior}
                                  onChange={(e) => setIsSenior(e.target.checked)}
                                  className="w-3.5 h-3.5 text-amber-600 rounded-sm focus:ring-amber-500"
                                />
                                <span className="font-semibold">Tôi là Con Trưởng</span>
                              </label>
                            )}
                          </div>
                        )}

                        {/* Checkbox chuyển đổi linh hoạt sang Phiếu Yêu Cầu */}
                        <label className="flex items-center gap-2 cursor-pointer pt-2 text-xs text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
                          <input
                            type="checkbox"
                            checked={isOriginUnknown}
                            onChange={(e) => setIsOriginUnknown(e.target.checked)}
                            className="w-3.5 h-3.5 text-emerald-600 rounded-sm focus:ring-emerald-500"
                          />
                          <span>Tôi chưa rõ hoặc Cha Mẹ chưa có trên Cây Gia Phả (Gửi Phiếu Yêu Cầu)</span>
                        </label>
                      </div>
                    ) : (
                      /* Phiếu Yêu Cầu (Khi tick chọn chưa rõ cha mẹ trên cây) */
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
                          <p className="font-semibold flex items-center gap-1.5">
                            Phiếu Yêu Cầu
                          </p>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                            Thông tin của bạn sẽ được lưu để Ban Quản Trị, Trưởng Chi đối chiếu gia phả gốc
                            <br />
                            Hãy cung cấp thông tin đầy đủ để kết nối nhanh chóng.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Tên Bố / Mẹ ngoài đời: *
                          </label>
                          <input
                            type="text"
                            value={rawParentInfo}
                            onChange={(e) => setRawParentInfo(e.target.value)}
                            placeholder="Ví dụ: Bố tôi là Phạm Văn Minh, sinh năm 1968..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Thông tin Ông/Bà hoặc Nhánh nghi vấn: (nếu biết)
                          </label>
                          <input
                            type="text"
                            value={rawAncestorInfo}
                            onChange={(e) => setRawAncestorInfo(e.target.value)}
                            placeholder="Ví dụ: Nghe nói ông nội là cụ Hùng ở Chi 2..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsOriginUnknown(false)}
                          className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                        >
                          ← Quay lại tìm Bố Mẹ trên Cây Gia Phả
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Khối 3: Lời nhắn xác minh */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Lời nhắn xác minh gửi BQT / Bố Mẹ: (tùy chọn)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ghi chú thêm thông tin liên hệ hoặc chi tiết để BQT xác minh..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 resize-none"
                    />
                  </div>
                </div>

                {/* Pinned Sticky Footer Bước 2 */}
                <div className="shrink-0 p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewMemberStep(1)}
                    className="py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>
                  <button
                    type="button"
                    id="submit-propose-child-btn"
                    disabled={
                      isSubmitting ||
                      (!isOriginUnknown && !parentId) ||
                      (isOriginUnknown && !rawParentInfo.trim())
                    }
                    onClick={handleProposeNew}
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi hồ sơ...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>{isOriginUnknown ? 'Gửi Yêu Cầu Xác Minh' : 'Gửi Yêu Cầu Xét Duyệt'}</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
