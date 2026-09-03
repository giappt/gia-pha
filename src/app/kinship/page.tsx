'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  ArrowRightLeft,
  Search,
  Users,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Info,
  CheckCircle2,
  GitBranch,
  Crown,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Quote,
  ShieldAlert,
} from 'lucide-react';
import type { KinshipRegion, KinshipResolution, KinshipPathNode } from '@/types/kinship';

interface MemberOption {
  id: string;
  full_name: string;
  gender: 'male' | 'female' | 'other';
  generation_number: number;
  birth_year: number | null;
  birth_order: number;
  is_senior_branch?: boolean;
  is_adopted?: boolean;
  has_parents: boolean;
}

import { MOCK_CLAN_MEMBERS } from '@/lib/kinship-engine/mock-data';
import { findLowestCommonAncestor } from '@/lib/kinship-engine/lca-finder';
import { resolveKinshipTerms } from '@/lib/kinship-engine/regional-dictionaries';
import type { Member } from '@/types/database';

const INITIAL_MEMBERS: MemberOption[] = MOCK_CLAN_MEMBERS.map((m) => ({
  id: m.id,
  full_name: m.full_name,
  gender: m.gender,
  generation_number: m.generation_number,
  birth_year: m.birth_year,
  birth_order: m.birth_order,
  is_senior_branch: m.is_senior_branch ?? undefined,
  is_adopted: m.is_adopted ?? undefined,
  has_parents: Boolean(m.father_id || m.mother_id),
}));

const MEMBERS_MAP = new Map<string, Member>(MOCK_CLAN_MEMBERS.map((m) => [m.id, m]));

/**
 * Tính toán quan hệ xưng hô tức thì 0ms (In-Memory Zero-Latency)
 * Hoạt động 100% offline, không bị ảnh hưởng bởi nghẽn mạng hay middleware auth
 */
function computeKinshipDirect(pA: string, pB: string, reg: KinshipRegion): KinshipResolution | null {
  if (!pA || !pB || pA === pB) return null;
  const memberA = MEMBERS_MAP.get(pA);
  const memberB = MEMBERS_MAP.get(pB);
  if (!memberA || !memberB) return null;

  const lcaResult = findLowestCommonAncestor(pA, pB, MEMBERS_MAP);
  const resolution = resolveKinshipTerms(lcaResult, memberA, memberB, reg);

  const isMember1Unlinked = !memberA.father_id && !memberA.mother_id && memberA.generation_number > 1;
  const isMember2Unlinked = !memberB.father_id && !memberB.mother_id && memberB.generation_number > 1;
  if (lcaResult.relationshipType === 'unrelated' && (isMember1Unlinked || isMember2Unlinked)) {
    const unlinkedName = isMember1Unlinked ? memberA.full_name : memberB.full_name;
    resolution.explanation = `Thành viên "${unlinkedName}" chưa được liên kết cha/mẹ trong cây phả hệ, do đó chưa thể xác định quan hệ xưng hô.`;
  }

  return resolution;
}

const DEFAULT_A = '30000000-0000-0000-0000-000000000001'; // Hải (Chi 1)
const DEFAULT_B = '30000000-0000-0000-0000-000000000003'; // Hùng (Chi 2)

