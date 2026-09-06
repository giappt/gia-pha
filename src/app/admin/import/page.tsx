'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Eye,
  FileCheck,
  Check,
} from 'lucide-react';
import { ExcelMemberRow, ExcelParseResult } from '@/types/tree';
import { parseExcelFamilyTree, validateExcelRows } from '@/lib/excel/excel-parser';

export default function ExcelImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'clean'>('append');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setImportSuccess(null);
    setImportError(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const rawRows = parseExcelFamilyTree(new Uint8Array(buffer));
      const validated = validateExcelRows(rawRows);
      setParseResult(validated);
    } catch (err: any) {
      setImportError(err.message || 'Không thể đọc file Excel. Vui lòng kiểm tra định dạng.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleExecuteImport = async () => {
    if (!parseResult || !parseResult.canImport) return;

    setIsImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: parseResult.rows,
          mode: importMode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Nhập dữ liệu thất bại.');
      }

      setImportSuccess(data.message || `Đã nạp thành công ${data.importedCount} thành viên.`);
    } catch (err: any) {
      setImportError(err.message || 'Lỗi kết nối khi nạp dữ liệu.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setImportSuccess(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/tree"
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Quay lại Cây phả hệ
            </Link>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
              Nhập Liệu Gia Phả Hàng Loạt (Bulk Excel Import - S-08)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tự động phân tích cây phả hệ, sắp xếp thế hệ (Topological Sort) và phát hiện lỗi chu trình
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/admin/template"
              download="gia-pha-template.xlsx"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Tải Template Excel Mẫu (.xlsx)
            </a>
          </div>
        </div>

        {/* Notifications */}
        {importSuccess && (
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start justify-between gap-3 text-emerald-800 dark:text-emerald-200 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">Nhập dữ liệu thành công!</p>
                <p className="mt-0.5">{importSuccess}</p>
              </div>
            </div>
            <Link
              href="/tree"
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors"
            >
              Xem Cây Phả Hệ
            </Link>
          </div>
        )}

        {importError && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Lỗi xử lý file Excel</p>
              <p className="mt-0.5">{importError}</p>
            </div>
          </div>
        )}

        {/* Dropzone Upload Box */}
        {!parseResult && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-emerald-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
            <div className="w-16 h-16 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              Kéo thả file Excel vào đây, hoặc bấm để duyệt file
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Hỗ trợ định dạng <strong>.xlsx</strong> hoặc <strong>.csv</strong>. Khuyến khích sử dụng template chuẩn để đảm bảo ánh xạ đầy đủ cha mẹ và ngày mất âm lịch.
            </p>
            {isParsing && (
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <RefreshCw className="w-4 h-4 animate-spin" /> Đang phân tích đồ thị gia tộc...
              </div>
            )}
          </div>
        )}

        {/* Data Preview & Validation Report */}
        {parseResult && (
          <div className="space-y-6">
            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Tổng số dòng
                </span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {parseResult.totalRows}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ hoàn toàn
                </span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {parseResult.validRowsCount}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800/60 shadow-sm">
                <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Dòng có lỗi chặn
                </span>
                <span className="text-2xl font-black text-rose-600 mt-1 block">
                  {parseResult.errorRowsCount}
                </span>
              </div>

              <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 shadow-sm">
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Cảnh báo logic
                </span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">
                  {parseResult.warningRowsCount}
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Chế độ nhập:
                </span>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Nhập bổ sung (Giữ dữ liệu cũ)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-rose-600">
                  <input
                    type="radio"
                    name="importMode"
                    value="clean"
                    checked={importMode === 'clean'}
                    onChange={() => setImportMode('clean')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Làm mới toàn bộ (Ghi đè cây mới)</span>
                </label>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Chọn file khác
                </button>
                <button
                  type="button"
                  disabled={!parseResult.canImport || isImporting}
                  onClick={handleExecuteImport}
                  className="flex-1 sm:flex-initial px-6 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Đang nạp dữ liệu...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Xác nhận nhập ({parseResult.validRowsCount} thành viên)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Preview Table */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" /> Bảng Kiểm Tra Trước Dữ Liệu ({parseResult.rows.length} dòng)
                </h3>
                <span className="text-[11px] text-slate-400">
                  {file?.name}
                </span>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Họ và Tên</th>
                      <th className="py-2.5 px-3">Giới tính</th>
                      <th className="py-2.5 px-3">STT Bố</th>
                      <th className="py-2.5 px-3">STT Mẹ</th>
                      <th className="py-2.5 px-3">Vợ/Chồng</th>
                      <th className="py-2.5 px-3">Năm sinh</th>
                      <th className="py-2.5 px-3">Ngày mất (Âm)</th>
                      <th className="py-2.5 px-3">Trạng thái kiểm tra</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {parseResult.rows.map((row) => {
                      const hasErrors = row.validationErrors.length > 0;
                      const hasWarnings = row.validationWarnings.length > 0;

                      return (
                        <tr
                          key={row.rowNumber}
                          className={`transition-colors ${
                            hasErrors
                              ? 'bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50'
                              : hasWarnings
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/60'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-bold text-slate-500">{row.stt}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {row.fullName || <span className="text-rose-500 italic">Trống</span>}
                            {row.isRoot && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold">
                                Cụ Tổ
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                row.gender === 'Nam'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                                  : 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300'
                              }`}
                            >
                              {row.gender}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {row.fatherStt ?? '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {row.motherStt ?? '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {row.spouseStt ?? '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {row.birthYear ?? '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            {row.deathLunarDay && row.deathLunarMonth
                              ? `${row.deathLunarDay}/${row.deathLunarMonth}${
                                  row.deathLunarIsLeap ? ' (Nhuận)' : ''
                                }`
                              : '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {hasErrors ? (
                              <div className="space-y-0.5">
                                {row.validationErrors.map((err, i) => (
                                  <span
                                    key={i}
                                    className="block text-[10px] font-bold text-rose-600 dark:text-rose-400"
                                  >
                                    • {err}
                                  </span>
                                ))}
                              </div>
                            ) : hasWarnings ? (
                              <div className="space-y-0.5">
                                {row.validationWarnings.map((warn, i) => (
                                  <span
                                    key={i}
                                    className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                                  >
                                    ⚠ {warn}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Hợp lệ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
