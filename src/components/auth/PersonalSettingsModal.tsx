'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Bell, BellOff, GitBranch, Settings, CheckCircle2 } from 'lucide-react';
import {
  getUserPreferences,
  saveUserPreferences,
  flattenBranchTree,
  FlattenedBranchItem,
} from '@/lib/tree-layout/branch-engine';
import type { BranchNode } from '@/types/database';

interface PersonalSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
}

export default function PersonalSettingsModal({
  isOpen,
  onClose,
  userEmail,
}: PersonalSettingsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [branches, setBranches] = useState<FlattenedBranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [enablePush, setEnablePush] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lắng nghe sự kiện phím tắt Escape & khóa cuộn body khi mở modal
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

  useEffect(() => {
    if (!isOpen) return;

    // 1. Read current local preferences
    const currentPrefs = getUserPreferences();
    setSelectedBranchId(currentPrefs.focusedBranchId);
    setEnablePush(currentPrefs.enablePushNotifications);

    // 2. Fetch clan branch tree
    async function loadBranches() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/clan-settings');
        if (res.ok) {
          const json = await res.json();
          const rawBranches: BranchNode[] = json.data?.branches || [];
          setBranches(flattenBranchTree(rawBranches));
        }
      } catch (err) {
        console.warn('Failed to load branches for personal settings:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadBranches();
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSave = () => {
    saveUserPreferences({
      focusedBranchId: selectedBranchId,
      enablePushNotifications: enablePush,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto flex min-h-full items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] flex flex-col my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Cài Đặt Của Tôi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px]">
                {userEmail ? userEmail : 'Tùy chỉnh cá nhân hóa thiết bị này'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          {/* Section 1: Focus Branch */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nhánh Theo Dõi Mặc Định</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Tự động ưu tiên lọc danh sách giỗ và góc nhìn phả hệ theo nhánh bạn quan tâm nhất.
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
              {/* Option All */}
              <label
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  selectedBranchId === null
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="focus_branch"
                    checked={selectedBranchId === null}
                    onChange={() => setSelectedBranchId(null)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>🏛️ Toàn dòng họ (Xem tất cả)</span>
                </div>
                {selectedBranchId === null && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </label>

              {/* Branch Options */}
              {branches.map((b) => (
                <label
                  key={b.id}
                  style={{ paddingLeft: `${b.depth * 12 + 12}px` }}
                  className={`flex items-center justify-between py-2 pr-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    selectedBranchId === b.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="focus_branch"
                      checked={selectedBranchId === b.id}
                      onChange={() => setSelectedBranchId(b.id)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>{b.depth > 0 ? `└─ ${b.fullTitle}` : b.fullTitle}</span>
                  </div>
                  {selectedBranchId === b.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </label>
              ))}

              {!isLoading && branches.length === 0 && (
                <div className="py-3 text-center text-xs text-slate-400">
                  Dòng họ chưa thiết lập cấu trúc Ngành/Chi trong Quản trị.
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Push Notifications */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Nhận Chuông Báo Giỗ
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                  Nhận thông báo đẩy trên thiết bị này trước ngày giỗ 3 ngày.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEnablePush(!enablePush)}
                className={`p-2 rounded-xl transition-all ${
                  enablePush
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {enablePush ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            id="personal-settings-save-btn"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-xs transition-all cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đã lưu!</span>
              </>
            ) : (
              <span>Lưu Cài Đặt</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
