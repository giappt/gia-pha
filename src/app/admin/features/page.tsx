'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  SlidersHorizontal,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  Eye,
  BookOpen,
  Calendar,
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import type { ClanFeatureFlags } from '@/types/database';
import { DEFAULT_FEATURE_FLAGS, resolveFeatureFlags } from '@/lib/admin/admin-engine';

interface FeatureFlagConfig {
  key: keyof ClanFeatureFlags;
  title: string;
  icon: React.ElementType;
  description: string;
  onDesc: string;
  offDesc: string;
  safetyTag: 'An Toàn' | 'Riêng Tư' | 'Toàn Hệ Thống';
  tagColor: string;
}

const FEATURE_CONFIGS: FeatureFlagConfig[] = [
  {
    key: 'enable_public_tree',
    title: 'Công Khai Cây Phả Hệ Cho Khách Vãng Lai',
    icon: Eye,
    description: 'Quyết định việc người dùng chưa đăng nhập có được xem Cây Phả Hệ hay không.',
    onDesc: 'Khách vãng lai và mọi người trên mạng đều xem được cây gia phả.',
    offDesc: 'Khách chưa đăng nhập bị chặn xem cây; bắt buộc đăng nhập tài khoản để vào xem.',
    safetyTag: 'Riêng Tư',
    tagColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  {
    key: 'enable_kinship_lookup',
    title: 'Công Cụ Tra Cứu Vai Vế Xưng Hô',
    icon: BookOpen,
    description: 'Hiển thị tính năng Tra Cứu Vai Vế trên thanh điều hướng trang chủ.',
    onDesc: 'Con cháu có thể chọn 2 người bất kỳ để hệ thống tự động tính xưng hô 2 chiều.',
    offDesc: 'Ẩn menu Tra cứu ngoài trang chủ (dùng khi dòng họ đang hiệu chỉnh từ điển).',
    safetyTag: 'An Toàn',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    key: 'enable_anniversaries',
    title: 'Phân Hệ Lịch Giỗ 30 Ngày & Thông Báo Đẩy',
    icon: Calendar,
    description: 'Hiển thị Lịch Giỗ và cho phép con cháu đăng ký nhận Web Push hàng ngày.',
    onDesc: 'Hiển thị mục Lịch Giỗ ngoài trang chủ và tiến trình gửi thông báo giỗ hoạt động.',
    offDesc: 'Ẩn mục Lịch Giỗ và tạm dừng tiến trình thông báo Web Push tự động.',
    safetyTag: 'An Toàn',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    key: 'allow_member_claims',
    title: 'Tiếp Nhận Yêu Cầu Nhận Node (Claim Profile)',
    icon: UserPlus,
    description: 'Cho phép con cháu bấm "Đây là tôi trên cây" để nộp hồ sơ nhận diện.',
    onDesc: 'Mở cổng để con cháu toàn quốc vào gửi phiếu nhận node (thích hợp dịp lễ tết, họp họ).',
    offDesc: 'Khóa cổng nhận node để chống spam khi ban quản trị đang rà soát dữ liệu.',
    safetyTag: 'An Toàn',
    tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    key: 'mask_living_member_privacy',
    title: 'Lá Chắn Bảo Vệ Thông Tin Người Còn Sống',
    icon: Shield,
    description: 'Tự động che giấu số điện thoại, địa chỉ nhà đối với người xem công chúng.',
    onDesc: 'Ẩn số điện thoại, địa chỉ của người đang sống với khách để chống lừa đảo mạo danh.',
    offDesc: 'Hiển thị đầy đủ thông tin liên lạc cho mọi người (không khuyến nghị tắt).',
    safetyTag: 'Riêng Tư',
    tagColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  {
    key: 'maintenance_mode',
    title: 'Chế Độ Đóng Cửa Bảo Trì Toàn Tộc',
    icon: AlertTriangle,
    description: 'Khóa toàn bộ truy cập bên ngoài để nhập phả hệ lớn hoặc đối soát tranh chấp.',
    onDesc: 'Toàn bộ người ngoài thấy màn hình thông báo bảo trì trang trọng; chỉ Super Admin vào được.',
    offDesc: 'Hệ thống mở cửa hoạt động bình thường cho mọi thành viên dòng họ.',
    safetyTag: 'Toàn Hệ Thống',
    tagColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
  },
];

export default function AdminFeaturesPage() {
  const [flags, setFlags] = useState<ClanFeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadFlags() {
      try {
        const res = await fetch('/api/clan-settings');
        if (res.ok) {
          const json = await res.json();
          if (json.data?.feature_flags) {
            setFlags(resolveFeatureFlags(json.data.feature_flags));
          }
        }
      } catch (err) {
        console.error('Failed to load feature flags:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFlags();
  }, []);

  const handleToggle = (key: keyof ClanFeatureFlags) => {
    setFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/clan-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_flags: flags }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMessage({
          type: 'success',
          text: 'Đã lưu cấu hình Bật/Tắt Tính Năng thành công! Các thiết lập mới đã có hiệu lực ngay lập tức.',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: json.error || 'Có lỗi xảy ra khi lưu cấu hình tính năng.',
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
          <span>Đang nạp cấu hình cờ tính năng...</span>
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
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Bật/Tắt Tính Năng & Quyền Riêng Tư
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kiểm soát linh hoạt các phân hệ chức năng và chế độ bảo mật thông tin dòng họ cho công chúng.
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

      {/* Switches Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-3">
          {FEATURE_CONFIGS.map((cfg) => {
            const isChecked = !!flags[cfg.key];
            const Icon = cfg.icon;

            return (
              <div
                key={cfg.key}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isChecked
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs'
                    : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/50 opacity-85'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isChecked
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                          {cfg.title}
                        </h3>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${cfg.tagColor}`}>
                          {cfg.safetyTag}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {cfg.description}
                      </p>

                      <div className="pt-1.5 flex items-center gap-1.5 text-xs">
                        <span className={`font-semibold ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {isChecked ? '✓ Đang BẬT:' : '✗ Đang TẮT:'}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {isChecked ? cfg.onDesc : cfg.offDesc}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isChecked}
                    id={`toggle-${cfg.key}`}
                    onClick={() => handleToggle(cfg.key)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isChecked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200/80 dark:border-slate-800">
          <Link
            href="/admin"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Quay Về
          </Link>

          <button
            id="save-features-btn"
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
                <span>Lưu Cấu Hình Tính Năng</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