export default function KinshipPage() {
  const [members] = useState<MemberOption[]>(INITIAL_MEMBERS);

  // Selection states: Mặc định chọn Hải (Chi 1) và Hùng (Chi 2)
  const [personAId, setPersonAId] = useState<string>(DEFAULT_A);
  const [personBId, setPersonBId] = useState<string>(DEFAULT_B);
  const [region, setRegion] = useState<KinshipRegion>('north');

  // Search filter states
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');

  // Resolution states: Khởi tạo kết quả NGAY LẬP TỨC 0ms trên client
  const [result, setResult] = useState<KinshipResolution | null>(() =>
    computeKinshipDirect(DEFAULT_A, DEFAULT_B, 'north')
  );
  const [isCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Accordion state for smart folding middle generations
  const [isExpandedMiddle, setIsExpandedMiddle] = useState(false);

  // Tra cứu vai vế xưng hô tức thì 0ms (In-Memory Live Reactive)
  const handleCalculate = (pA = personAId, pB = personBId, reg = region) => {
    if (!pA || !pB) {
      setErrorMessage('Vui lòng chọn đầy đủ cả 2 thành viên để xác định vai vế.');
      return;
    }

    // TC05: Kiểm tra chọn trùng 1 người
    if (pA === pB) {
      setErrorMessage('Vui lòng chọn 2 thành viên khác nhau để tra cứu quan hệ xưng hô.');
      setResult(null);
      return;
    }

    setErrorMessage(null);
    setIsExpandedMiddle(false);

    const directRes = computeKinshipDirect(pA, pB, reg);
    if (directRes) {
      setResult(directRes);
    } else {
      setErrorMessage('Không tìm thấy dữ liệu phả hệ của thành viên được chọn.');
      setResult(null);
    }
  };

  // 1. Đồng bộ URL parameters nếu truy cập qua deep link
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const p1 = urlParams.get('p1');
    const p2 = urlParams.get('p2');
    const reg = (urlParams.get('region') as KinshipRegion) || region;

    if (p1 && p2) {
      setPersonAId(p1);
      setPersonBId(p2);
      setRegion(reg);
      handleCalculate(p1, p2, reg);
    }
  }, []);

  // 2. Đảo vai A ↔ B (TC07)
  const handleSwapRoles = () => {
    const tempA = personAId;
    const tempB = personBId;
    setPersonAId(tempB);
    setPersonBId(tempA);

    if (tempB && tempA && tempB !== tempA) {
      handleCalculate(tempB, tempA, region);
    }
  };

  // Lọc danh sách thành viên theo từ khóa tìm kiếm
  const filteredMembersA = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchA.toLowerCase())
  );
  const filteredMembersB = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchB.toLowerCase())
  );

  const selectedPersonA = members.find((m) => m.id === personAId);
  const selectedPersonB = members.find((m) => m.id === personBId);

  const isSamePerson = Boolean(personAId && personBId && personAId === personBId);

  // Chuẩn bị danh sách node trung gian của 2 nhánh để vẽ Cây Chữ V
  // pathA trong KinshipResolution có thứ tự: [A, parent1, ..., LCA]
  // Để vẽ từ LCA xuống A: bỏ LCA (ở đỉnh), đảo ngược lại để đi từ trên xuống
  const branchNodesA: KinshipPathNode[] =
    result?.pathA && result.pathA.length > 1
      ? [...result.pathA.slice(0, -1)].reverse()
      : [];

  const branchNodesB: KinshipPathNode[] =
    result?.pathB && result.pathB.length > 1
      ? [...result.pathB.slice(0, -1)].reverse()
      : [];

  const maxBranchDepth = Math.max(branchNodesA.length, branchNodesB.length);
  const hasMiddleFolding = maxBranchDepth >= 4;

  return (
    <div className="flex-1 bg-slate-50/50 dark:bg-slate-950 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Hero Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold tracking-wide">
            <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>KINSHIP ENGINE · ĐỒ THỊ PHẢ HỆ VIỆT NAM</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Tra Cứu Vai Vế Xưng Hô Dòng Họ
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Thuật toán tìm Tổ tiên chung gần nhất (LCA) kết hợp từ điển xưng hô 3 miền,
            phân định tôn ti trật tự chính xác theo phong tục dòng tộc Việt.
          </p>
        </div>

        {/* Form Selector Box */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-5 sm:p-7 space-y-6">
          {/* 2 Selectors with Swap Button */}
          <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
            {/* Person A Selector */}
            <div className="md:col-span-4 space-y-2">
              <label
                htmlFor="person-a-select"
                className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                <span>Người hỏi (A)</span>
                {selectedPersonA && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 normal-case">
                    Đời thứ {selectedPersonA.generation_number}
                  </span>
                )}
              </label>
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="person-a-search"
                    placeholder="Lọc theo tên..."
                    value={searchA}
                    onChange={(e) => setSearchA(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <select
                  id="person-a-select"
                  value={personAId}
                  onChange={(e) => {
                    const newA = e.target.value;
                    setPersonAId(newA);
                    setErrorMessage(null);
                    if (newA && personBId && newA !== personBId) {
                      handleCalculate(newA, personBId, region);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                >
                  <option value="">-- Chọn thành viên A --</option>
                  {filteredMembersA.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.gender === 'male' ? 'Nam' : 'Nữ'}
                      {m.birth_year ? ` - ${m.birth_year}` : ''}
                      {m.is_senior_branch ? ' · Chi Trưởng' : ''}
                      {m.is_adopted ? ' · Con Nuôi' : ''})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button (TC07) */}
            <div className="md:col-span-1 flex justify-center pt-3 md:pt-6">
              <button
                type="button"
                id="swap-roles-btn"
                onClick={handleSwapRoles}
                title="Đảo vai xưng hô (A ↔ B)"
                className="w-10 h-10 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Person B Selector */}
            <div className="md:col-span-4 space-y-2">
              <label
                htmlFor="person-b-select"
                className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                <span>Người được xưng hô (B)</span>
                {selectedPersonB && (
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 normal-case">
                    Đời thứ {selectedPersonB.generation_number}
                  </span>
                )}
              </label>
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="person-b-search"
                    placeholder="Lọc theo tên..."
                    value={searchB}
                    onChange={(e) => setSearchB(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <select
                  id="person-b-select"
                  value={personBId}
                  onChange={(e) => {
                    const newB = e.target.value;
                    setPersonBId(newB);
                    setErrorMessage(null);
                    if (personAId && newB && personAId !== newB) {
                      handleCalculate(personAId, newB, region);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                >
                  <option value="">-- Chọn thành viên B --</option>
                  {filteredMembersB.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.gender === 'male' ? 'Nam' : 'Nữ'}
                      {m.birth_year ? ` - ${m.birth_year}` : ''}
                      {m.is_senior_branch ? ' · Chi Trưởng' : ''}
                      {m.is_adopted ? ' · Con Nuôi' : ''})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Scenario Chips */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Kịch bản mẫu:
            </span>
            <button
              type="button"
              id="sample-tc08-btn"
              onClick={() => {
                setSearchA('');
                setSearchB('');
                const idHai = '30000000-0000-0000-0000-000000000001';
                const idMinh = '40000000-0000-0000-0000-000000000001';
                setPersonAId(idHai);
                setPersonBId(idMinh);
                handleCalculate(idHai, idMinh, region);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
            >
              👑 Cây Chữ V (Hải & Minh)
            </button>
            <button
              type="button"
              id="sample-tc10-btn"
              onClick={() => {
                setSearchA('');
                setSearchB('');
                const idHung = '30000000-0000-0000-0000-000000000003';
                const idHai = '30000000-0000-0000-0000-000000000001';
                setPersonAId(idHung);
                setPersonBId(idHai);
                setRegion('north');
                handleCalculate(idHung, idHai, 'north');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
            >
              📜 Tôn ti Miền Bắc (Hùng & Hải)
            </button>
            <button
              type="button"
              id="sample-tc09-btn"
              onClick={() => {
                setSearchA('');
                setSearchB('');
                const idKhoi = '10000000-0000-0000-0000-000000000001';
                const idAn = '70000000-0000-0000-0000-000000000001';
                setPersonAId(idKhoi);
                setPersonBId(idAn);
                handleCalculate(idKhoi, idAn, region);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
            >
              🔽 Nén 6 Đời (Khởi & An)
            </button>
            <button
              type="button"
              id="sample-tc11-btn"
              onClick={() => {
                setSearchA('');
                setSearchB('');
                const idNam = '40000000-0000-0000-0000-000000000002';
                const idTam = '40000000-0000-0000-0000-000000000003';
                setPersonAId(idNam);
                setPersonBId(idTam);
                handleCalculate(idNam, idTam, region);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
            >
              🤝 Con Nuôi (Nam & Tâm)
            </button>
          </div>


          {/* Region Segmented Controls */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Phong tục vùng miền:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200/80 dark:border-slate-800 p-0.5 bg-slate-100/70 dark:bg-slate-950 text-xs font-medium">
                <button
                  type="button"
                  id="region-north-btn"
                  onClick={() => {
                    setRegion('north');
                    if (personAId && personBId && personAId !== personBId) {
                      handleCalculate(personAId, personBId, 'north');
                    }
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    region === 'north'
                      ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Miền Bắc (Trọng Nhánh)
                </button>
                <button
                  type="button"
                  id="region-central-btn"
                  onClick={() => {
                    setRegion('central');
                    if (personAId && personBId && personAId !== personBId) {
                      handleCalculate(personAId, personBId, 'central');
                    }
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    region === 'central'
                      ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Miền Trung
                </button>
                <button
                  type="button"
                  id="region-south-btn"
                  onClick={() => {
                    setRegion('south');
                    if (personAId && personBId && personAId !== personBId) {
                      handleCalculate(personAId, personBId, 'south');
                    }
                  }}
                  className={`px-3 py-1 rounded-md transition-all ${
                    region === 'south'
                      ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Miền Nam (Trọng Tuổi)
                </button>
              </div>
            </div>

            {/* Tra cứu Button */}
            <button
              type="button"
              id="calculate-kinship-btn"
              disabled={isSamePerson}
              onClick={() => handleCalculate()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm shadow-emerald-700/20 transition-all"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang tính toán phả hệ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Xác Định Vai Vế Xưng Hô</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Warning when Same Person is selected (TC05) */}
          {isSamePerson && (
            <div
              id="same-person-warning"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Vui lòng chọn 2 thành viên khác nhau để tra cứu quan hệ xưng hô.
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div
              id="kinship-error-banner"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Kinship Result Card */}
        {result && (
          <div
            id="kinship-result-container"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200/70 dark:border-emerald-800/40 shadow-md shadow-emerald-900/5 overflow-hidden transition-all animate-in fade-in duration-300 space-y-6"
          >
            {/* Top Result Banner: 2-Way Callouts */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-6 sm:p-8 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                  <span id="result-relationship-badge">
                    {result.relationshipType === 'sibling'
                      ? 'Anh Chị Em Ruột'
                      : result.relationshipType === 'cousin'
                      ? 'Quan Hệ Họ Hàng (Cousin)'
                      : result.relationshipType === 'parent_child'
                      ? 'Quan Hệ Cha/Mẹ - Con'
                      : result.relationshipType === 'direct_ancestor'
                      ? 'Quan Hệ Trực Hệ'
                      : 'Quan Hệ Dòng Tộc'}
                  </span>
                </div>

                <div className="text-xs text-emerald-100/90 font-medium">
                  {result.generationDelta === 0
                    ? 'Cùng thế hệ (Ngang hàng)'
                    : result.generationDelta > 0
                    ? `A ở trên B ${result.generationDelta} thế hệ`
                    : `A ở dưới B ${Math.abs(result.generationDelta)} thế hệ`}
                </div>
              </div>

              {/* Two-Way Callouts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <div className="text-xs text-emerald-100 font-medium mb-1">
                    {selectedPersonA?.full_name || 'Người A'} gọi{' '}
                    {selectedPersonB?.full_name || 'Người B'} là:
                  </div>
                  <div
                    id="term-a-to-b"
                    className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
                  >
                    {result.termAtoB}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                  <div className="text-xs text-emerald-100 font-medium mb-1">
                    {selectedPersonB?.full_name || 'Người B'} gọi{' '}
                    {selectedPersonA?.full_name || 'Người A'} là:
                  </div>
                  <div
                    id="term-b-to-a"
                    className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
                  >
                    {result.termBtoA}
                  </div>
                </div>
              </div>
            </div>

            {/* SƠ ĐỒ CÂY PHẢ HỆ MINI CHỮ V NGƯỢC (INVERTED-V KINSHIP TREE) */}
            {result.relationshipType !== 'unrelated' && result.lcaName && (
              <div className="px-6 sm:px-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <GitBranch className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Sơ Đồ Cây Phả Hệ Trực Quan (Inverted-V Kinship Tree)</span>
                  </h2>

                  <Link
                    href="/"
                    id="deep-link-tree-btn"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <span>Xem trên Cây Phả Hệ Lớn</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div
                  id="inverted-v-tree"
                  className="p-5 sm:p-7 rounded-2xl bg-gradient-to-b from-slate-50/80 to-slate-100/50 dark:from-slate-950 dark:to-slate-900 border border-slate-200/70 dark:border-slate-800"
                >
                  {/* Đỉnh chóp: Tổ tiên chung gần nhất (LCA) */}
                  <div className="flex flex-col items-center">
                    <div
                      id="lca-apex-node"
                      className="px-5 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300/80 dark:border-amber-700 shadow-sm text-center max-w-md w-full relative z-10"
                    >
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[11px] font-bold uppercase tracking-wider mb-1">
                        <Crown className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                        <span>Tổ Tiên Chung Gần Nhất (LCA)</span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                        {result.lcaNode?.name || result.lcaName}
                      </div>
                      <div className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                        {result.lcaNode?.birthYear ? `Sinh năm ${result.lcaNode.birthYear} · ` : ''}
                        Điểm khởi nguồn rẽ nhánh huyết thống
                      </div>
                    </div>

                    {/* SVG Connector rẽ sang 2 nhánh */}
                    <svg
                      className="w-full max-w-lg h-10 text-slate-300 dark:text-slate-700 my-1 hidden sm:block"
                      viewBox="0 0 400 40"
                      fill="none"
                    >
                      <path
                        d="M200,0 L200,16 Q200,28 120,28 L60,28 L60,40"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      <path
                        d="M200,0 L200,16 Q200,28 280,28 L340,28 L340,40"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                    </svg>
                  </div>

                  {/* 2 Cột nhánh: Cột A (Trái) & Cột B (Phải) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 pt-2">
                    {/* CỘT A (Bên Trái) */}
                    <div className="space-y-3">
                      <div className="text-center sm:text-left text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200/60 dark:border-slate-800">
                        Nhánh của {selectedPersonA?.full_name || 'Người A'}
                      </div>

                      <div className="space-y-2.5">
                        {renderBranchNodes(
                          branchNodesA,
                          isExpandedMiddle,
                          selectedPersonA?.id
                        )}
                      </div>
                    </div>

                    {/* CỘT B (Bên Phải) */}
                    <div className="space-y-3">
                      <div className="text-center sm:text-right text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-200/60 dark:border-slate-800">
                        Nhánh của {selectedPersonB?.full_name || 'Người B'}
                      </div>

                      <div className="space-y-2.5">
                        {renderBranchNodes(
                          branchNodesB,
                          isExpandedMiddle,
                          selectedPersonB?.id
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nút Toggle Nén Tầng Trung Gian nếu cách nhau >= 4 đời */}
                  {hasMiddleFolding && (
                    <div className="flex justify-center pt-4">
                      <button
                        type="button"
                        id="toggle-fold-generations-btn"
                        onClick={() => setIsExpandedMiddle(!isExpandedMiddle)}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-950/60 hover:text-emerald-800 transition-all shadow-xs"
                      >
                        {isExpandedMiddle ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" />
                            <span>Thu gọn các thế hệ trung gian</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" />
                            <span>Mở rộng toàn bộ các thế hệ trung gian</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Thanh Cầu Nối Quan Hệ ở Đáy */}
                  <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                    <div className="text-xs text-slate-600 dark:text-slate-400 text-center sm:text-left">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Mối quan hệ trực diện:
                      </span>{' '}
                      {result.termAtoB} <span className="text-slate-400">⇄</span>{' '}
                      {result.termBtoA}
                    </div>

                    <button
                      type="button"
                      onClick={handleSwapRoles}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-700 shadow-2xs hover:scale-102 active:scale-98 transition-all"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-emerald-600" />
                      <span>Đổi vai A ↔ B</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* THẺ DIỄN GIẢI PHONG TỤC CẤU TRÚC HÓA */}
            <div id="cultural-customs-card" className="p-6 sm:p-8 pt-0 space-y-4">
              <h2 className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Căn Cứ Phong Tục & Đối Sánh Tương Quan</span>
              </h2>

              <div className="p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-100/80 dark:border-emerald-900/30 space-y-4">
                {/* Khối 1: Huy hiệu Nguyên Tắc Vùng Miền */}
                {result.customsBadge && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-900 dark:text-emerald-200 text-xs font-bold">
                    <span>⚖️</span>
                    <span>{result.customsBadge}</span>
                  </div>
                )}

                {/* Khối 2: Tục Ngữ / Lời Cổ Phong */}
                {result.proverbQuote && (
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
                    <Quote className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-sm font-semibold italic text-slate-800 dark:text-slate-200">
                      {result.proverbQuote}
                    </div>
                  </div>
                )}

                {/* Khối 3: Bảng Đối Sánh Tương Quan Trực Diện */}
                {result.comparisonFacts && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                        {result.comparisonFacts.labelA}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {result.comparisonFacts.detailA}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                      <div className="text-xs font-bold text-teal-700 dark:text-teal-400 mb-0.5">
                        {result.comparisonFacts.labelB}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {result.comparisonFacts.detailB}
                      </div>
                    </div>
                  </div>
                )}

                {/* Diễn giải chi tiết */}
                <div
                  id="cultural-explanation"
                  className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-1 border-t border-emerald-200/40 dark:border-emerald-900/20"
                >
                  {result.explanation}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State / Instructional Guide */}
        {!result && !errorMessage && (
          <div className="bg-white/60 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Chọn 2 thành viên bất kỳ và bấm &quot;Xác Định Vai Vế Xưng Hô&quot;
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Hệ thống sẽ tự động dò tìm Tổ tiên chung gần nhất (LCA), vẽ sơ đồ phân nhánh
              và quy chuẩn danh xưng theo phong tục vùng miền đã chọn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Hàm hỗ trợ vẽ các node thế hệ trên một nhánh của Cây Chữ V Ngược
 */
function renderBranchNodes(
  nodes: KinshipPathNode[],
  isExpanded: boolean,
  targetPersonId?: string
) {
  if (nodes.length === 0) {
    return (
      <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-950 text-center text-xs text-slate-400 italic">
        (Trực hệ từ LCA)
      </div>
    );
  }

  // Nếu chuỗi dài >= 4 node và chưa bấm mở rộng -> Áp dụng Smart Folding
  if (nodes.length >= 4 && !isExpanded) {
    const topNode = nodes[0];
    const foldedCount = nodes.length - 2;
    const bottomNode = nodes[nodes.length - 1];

    return (
      <>
        {renderNodeItem(topNode, false)}
        <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-100/40 dark:bg-slate-950 text-center text-xs font-semibold text-slate-500">
          ... Nén {foldedCount} thế hệ trung gian ...
        </div>
        {renderNodeItem(bottomNode, bottomNode.id === targetPersonId)}
      </>
    );
  }

  return nodes.map((node, index) =>
    renderNodeItem(node, node.id === targetPersonId || index === nodes.length - 1)
  );
}

function renderNodeItem(node: KinshipPathNode, isTarget: boolean) {
  return (
    <div
      key={node.id}
      className={`p-3 rounded-xl border transition-all ${
        isTarget
          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-semibold'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-tight">{node.name}</span>
        {node.relation && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              isTarget
                ? 'bg-emerald-700/80 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            {node.relation}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] opacity-90">
        {node.birthYear && <span>Sinh: {node.birthYear}</span>}
        {node.isSeniorBranch !== undefined && (
          <span>· {node.isSeniorBranch ? 'Chi Trưởng' : 'Chi Thứ'}</span>
        )}
        {node.isAdopted && (
          <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium">
            Con Nuôi
          </span>
        )}
      </div>
    </div>
  );
}
