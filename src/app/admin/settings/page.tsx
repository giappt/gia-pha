'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  BookOpen,
  RotateCcw,
  Sparkles,
  Search,
  X,
  Filter,
  GitBranch,
} from 'lucide-react';
import { getRegionalPresetDictionary } from '@/lib/kinship-engine/regional-dictionaries';
import type { KinshipTermRule, CustomKinshipDictionary, KinshipRegion } from '@/types/kinship';
import type { BranchNode } from '@/types/database';
import type { MemberRecord } from '@/types/tree';
import BranchTaxonomyManager from '@/components/admin/BranchTaxonomyManager';

const CATEGORY_GROUPS: {
  key: KinshipTermRule['category'];
  title: string;
  desc: string;
  icon: string;
}[] = [
  {
    key: 'direct',
    title: 'I. QUAN HỆ TRỰC HỆ (NỘI & NGOẠI)',
    desc: 'Quan hệ huyết thống trực hệ (Cha, Mẹ, Ông, Bà nội/ngoại, Cụ, Kỵ)',
    icon: '🏛️',
  },
  {
    key: 'same_gen',
    title: 'II. CÙNG THẾ HỆ & DÂU / RỂ NGANG HÀNG',
    desc: 'Anh chị em ruột, con chú con bác, chị dâu, anh rể, em dâu, em rể',
    icon: '👥',
  },
  {
    key: 'paternal_uncle_aunt',
    title: 'III. BẬC BÁC / CHÚ / CÔ & PHU THÊ (BÊN NỘI)',
    desc: 'Bác trai, Bác dâu, Bác gái, Bác rể, Chú, Thím, Cô, Dượng bên nội',
    icon: '🤝',
  },
  {
    key: 'maternal_uncle_aunt',
    title: 'IV. BẬC BÁC / CẬU / DÌ & PHU THÊ (BÊN NGOẠI)',
    desc: 'Bác ngoại, Bác dâu ngoại, Cậu, Mợ, Dì, Dượng bên ngoại',
    icon: '🌸',
  },
  {
    key: 'in_law_descendant',
    title: 'V. DÂU / RỂ THẾ HỆ CON & CHÁU',
    desc: 'Con dâu, Con rể, Cháu dâu, Cháu rể trong gia tộc',
    icon: '💍',
  },
  {
    key: 'grand_collateral',
    title: 'VI. HỌ HÀNG LỆCH ĐỜI (ÔNG HỌ, BÀ HỌ)',
    desc: 'Quan hệ họ hàng cách 2 thế hệ trong cùng dòng tộc',
    icon: '🌿',
  },
];

const FILTER_CHIPS = [
  { id: 'all', label: 'Tất Cả', icon: '📋' },
  { id: 'direct', label: 'Trực Hệ', icon: '🏛️' },
  { id: 'same_gen', label: 'Cùng Đời & Dâu Rể', icon: '👥' },
  { id: 'paternal_uncle_aunt', label: 'Bên Nội (Bác/Chú/Cô)', icon: '🤝' },
  { id: 'maternal_uncle_aunt', label: 'Bên Ngoại (Cậu/Dì)', icon: '🌸' },
  { id: 'in_law_descendant', label: 'Dâu / Rể Con Cháu', icon: '💍' },
  { id: 'grand_collateral', label: 'Họ Hàng Lệch Đời', icon: '🌿' },
];

