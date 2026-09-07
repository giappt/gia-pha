'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  X,
  Edit2,
  ChevronDown,
} from 'lucide-react';
import type { UserRole, UserProfile } from '@/types/database';
import type { MemberRecord } from '@/types/tree';

interface EnrichedUser extends UserProfile {
  linked_member?: {
    id: string;
    full_name: string;
    gender: string;
    generation_number: number;
    branch_code?: string;
  } | null;
}

const ROLE_LABELS: Record<UserRole, { label: string; bg: string; text: string; border: string }> = {
  viewer: {
    label: 'Khách Đã Đăng Nhập (Viewer)',
    bg: 'bg-slate-50 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
  claimed_member: {
    label: 'Con Cháu Đã Gắn Node (Member)',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  branch_editor: {
    label: 'Ban Biên Tập Chi (Editor)',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  super_admin: {
    label: 'Quản Trị Tối Cao (Super Admin)',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [allMembers, setAllMembers] = useState<MemberRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Link node modal state
  const [linkingUser, setLinkingUser] = useState<EnrichedUser | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Role change modal/dropdown state
  const [editingRoleUser, setEditingRoleUser] = useState<EnrichedUser | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [usersRes, membersRes] = await Promise.all([
        fetch('/api/users').then((r) => (r.ok ? r.json() : { data: [] })),
        fetch('/api/members').then((r) => (r.ok ? r.json() : { members: [] })),
      ]);

      if (Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
      if (Array.isArray(membersRes.members)) {
        setAllMembers(membersRes.members);
      }
    } catch (err) {
      console.error('Failed to load users data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.user_role !== roleFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.linked_member?.full_name && u.linked_member.full_name.toLowerCase().includes(q))
      );
    });
  }, [users, roleFilter, searchQuery]);

  // Handle role update
  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, user_role: newRole }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, user_role: newRole } : u))
        );
        setStatusMessage({
          type: 'success',
          text: `Đã cập nhật vai trò thành '${ROLE_LABELS[newRole].label}' thành công!`,
        });
        setEditingRoleUser(null);
      } else {
        setStatusMessage({ type: 'error', text: json.error || 'Lỗi cập nhật vai trò' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle link node
  const handleLinkNode = async (userId: string, memberId: string | null) => {
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, linked_member_id: memberId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        const linkedMem = memberId ? allMembers.find((m) => m.id === memberId) || null : null;
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  linked_member_id: memberId,
                  user_role: memberId && u.user_role === 'viewer' ? 'claimed_member' : u.user_role,
                  linked_member: linkedMem
                    ? {
                        id: linkedMem.id,
                        full_name: linkedMem.full_name,
                        gender: linkedMem.gender,
                        generation_number: Number(linkedMem.generation_level || 1),
                        branch_code: linkedMem.branch_name || undefined,
                      }
                    : null,
                }
              : u
          )
        );
        setStatusMessage({
          type: 'success',
          text: memberId
            ? `Đã liên kết tài khoản với '${linkedMem?.full_name}' thành công!`
            : 'Đã gỡ liên kết node phả hệ của tài khoản này.',
        });
        setLinkingUser(null);
      } else {
        setStatusMessage({ type: 'error', text: json.error || 'Lỗi liên kết node phả hệ' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Lỗi kết nối máy chủ' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered members for linking modal
  const searchableMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return allMembers.slice(0, 8);
    const q = memberSearchQuery.toLowerCase().trim();
    return allMembers
      .filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          (m.alias_name && m.alias_name.toLowerCase().includes(q))
      )
      .slice(0, 15);
  }, [allMembers, memberSearchQuery]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2.5 text-slate-500 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Đang tải danh sách tài khoản người dùng...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Quản Lý Tài Khoản & Gán Node Phả Hệ
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Danh sách tài khoản Google đã đăng nhập, phân cấp vai trò và liên kết với thành viên trên cây gia phả.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm Mới</span>
          </button>
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

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-user-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo email, tên tài khoản hoặc tên người được gắn trên cây..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/50"
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

          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex-shrink-0">
            Hiển thị: <strong>{filteredUsers.length}</strong> / {users.length} tài khoản
          </div>
        </div>

        {/* Role Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
            Lọc Vai Trò:
          </span>
          {[
            { id: 'all', label: 'Tất Cả' },
            { id: 'viewer', label: 'Viewer' },
            { id: 'claimed_member', label: 'Claimed Member' },
            { id: 'branch_editor', label: 'Branch Editor' },
            { id: 'super_admin', label: 'Super Admin' },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setRoleFilter(chip.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                roleFilter === chip.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-850/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Tài Khoản Google</th>
                <th className="py-3 px-4">Vai Trò Hệ Thống</th>
                <th className="py-3 px-4">Hồ Sơ Phả Hệ Liên Kết</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Không tìm thấy tài khoản nào khớp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleConfig = ROLE_LABELS[u.user_role] || ROLE_LABELS.viewer;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-xs flex-shrink-0 uppercase">
                            {u.full_name ? u.full_name.charAt(0) : u.email.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {u.full_name || 'Chưa đặt tên'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() => setEditingRoleUser(editingRoleUser?.id === u.id ? null : u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${roleConfig.bg} ${roleConfig.text} ${roleConfig.border} hover:opacity-80`}
                            title="Bấm để đổi vai trò"
                          >
                            <span>{roleConfig.label.split('(')[0]}</span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>

                          {/* Role Select Dropdown */}
                          {editingRoleUser?.id === u.id && (
                            <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-1.5 space-y-1">
                              {(['viewer', 'claimed_member', 'branch_editor', 'super_admin'] as UserRole[]).map(
                                (r) => (
                                  <button
                                    key={r}
                                    type="button"
                                    onClick={() => handleUpdateRole(u.id, r)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                                      u.user_role === r
                                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <span>{ROLE_LABELS[r].label.split('(')[0]}</span>
                                    {u.user_role === r && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Linked Member Node */}
                      <td className="py-3.5 px-4">
                        {u.linked_member ? (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {u.linked_member.full_name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                              Đời {u.linked_member.generation_number}
                            </span>
                            {u.linked_member.branch_code && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                                {u.linked_member.branch_code}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">
                            -- Chưa liên kết node --
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLinkingUser(u);
                            setMemberSearchQuery('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                          title="Gán hoặc đổi người đại diện trên cây phả hệ"
                        >
                          <LinkIcon className="w-3 h-3 text-emerald-600" />
                          <span>{u.linked_member ? 'Đổi Node' : 'Gán Node'}</span>
                        </button>

                        {u.linked_member_id && (
                          <button
                            type="button"
                            onClick={() => handleLinkNode(u.id, null)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-semibold transition-colors cursor-pointer"
                            title="Gỡ liên kết node phả hệ"
                          >
                            <Unlink className="w-3 h-3" />
                            <span>Gỡ</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Gán Node Phả Hệ */}
      {linkingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Gán Node Cho: {linkingUser.full_name || linkingUser.email}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Chọn người đại diện tương ứng trên Cây Phả Hệ cho tài khoản này.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLinkingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Gõ tên thành viên cần tìm..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/80">
                {searchableMembers.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">
                    Không tìm thấy thành viên nào khớp.
                  </p>
                ) : (
                  searchableMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleLinkNode(linkingUser.id, m.id)}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                          {m.full_name}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          Đời {m.generation_level || 1} • {m.gender === 'male' ? 'Nam' : 'Nữ'}
                          {m.birth_year ? ` (${m.birth_year})` : ''}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Chọn →
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {linkingUser.linked_member_id ? (
                <button
                  type="button"
                  onClick={() => handleLinkNode(linkingUser.id, null)}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Gỡ bỏ liên kết hiện tại
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setLinkingUser(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
              >
                Hủy Bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
