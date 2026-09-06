'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  User,
  Calendar,
  Heart,
  AlertTriangle,
  Check,
  Link2,
  ShieldAlert,
  Users,
  Baby,
  Plus,
  Trash2,
  Clock,
  MapPin,
  FileText,
  Lock,
  Info,
} from 'lucide-react';
import { MemberRecord, SpouseRelationRecord, MemberFormData, Gender, LifeStatus } from '@/types/tree';
import { validateNoCycle, detectConsanguinity, validateParentChildAge } from '@/lib/tree-layout/graph-validation';
import { KINSHIP_TERMS } from '@/constants/kinship-terms';

export interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<MemberRecord> | null;
  mode: 'create' | 'edit';
  defaultRole?: 'child' | 'spouse' | 'root';
  parentMember?: MemberRecord | null;
  fixedMotherId?: string | null;
  currentSpouse?: MemberRecord | null;
  allMembers: MemberRecord[];
  allSpouses: SpouseRelationRecord[];
  onSaved: (
    member: MemberRecord,
    newSpouse?: MemberRecord,
    newSpouseRelation?: any,
    clearedBirthOrderId?: string | null,
    demotedSeniorId?: string | null
  ) => void;
}

const CAN_CHI_YEARS = [
  'Giáp Tý', 'Ất Sửu', 'Bính Dần', 'Đinh Mão', 'Mậu Thìn', 'Kỷ Tỵ',
  'Canh Ngọ', 'Tân Mùi', 'Nhâm Thân', 'Quý Dậu', 'Giáp Tuất', 'Ất Hợi',
  'Bính Tý', 'Đinh Sửu', 'Mậu Dần', 'Kỷ Mão', 'Canh Thìn', 'Tân Tỵ',
  'Nhâm Ngọ', 'Quý Mùi', 'Giáp Thân', 'Ất Dậu', 'Bính Tuất', 'Đinh Hợi',
  'Mậu Tý', 'Kỷ Sửu', 'Canh Dần', 'Tân Mão', 'Nhâm Thìn', 'Quý Tỵ',
  'Canh Tý', 'Tân Sửu', 'Nhâm Dần', 'Quý Mão', 'Giáp Thìn', 'Ất Tỵ',
  'Bính Ngọ', 'Đinh Mùi', 'Mậu Thân', 'Kỷ Dậu', 'Canh Tuất', 'Tân Hợi',
  'Nhâm Tý', 'Quý Sửu', 'Giáp Dần', 'Ất Mão', 'Bính Thìn', 'Đinh Tỵ',
  'Mậu Ngọ', 'Kỷ Mùi', 'Canh Thân', 'Tân Dậu', 'Nhâm Tuất', 'Quý Hợi',
];

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  mode,
  defaultRole = 'child',
  parentMember,
  fixedMotherId,
  currentSpouse,
  allMembers,
  allSpouses,
  onSaved,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal xác nhận chuyển quyền Con Trưởng
  const [showSeniorConfirmModal, setShowSeniorConfirmModal] = useState(false);
  const [existingSeniorName, setExistingSeniorName] = useState('');

  // Chuyên biệt hóa Thêm phối ngẫu: Ngoại tộc vs Nội tộc
  const [spouseOrigin, setSpouseOrigin] = useState<'external' | 'internal'>('external');
  const [marriageOrder, setMarriageOrder] = useState<number>(1);

  // 1. Định danh cơ bản
  const [fullName, setFullName] = useState('');
  const [aliasName, setAliasName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [lifeStatus, setLifeStatus] = useState<LifeStatus>('living');
  const [birthYear, setBirthYear] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');

  // 2. Thân tộc trực hệ
  const [fatherId, setFatherId] = useState<string>('');
  const [motherId, setMotherId] = useState<string>('');
  const [birthOrder, setBirthOrder] = useState<number>(1);
  const [isSenior, setIsSenior] = useState(false);
  const [isAdopted, setIsAdopted] = useState(false);
  const [isRoot, setIsRoot] = useState(false);

  // 3. Phối ngẫu (Vợ / Chồng)
  const [spouseMode, setSpouseMode] = useState<'none' | 'new' | 'existing'>('none');
  const [newSpouseName, setNewSpouseName] = useState('');
  const [newSpouseBirthYear, setNewSpouseBirthYear] = useState('');
  const [newSpouseMarriageOrder, setNewSpouseMarriageOrder] = useState<number>(1);
  const [spouseId, setSpouseId] = useState<string>('');

  // 4. Hậu duệ (Con cái)
  const [selectedChildIdsToLink, setSelectedChildIdsToLink] = useState<string[]>([]);
  const [showAddChildInline, setShowAddChildInline] = useState(false);
  const [quickChildName, setQuickChildName] = useState('');
  const [quickChildGender, setQuickChildGender] = useState<Gender>('male');
  const [quickChildBirthYear, setQuickChildBirthYear] = useState('');
  const [stagedQuickChildren, setStagedQuickChildren] = useState<
    Array<{ id: string; name: string; gender: Gender; birthYear?: string }>
  >([]);

  // 5. Ngày mất & Lịch giỗ Âm lịch
  const [deathLunarDay, setDeathLunarDay] = useState<string>('');
  const [deathLunarMonth, setDeathLunarMonth] = useState<string>('');
  const [deathLunarIsLeap, setDeathLunarIsLeap] = useState(false);
  const [deathLunarYearName, setDeathLunarYearName] = useState('');
  const [deathYear, setDeathYear] = useState<string>('');
  const [burialLocation, setBurialLocation] = useState('');

  // 6. Tiểu sử & Ghi chú
  const [notes, setNotes] = useState('');

  // Khởi tạo form khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    setErrorMessage(null);
    setShowAddChildInline(false);
    setStagedQuickChildren([]);
    setSelectedChildIdsToLink([]);

    if (mode === 'edit' && initialData) {
      setFullName(initialData.full_name || '');
      setAliasName(initialData.alias_name || '');
      setGender(initialData.gender || 'male');
      setLifeStatus(initialData.life_status || 'living');
      setBirthYear(initialData.birth_year ? String(initialData.birth_year) : '');
      setBirthDate(initialData.birth_date || '');
      setDeathLunarDay(initialData.death_lunar_day ? String(initialData.death_lunar_day) : '');
      setDeathLunarMonth(initialData.death_lunar_month ? String(initialData.death_lunar_month) : '');
      setDeathLunarIsLeap(!!initialData.death_lunar_is_leap);
      setDeathLunarYearName(initialData.death_lunar_year_name || '');
      setDeathYear(initialData.death_year ? String(initialData.death_year) : '');
      setBurialLocation(initialData.burial_location || '');
      setFatherId(initialData.father_id || '');
      setMotherId(initialData.mother_id || '');
      setBirthOrder(initialData.birth_order || 1);
      setIsSenior(!!initialData.is_senior);
      setIsAdopted(!!initialData.is_adopted);
      setIsRoot(!!initialData.is_root);
      setNotes(initialData.notes || '');

      // Tìm phối ngẫu hiện tại nếu có
      const existingRel = allSpouses.find(
        (s) => s.member_a_id === initialData.id || s.member_b_id === initialData.id
      );
      if (existingRel) {
        const partnerId = existingRel.member_a_id === initialData.id ? existingRel.member_b_id : existingRel.member_a_id;
        setSpouseId(partnerId);
        setSpouseMode('existing');
      } else {
        setSpouseId('');
        setSpouseMode('none');
      }
      setNewSpouseName('');
      setNewSpouseBirthYear('');
    } else {
      // Chế độ Create mới
      setFullName('');
      setAliasName('');
      setLifeStatus('living');
      setBirthYear('');
      setBirthDate('');
      setDeathLunarDay('');
      setDeathLunarMonth('');
      setDeathLunarIsLeap(false);
      setDeathLunarYearName('');
      setDeathYear('');
      setBurialLocation('');
      setIsAdopted(false);
      setIsRoot(defaultRole === 'root');
      setNotes('');
      setShowSeniorConfirmModal(false);
      setExistingSeniorName('');

      if (defaultRole === 'spouse' && currentSpouse) {
        const autoGender = currentSpouse.gender === 'male' ? 'female' : 'male';
        setGender(autoGender);
        const existingSpouseRels = allSpouses.filter(
          (s) => s.member_a_id === currentSpouse.id || s.member_b_id === currentSpouse.id
        );
        setMarriageOrder(existingSpouseRels.length + 1);
        setSpouseOrigin('external');
        setSpouseId(currentSpouse.id);
        setSpouseMode('none');
        setFatherId('');
        setMotherId('');
        setBirthOrder(1);
        setIsSenior(false);
      } else if (defaultRole === 'child' && parentMember) {
        setGender('male');
        setIsSenior(false);
        setSpouseMode('none');
        setSpouseId('');

        if (parentMember.gender === 'male') {
          setFatherId(parentMember.id);
          const siblings = allMembers.filter((m) => m.father_id === parentMember.id);
          const maxOrder = siblings.reduce((max, s) => Math.max(max, s.birth_order || 0), 0);
          setBirthOrder(maxOrder + 1);

          if (fixedMotherId) {
            setMotherId(fixedMotherId);
          } else {
            const spouseRels = allSpouses.filter(
              (s) => s.member_a_id === parentMember.id || s.member_b_id === parentMember.id
            );
            if (spouseRels.length === 1) {
              const mId =
                spouseRels[0].member_a_id === parentMember.id
                  ? spouseRels[0].member_b_id
                  : spouseRels[0].member_a_id;
              setMotherId(mId);
            } else {
              setMotherId('');
            }
          }
        } else {
          setMotherId(parentMember.id);
          setFatherId('');
          const siblings = allMembers.filter((m) => m.mother_id === parentMember.id);
          const maxOrder = siblings.reduce((max, s) => Math.max(max, s.birth_order || 0), 0);
          setBirthOrder(maxOrder + 1);
        }
      } else {
        setGender('male');
        setFatherId('');
        setMotherId('');
        setBirthOrder(1);
        setIsSenior(false);
        setSpouseMode('none');
        setSpouseId('');
      }

      setNewSpouseName('');
      setNewSpouseBirthYear('');
    }
  }, [isOpen, mode, initialData, defaultRole, parentMember, fixedMotherId, currentSpouse, allMembers, allSpouses]);

  // Danh sách các bà vợ của cha để chọn Mẹ ruột (Đa thê)
  const availableMothers = useMemo(() => {
    if (!fatherId) return [];
    const spouseRels = allSpouses.filter(
      (s) => s.member_a_id === fatherId || s.member_b_id === fatherId
    );
    const motherIds = spouseRels.map((s) => (s.member_a_id === fatherId ? s.member_b_id : s.member_a_id));
    return allMembers.filter((m) => motherIds.includes(m.id));
  }, [fatherId, allSpouses, allMembers]);

  // Kiểm tra năm sinh sinh học giữa con và bố mẹ
  const ageValidation = useMemo(() => {
    if (!birthYear) return { isValid: true, error: null, warning: null };
    const childYear = Number(birthYear);
    if (isNaN(childYear)) return { isValid: true, error: null, warning: null };

    if (fatherId) {
      const father = allMembers.find((m) => m.id === fatherId);
      if (father && father.birth_year) {
        try {
          const check = validateParentChildAge(childYear, father.birth_year, 'Bố', father.full_name);
          if (check.warning) {
            return {
              isValid: true,
              error: null,
              warning: check.warning,
            };
          }
        } catch (err: unknown) {
          return {
            isValid: false,
            error: err instanceof Error ? err.message : `Năm sinh của con (${childYear}) không thể trước hoặc bằng năm sinh của Bố ${father.full_name} (${father.birth_year}).`,
            warning: null,
          };
        }
      }
    }

    if (motherId) {
      const mother = allMembers.find((m) => m.id === motherId);
      if (mother && mother.birth_year) {
        try {
          const check = validateParentChildAge(childYear, mother.birth_year, 'Mẹ', mother.full_name);
          if (check.warning) {
            return {
              isValid: true,
              error: null,
              warning: check.warning,
            };
          }
        } catch (err: unknown) {
          return {
            isValid: false,
            error: err instanceof Error ? err.message : `Năm sinh của con (${childYear}) không thể trước hoặc bằng năm sinh của Mẹ ${mother.full_name} (${mother.birth_year}).`,
            warning: null,
          };
        }
      }
    }

    return { isValid: true, error: null, warning: null };
  }, [birthYear, fatherId, motherId, allMembers]);

  // Xử lý chuyển quyền Con Trưởng có popup cảnh báo nếu đã có người nhận
  const handleToggleSenior = (checked: boolean) => {
    if (!checked) {
      setIsSenior(false);
      return;
    }

    const currentId = initialData?.id || '';
    const siblings = (fatherId || motherId)
      ? allMembers.filter(
          (m) =>
            m.id !== currentId &&
            ((fatherId && m.father_id === fatherId) || (motherId && m.mother_id === motherId))
        )
      : [];

    const existingSenior = siblings.find((s) => s.is_senior);
    if (existingSenior) {
      setExistingSeniorName(existingSenior.full_name);
      setShowSeniorConfirmModal(true);
      return;
    }

    setIsSenior(true);
  };

  // Danh sách con cái hiện có của người này (nếu đang ở chế độ edit)
  const existingChildren = useMemo(() => {
    if (mode !== 'edit' || !initialData?.id) return [];
    return allMembers.filter(
      (m) => m.father_id === initialData.id || m.mother_id === initialData.id
    );
  }, [mode, initialData, allMembers]);

  // Danh sách các thành viên chưa nối / mồ côi có thể nhận làm con
  const unlinkedCandidates = useMemo(() => {
    const currentId = initialData?.id;
    return allMembers.filter((m) => {
      if (m.id === currentId) return false;
      if (m.father_id || m.is_root) return false;
      // Tránh gán chính cha/mẹ hoặc con đã có
      if (m.id === fatherId || m.id === motherId) return false;
      return true;
    });
  }, [allMembers, initialData, fatherId, motherId]);

  // Kiểm tra Hôn nhân nội tộc
  const consanguinityCheck = useMemo(() => {
    if (spouseMode !== 'existing' || !spouseId) return null;
    const targetId = mode === 'edit' && initialData?.id ? initialData.id : null;
    if (!targetId) return null;
    return detectConsanguinity(targetId, spouseId, allMembers);
  }, [spouseMode, spouseId, mode, initialData, allMembers]);

  // Kiểm tra chu trình lặp (Cycle Check)
  const cycleWarning = useMemo(() => {
    if (mode !== 'edit' || !initialData?.id) return null;
    const targetParentId = fatherId || motherId;
    if (!targetParentId) return null;

    try {
      validateNoCycle(initialData.id, targetParentId, allMembers);
      return null;
    } catch (err: any) {
      return err.message || 'Phát hiện vòng lặp cha-con!';
    }
  }, [mode, initialData, fatherId, motherId, allMembers]);

  if (!isOpen) return null;

  // Thêm nhanh con tạm thời vào danh sách
  const handleAddQuickChild = () => {
    if (!quickChildName.trim()) return;
    setStagedQuickChildren((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        name: quickChildName.trim(),
        gender: quickChildGender,
        birthYear: quickChildBirthYear || undefined,
      },
    ]);
    setQuickChildName('');
    setQuickChildBirthYear('');
    setShowAddChildInline(false);
  };

  const handleRemoveStagedChild = (id: string) => {
    setStagedQuickChildren((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleChildLink = (childId: string) => {
    setSelectedChildIdsToLink((prev) =>
      prev.includes(childId) ? prev.filter((id) => id !== childId) : [...prev, childId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trường hợp kết hôn nội tộc: Cả 2 thành viên đã tồn tại trong CSDL -> Chỉ tạo quan hệ hôn phối (Single Record Policy)
    if (defaultRole === 'spouse' && spouseOrigin === 'internal') {
      if (!spouseId) {
        setErrorMessage('Vui lòng chọn một thành viên trong dòng họ để kết hôn nội tộc.');
        return;
      }
      if (!currentSpouse) {
        setErrorMessage('Thiếu thông tin người phối ngẫu.');
        return;
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const res = await fetch('/api/spouse-relations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_a_id: currentSpouse.gender === 'male' ? currentSpouse.id : spouseId,
            member_b_id: currentSpouse.gender === 'male' ? spouseId : currentSpouse.id,
            marriage_order: marriageOrder || 1,
            marriage_status: 'married',
          }),
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Tạo quan hệ hôn phối nội tộc không thành công');
        }

        const internalMember = allMembers.find((m) => m.id === spouseId) || currentSpouse;
        onSaved(internalMember, undefined, result.relation);
        onClose();
      } catch (err: any) {
        setErrorMessage(err.message || 'Đã xảy ra lỗi khi tạo quan hệ hôn phối nội tộc');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!fullName.trim()) {
      setErrorMessage('Họ và Tên không được để trống.');
      return;
    }

    if (cycleWarning) {
      setErrorMessage(cycleWarning);
      return;
    }

    if (ageValidation.error) {
      setErrorMessage(ageValidation.error);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const effectiveSpouseId =
      defaultRole === 'spouse'
        ? (spouseOrigin === 'external' ? (currentSpouse?.id || null) : (spouseId || null))
        : (spouseMode === 'existing' && spouseId ? spouseId : null);

    const effectiveFatherId =
      defaultRole === 'spouse' && spouseOrigin === 'external'
        ? null
        : (fatherId || null);

    const effectiveMotherId =
      defaultRole === 'spouse' && spouseOrigin === 'external'
        ? null
        : (motherId || null);

    const effectiveBirthOrder =
      defaultRole === 'spouse' && spouseOrigin === 'external'
        ? 1
        : (birthOrder || 1);

    const effectiveIsSenior =
      defaultRole === 'spouse' && spouseOrigin === 'external'
        ? false
        : isSenior;

    const effectiveMarriageOrder =
      defaultRole === 'spouse'
        ? (marriageOrder || 1)
        : (newSpouseMarriageOrder || 1);

    const formData: MemberFormData = {
      id: mode === 'edit' && initialData?.id ? initialData.id : undefined,
      full_name: fullName.trim(),
      alias_name: aliasName.trim() || null,
      gender,
      life_status: lifeStatus,
      birth_year: birthYear ? Number(birthYear) : null,
      birth_date: birthDate || null,
      death_lunar_day: lifeStatus === 'deceased' && deathLunarDay ? Number(deathLunarDay) : null,
      death_lunar_month: lifeStatus === 'deceased' && deathLunarMonth ? Number(deathLunarMonth) : null,
      death_lunar_is_leap: lifeStatus === 'deceased' ? deathLunarIsLeap : false,
      death_lunar_year_name: lifeStatus === 'deceased' && deathLunarYearName.trim() ? deathLunarYearName.trim() : null,
      death_year: lifeStatus === 'deceased' && deathYear ? Number(deathYear) : null,
      father_id: effectiveFatherId,
      mother_id: effectiveMotherId,
      birth_order: effectiveBirthOrder,
      is_senior: effectiveIsSenior,
      is_adopted: isAdopted,
      is_root: isRoot,
      burial_location: lifeStatus === 'deceased' && burialLocation.trim() ? burialLocation.trim() : null,
      notes: notes.trim() || null,
      spouse_id: effectiveSpouseId,
      new_spouse_name: defaultRole !== 'child' && spouseMode === 'new' && newSpouseName.trim() ? newSpouseName.trim() : null,
      new_spouse_birth_year: defaultRole !== 'child' && spouseMode === 'new' && newSpouseBirthYear ? Number(newSpouseBirthYear) : null,
      new_spouse_gender: gender === 'male' ? 'female' : 'male',
      marriage_order: effectiveMarriageOrder,
      child_ids_to_link: defaultRole === 'spouse' && spouseOrigin === 'external' ? [] : selectedChildIdsToLink,
    };

    try {
      const url = mode === 'edit' && initialData?.id ? `/api/members/${initialData.id}` : '/api/members';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Thao tác không thành công');
      }

      // Nếu có tạo thêm con nhanh dạng staged children
      if (stagedQuickChildren.length > 0) {
        const savedParentId = result.member.id;
        for (let i = 0; i < stagedQuickChildren.length; i++) {
          const child = stagedQuickChildren[i];
          await fetch('/api/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              full_name: child.name,
              gender: child.gender,
              birth_year: child.birthYear ? Number(child.birthYear) : null,
              father_id: gender === 'male' ? savedParentId : null,
              mother_id: gender === 'female' ? savedParentId : null,
              birth_order: (existingChildren.length || 0) + i + 1,
            }),
          });
        }
      }

      onSaved(
        result.member,
        result.newSpouse,
        result.newSpouseRelation,
        result.clearedBirthOrderId,
        result.demotedSeniorId
      );
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã xảy ra lỗi khi lưu thông tin');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* POPUP XÁC NHẬN CHUYỂN GIAO CON TRƯỞNG */}
        {showSeniorConfirmModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 max-w-sm w-full border border-amber-300 dark:border-amber-700 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Xác nhận chuyển quyền {KINSHIP_TERMS.SENIOR_CHILD}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hiện tại <strong>{existingSeniorName}</strong> đang được ghi nhận là {KINSHIP_TERMS.SENIOR_CHILD} trong gia đình.
                Nếu bạn tiếp tục, danh hiệu {KINSHIP_TERMS.SENIOR_CHILD} của <strong>{existingSeniorName}</strong> sẽ tự động được thu hồi và trao cho thành viên này.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSeniorConfirmModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSenior(true);
                    setShowSeniorConfirmModal(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm"
                >
                  Xác nhận chuyển
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TẦNG 1: FIXED HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {mode === 'edit'
                ? `Chỉnh Sửa Hồ Sơ: ${initialData?.full_name || 'Thành viên'}`
                : defaultRole === 'child' && parentMember
                ? `Thêm Con Cho: ${parentMember.full_name}`
                : defaultRole === 'spouse' && currentSpouse
                ? `Thêm Phối Ngẫu Cho: ${currentSpouse.full_name}`
                : 'Thêm Thành Viên Mới'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Hệ thống phả hệ phẳng 1 cấp, quản lý đa thê và ưu tiên ngày giỗ âm lịch
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CẢNH BÁO LỖI / CHU TRÌNH */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2.5 text-rose-800 dark:text-rose-200 text-xs shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {cycleWarning && (
          <div className="mx-6 mt-3 p-3 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-amber-800 dark:text-amber-200 text-xs shrink-0">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{cycleWarning}</span>
          </div>
        )}

        {consanguinityCheck?.isConsanguineous && (
          <div className="mx-6 mt-3 p-3 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-start gap-2.5 text-purple-800 dark:text-purple-200 text-xs shrink-0">
            <Link2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>{consanguinityCheck.message}</span>
          </div>
        )}

        {/* TẦNG 2: SCROLLABLE FORM BODY (Refined Modern Heritage) */}
        <form
          id="member-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-900 dark:text-slate-100 scrollbar-thin"
        >
          {/* KHỐI CỐ ĐỊNH 1: ĐỐI TÁC HÔN PHỐI (DÀNH CHO FORM THÊM PHỐI NGẪU) */}
          {defaultRole === 'spouse' && currentSpouse && (
            <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 block">
                      Người phối ngẫu [🔒 Cố định]:
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {currentSpouse.full_name} ({currentSpouse.gender === 'male' ? KINSHIP_TERMS.HUSBAND_DEFAULT : KINSHIP_TERMS.WIFE_DEFAULT}, Đời {currentSpouse.generation_level})
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Thứ bậc:</span>
                  <select
                    value={marriageOrder}
                    onChange={(e) => setMarriageOrder(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-xs"
                  >
                    <option value={1}>{currentSpouse.gender === 'male' ? KINSHIP_TERMS.WIFE_FIRST : KINSHIP_TERMS.HUSBAND_FIRST} (#1)</option>
                    <option value={2}>{currentSpouse.gender === 'male' ? KINSHIP_TERMS.WIFE_SECOND : KINSHIP_TERMS.HUSBAND_SECOND} (#2)</option>
                    <option value={3}>{currentSpouse.gender === 'male' ? KINSHIP_TERMS.WIFE_THIRD : 'Chồng ba'} (#3)</option>
                    <option value={4}>Thứ tư (#4)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSpouseOrigin('external')}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    spouseOrigin === 'external'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🌸 {currentSpouse.gender === 'male' ? KINSHIP_TERMS.CLAN_EXTERNAL_BRIDE : KINSHIP_TERMS.CLAN_EXTERNAL_GROOM}
                </button>
                <button
                  type="button"
                  onClick={() => setSpouseOrigin('internal')}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    spouseOrigin === 'internal'
                      ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🔗 {currentSpouse.gender === 'male' ? KINSHIP_TERMS.CLAN_INTERNAL_BRIDE : KINSHIP_TERMS.CLAN_INTERNAL_GROOM}
                </button>
              </div>

              {spouseOrigin === 'internal' && (
                <div className="pt-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 text-xs">
                    Chọn người trong họ để kết hôn nội tộc:
                  </label>
                  <select
                    value={spouseId}
                    onChange={(e) => {
                      setSpouseId(e.target.value);
                      const m = allMembers.find((item) => item.id === e.target.value);
                      if (m) {
                        setFullName(m.full_name);
                        setGender(m.gender);
                        setBirthYear(m.birth_year ? String(m.birth_year) : '');
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="">-- Chọn thành viên trong dòng họ --</option>
                    {allMembers
                      .filter((m) => m.id !== currentSpouse.id && m.gender !== currentSpouse.gender)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.gender === 'male' ? 'Nam' : 'Nữ'}, Đời {m.generation_level})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {defaultRole === 'spouse' && spouseOrigin === 'internal' ? (
            <div className="p-4 rounded-lg bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
              <div className="flex items-center gap-2 text-purple-800 dark:text-purple-300 font-bold text-xs">
                <Info className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Chế độ Hôn nhân nội tộc (Single Record Policy)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Thành viên được chọn đã tồn tại trong CSDL gia phả. Khi lưu, hệ thống chỉ tạo liên kết hôn phối (Spouse Relation) và hiển thị Ghost Node 🔗 trên phả đồ mà không nhân bản bản ghi thành viên.
              </p>
              {spouseId ? (
                <div className="text-xs space-y-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-purple-200/70 dark:border-purple-800/60 text-slate-700 dark:text-slate-300">
                  <div>• <strong>Người phối ngẫu đã chọn:</strong> {allMembers.find((m) => m.id === spouseId)?.full_name}</div>
                  <div>• <strong>Giới tính:</strong> {allMembers.find((m) => m.id === spouseId)?.gender === 'male' ? 'Nam' : 'Nữ'}</div>
                  <div>• <strong>Thế hệ:</strong> Đời thứ {allMembers.find((m) => m.id === spouseId)?.generation_level}</div>
                  <div>• <strong>Thứ bậc hôn phối:</strong> #{marriageOrder}</div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  ⚠️ Vui lòng chọn một thành viên từ danh sách ở trên để tiếp tục.
                </p>
              )}
            </div>
          ) : (
            <>
          {/* KHỐI CỐ ĐỊNH 2: BỐ MẸ (DÀNH CHO FORM THÊM CON) */}
          {defaultRole === 'child' && parentMember && (
            <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold text-blue-800 dark:text-blue-300 block">
                    {parentMember.gender === 'male' ? KINSHIP_TERMS.FATHER_FULL : KINSHIP_TERMS.MOTHER_FULL} [🔒 Cố định]:
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {parentMember.full_name} (Đời {parentMember.generation_level})
                  </span>
                </div>
              </div>

              {/* Thông tin Mẹ ruột (nếu Bố là parentMember) */}
              {parentMember.gender === 'male' && (
                fixedMotherId ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                    <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <div>
                      <span className="text-[10px] font-semibold text-purple-800 dark:text-purple-300 block">
                        {KINSHIP_TERMS.MOTHER_FULL} [🔒 Cố định theo nhánh]:
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {allMembers.find((m) => m.id === fixedMotherId)?.full_name || 'Đã chọn'}
                      </span>
                    </div>
                  </div>
                ) : availableMothers.length > 1 ? (
                  <div className="pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1 text-xs">
                      {KINSHIP_TERMS.MOTHER_FULL} <span className="text-amber-600 font-bold">(Bố có {availableMothers.length} người vợ)</span>:
                    </label>
                    <select
                      value={motherId}
                      onChange={(e) => setMotherId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                    >
                      <option value="">-- Chưa rõ / Khuyết mẹ --</option>
                      {availableMothers.map((m, idx) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({idx === 0 ? KINSHIP_TERMS.WIFE_FIRST : idx === 1 ? KINSHIP_TERMS.WIFE_SECOND : KINSHIP_TERMS.WIFE_THIRD})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : availableMothers.length === 1 ? (
                  <div className="flex items-center gap-2 pt-2 border-t border-blue-200/50 dark:border-blue-800/50">
                    <span className="text-[10px] font-semibold text-slate-500 block">
                      {KINSHIP_TERMS.MOTHER_FULL}:
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {availableMothers[0].full_name}
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic pt-1">Bố chưa có thông tin phối ngẫu trong gia phả</p>
                )
              )}
            </div>
          )}

          {/* KHỐI 1: ĐỊNH DANH & THỜI ĐIỂM SINH */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              1. ĐỊNH DANH & THỜI ĐIỂM SINH
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Họ và Tên (<span className="text-rose-500">*</span>)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Nam"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-colors"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Tên húy / Tên tự / Bí danh
                </label>
                <input
                  type="text"
                  value={aliasName}
                  onChange={(e) => setAliasName(e.target.value)}
                  placeholder="VD: Trọng, Bá, Hiệu..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-colors"
                />
              </div>
            </div>

            {/* Giới tính: Pill Buttons Chuẩn Hình Học */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Giới tính (<span className="text-rose-500">*</span>)
              </label>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    gender === 'male'
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">♂</span> Nam
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    gender === 'female'
                      ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-600 text-rose-700 dark:text-rose-300 shadow-sm ring-1 ring-rose-600'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="text-sm">♀</span> Nữ
                </button>
                <button
                  type="button"
                  onClick={() => setGender('other')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    gender === 'other'
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-600 text-slate-800 dark:text-slate-200 shadow-sm ring-1 ring-slate-600'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>⚪</span> Khác
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Năm sinh (Dương lịch)
                </label>
                <input
                  type="number"
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="VD: 1985"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-colors"
                />
                {ageValidation.error && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{ageValidation.error}</span>
                  </p>
                )}
                {ageValidation.warning && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{ageValidation.warning}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Ngày tháng năm sinh đầy đủ
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* KHỐI 2: THÂN TỘC & THỨ BẬC GIA ĐÌNH (Ẩn khi là dâu/rể ngoại tộc) */}
          {!(defaultRole === 'spouse' && spouseOrigin === 'external') && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                2. {KINSHIP_TERMS.PARENTS.toUpperCase()} & THỨ BẬC GIA ĐÌNH
              </h4>

              {defaultRole !== 'child' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      {KINSHIP_TERMS.FATHER_FULL}
                    </label>
                    <select
                      value={fatherId}
                      onChange={(e) => setFatherId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-colors"
                    >
                      <option value="">-- Chưa rõ / Không có --</option>
                      {allMembers
                        .filter((m) => m.gender === 'male' && m.id !== initialData?.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.full_name} (Đời {m.generation_level})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      {KINSHIP_TERMS.MOTHER_FULL} {availableMothers.length > 1 && <span className="text-amber-600 font-bold">(Đa thê)</span>}
                    </label>
                    <select
                      value={motherId}
                      onChange={(e) => setMotherId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10 dark:focus:ring-slate-100/10 transition-colors"
                    >
                      <option value="">-- Chưa rõ / Khuyết mẹ --</option>
                      {availableMothers.length > 0
                        ? availableMothers.map((m, idx) => (
                            <option key={m.id} value={m.id}>
                              {m.full_name} ({idx === 0 ? KINSHIP_TERMS.WIFE_FIRST : idx === 1 ? KINSHIP_TERMS.WIFE_SECOND : KINSHIP_TERMS.WIFE_THIRD})
                            </option>
                          ))
                        : allMembers
                            .filter((m) => m.gender === 'female' && m.id !== initialData?.id)
                            .map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name} (Đời {m.generation_level})
                              </option>
                            ))}
                    </select>
                    {availableMothers.length > 1 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                        Bố có {availableMothers.length} người vợ. Hãy chọn chính xác Mẹ ruột để phân nhóm con cái chuẩn xác.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Vị trí con thứ mấy & Phân loại */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <label className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">
                    Thứ tự sinh:
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={birthOrder}
                      onChange={(e) => setBirthOrder(Number(e.target.value))}
                      className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-center focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10"
                    />
                    <span className="text-slate-500 dark:text-slate-400 text-xs">
                      (Con thứ mấy trong gia đình cha mẹ)
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isSenior}
                      onChange={(e) => handleToggleSenior(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-amber-700 dark:text-amber-400 text-xs">
                      ⭐ {KINSHIP_TERMS.SENIOR_CHILD} (Trưởng nam / Trưởng nữ)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isAdopted}
                      onChange={(e) => setIsAdopted(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-purple-700 dark:text-purple-400 text-xs">
                      {KINSHIP_TERMS.ADOPTED_CHILD} / Dưỡng tử
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* KHỐI 3: PHỐI NGẪU (VỢ / CHỒNG) - Chỉ hiển thị trong chế độ chung hoặc edit */}
          {defaultRole !== 'child' && defaultRole !== 'spouse' && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                3. {KINSHIP_TERMS.SPOUSE.toUpperCase()} (VỢ / CHỒNG)
              </h4>

              {/* Segmented Control 3 Phân Đoạn Chuẩn Hình Học */}
              <div className="flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setSpouseMode('none')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                    spouseMode === 'none'
                      ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Chưa ghép / Độc thân
                </button>
                <button
                  type="button"
                  onClick={() => setSpouseMode('new')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                    spouseMode === 'new'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800'
                  }`}
                >
                  + Thêm Vợ/Chồng ngoài họ
                </button>
                <button
                  type="button"
                  onClick={() => setSpouseMode('existing')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${
                    spouseMode === 'existing'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'text-purple-700 dark:text-purple-400 hover:text-purple-800'
                  }`}
                >
                  Ghép người trong họ (Nội tộc)
                </button>
              </div>

              {/* Chế độ 1: Thêm Vợ/Chồng Mới Ngoài Tộc Tại Chỗ */}
              {spouseMode === 'new' && (
                <div className="p-4 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Họ và Tên Vợ/Chồng mới ngoài tộc (<span className="text-rose-500">*</span>)
                      </label>
                      <input
                        type="text"
                        value={newSpouseName}
                        onChange={(e) => setNewSpouseName(e.target.value)}
                        placeholder="VD: Lê Thị Mai (Dâu ngoài tộc)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                        Năm sinh
                      </label>
                      <input
                        type="number"
                        value={newSpouseBirthYear}
                        onChange={(e) => setNewSpouseBirthYear(e.target.value)}
                        placeholder="VD: 1992"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                    <span>
                      Giới tính phối ngẫu tự suy luận ngược chiều: <strong className="text-emerald-700 dark:text-emerald-400">{gender === 'male' ? KINSHIP_TERMS.CLAN_EXTERNAL_BRIDE : KINSHIP_TERMS.CLAN_EXTERNAL_GROOM}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Thứ bậc:</span>
                      <select
                        value={newSpouseMarriageOrder}
                        onChange={(e) => setNewSpouseMarriageOrder(Number(e.target.value))}
                        className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value={1}>{KINSHIP_TERMS.WIFE_FIRST} / {KINSHIP_TERMS.HUSBAND_FIRST}</option>
                        <option value={2}>{KINSHIP_TERMS.WIFE_SECOND} (Bà hai)</option>
                        <option value={3}>{KINSHIP_TERMS.WIFE_THIRD} (Bà ba)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Chế độ 2: Ghép với Thành Viên Trong Họ (Nội Tộc) */}
              {spouseMode === 'existing' && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Chọn người phối ngẫu trong dòng họ
                  </label>
                  <select
                    value={spouseId}
                    onChange={(e) => setSpouseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 focus:ring-1 focus:ring-slate-900/10"
                  >
                    <option value="">-- Chọn thành viên --</option>
                    {allMembers
                      .filter((m) => m.id !== initialData?.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.full_name} ({m.gender === 'male' ? 'Nam' : 'Nữ'}, Đời {m.generation_level})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* KHỐI 4: CON CÁI (Ẩn khi là dâu/rể ngoại tộc) */}
          {!(defaultRole === 'spouse' && spouseOrigin === 'external') && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  4. {KINSHIP_TERMS.CHILDREN.toUpperCase()}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddChildInline(!showAddChildInline)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm nhanh con mới
                </button>
              </div>

              {/* Danh sách con đã có trong CSDL */}
              {existingChildren.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Con hiện có trong gia phả ({existingChildren.length} người):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {existingChildren.map((c, idx) => (
                      <div
                        key={c.id}
                        className="p-2.5 rounded-md bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                            {c.birth_order || idx + 1}
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.full_name}</span>
                          <span className="text-[10px] text-slate-400">
                            ({c.gender === 'male' ? 'Nam' : c.gender === 'female' ? 'Nữ' : 'Khác'}{c.birth_year ? `, ${c.birth_year}` : ''})
                          </span>
                        </div>
                        {c.is_senior && <span className="text-[10px] font-bold text-amber-600">({KINSHIP_TERMS.SENIOR_CHILD})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Danh sách con thêm nhanh chuẩn bị lưu */}
              {stagedQuickChildren.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    Con mới thêm nhanh (sẽ tạo kèm cùng hồ sơ):
                  </p>
                  <div className="space-y-1.5">
                    {stagedQuickChildren.map((sc, idx) => (
                      <div
                        key={sc.id}
                        className="p-2.5 rounded-md bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Con #{existingChildren.length + idx + 1}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{sc.name}</span>
                          <span className="text-[10px] text-slate-500">
                            ({sc.gender === 'male' ? 'Nam' : sc.gender === 'female' ? 'Nữ' : 'Khác'}{sc.birthYear ? `, ${sc.birthYear}` : ''})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedChild(sc.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Input thêm nhanh con: 3 nút Giới tính Nam / Nữ / Khác */}
              {showAddChildInline && (
                <div className="p-3.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={quickChildName}
                        onChange={(e) => setQuickChildName(e.target.value)}
                        placeholder="Họ và tên con..."
                        className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={quickChildBirthYear}
                        onChange={(e) => setQuickChildBirthYear(e.target.value)}
                        placeholder="Năm sinh..."
                        className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium text-xs">Giới tính con:</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setQuickChildGender('male')}
                          className={`px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
                            quickChildGender === 'male'
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300 ring-1 ring-blue-600'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          ♂ Nam
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickChildGender('female')}
                          className={`px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
                            quickChildGender === 'female'
                              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-600 text-rose-700 dark:text-rose-300 ring-1 ring-rose-600'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          ♀ Nữ
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickChildGender('other')}
                          className={`px-3 py-1 rounded-md border text-xs font-semibold transition-all ${
                            quickChildGender === 'other'
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-600 text-slate-800 dark:text-slate-200 ring-1 ring-slate-600'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          ⚪ Khác
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddChildInline(false)}
                        className="px-3 py-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleAddQuickChild}
                        className="px-3 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors"
                      >
                        Thêm vào danh sách
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Chọn con từ danh sách mồ côi / chưa nối */}
              {unlinkedCandidates.length > 0 && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    🔗 Hoặc nhận con từ danh sách thành viên chưa nối phả:
                  </p>
                  <div className="max-h-28 overflow-y-auto space-y-1 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 scrollbar-thin">
                    {unlinkedCandidates.map((cand) => {
                      const isSelected = selectedChildIdsToLink.includes(cand.id);
                      return (
                        <label
                          key={cand.id}
                          className="flex items-center justify-between p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleChildLink(cand.id)}
                              className="w-3.5 h-3.5 rounded text-emerald-600"
                            />
                            <span className="font-medium text-slate-800 dark:text-slate-200">{cand.full_name}</span>
                            <span className="text-[10px] text-slate-400">({cand.gender === 'male' ? 'Nam' : cand.gender === 'female' ? 'Nữ' : 'Khác'})</span>
                          </div>
                          <span className="text-[10px] text-amber-600 font-medium">Chưa có cha mẹ</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KHỐI 5: TRẠNG THÁI SINH - TỬ & NGÀY GIỖ ÂM LỊCH */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              5. TRẠNG THÁI SINH - TỬ & NGÀY GIỖ
            </h4>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                Trạng thái hiện tại
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setLifeStatus('living')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    lifeStatus === 'living'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-700 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-600'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>🌱</span> Còn sống
                </button>
                <button
                  type="button"
                  onClick={() => setLifeStatus('deceased')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    lifeStatus === 'deceased'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-600 text-amber-800 dark:text-amber-200 shadow-sm ring-1 ring-amber-600'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>†</span> Đã mất
                </button>
              </div>
            </div>

            {/* Dynamic Disclosure */}
            {lifeStatus === 'deceased' && (
              <div className="p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Quy ước gia phả: Ưu tiên ngày và tháng mất Âm lịch để quét lịch giỗ chính xác hàng năm.</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Ngày mất (Âm)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={deathLunarDay}
                      onChange={(e) => setDeathLunarDay(e.target.value)}
                      placeholder="1 - 30"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Tháng mất (Âm)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={deathLunarMonth}
                      onChange={(e) => setDeathLunarMonth(e.target.value)}
                      placeholder="1 - 12"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div className="col-span-2 flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deathLunarIsLeap}
                        onChange={(e) => setDeathLunarIsLeap(e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        Tháng nhuận Âm lịch
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Năm Can Chi khi mất
                    </label>
                    <input
                      list="can-chi-list"
                      value={deathLunarYearName}
                      onChange={(e) => setDeathLunarYearName(e.target.value)}
                      placeholder="VD: Canh Tý, Ất Mão..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                    />
                    <datalist id="can-chi-list">
                      {CAN_CHI_YEARS.map((y) => (
                        <option key={y} value={y} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Năm mất (Dương lịch - Tùy chọn)
                    </label>
                    <input
                      type="number"
                      value={deathYear}
                      onChange={(e) => setDeathYear(e.target.value)}
                      placeholder="VD: 1985"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Vị trí an táng / Khu mộ
                  </label>
                  <input
                    type="text"
                    value={burialLocation}
                    onChange={(e) => setBurialLocation(e.target.value)}
                    placeholder="VD: Nghĩa trang Cây Gạo, Lô B..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* KHỐI 6: TIỂU SỬ & CÔNG TRẠNG */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              6. TIỂU SỬ & CÔNG TRẠNG
            </h4>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chép công đức, chức vụ, hoàn cảnh lịch sử, đóng góp cho dòng họ..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-slate-900"
            />
          </div>
            </>
          )}
        </form>

        {/* TẦNG 3: STICKY FOOTER */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 flex items-center justify-end gap-3 backdrop-blur-sm shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="member-form"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Đang lưu...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>
                  {mode === 'edit'
                    ? 'Cập nhật hồ sơ'
                    : defaultRole === 'spouse' && spouseOrigin === 'internal'
                    ? 'Tạo liên kết nội tộc'
                    : 'Lưu thành viên'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
