'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Save, CheckCircle2, AlertCircle, Eye, RefreshCw, ExternalLink } from 'lucide-react';

export default function ClanSettingsPage() {
  const [clanName, setClanName] = useState('');
  const [region, setRegion] = useState<'north' | 'central' | 'south'>('north');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/clan-settings');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.clan_name) {
            setClanName(json.data.clan_name);
          }
          if (json.data?.default_kinship_region) {
            setRegion(json.data.default_kinship_region);
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
      const res = await fetch('/api/clan-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clan_name: trimmed,
          default_kinship_region: region,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setClanName(json.data.clan_name);
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu cài đặt dòng họ thành công! Giao diện trang chủ đã được cập nhật.',
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
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
              Cấu hình tên dòng họ toàn cục, bộ từ điển xưng hô và quy ước phả hệ.
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
                href="/"
                className="inline-flex items-center gap-1 ml-4 text-xs font-bold text-emerald-700 dark:text-emerald-300 underline hover:no-underline"
              >
                <span>Xem Trang Chủ</span>
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

        {/* Card 2: Kinship Region Setting */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Từ Điển Xưng Hô Vùng Miền Mặc Định
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Quyết định quy ước tính toán vai vế xưng hô trong thuật toán Kinship Engine (Milestone 2).
            </p>
          </div>

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
                    onChange={() => setRegion('north')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Tôn trọng thứ bậc chi trưởng/thứ (*&quot;Bé bằng củ khoai, cứ vai Bác là gọi Bác&quot;*).
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
                    onChange={() => setRegion('central')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Cách gọi Bác, Chú, Cậu, Thím, Dì theo truyền thống khu vực Bắc & Nam Trung Bộ.
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
                    onChange={() => setRegion('south')}
                    className="accent-emerald-600"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Xưng hô linh hoạt theo tuổi tác kết hợp nhánh họ (Anh Hai, Chị Ba, Chú Út...).
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-3 block">
                Phong tục Nam Bộ
              </span>
            </label>
          </div>
        </div>

        {/* Action Button */}
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
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-bold shadow-sm shadow-emerald-700/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
