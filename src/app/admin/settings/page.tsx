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
  ExternalLink,
  BookOpen,
  RotateCcw,
  Sparkles,
  Search,
  X,
  Filter,
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

export default function ClanSettingsPage() {
  const [clanName, setClanName] = useState('');
  const [region, setRegion] = useState<KinshipRegion>('north');
  const [rules, setRules] = useState<KinshipTermRule[]>(() => getRegionalPresetDictionary('north'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bộ lọc & Tìm kiếm quan hệ
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
        console.error('Failed to load clan settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Thay đổi vùng miền chuẩn cơ sở
  const handleRegionSelect = (newRegion: KinshipRegion) => {
    setRegion(newRegion);
    const newPreset = getRegionalPresetDictionary(newRegion);
    setRules(newPreset);
  };

  // Cập nhật từng ô danh xưng
  const handleRuleChange = (ruleId: string, field: 'termSenior' | 'termJunior', value: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, [field]: value } : r))
    );
  };

  // Khôi phục chuẩn theo vùng miền đang chọn
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

  // Lọc danh sách quy tắc theo phân nhóm và từ khóa tìm kiếm
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
      // Đóng gói từ điển tùy biến
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
          default_kinship_region: region,
          custom_kinship_dictionary,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setClanName(json.data.clan_name);
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu cài đặt dòng họ và từ điển xưng hô thành công! Dữ liệu đã đồng bộ sang trang Tra Cứu Vai Vế.',
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

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-sm animate-in fade-in duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 flex items-center justify-between">
            <span>{statusMessage.text}</span>
            {statusMessage.type === 'success' && (
              <Link
                href="/kinship"
                className="inline-flex items-center gap-1 ml-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 underline hover:no-underline"
              >
                <span>Xem Trang Tra Cứu</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Clan Name Setting */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
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

            <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Giới hạn tối đa <strong>40 ký tự</strong> để tránh tràn khung và giữ nguyên tỷ lệ thẩm mỹ trên điện thoại di động.</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Hỗ trợ chữ hoa, chữ thường tiếng Việt có dấu, số và dấu phân cách (Ví dụ: <em>Gia tộc Trần Lê (Chi 2)</em>).</span>
              </p>
            </div>
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
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto line-clamp-1">
                Nền tảng số hóa gia phả trực tuyến hiện đại. Kết nối mọi thế hệ con cháu...
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Kinship Region Setting & Structured Dictionary */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>Từ Điển Xưng Hô Dòng Họ Toàn Diện & Quy Ước Vùng Miền</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Chọn mẫu vùng miền và tùy biến trực tiếp từng mối quan hệ bên Nội, bên Ngoại, Dâu, Rể theo tập quán riêng của gia tộc.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2.1: Region Presets Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
              1. Chọn Vùng Miền Làm Chuẩn Cơ Sở:
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
                    Tôn trọng thứ bậc chi trưởng/thứ (*&quot;Bé bằng củ khoai, cứ vai Bác là gọi Bác&quot;*). Xưng hô Bố, Mẹ, Bác, Chú, Cô, Thím.
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
                    Cách gọi Ba, Mạ, Bác, Chú, O, Thím, Dượng theo truyền thống khu vực Bắc & Nam Trung Bộ.
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
                    Xưng hô linh hoạt theo tuổi đời kết hợp nhánh họ (Anh Hai, Chị Ba, Ba/Má, Chú Út, Thím, Dượng...).
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-3 block">
                  Phong tục Nam Bộ
                </span>
              </label>
            </div>
          </div>

          {/* Section 2.2: Detailed Structured Kinship Dictionary Table with Filter Chips & Search */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
            {/* Header & Quick Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>2. Danh Mục Chi Tiết 32+ Mối Quan Hệ (Có Thể Chỉnh Sửa Trực Tiếp):</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Bao gồm đầy đủ bên Nội, bên Ngoại, Bác dâu, Bác rể, Thím, Cậu, Mợ, Dì, Dượng và Dâu/Rể các đời.
                </p>
              </div>

              <button
                type="button"
                id="reset-preset-btn"
                onClick={handleResetToPreset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors self-start sm:self-auto cursor-pointer"
                title={`Đặt lại danh xưng về mẫu mặc định của ${regionNameLabel}`}
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Khôi phục chuẩn {regionNameLabel}</span>
              </button>
            </div>

            {/* Quick Search & Category Filter Chips Toolbar */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              {/* Search Box */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="search-relation-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nhanh theo tên quan hệ hoặc danh xưng (VD: Thím, Mợ, Dượng, Dâu, Rể, Cậu...)"
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

              {/* Group Filter Chips */}
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
                      id={`filter-chip-${chip.id}`}
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

            {/* Render Category Groups */}
            <div className="space-y-6">
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
                    className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
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
                      {/* Group Header */}
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

                      {/* Table of Relationships in Group */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {groupRules.map((rule) => (
                          <div
                            key={rule.id}
                            className="p-3 sm:p-4 hover:bg-white dark:hover:bg-slate-850/60 transition-colors grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                          >
                            {/* Col 1: Relationship Name & Context (4 cols) */}
                            <div className="sm:col-span-4">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                                {rule.name}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                {rule.context}
                              </span>
                            </div>

                            {/* Col 2: Senior calls Junior (A -> B) (3 cols) */}
                            <div className="sm:col-span-3">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                Bề trên gọi Bề dưới:
                              </label>
                              <input
                                type="text"
                                id={`rule-${rule.id}-junior`}
                                value={rule.termJunior}
                                onChange={(e) => handleRuleChange(rule.id, 'termJunior', e.target.value)}
                                placeholder="VD: Con, Cháu, Em"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>

                            {/* Col 3: Junior calls Senior (B -> A) (3 cols) */}
                            <div className="sm:col-span-3">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                                Bề dưới gọi Bề trên:
                              </label>
                              <input
                                type="text"
                                id={`rule-${rule.id}-senior`}
                                value={rule.termSenior}
                                onChange={(e) => handleRuleChange(rule.id, 'termSenior', e.target.value)}
                                placeholder="VD: Bố, Mẹ, Bác, Chú, Thím, Cậu, Mợ"
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                              />
                            </div>

                            {/* Col 4: Note / Explanation (2 cols) */}
                            <div className="sm:col-span-2 text-[11px] text-slate-400 dark:text-slate-500 italic">
                              {rule.note || 'Theo tập quán truyền thống'}
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
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy Bỏ
          </Link>

          <button
            id="save-settings-btn"
            type="submit"
            disabled={isSaving || isTooLong}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold shadow-sm shadow-emerald-700/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Lưu Thay Đổi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
