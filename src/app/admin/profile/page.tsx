'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Landmark, Save, RefreshCw, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ClanProfilePage() {
  const [clanName, setClanName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadClanName() {
      try {
        const res = await fetch('/api/clan-settings');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.clan_name) {
            setClanName(json.data.clan_name);
          }
        }
      } catch (err) {
        console.error('Failed to load clan name:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadClanName();
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
        body: JSON.stringify({ clan_name: trimmed }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setClanName(json.data.clan_name);
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu Căn Cước Dòng Họ thành công! Tên mới đã cập nhật trên toàn hệ thống.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: json.error || 'Có lỗi xảy ra khi lưu thông tin.',
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage({ type: 'error', text: 'Không thể kết nối máy chủ. Vui lòng thử lại.' });
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
          <span>Đang tải thông tin Căn Cước Dòng Họ...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Căn Cước & Tôn Danh Dòng Họ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Cấu hình tên dòng họ toàn cục, hiển thị trang trọng tại biểu ngữ trang chủ và thanh tiêu đề.
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

      {/* Form Card & Live Preview */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="clan-name-input" className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Nhập tên dòng họ chính thức:
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
                <span>Giới hạn tối đa <strong>40 ký tự</strong> để đảm bảo bố cục hoàn hảo trên mọi điện thoại di động.</span>
              </p>
              <p className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Hỗ trợ tiếng Việt đầy đủ dấu và ký tự phân nhánh (Ví dụ: <em>Gia Tộc Họ Phạm Văn (Chi 2)</em>).</span>
              </p>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-3">
              <Eye className="w-3.5 h-3.5 text-emerald-600" />
              <span>MÔ PHỎNG HIỂN THỊ THỰC TẾ TRÊN TRANG CHỦ & BANNER:</span>
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Quay Về
          </Link>

          <button
            id="save-profile-btn"
            type="submit"
            disabled={isSaving || isTooLong}
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
                <span>Lưu Căn Cước Dòng Họ</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