export default function ClanSettingsPage() {
  const [activeTab, setActiveTab] = useState<'branches' | 'info_kinship'>('branches');
  const [clanName, setClanName] = useState('');
  const [rootAncestorId, setRootAncestorId] = useState<string>('');
  const [region, setRegion] = useState<KinshipRegion>('north');
  const [rules, setRules] = useState<KinshipTermRule[]>(() => getRegionalPresetDictionary('north'));
  const [branches, setBranches] = useState<BranchNode[]>([]);
  const [branchTiers, setBranchTiers] = useState<string[]>(['Ngành', 'Chi', 'Nhánh', 'Phái']);
  const [allMembers, setAllMembers] = useState<MemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/clan-settings');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.clan_name) {
            setClanName(json.data.clan_name);
          }
          if (json.data?.root_ancestor_id) {
            setRootAncestorId(json.data.root_ancestor_id);
          }
          const loadedRegion: KinshipRegion = json.data?.default_kinship_region || 'north';
          setRegion(loadedRegion);

          if (json.data?.branches && Array.isArray(json.data.branches)) {
            setBranches(json.data.branches);
          }
          if (json.data?.branch_tiers && Array.isArray(json.data.branch_tiers) && json.data.branch_tiers.length > 0) {
            setBranchTiers(json.data.branch_tiers);
          }

          const basePreset = getRegionalPresetDictionary(loadedRegion);
          const customDict = json.data?.custom_kinship_dictionary as CustomKinshipDictionary | undefined;

          if (customDict && Object.keys(customDict).length > 0) {
            setRules(
              basePreset.map((r) => ({
                ...r,
                termSenior: customDict[r.id]?.termSenior || r.termSenior,
                termJunior: customDict[r.id]?.termJunior || r.termJunior,
              }))
            );
          } else {
            setRules(basePreset);
          }
        }
      } catch (err) {
        console.error('Failed to load clan settings:', err);
      }

      try {
        const memRes = await fetch('/api/members');
        if (memRes.ok) {
          const memJson = await memRes.json();
          if (Array.isArray(memJson.members)) {
            setAllMembers(memJson.members);
          }
        }
      } catch (err) {
        console.warn('Failed to load members for root member selection:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleRegionSelect = (newRegion: KinshipRegion) => {
    setRegion(newRegion);
    const newPreset = getRegionalPresetDictionary(newRegion);
    setRules(newPreset);
  };

  const handleRuleChange = (ruleId: string, field: 'termSenior' | 'termJunior', value: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, [field]: value } : r))
    );
  };

  const handleResetToPreset = () => {
    const basePreset = getRegionalPresetDictionary(region);
    setRules(basePreset);
    setStatusMessage({
      type: 'success',
      text: `Đã khôi phục danh mục từ điển về mẫu chuẩn ${
        region === 'north' ? 'Miền Bắc' : region === 'central' ? 'Miền Trung' : 'Miền Nam'
      }! Bấm "Lưu Thay Đổi" để lưu vào cơ sở dữ liệu.`,
    });
  };

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchesCategory = activeCategoryFilter === 'all' || r.category === activeCategoryFilter;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        r.name.toLowerCase().includes(q) ||
        r.context.toLowerCase().includes(q) ||
        r.termSenior.toLowerCase().includes(q) ||
        r.termJunior.toLowerCase().includes(q) ||
        (r.note && r.note.toLowerCase().includes(q))
      );
    });
  }, [rules, activeCategoryFilter, searchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const trimmed = clanName.trim();
    if (trimmed.length < 2) {
      setStatusMessage({ type: 'error', text: 'Tên dòng họ phải có ít nhất 2 ký tự.' });
      return;
    }
    if (trimmed.length > 40) {
      setStatusMessage({ type: 'error', text: 'Tên dòng họ không được vượt quá 40 ký tự để tránh vỡ giao diện.' });
      return;
    }

    setIsSaving(true);
    try {
      const custom_kinship_dictionary: CustomKinshipDictionary = {};
      rules.forEach((r) => {
        custom_kinship_dictionary[r.id] = {
          termSenior: r.termSenior.trim(),
          termJunior: r.termJunior.trim(),
        };
      });

      const res = await fetch('/api/clan-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clan_name: trimmed,
          root_ancestor_id: rootAncestorId || null,
          default_kinship_region: region,
          custom_kinship_dictionary,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setClanName(json.data.clan_name);
        if (json.data.root_ancestor_id !== undefined) {
          setRootAncestorId(json.data.root_ancestor_id || '');
        }
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu cài đặt dòng họ và từ điển xưng hô thành công!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: json.error || 'Có lỗi xảy ra khi lưu cài đặt.',
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ. Vui lòng thử lại.' });
    } finally {
      setIsSaving(false);
    }
  };

  const charCount = clanName.length;
  const isTooLong = charCount > 40;
  const isNearLimit = charCount >= 35 && charCount <= 40;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Đang tải thông tin cài đặt...</span>
        </div>
      </div>
    );
  }

  const regionNameLabel =
    region === 'north' ? 'Miền Bắc' : region === 'central' ? 'Miền Trung' : 'Miền Nam';

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Cài Đặt Thông Tin Dòng Họ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Cấu hình tên dòng họ toàn cục, bộ từ điển xưng hô chi tiết 32 quan hệ và quy ước phả hệ.
            </p>
          </div>
        </div>
      </div>

      {/* Flat Segmented Tab Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          id="tab-btn-branches"
          onClick={() => setActiveTab('branches')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'branches'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Cấu Trúc Ngành/Chi</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              activeTab === 'branches'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {branches.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-info"
          onClick={() => setActiveTab('info_kinship')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'info_kinship'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Thông Tin & Xưng Hô</span>
        </button>
      </div>

      {activeTab === 'branches' ? (
        <BranchTaxonomyManager
          initialBranches={branches}
          initialTiers={branchTiers}
          allMembers={allMembers}
          onBranchesSaved={(updated, updatedTiers) => {
            setBranches(updated);
            if (updatedTiers) setBranchTiers(updatedTiers);
          }}
        />
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {/* Card 1: Clan Name Setting */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Tên Dòng Họ (Tiêu Đề Trang Chủ)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hiển thị trang trọng tại vị trí nổi bật nhất ở trang chủ và trên thanh điều hướng.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="clan-name-input" className="font-semibold text-slate-700 dark:text-slate-300">
                  Nhập tên dòng họ:
                </label>
                <span
                  id="char-counter"
                  className={`font-semibold text-xs transition-colors ${
                    isTooLong
                      ? 'text-rose-600'
                      : isNearLimit
                      ? 'text-amber-600'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {charCount} / 40 ký tự
                </span>
              </div>

              <input
                id="clan-name-input"
                type="text"
                value={clanName}
                onChange={(e) => setClanName(e.target.value)}
                maxLength={40}
                placeholder="Ví dụ: DÒNG HỌ NGUYỄN VĂN"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-base font-bold tracking-tight focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            {/* Live Preview Box */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>MÔ PHỎNG HIỂN THỊ THỰC TẾ TRÊN TRANG CHỦ:</span>
              </div>

              <div className="rounded-xl p-6 bg-radial-gradient from-emerald-500/10 via-slate-50 to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-950 border border-slate-200/60 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold tracking-widest text-emerald-700 dark:text-emerald-400 uppercase">
                  HỆ THỐNG PHẢ HỆ TRỰC TUYẾN
                </span>
                <h3
                  id="preview-clan-name"
                  className={`font-black tracking-tight text-emerald-950 dark:text-emerald-50 mt-1 uppercase text-balance break-words ${
                    clanName.length > 25 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'
                  }`}
                >
                  {clanName.trim() || 'DÒNG HỌ NGUYỄN VĂN'}
                </h3>
              </div>
            </div>
          </div>

          {/* Card: Root Ancestor Setting */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-amber-500 text-base">✨</span>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cụ Thủy Tổ Của Dòng Họ (Gốc Phả Hệ Toàn Cục)
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chỉ định vị Cụ Thủy Tổ duy nhất của toàn bộ dòng họ. Người được chọn sẽ mang huy hiệu <strong>✨ Cụ Tổ</strong> trên cây phả hệ, và toàn bộ thế hệ con cháu cũng như dâu/rể sẽ tự động suy diễn bậc đời dựa theo Cụ.
              </p>
            </div>

            <div className="space-y-3">
              <label htmlFor="root-ancestor-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Chọn Cụ Thủy Tổ (Gốc Cây):
              </label>

              <select
                id="root-ancestor-select"
                value={rootAncestorId}
                onChange={(e) => setRootAncestorId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              >
                <option value="">-- Tự động xác định Cụ cao nhất theo đồ thị --</option>
                {allMembers
                  .filter((m) => !m.is_anonymous)
                  .sort((a, b) => (a.generation_level || 99) - (b.generation_level || 99))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} {m.generation_level ? `(Đời ${m.generation_level})` : ''} {m.birth_year ? `• Sinh năm ${m.birth_year}` : ''} {m.gender === 'female' ? '• Nữ' : '• Nam'}
                    </option>
                  ))}
              </select>

              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <span>💡</span>
                  <span>Quy tắc suy diễn thế hệ tự động:</span>
                </p>
                <p className="text-[11px] text-amber-700/90 dark:text-amber-300/80 pl-5">
                  • Cụ Thủy Tổ được thiết lập là <strong>Đời 1</strong>.<br />
                  • Con cái tự động nhận đời bằng <strong>Đời của Cha/Mẹ + 1</strong>.<br />
                  • Dâu / Rể (phối ngẫu) tự động nhận <strong>cùng đời</strong> với bạn đời huyết thống, và hiển thị danh xưng phù hợp (Bà cả / Bà hai / Phu thê) thay vì bị gán nhầm là Cụ Tổ.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Kinship Region Setting & Structured Dictionary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Từ Điển Xưng Hô Dòng Họ Toàn Diện & Quy Ước Vùng Miền</span>
              </h2>
            </div>

            {/* Region Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                1. Chọn Vùng Miền Làm Chuẩn Cơ Sở:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['north', 'central', 'south'] as KinshipRegion[]).map((r) => (
                  <label
                    key={r}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      region === r
                        ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">
                        {r === 'north' ? 'Miền Bắc' : r === 'central' ? 'Miền Trung' : 'Miền Nam'}
                      </span>
                      <input
                        type="radio"
                        name="region"
                        value={r}
                        checked={region === r}
                        onChange={() => handleRegionSelect(r)}
                        className="accent-emerald-600"
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Kinship Table */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>2. Danh Mục 32+ Mối Quan Hệ:</span>
                </h3>

                <button
                  type="button"
                  id="reset-preset-btn"
                  onClick={handleResetToPreset}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Khôi phục chuẩn {regionNameLabel}</span>
                </button>
              </div>

              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {FILTER_CHIPS.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveCategoryFilter(chip.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeCategoryFilter === chip.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>

              {/* Rules List */}
              <div className="space-y-4">
                {CATEGORY_GROUPS.map((group) => {
                  const groupRules = filteredRules.filter((r) => r.category === group.key);
                  if (groupRules.length === 0) return null;

                  return (
                    <div
                      key={group.key}
                      className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/40"
                    >
                      <div className="px-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2">
                        <span>{group.icon}</span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
                          {group.title}
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {groupRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="p-3 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                          >
                            <div className="sm:col-span-4 font-bold text-slate-900 dark:text-slate-100">
                              {rule.name}
                            </div>
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                value={rule.termJunior}
                                onChange={(e) => handleRuleChange(rule.id, 'termJunior', e.target.value)}
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                              />
                            </div>
                            <div className="sm:col-span-4">
                              <input
                                type="text"
                                value={rule.termSenior}
                                onChange={(e) => handleRuleChange(rule.id, 'termSenior', e.target.value)}
                                className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-700 dark:text-emerald-300"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="save-settings-btn"
              type="submit"
              disabled={isSaving || isTooLong}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
