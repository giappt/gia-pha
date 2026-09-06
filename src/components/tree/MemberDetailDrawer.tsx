'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MemberRecord, SpouseRelationRecord } from '@/types/tree';
import { getImmediateFamily, getNextSolarAnniversary } from '@/lib/tree-layout/immediate-family';
import { KINSHIP_TERMS } from '@/constants/kinship-terms';
import { calculateMemberAge } from '@/lib/tree-layout/age-utils';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Users,
  User,
  Compass,
  Scroll,
  HelpCircle,
  Crown,
  ChevronRight,
  Edit3,
  UserPlus,
  Info,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { canDeleteMember } from '@/lib/tree-layout/graph-validation';

export interface MemberDetailDrawerProps {
  memberId: string | null;
  isOpen: boolean;
  onClose: () => void;
  members: MemberRecord[];
  spouseRelations: SpouseRelationRecord[];
  onSelectMember: (id: string) => void;
  onSetFocusRoot?: (id: string) => void;
  onEditMember?: (member: MemberRecord) => void;
  onAddChild?: (parent: MemberRecord, motherId?: string | null) => void;
  onAddSpouse?: (member: MemberRecord) => void;
  onDeleteMember?: (memberId: string) => Promise<void>;
}

export const MemberDetailDrawer: React.FC<MemberDetailDrawerProps> = ({
  memberId,
  isOpen,
  onClose,
  members,
  spouseRelations,
  onSelectMember,
  onSetFocusRoot,
  onEditMember,
  onAddChild,
  onAddSpouse,
  onDeleteMember,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Lắng nghe phím Escape để đóng Drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trích xuất mạng lưới gia đình 1 đời
  const familyData = useMemo(() => {
    if (!memberId) return null;
    return getImmediateFamily(memberId, members, spouseRelations);
  }, [memberId, members, spouseRelations]);

  const target = familyData?.targetMember;

  // Tính ngày giỗ kế tiếp
  const anniversaryInfo = useMemo(() => {
    if (!target || target.life_status !== 'deceased') return null;
    return getNextSolarAnniversary(target.death_lunar_day, target.death_lunar_month);
  }, [target]);

  // Kiểm tra điều kiện xóa hồ sơ an toàn (Safe Delete RESTRICT)
  const deleteCheck = useMemo(() => {
    if (!target) return { canDelete: false, childrenCount: 0, reason: 'Không có dữ liệu thành viên' };
    return canDeleteMember(target.id, members);
  }, [target, members]);

  if (!isOpen || !target) return null;

  const isMale = target.gender === 'male';
  const isDeceased = target.life_status === 'deceased';
  const isAnonymous = !!target.is_anonymous;

  return (
    <>
      {/* Backdrop mờ phía sau */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col transform transition-transform duration-300 ease-in-out select-text"
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-drawer-title"
      >
        {/* Top Header & Close Button */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Profile Identity Card */}
          <div className="flex items-start gap-4">
            {/* Avatar Circle */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${
                isAnonymous
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-dashed border-amber-400 dark:border-amber-600 text-amber-600'
                  : isMale
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400'
              }`}
            >
              {isAnonymous ? (
                <HelpCircle className="w-7 h-7" />
              ) : (
                <User className="w-7 h-7" />
              )}
            </div>

            {/* Info and Badges */}
            <div className="flex-1 min-w-0">
              <h2
                id="member-drawer-title"
                className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate"
              >
                {target.full_name}
              </h2>

              {target.alias_name && (
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  Tự: <span className="italic font-medium">{target.alias_name}</span>
                </p>
              )}

              {target.birth_year && (() => {
                const ageInfo = calculateMemberAge(target.birth_year, target.death_year, target.life_status);
                if (!ageInfo) return null;
                return (
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-600 dark:text-slate-300">
                    <span>{ageInfo.displayLabel}</span>
                    <span
                      title={ageInfo.tooltipText}
                      className="cursor-help inline-flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </div>
                );
              })()}

              {/* Badges container */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300">
                  Đời thứ {target.generation_level}
                </span>

                {target.is_senior && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                    <Crown className="w-3 h-3" /> Con trưởng
                  </span>
                )}

                {isAnonymous ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                    Khuyết danh
                  </span>
                ) : isDeceased ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Đã khuất
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/60">
                    Còn sống
                  </span>
                )}

                {target.branch_name && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {target.branch_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-sm">
          {/* 1. SECTION: ANONYMOUS ANCESTOR NOTICE */}
          {isAnonymous && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Tiền nhân khuyết danh / Chờ xác minh danh tự</span>
              </div>
              <p>
                Tư liệu lịch sử về bậc tiền nhân này hiện bị thất truyền trong gia phả cổ.
                Hệ thống lưu giữ vị trí thế hệ để bảo toàn tôn ti trật tự gia tộc.
              </p>
            </div>
          )}

          {/* 2. SECTION: PHONG TỤC & GIỖ CHẠP (NẾU ĐÃ KHUẤT) */}
          {isDeceased && (target.death_lunar_day || target.death_year || anniversaryInfo) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Phong Tục & Giỗ Chạp
              </h3>

              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 space-y-2.5">
                {target.death_lunar_day && target.death_lunar_month && (
                  <div className="flex items-start justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Ngày giỗ chính:</span>
                    <span className="font-semibold text-amber-900 dark:text-amber-200">
                      Ngày {target.death_lunar_day} tháng {target.death_lunar_month} (Âm lịch)
                    </span>
                  </div>
                )}

                {anniversaryInfo && (
                  <div className="flex items-start justify-between pt-1 border-t border-amber-200/40 dark:border-amber-900/30">
                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" /> Giỗ Dương lịch tới:
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {anniversaryInfo.solarDateStr}
                      </span>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                        {anniversaryInfo.daysLeft === 0
                          ? 'Hôm nay là ngày giỗ!'
                          : `(Còn ${anniversaryInfo.daysLeft} ngày nữa)`}
                      </p>
                    </div>
                  </div>
                )}

                {target.birth_year && target.death_year && (
                  <div className="flex items-start justify-between pt-1 border-t border-amber-200/40 dark:border-amber-900/30">
                    <span className="text-slate-600 dark:text-slate-400">Hưởng thọ:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {target.death_year - target.birth_year} tuổi ({target.birth_year} – {target.death_year})
                    </span>
                  </div>
                )}

                {target.burial_location && (
                  <div className="flex items-start gap-2 pt-1 border-t border-amber-200/40 dark:border-amber-900/30">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      Mộ phần: <span className="text-slate-900 dark:text-slate-200">{target.burial_location}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. SECTION: PHẢ KÝ & CÔNG TRẠNG (NOTES) */}
          {target.notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Scroll className="w-3.5 h-3.5 text-emerald-600" />
                Phả Ký & Ghi Chú
              </h3>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs leading-relaxed italic">
                "{target.notes}"
              </div>
            </div>
          )}

          {/* 4. SECTION: MẠNG LƯỚI THÂN TỘC 1 ĐỜI */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Thân Tộc Trực Hệ 1 Đời
            </h3>

            {/* A. Bố mẹ */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{KINSHIP_TERMS.PARENTS}:</span>
              <div className="grid grid-cols-2 gap-2">
                <RelativeCard
                  label={KINSHIP_TERMS.FATHER}
                  member={familyData?.parents.father}
                  onClick={() => familyData?.parents.father && onSelectMember(familyData.parents.father.id)}
                />
                <RelativeCard
                  label={KINSHIP_TERMS.MOTHER}
                  member={familyData?.parents.mother}
                  onClick={() => familyData?.parents.mother && onSelectMember(familyData.parents.mother.id)}
                />
              </div>
            </div>

            {/* B. Hôn phối */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500" /> {KINSHIP_TERMS.SPOUSE} ({familyData?.spouses.length || 0}):
                </span>
                {onAddSpouse && target && (
                  <button
                    type="button"
                    onClick={() => onAddSpouse(target)}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3 h-3" /> + Thêm phối ngẫu
                  </button>
                )}
              </div>
              {familyData && familyData.spouses.length > 0 ? (
                <div className="space-y-1.5">
                  {familyData.spouses.map(({ member, relation }, idx) => {
                    const roleLabel =
                      member.gender === 'male'
                        ? KINSHIP_TERMS.HUSBAND_DEFAULT
                        : relation.marriage_order === 1
                        ? KINSHIP_TERMS.WIFE_FIRST
                        : relation.marriage_order === 2
                        ? KINSHIP_TERMS.WIFE_SECOND
                        : relation.marriage_order === 3
                        ? KINSHIP_TERMS.WIFE_THIRD
                        : KINSHIP_TERMS.WIFE_DEFAULT;
                    return (
                      <div
                        key={member.id}
                        onClick={() => onSelectMember(member.id)}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600/60 bg-white dark:bg-slate-900 cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="text-xs text-slate-400 font-medium mr-1.5">{roleLabel}:</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {member.full_name}
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">{KINSHIP_TERMS.EMPTY_SPOUSE}</p>
              )}
            </div>

            {/* C. Anh em ruột */}
            {familyData && familyData.siblings.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {KINSHIP_TERMS.SIBLINGS_FULL} ({familyData.siblings.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {familyData.siblings.map((sib) => (
                    <button
                      key={sib.id}
                      onClick={() => onSelectMember(sib.id)}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors border border-transparent hover:border-emerald-200"
                    >
                      {sib.full_name} {sib.birth_order ? `(#${sib.birth_order})` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* D. Con cái */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {KINSHIP_TERMS.CHILDREN} ({familyData?.children.length || 0}):
                </span>
                {onAddChild && target && (
                  <button
                    type="button"
                    onClick={() => onAddChild(target)}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <UserPlus className="w-3 h-3" /> + Thêm con
                  </button>
                )}
              </div>
              {familyData && familyData.children.length > 0 ? (
                familyData.childrenGroups && familyData.childrenGroups.length > 1 ? (
                  <div className="space-y-3">
                    {familyData.childrenGroups.map((grp, gIdx) => {
                      const groupTitle =
                        grp.marriageOrder === 1
                          ? `Con với bà ${grp.motherName} (${KINSHIP_TERMS.WIFE_FIRST} - ${grp.children.length} người)`
                          : grp.marriageOrder === 2
                          ? `Con với bà ${grp.motherName} (${KINSHIP_TERMS.WIFE_SECOND} - ${grp.children.length} người)`
                          : grp.motherId
                          ? `Con với bà ${grp.motherName} (${grp.children.length} người)`
                          : `Chưa rõ thông tin mẹ (${grp.children.length} người)`;

                      return (
                        <div
                          key={grp.motherId || `group-unknown-${gIdx}`}
                          className="space-y-1.5 pl-2.5 border-l-2 border-purple-300 dark:border-purple-800"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                              <span>{grp.motherId ? '🌸' : '❓'}</span> {groupTitle}
                            </p>
                            {onAddChild && target && (
                              <button
                                type="button"
                                onClick={() => onAddChild(target, grp.motherId)}
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                              >
                                <UserPlus className="w-3 h-3" /> + Thêm con
                              </button>
                            )}
                          </div>
                          <div className="space-y-1">
                            {grp.children.map((child, cIdx) => {
                              const chAge = child.birth_year ? calculateMemberAge(child.birth_year, child.death_year, child.life_status) : null;
                              return (
                                <div
                                  key={child.id}
                                  onClick={() => onSelectMember(child.id)}
                                  className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                                      {child.birth_order || cIdx + 1}
                                    </span>
                                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                      {child.full_name}
                                    </span>
                                    {child.is_senior && (
                                      <span className="text-[10px] text-amber-600 font-semibold">({KINSHIP_TERMS.SENIOR_CHILD})</span>
                                    )}
                                    {chAge && chAge.solarAge !== null && (
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                        <span>· SN {child.birth_year} ({chAge.solarAge}t · {chAge.lunarAge} mụ)</span>
                                        <span title={chAge.tooltipText} className="cursor-help inline-flex items-center text-slate-400 hover:text-slate-600">
                                          <Info className="w-3 h-3" />
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {familyData.children.map((child, cIdx) => {
                      const chAge = child.birth_year ? calculateMemberAge(child.birth_year, child.death_year, child.life_status) : null;
                      return (
                        <div
                          key={child.id}
                          onClick={() => onSelectMember(child.id)}
                          className="flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-emerald-400 bg-slate-50/50 dark:bg-slate-900/40 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                              {child.birth_order || cIdx + 1}
                            </span>
                            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                              {child.full_name}
                            </span>
                            {child.is_senior && (
                              <span className="text-[10px] text-amber-600 font-semibold">({KINSHIP_TERMS.SENIOR_CHILD})</span>
                            )}
                            {chAge && chAge.solarAge !== null && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-0.5">
                                <span>· SN {child.birth_year} ({chAge.solarAge}t · {chAge.lunarAge} mụ)</span>
                                <span title={chAge.tooltipText} className="cursor-help inline-flex items-center text-slate-400 hover:text-slate-600">
                                  <Info className="w-3 h-3" />
                                </span>
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <p className="text-xs text-slate-400 italic">{KINSHIP_TERMS.EMPTY_CHILDREN}</p>
              )}
            </div>
          </div>
        </div>

        {/* POPUP XÁC NHẬN XÓA THÀNH VIÊN AN TOÀN (Safe Delete RESTRICT) */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 max-w-sm w-full border border-rose-200 dark:border-rose-800 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Xác nhận xóa hồ sơ</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Bạn có chắc chắn muốn xóa hồ sơ thành viên <strong>{target.full_name}</strong> khỏi cây gia phả?
                Hành động này không thể hoàn tác.
              </p>
              {deleteError && (
                <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                  {deleteError}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={async () => {
                    try {
                      setIsDeleting(true);
                      setDeleteError(null);
                      if (onDeleteMember) {
                        await onDeleteMember(target.id);
                      }
                      setShowDeleteConfirm(false);
                      onClose();
                    } catch (err: any) {
                      setDeleteError(err.message || 'Lỗi khi xóa thành viên');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Action Bar */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center gap-2">
          {onEditMember && target && (
            <button
              onClick={() => onEditMember(target)}
              className="flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" /> Sửa hồ sơ
            </button>
          )}

          {onSetFocusRoot && (
            <button
              onClick={() => onSetFocusRoot(target.id)}
              className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
            >
              <Compass className="w-3.5 h-3.5" /> Đặt làm Gốc
            </button>
          )}

          <Link
            href={`/kinship?from=${target.id}`}
            className="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-blue-600" /> Tra cứu xưng hô
          </Link>

          {onDeleteMember && target && (
            <button
              type="button"
              disabled={!deleteCheck.canDelete || isDeleting}
              onClick={() => {
                setDeleteError(null);
                setShowDeleteConfirm(true);
              }}
              title={deleteCheck.reason || 'Xóa hồ sơ thành viên (chỉ áp dụng cho thành viên không có con cái)'}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                deleteCheck.canDelete
                  ? 'bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/60 shadow-sm'
                  : 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa hồ sơ</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

interface RelativeCardProps {
  label: string;
  member?: MemberRecord;
  onClick?: () => void;
}

const RelativeCard: React.FC<RelativeCardProps> = ({ label, member, onClick }) => {
  if (!member) {
    return (
      <div className="p-2.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
        <span className="font-semibold">{label}:</span> <em>Chưa có dữ liệu</em>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-emerald-400 bg-white dark:bg-slate-900 cursor-pointer transition-colors flex items-center justify-between"
    >
      <div className="truncate">
        <span className="text-[11px] text-slate-400 font-medium block">{label}</span>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
          {member.full_name}
        </span>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
    </div>
  );
};
