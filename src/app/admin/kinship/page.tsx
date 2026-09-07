'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Save,
  RotateCcw,
  Sparkles,
  Search,
  X,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getRegionalPresetDictionary } from '@/lib/kinship-engine/regional-dictionaries';
import type { KinshipTermRule, CustomKinshipDictionary, KinshipRegion } from '@/types/kinship';

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

export default function AdminKinshipPage() {
  const [region, setRegion] = useState<KinshipRegion>('north');
  const [rules, setRules] = useState<KinshipTermRule[]>(() => getRegionalPresetDictionary('north'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadKinshipSettings() {
      try {
        const res = await fetch('/api/clan-settings');
        if (res.ok) {
          const json = await res.json();
          const loadedRegion: KinshipRegion = json.data?.default_kinship_region || 'north';
          setRegion(loadedRegion);

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
        console.error('Failed to load kinship settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadKinshipSettings();
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
      }! Bấm "Lưu Quy Ước Xưng Hô" để lưu vào cơ sở dữ liệu.`,
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
          default_kinship_region: region,
          custom_kinship_dictionary,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu Quy Ước Xưng Hô thành công! Dữ liệu đã đồng bộ sang công cụ Tra Cứu Vai Vế.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: json.error || 'Có lỗi xảy ra khi lưu quy ước xưng hô.',
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage({ type: 'error', text: 'Không thể kết nối máy chủ. Vui lòng thử lại.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Đang nạp từ điển Quy Ước Xưng Hô...</span>
        </div>
      </div>
    );
  }

  const regionNameLabel =
    region === 'north' ? 'Miền Bắc' : region === 'central' ? 'Miền Trung' : 'Miền Nam';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Quy Ước Xưng Hô & Từ Điển Dòng Họ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Cấu hình mẫu vùng miền và tùy biến trực tiếp từng mối quan hệ bên Nội, bên Ngoại, Dâu, Rể theo tập quán gia tộc.
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Region Presets Selector */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            1. Chọn Mẫu Vùng Miền Làm Chuẩn Cơ Sở:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* North */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                region === 'north'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Miền Bắc</span>
                  <input
                    type="radio"
                    name="region"
                    value="north"
                    checked={region === 'north'}
                    onChange={() => handleRegionSelect('north')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Tôn trọng thứ bậc chi trưởng/thứ (*&quot;Bé bằng củ khoai, cứ vai Bác là gọi Bác&quot;*). Xưng hô Bác, Chú, Cô, Thím.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 mt-3 block">
                Khuyên dùng cho họ gốc Bắc
              </span>
            </label>

            {/* Central */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                region === 'central'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Miền Trung</span>
                  <input
                    type="radio"
                    name="region"
                    value="central"
                    checked={region === 'central'}
                    onChange={() => handleRegionSelect('central')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Cách gọi Ba, Mạ, Bác, Chú, O, Thím, Dượng theo truyền thống miền Trung.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-3 block">
                Phong tục Miền Trung
              </span>
            </label>

            {/* South */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                region === 'south'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Miền Nam</span>
                  <input
                    type="radio"
                    name="region"
                    value="south"
                    checked={region === 'south'}
                    onChange={() => handleRegionSelect('south')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Xưng hô theo tuổi đời kết hợp nhánh họ (Anh Hai, Chị Ba, Ba/Má, Chú Út, Thím...).
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-3 block">
                Phong tục Nam Bộ
              </span>
            </label>
          </div>
        </div>

        {/* Kinship Table & Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Danh Mục 32+ Mối Quan Hệ (Chỉnh Sửa Trực Tiếp):</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Đầy đủ bên Nội, bên Ngoại, Bác dâu, Bác rể, Thím, Cậu, Mợ, Dì, Dượng và Dâu/Rể các đời.
              </p>
            </div>

            <button
              type="button"
              id="reset-preset-btn"
              onClick={handleResetToPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Khôi phục chuẩn {regionNameLabel}</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="search-relation-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhanh quan hệ hoặc danh xưng (VD: Thím, Mợ, Dượng, Dâu, Rể, Cậu...)"
                  className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex-shrink-0 px-1">
                {filteredRules.length} / {rules.length} quan hệ
              </div>
            </div>

            {/* Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
                <Filter className="w-3 h-3" />
                Nhóm:
              </span>
              {FILTER_CHIPS.map((chip) => {
                const isActive = activeCategoryFilter === chip.id;
                const count =
                  chip.id === 'all'
                    ? rules.length
                    : rules.filter((r) => r.category === chip.id).length;

                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setActiveCategoryFilter(chip.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                    <span
                      className={`text-[10px] px-1 rounded-full ${
                        isActive
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            {filteredRules.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Không tìm thấy mối quan hệ nào khớp với từ khóa &quot;{searchQuery}&quot;.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategoryFilter('all');
                  }}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Xóa bộ lọc & hiển thị tất cả
                </button>
              </div>
            ) : (
              CATEGORY_GROUPS.map((group) => {
                const groupRules = filteredRules.filter((r) => r.category === group.key);
                if (groupRules.length === 0) return null;

                return (
                  <div
                    key={group.key}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/40 shadow-xs"
                  >
                    <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{group.icon}</span>
                        <span className="text-xs font-black tracking-wide text-slate-800 dark:text-slate-200 uppercase">
                          {group.title}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {groupRules.length}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                        {group.desc}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {groupRules.map((rule) => (
                        <div
                          key={rule.id}
                          className="p-3 sm:p-4 hover:bg-white dark:hover:bg-slate-850/60 transition-colors grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                        >
                          <div className="sm:col-span-4">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                              {rule.name}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              {rule.context}
                            </span>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              Bề trên gọi Bề dưới:
                            </label>
                            <input
                              type="text"
                              value={rule.termJunior}
                              onChange={(e) => handleRuleChange(rule.id, 'termJunior', e.target.value)}
                              placeholder="VD: Con, Cháu, Em"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                              Bề dưới gọi Bề trên:
                            </label>
                            <input
                              type="text"
                              value={rule.termSenior}
                              onChange={(e) => handleRuleChange(rule.id, 'termSenior', e.target.value)}
                              placeholder="VD: Bác, Chú, Thím"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="sm:col-span-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
                            {rule.note || 'Theo phong tục'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Quay Về
          </Link>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-emerald-700/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Quy Ước Xưng Hô</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
